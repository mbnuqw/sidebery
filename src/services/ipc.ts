import { AnyFunc, Actions, Message, InstanceType, ActionsKeys } from 'src/types'
import { ActionsType } from 'src/types'
import { NOID } from 'src/defaults'
import { Logs } from 'src/services/logs'
import { Info } from 'src/services/info'
import { Windows } from 'src/services/windows'

interface PortNameData {
  srcType: InstanceType
  dstType: InstanceType
  srcWinId?: ID
  dstWinId?: ID
  srcTabId?: ID
  dstTabId?: ID
}

export interface ConnectionInfo {
  type: InstanceType
  /**
   * - NOID (-1) for background
   * - Window id for sidebar and popup
   * - Tab id for content scripts
   */
  id: ID
  reconnectCount: number
  /**
   * Port from browser.runtime.connect()
   */
  localPort?: browser.runtime.Port
  /**
   * Port from browser.runtime.onConnect event
   */
  remotePort?: browser.runtime.Port
}

interface MsgWaitingForAnswer {
  timeout: number
  ok?: (v?: any) => void
  err?: (err?: any) => void
  portName: string
}

const MSG_CONFIRMATION_MAX_DELAY = 1000
const CONNECT_CONFIRMATION_MAX_DELAY = 1000

let actions: Actions | undefined

export const IPC = {
  bgConnection: undefined as ConnectionInfo | undefined,
  searchPopupConnections: {} as Record<ID, ConnectionInfo>,
  sidebarConnections: {} as Record<ID, ConnectionInfo>,
  setupPageConnections: {} as Record<ID, ConnectionInfo>,
  groupPageConnections: {} as Record<ID, ConnectionInfo>,

  registerActions,
  connectTo,

  sidebar,
  sidebars,
  setupPage,
  groupPage,
  searchPopup,
  bg,
  send,
  broadcast,

  onConnected,
  onDisconnected,

  setupConnectionListener,
  setupGlobalMessageListener,
}

function registerActions(a: Actions): void {
  actions = a
}

/**
 * Connects current instance to another instance.
 */
