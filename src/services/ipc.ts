import { AnyFunc, Actions, Message, InstanceType, ActionsKeys } from 'src/types'
import { ActionsType } from 'src/types'
import { NOID } from 'src/defaults'
import * as Logs from 'src/services/logs'
import { getInstanceName } from './info.actions'
import { Windows } from './windows'

export interface PortNameData {
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

const MSG_CONFIRMATION_MAX_DELAY = 5000
const CONNECT_CONFIRMATION_MAX_DELAY = 5000

let actions: Actions | undefined
let _localType = InstanceType.unknown
let _localWinId = NOID
let _localTabId = NOID

export const state = {
  bgConnection: undefined as ConnectionInfo | undefined,
  searchPopupConnections: new Map<ID, ConnectionInfo>(),
  sidebarConnections: new Map<ID, ConnectionInfo>(),
  setupPageConnections: new Map<ID, ConnectionInfo>(),
  groupPageConnections: new Map<ID, ConnectionInfo>(),
}

export function setInstanceType(type: InstanceType): void {
  _localType = type
}

export function setWinId(id: ID): void {
  _localWinId = id
}

export function setTabId(id: ID): void {
  _localTabId = id
}

export function registerActions(a: Actions): void {
  actions = a
}

export function isConnected(type: InstanceType, id = NOID): boolean {
  if (type === InstanceType.bg && state.bgConnection) return true
  else if (type === InstanceType.sidebar) return state.sidebarConnections.has(id)
  else if (type === InstanceType.setup) return state.setupPageConnections.has(id)
  else if (type === InstanceType.search) return state.searchPopupConnections.has(id)
  else if (type === InstanceType.group) return state.groupPageConnections.has(id)
  return false
}

export function getConnection(type: InstanceType, id: ID): ConnectionInfo | void {
  if (type === InstanceType.bg && state.bgConnection) return state.bgConnection
  else if (type === InstanceType.sidebar) return state.sidebarConnections.get(id)
  else if (type === InstanceType.setup) return state.setupPageConnections.get(id)
  else if (type === InstanceType.search) return state.searchPopupConnections.get(id)
  else if (type === InstanceType.group) return state.groupPageConnections.get(id)
}

function createConnection(type: InstanceType, id: ID): ConnectionInfo {
  const connection = { type, id, reconnectCount: 0 }
  if (type === InstanceType.bg) state.bgConnection = connection
  else if (type === InstanceType.sidebar) state.sidebarConnections.set(id, connection)
  else if (type === InstanceType.setup) state.setupPageConnections.set(id, connection)
  else if (type === InstanceType.search) state.searchPopupConnections.set(id, connection)
  else if (type === InstanceType.group) state.groupPageConnections.set(id, connection)
  return connection
}

/**
 * Connects current instance to another instance.
 */
let connectingTimeout: number | undefined
export function connectTo(
  dstType: InstanceType,
  dstWinId = NOID,
  dstTabId = NOID
): browser.runtime.Port | undefined {
  const srcType = _localType
  const srcWinId = _localWinId
  const srcTabId = _localTabId
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
  if (dstWinId !== NOID && (toSidebar || toSearch)) portNameData.dstWinId = dstWinId
  if (dstTabId !== NOID && (toSetup || toGroup)) portNameData.dstTabId = dstTabId
  const portNameJson = JSON.stringify(portNameData)

  // Find/Create connection
  let connection: ConnectionInfo
  let connectionIsNew = false
  const existedConnection = getConnection(dstType, id)
  if (existedConnection) {
    connection = existedConnection
  } else {
    connectionIsNew = true
    connection = createConnection(dstType, id)
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
      if (toBg) state.bgConnection = undefined
      else if (toSidebar) state.sidebarConnections.delete(dstWinId)
      else if (toSetup) state.setupPageConnections.delete(dstTabId)
      else if (toSearch) state.searchPopupConnections.delete(dstWinId)
      else if (toGroup) state.groupPageConnections.delete(dstTabId)
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
    Logs.warn('IPC.connectTo: No confirmation:', getInstanceName(dstType))
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
export function sidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  dstWinId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.sidebar, dstWinId, action, args }
  return request(msg, AutoConnectMode.WithRetry)
}
export function sendToSidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  dstWinId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  send({ dstType: InstanceType.sidebar, dstWinId, action, args })
}