let connectingTimeout: number | undefined
function connectTo(
  dstType: InstanceType,
  dstWinId = NOID,
  dstTabId = NOID
): browser.runtime.Port | undefined {
  const srcType = Info.instanceType
  const srcWinId = Windows.id
  const srcTabId = Info.currentTabId
  const toBg = dstType === InstanceType.bg
  const toSidebar = dstType === InstanceType.sidebar
  const toSetup = dstType === InstanceType.setup
  const toSearch = dstType === InstanceType.search
  const toGroup = dstType === InstanceType.group

  // Check destination id
  let id
  if (toBg) id = NOID
  else if ((toSidebar || toSearch) && dstWinId !== NOID) id = dstWinId
  else if ((toSetup || toGroup) && dstTabId !== NOID) id = dstTabId
  else {
    Logs.err('IPC.connectTo: No destination id')
    return
  }

  // Create port name
  const portNameData: PortNameData = { srcType, dstType }
  if (srcWinId !== NOID) portNameData.srcWinId = srcWinId
  if (srcTabId !== NOID) portNameData.srcTabId = srcTabId
  if (dstWinId !== NOID) portNameData.dstWinId = dstWinId
  if (dstTabId !== NOID) portNameData.dstTabId = dstTabId
  const portNameJson = JSON.stringify(portNameData)

  // Find/Create connection
  let connection: ConnectionInfo,
    connectionIsNew = false
  if (toBg && IPC.bgConnection) {
    connection = IPC.bgConnection
  } else if (toSidebar && IPC.sidebarConnections[dstWinId]) {
    connection = IPC.sidebarConnections[dstWinId]
  } else if (toSetup && IPC.setupPageConnections[dstTabId]) {
    connection = IPC.setupPageConnections[dstTabId]
  } else if (toSearch && IPC.searchPopupConnections[dstWinId]) {
    connection = IPC.searchPopupConnections[dstWinId]
  } else if (toGroup && IPC.groupPageConnections[dstTabId]) {
    connection = IPC.groupPageConnections[dstTabId]
  } else {
    connectionIsNew = true
    connection = { type: dstType, id, reconnectCount: 0 }
    if (toBg) IPC.bgConnection = connection
    else if (toSidebar) IPC.sidebarConnections[dstWinId] = connection
    else if (toSetup) IPC.setupPageConnections[dstTabId] = connection
    else if (toSearch) IPC.searchPopupConnections[dstWinId] = connection
    else if (toGroup) IPC.groupPageConnections[dstTabId] = connection
  }
  if (connection.localPort) connection.localPort.disconnect()
  connection.localPort = browser.runtime.connect({ name: portNameJson })

  // Handle messages
  const postListener = <T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) => {
    onPostMsg(msg, connection.localPort)
  }
  connection.localPort.onMessage.addListener(postListener)

  // Handle disconnect
  const disconnectListener = (port: browser.runtime.Port) => {
    port.onMessage.removeListener(postListener)
    port.onDisconnect.removeListener(disconnectListener)

    // Remove port
    connection.localPort = undefined

    // Remove connection
    let connectionIsRemoved = false
    if (!connection.remotePort) {
      connectionIsRemoved = true
      if (toBg) IPC.bgConnection = undefined
      else if (toSidebar) delete IPC.sidebarConnections[dstWinId]
      else if (toSetup) delete IPC.setupPageConnections[dstTabId]
      else if (toSearch) delete IPC.searchPopupConnections[dstWinId]
      else if (toGroup) delete IPC.groupPageConnections[dstTabId]
    }

    // Run disconnection handlers
    if (connectionIsRemoved) {
      const handlers = disconnectionHandlers.get(dstType)
      if (handlers) handlers.forEach(cb => cb(connection.id))
    }

    // Reconnect to background
    if (toBg && connection.reconnectCount++ < 3) {
      clearTimeout(connectingTimeout)
      connectingTimeout = setTimeout(() => connectTo(dstType, dstWinId), 120)
    }
  }
  connection.localPort.onDisconnect.addListener(disconnectListener)

  // Stop reconnection
  clearTimeout(connectingTimeout)
  connectingTimeout = setTimeout(() => {
    if (connection.localPort && !connection.localPort.error) connection.reconnectCount = 0
    else Logs.err('IPC.connectTo: Cannot reconnect')
  }, 120)

  // Wait confirmation
  const timeout = setTimeout(() => {
    Logs.warn('IPC.connectTo: No confirmation:', Info.getInstanceName(dstType))
    msgsWaitingForAnswer.delete(-1)
  }, CONNECT_CONFIRMATION_MAX_DELAY)
  msgsWaitingForAnswer.set(-1, {
    timeout,
    portName: '',
    ok: () => {
      if (connectionIsNew) {
        const handlers = connectionHandlers.get(dstType)
        if (handlers) handlers.forEach(cb => cb(connection.id))
      }
    },
  })

  return connection.localPort
}

/**
 * Sends message to sidebar.
 */
function sidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  dstWinId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.sidebar, dstWinId, action, args }
  return send(msg)
}

/**
 * Sends message to all connected sidebars.
 */
function sidebars<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>[]> | undefined {
  const tasks = Object.values(IPC.sidebarConnections).map(con => {
    return send({ dstType: InstanceType.sidebar, dstWinId: con.id, action, args })
  })
  return Promise.all(tasks)
}

/**
 * Sends message to setup page.
 */
function setupPage<T extends InstanceType.setup, A extends ActionsKeys<T>>(
  dstTabId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.setup, dstTabId, action, args }
  return send(msg)
}

/**
 * Sends message to group page
 */
function groupPage(dstTabId: ID, msg: any): void {
  browser.tabs.sendMessage(dstTabId, msg).catch(() => {
    /** Ignore possible errors **/
  })
}

/**
 * Sends message to search popup.
 */
function searchPopup<T extends InstanceType.search, A extends ActionsKeys<T>>(
  dstWinId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.search, dstWinId, action, args }
  return send(msg)
}

/**
 * Sends message to background.
 */
function bg<T extends InstanceType.bg, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.bg, action, args }
  return send(msg)
}

const msgsWaitingForAnswer: Map<number, MsgWaitingForAnswer> = new Map()
let msgCounter = 1
/**
 * Send message between foreground and background using port.postMessage
 */
async function send<T extends InstanceType, A extends ActionsKeys<T>>(
  msg: Message<T, A>,
  noRetry = false
): Promise<ReturnType<ActionsType<T>[A]>> {
  if (msg.dstType === undefined) return Promise.reject('IPC.send: No dstType')

  // Get port
  let connection, port: browser.runtime.Port | undefined
  if (msg.dstType === InstanceType.bg) {
    connection = IPC.bgConnection
  } else if (msg.dstType === InstanceType.sidebar && msg.dstWinId !== undefined) {
    connection = IPC.sidebarConnections[msg.dstWinId]
  } else if (msg.dstType === InstanceType.setup && msg.dstTabId !== undefined) {
    connection = IPC.setupPageConnections[msg.dstTabId]
  } else if (msg.dstType === InstanceType.search && msg.dstWinId !== undefined) {
    connection = IPC.searchPopupConnections[msg.dstWinId]
  } else if (msg.dstType === InstanceType.group && msg.dstTabId !== undefined) {
    connection = IPC.groupPageConnections[msg.dstTabId]
  }
  port = connection?.localPort ?? connection?.remotePort

  return new Promise((ok, err) => {
    if (msg.dstType === undefined) return

    // No port, try to connect
    if (!port || port.error) {
      if (port?.error) Logs.err('IPC.send: Target port has an error:', port?.error)
      port = undefined

      if (!noRetry) {
        Logs.warn('IPC.send: Cannot find appropriate port, trying to reconnect...')
        port = IPC.connectTo(msg.dstType, msg.dstWinId, msg.dstTabId)
      }

      if (!port || port.error) {
        if (port?.error) Logs.err('IPC.send: Target port has error:', port?.error)
        return err(`IPC.send: Cannot get target port for "${Info.getInstanceName(msg.dstType)}"`)
      }
    }

    // Set message id
    const msgId = msgCounter++
    msg.id = msgId

    // Send the message
    try {
      port.postMessage(msg)
    } catch (e) {
      Logs.warn('IPC.send: Got error on postMessage, trying to reconnect...', e)
      port = IPC.connectTo(msg.dstType, msg.dstWinId, msg.dstTabId)
      if (!port || port.error) {
        if (port?.error) Logs.err('IPC.send: Target port has error:', port?.error)
        return err(`IPC.send: Cannot get target port for "${Info.getInstanceName(msg.dstType)}"`)
      }

      try {
        port?.postMessage(msg)
      } catch (e) {
        const dstTypeName = Info.getInstanceName(msg.dstType)
        Logs.err(`IPC.send: Cannot post message to "${dstTypeName}":`, e)
        return err(`IPC.send: Cannot post message to "${dstTypeName}": ${String(e)}`)
      }
    }

    // Wait confirmation
    const timeout = setTimeout(async () => {
      Logs.warn('IPC.send: No confirmation:', Info.getInstanceName(msg.dstType), msg.action)

      msgsWaitingForAnswer.delete(msgId)
      if (port) port.error = { message: 'No confirmation' }

      // Try to send message again with reconnection
      if (!noRetry) {
        try {
          ok(await IPC.send(msg, true))
        } catch (e) {
          err(e)
        }
      } else {
        err('IPC.send: No confirmation')
      }
    }, MSG_CONFIRMATION_MAX_DELAY)
    msgsWaitingForAnswer.set(msgId, { timeout, ok, err, portName: port.name })
  })
}

/**
 * runtime.sendMessage wrapper.
 */
function broadcast<T extends InstanceType, A extends ActionsKeys<T>>(
  msg: Message<T, A>
): Promise<ReturnType<ActionsType<T>[A]>> {
  return browser.runtime.sendMessage(msg)
}

/**
 * Handles connection event.
 */