/**
 * Sends message to all connected sidebars.
 */
export function sidebars<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>[]> | undefined {
  const tasks = Array.from(state.sidebarConnections.keys()).map(id => {
    const msg = { dstType: InstanceType.sidebar, dstWinId: id, action, args }
    return request(msg, AutoConnectMode.WithRetry)
  })
  return Promise.all(tasks)
}
export function sendToSidebars<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  state.sidebarConnections.forEach(con => {
    send({ dstType: InstanceType.sidebar, dstWinId: con.id, action, args })
  })
}
export function sendToLastFocusedSidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  if (state.sidebarConnections.size === 1) {
    const [connection] = state.sidebarConnections.values()
    if (connection) sidebar(connection.id, action, ...args)
    return
  }

  if (Windows.lastFocusedWinId === undefined) {
    sendToSidebars(action, ...args)
    return
  }

  const win = Windows.byId[Windows.lastFocusedWinId]
  if (win) {
    sidebar(Windows.lastFocusedWinId, action, ...args)
  }
}

/**
 * Sends message to setup page.
 */
export function setupPage<T extends InstanceType.setup, A extends ActionsKeys<T>>(
  dstTabId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.setup, dstTabId, action, args }
  return request(msg, AutoConnectMode.WithRetry)
}

/**
 * Sends message to group page
 */
export function groupPage(dstTabId: ID, msg: any): void {
  browser.tabs.sendMessage(dstTabId, msg).catch(() => {
    /** Ignore possible errors **/
  })
}

/**
 * Sends message to search popup.
 */
export function sendToSearchPopup<T extends InstanceType.search, A extends ActionsKeys<T>>(
  dstWinId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  send({ dstType: InstanceType.search, dstWinId, action, args })
}

/**
 * Sends message to background.
 */
export function bg<T extends InstanceType.bg, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { dstType: InstanceType.bg, action, args }
  console.log(msg)
  return request(msg, AutoConnectMode.WithRetry)
}

export function send<T extends InstanceType, A extends ActionsKeys<T>>(msg: Message<T, A>): void {
  if (msg.dstType === undefined) return

  let id = NOID
  if (msg.dstType === InstanceType.sidebar && msg.dstWinId !== undefined) id = msg.dstWinId
  else if (msg.dstType === InstanceType.setup && msg.dstTabId !== undefined) id = msg.dstTabId
  else if (msg.dstType === InstanceType.search && msg.dstWinId !== undefined) id = msg.dstWinId
  else if (msg.dstType === InstanceType.group && msg.dstTabId !== undefined) id = msg.dstTabId

  // Get port
  const connection = getConnection(msg.dstType, id)
  const port = connection?.localPort ?? connection?.remotePort

  if (!port || port.error) return

  try {
    port.postMessage(msg)
  } catch (e) {
    Logs.warn('IPC.send: Got error on postMessage', e)
  }
}

const enum AutoConnectMode {
  Off = 0,
  On = 1,
  WithRetry = 2,
}
const msgsWaitingForAnswer: Map<number, MsgWaitingForAnswer> = new Map()
let msgCounter = 1
/**
 * Send message using port.postMessage and wait for answer
 */