function onConnect(port: browser.runtime.Port) {
  let portNameData: PortNameData | undefined
  try {
    portNameData = JSON.parse(port.name) as PortNameData
  } catch {
    return Logs.err('IPC.onConnect: Cannot parse PortName')
  }
  if (portNameData.dstType !== Info.instanceType) return
  if (portNameData.dstWinId !== undefined && portNameData.dstWinId !== Windows.id) return

  const srcType = portNameData.srcType
  const srcWinId = portNameData.srcWinId ?? NOID
  const srcTabId = portNameData.srcTabId ?? NOID

  // Check connection data
  const fromBg = srcType === InstanceType.bg
  const fromSidebar = srcType === InstanceType.sidebar
  const fromSetup = srcType === InstanceType.setup
  const fromSearch = srcType === InstanceType.search
  const fromGroup = srcType === InstanceType.group
  if (fromSidebar && srcWinId === NOID) return Logs.err('IPC.onConnect: Sidebar: No srcWinId')
  if (fromSetup && srcTabId === NOID) return Logs.err('IPC.onConnect: Setup page: No srcTabId')
  if (fromSearch && srcWinId === NOID) return Logs.err('IPC.onConnect: Search popup: No srcWinId')
  if (fromGroup && srcTabId === NOID) return Logs.err('IPC.onConnect: Group page: No srcTabId')

  // Check source id
  let id
  if (fromBg) id = NOID
  else if ((fromSidebar || fromSearch) && srcWinId !== NOID) id = srcWinId
  else if ((fromSetup || fromGroup) && srcTabId !== NOID) id = srcTabId
  else {
    Logs.err('IPC.onConnect: No source id')
    return
  }

  // Find/Create connection
  let connection: ConnectionInfo
  let connectionIsNew = false
  if (fromBg && IPC.bgConnection) {
    connection = IPC.bgConnection
  } else if (fromSidebar && IPC.sidebarConnections[srcWinId]) {
    connection = IPC.sidebarConnections[srcWinId]
  } else if (fromSetup && IPC.setupPageConnections[srcTabId]) {
    connection = IPC.setupPageConnections[srcTabId]
  } else if (fromSearch && IPC.searchPopupConnections[srcWinId]) {
    connection = IPC.searchPopupConnections[srcWinId]
  } else if (fromGroup && IPC.groupPageConnections[srcTabId]) {
    connection = IPC.groupPageConnections[srcTabId]
  } else {
    connectionIsNew = true
    connection = { type: srcType, id, reconnectCount: 0 }
    if (fromBg) IPC.bgConnection = connection
    else if (fromSidebar) IPC.sidebarConnections[srcWinId] = connection
    else if (fromSetup) IPC.setupPageConnections[srcTabId] = connection
    else if (fromSearch) IPC.searchPopupConnections[srcWinId] = connection
    else if (fromGroup) IPC.groupPageConnections[srcTabId] = connection
  }
  if (connection.remotePort) connection.remotePort.disconnect()
  connection.remotePort = port

  // Run connection handlers
  if (connectionIsNew) {
    const handlers = connectionHandlers.get(srcType)
    if (handlers) handlers.forEach(cb => cb(connection.id))
  }

  // Listen for messages
  const postListener = <T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) => {
    onPostMsg(msg, port)
  }
  port.onMessage.addListener(postListener)

  // Handle disconnect
  const disconnectListener = (port: browser.runtime.Port) => {
    port.onMessage.removeListener(postListener)
    port.onDisconnect.removeListener(disconnectListener)

    if (!portNameData) return

    // Handle unfinished communications
    for (const [msgId, waiting] of msgsWaitingForAnswer.entries()) {
      if (waiting.portName === port.name) {
        clearTimeout(waiting.timeout)
        if (waiting.err) waiting.err('IPC: Target disconnected')
        msgsWaitingForAnswer.delete(msgId)
      }
    }

    // Remove port
    connection.remotePort = undefined

    // Remove connection
    let connectionIsRemoved = false
    if (!connection.localPort) {
      connectionIsRemoved = true
      if (fromBg) IPC.bgConnection = undefined
      else if (fromSidebar) delete IPC.sidebarConnections[srcWinId]
      else if (fromSetup) delete IPC.setupPageConnections[srcTabId]
      else if (fromSearch) delete IPC.searchPopupConnections[srcWinId]
      else if (fromGroup) delete IPC.groupPageConnections[srcTabId]
    }

    // Run disconnection handlers
    if (connectionIsRemoved) {
      const handlers = disconnectionHandlers.get(srcType)
      if (handlers) handlers.forEach(cb => cb(connection.id))
    }
  }
  port.onDisconnect.addListener(disconnectListener)

  // Send connection confirmation message
  port.postMessage(-1)
}

const connectionHandlers: Map<InstanceType, ((id: ID) => void)[]> = new Map()
function onConnected(type: InstanceType, cb: (winOrTabId: ID) => void) {
  const handlers = connectionHandlers.get(type) ?? []
  handlers.push(cb)
  connectionHandlers.set(type, handlers)
}

const disconnectionHandlers: Map<InstanceType, ((id: ID) => void)[]> = new Map()
function onDisconnected(type: InstanceType, cb: (winOrTabId: ID) => void) {
  const handlers = disconnectionHandlers.get(type) ?? []
  handlers.push(cb)
  disconnectionHandlers.set(type, handlers)
}

/**
 * Runs a registered action (service function)
 * and returns its result.
 */
function runActionFor<T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>): any {
  if (msg.action !== undefined && actions) {
    const action = actions[msg.action] as AnyFunc
    if (action) {
      if (msg.arg) return action(msg.arg)
      else if (msg.args) return action(...msg.args)
      else return action()
    }
  }
}

/**
 * Handles message received from Port in background instance
 * and sends the answer message with the action result.
 */
async function onPostMsg<T extends InstanceType, A extends keyof Actions>(
  msg: Message<T, A> | number,
  port?: browser.runtime.Port
): Promise<void> {
  // Handle confirmation of connection
  if (msg === -1) {
    const waiting = msgsWaitingForAnswer.get(-1)
    if (waiting) {
      clearTimeout(waiting.timeout)
      if (waiting.ok) waiting.ok()
      msgsWaitingForAnswer.delete(-1)
    }
    return
  }

  // Handle simple confirmation of a received message
  if (typeof msg === 'number') {
    const waiting = msgsWaitingForAnswer.get(msg)
    if (waiting) clearTimeout(waiting.timeout)
    return
  }

  // Handle answer
  if (!msg.action && msg.id) {
    const waiting = msgsWaitingForAnswer.get(msg.id)
    if (waiting) {
      clearTimeout(waiting.timeout)
      if (msg.error && waiting.err) waiting.err(msg.error)
      else if (waiting.ok) waiting.ok(msg.result)
      msgsWaitingForAnswer.delete(msg.id)
    }
    return
  }

  // Run an action
  let result, error
  try {
    result = runActionFor(msg)
  } catch (err) {
    error = String(err)
    Logs.err(`IPC.onPostMsg: Error on running "${String(msg.action)}" action:`, err)
  }

  // Send the result
  if (msg.id && port) {
    if (result instanceof Promise) {
      // Send confirmation message
      port.postMessage(msg.id)
      // ...then wait for the final result and send it too
      let finalResult, error
      try {
        finalResult = await result
      } catch (err) {
        error = String(err)
      }
      port.postMessage({ id: msg.id, result: finalResult, error })
    } else {
      port.postMessage({ id: msg.id, result, error })
    }
  }
}

/**
 * Handles the message broadcasted with runtime.sendMessage,
 * checks destination
 * and sends result back.
 */
function onSendMsg<T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) {
  // Check if this instance is the correct destination
  if (msg.dstWinId !== undefined && msg.dstWinId !== Windows.id) return
  if (msg.dstType !== undefined && msg.dstType !== Info.instanceType) return

  // Run an action
  let result
  try {
    result = runActionFor(msg)
  } catch (err) {
    Logs.err(`IPC.onSendMsg: Error on running "${String(msg.action)}" action:`, err)
  }

  // Send the result
  if (result instanceof Promise) return result
  else if (result !== undefined) return Promise.resolve(result)
}

function setupConnectionListener(): void {
  browser.runtime.onConnect.addListener(onConnect)
}

function setupGlobalMessageListener(): void {
  browser.runtime.onMessage.addListener(onSendMsg)
}