export async function request<T extends InstanceType, A extends ActionsKeys<T>>(
  msg: Message<T, A>,
  autoConnectMode: AutoConnectMode
): Promise<ReturnType<ActionsType<T>[A]>> {
  if (msg.dstType === undefined) return Promise.reject('IPC.request: No dstType')

  let id = NOID
  if (msg.dstType === InstanceType.sidebar && msg.dstWinId !== undefined) id = msg.dstWinId
  else if (msg.dstType === InstanceType.setup && msg.dstTabId !== undefined) id = msg.dstTabId
  else if (msg.dstType === InstanceType.search && msg.dstWinId !== undefined) id = msg.dstWinId
  else if (msg.dstType === InstanceType.group && msg.dstTabId !== undefined) id = msg.dstTabId

  // Get port
  const connection = getConnection(msg.dstType, id)
  let port = connection?.localPort ?? connection?.remotePort

  return new Promise((ok, err) => {
    if (msg.dstType === undefined) return err('IPC.request: No dstType')

    // No port, try to connect
    if (!port || port.error) {
      if (autoConnectMode === AutoConnectMode.Off) return err('IPC.request: No port')

      if (port?.error) Logs.err('IPC.request: Target port has an error:', port?.error)
      port = undefined

      if (autoConnectMode === AutoConnectMode.WithRetry) {
        Logs.warn('IPC.request: Cannot find appropriate port, trying to reconnect...')
        port = connectTo(msg.dstType, msg.dstWinId, msg.dstTabId)
      }

      if (!port || port.error) {
        if (port?.error) Logs.err('IPC.request: Target port has error:', port?.error)
        return err(`IPC.request: Cannot get target port for "${getInstanceName(msg.dstType)}"`)
      }
    }

    // Set message id
    const msgId = msgCounter++
    msg.id = msgId

    // Send the message
    try {
      port.postMessage(msg)
    } catch (e) {
      Logs.warn('IPC.request: Got error on postMessage, trying to reconnect...', e)
      port = connectTo(msg.dstType, msg.dstWinId, msg.dstTabId)
      if (!port || port.error) {
        if (port?.error) Logs.err('IPC.request: Target port has error:', port?.error)
        return err(`IPC.request: Cannot get target port for "${getInstanceName(msg.dstType)}"`)
      }

      try {
        port?.postMessage(msg)
      } catch (e) {
        const dstTypeName = getInstanceName(msg.dstType)
        Logs.err(`IPC.request: Cannot post message to "${dstTypeName}":`, e)
        return err(`IPC.request: Cannot post message to "${dstTypeName}": ${String(e)}`)
      }
    }

    // Wait confirmation
    const timeout = setTimeout(async () => {
      Logs.warn('IPC.request: No confirmation:', getInstanceName(msg.dstType), msg.action)

      msgsWaitingForAnswer.delete(msgId)
      if (port) port.error = { message: 'No confirmation' }

      // Try to send message again with reconnection
      if (autoConnectMode === AutoConnectMode.WithRetry) {
        try {
          ok(await request(msg, AutoConnectMode.Off))
        } catch (e) {
          err(e)
        }
      } else {
        err('IPC.request: No confirmation')
      }
    }, MSG_CONFIRMATION_MAX_DELAY)
    msgsWaitingForAnswer.set(msgId, { timeout, ok, err, portName: port.name })
  })
}

/**
 * runtime.sendMessage wrapper.
 */
export function broadcast<T extends InstanceType, A extends ActionsKeys<T>>(
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
  if (portNameData.dstType !== _localType) return
  if (portNameData.dstWinId !== undefined && portNameData.dstWinId !== _localWinId) return

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
  const existedConnection = getConnection(srcType, id)
  if (existedConnection) {
    connection = existedConnection
  } else {
    connectionIsNew = true
    connection = createConnection(srcType, id)
  }

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
      if (fromBg) state.bgConnection = undefined
      else if (fromSidebar) state.sidebarConnections.delete(srcWinId)
      else if (fromSetup) state.setupPageConnections.delete(srcTabId)
      else if (fromSearch) state.searchPopupConnections.delete(srcWinId)
      else if (fromGroup) state.groupPageConnections.delete(srcTabId)
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
export function onConnected(type: InstanceType, cb: (winOrTabId: ID) => void) {
  if (type === InstanceType.bg && state.bgConnection) cb(NOID)
  if (type === InstanceType.sidebar) state.sidebarConnections.forEach(con => cb(con.id))
  if (type === InstanceType.setup) state.setupPageConnections.forEach(con => cb(con.id))
  if (type === InstanceType.search) state.searchPopupConnections.forEach(con => cb(con.id))
  if (type === InstanceType.group) state.groupPageConnections.forEach(con => cb(con.id))

  const handlers = connectionHandlers.get(type) ?? []
  handlers.push(cb)
  connectionHandlers.set(type, handlers)
}

const disconnectionHandlers: Map<InstanceType, ((id: ID) => void)[]> = new Map()
export function onDisconnected(type: InstanceType, cb: (winOrTabId: ID) => void) {
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
  if (msg.dstWinId !== undefined && msg.dstWinId !== _localWinId) return
  if (msg.dstType !== undefined && msg.dstType !== _localType) return

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

export function setupConnectionListener(): void {
  browser.runtime.onConnect.addListener(onConnect)
}

export function setupGlobalMessageListener(): void {
  browser.runtime.onMessage.addListener(onSendMsg)
}
