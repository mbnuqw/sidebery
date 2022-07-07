import { AnyFunc, Actions, Message, InstanceType, ActionsKeys } from 'src/types'
import { ActionsType } from 'src/types'
import { NOID } from 'src/defaults'
import { Logs } from 'src/services/logs'
import { Info } from 'src/services/info'
import { Windows } from 'src/services/windows'

interface PortNameData {
  srcType: InstanceType
  dstType: InstanceType
  srcWinId: ID
  dstWinId?: ID
}

export interface ConnectionInfo {
  srcType: InstanceType
  dstType: InstanceType
  srcWinId: ID
  dstWinId?: ID
  reconnectCount: number
  port?: browser.runtime.Port
}

interface MsgWaitingForAnswer {
  timeout: number
  cb: (v?: any) => void
  portName: string
}

let actions: Actions | undefined

export const IPC = {
  bgConnection: undefined as ConnectionInfo | undefined,
  searchPopupConnection: undefined as ConnectionInfo | undefined,
  sidebarConnections: {} as Record<ID, ConnectionInfo>,
  tabConnections: {} as Record<ID, ConnectionInfo>,

  registerActions,
  connectTo,

  sidebar,
  sidebars,
  searchPopup,
  bg,
  send,
  broadcast,

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
function connectTo(dstType: InstanceType, dstWinId: ID) {
  const srcType = Info.instanceType
  const srcWinId = Windows.id

  // Destination window id is required for non-background targets
  if (dstType !== InstanceType.bg && dstWinId === NOID) {
    Logs.err('IPC.connectTo: No dstWinId')
    return
  }

  // Create port name
  const portNameData: PortNameData = { srcType, dstType, srcWinId }
  if (dstWinId !== NOID) portNameData.dstWinId = dstWinId
  const portNameJson = JSON.stringify(portNameData)

  // Create connection
  const connection: ConnectionInfo = { ...portNameData, reconnectCount: 0 }
  connection.port = browser.runtime.connect({ name: portNameJson })

  if (dstType === InstanceType.bg) {
    IPC.bgConnection = connection
  } else if (dstType === InstanceType.sidebar) {
    IPC.sidebarConnections[dstWinId] = connection
  }

  // Handle messages
  const postListener = <T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) => {
    onPostMsg(msg, connection.port)
  }
  connection.port.onMessage.addListener(postListener)

  // Handle disconnect
  const disconnectListener = (port: browser.runtime.Port) => {
    port.onMessage.removeListener(postListener)
    port.onDisconnect.removeListener(disconnectListener)

    // On sidebar disconnection
    if (portNameData.dstType === InstanceType.sidebar) {
      delete IPC.sidebarConnections[dstWinId]
    }

    // On background disconnect
    else if (portNameData.dstType === InstanceType.bg) {
      IPC.bgConnection = undefined
    }

    // Reconnect
    if (connection.reconnectCount++ < 3) {
      clearTimeout(connectingTimeout)
      connectingTimeout = setTimeout(() => connectTo(dstType, dstWinId), 120)
    }
  }
  connection.port.onDisconnect.addListener(disconnectListener)

  // Stop reconnection
  clearTimeout(connectingTimeout)
  connectingTimeout = setTimeout(() => {
    if (connection.port && !connection.port.error) connection.reconnectCount = 0
    else Logs.err('IPC.connectTo: Cannot reconnect')
  }, 120)
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
 * Sends message to sidebars.
 */
function sidebars<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>[]> | undefined {
  if (Info.isBg) {
    const tasks = Object.values(Windows.byId).map(win => {
      return send({ dstType: InstanceType.sidebar, dstWinId: win.id, action, args })
    })
    return Promise.all(tasks)
  } else {
    const msg: Message<T, A> = { dstType: InstanceType.sidebar, action, args }
    browser.runtime.sendMessage(msg)
  }
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
let reconnectTryCount = 0
/**
 * Send message between foreground and background using port.postMessage
 * or runtime.sendMessage as fallback
 */
function send<T extends InstanceType, A extends ActionsKeys<T>>(
  msg: Message<T, A>
): Promise<ReturnType<ActionsType<T>[A]>> {
  // Get port
  let port: browser.runtime.Port | undefined
  if (msg.dstType === InstanceType.bg) {
    port = IPC.bgConnection?.port
  } else if (msg.dstType === InstanceType.sidebar && msg.dstWinId) {
    port = IPC.sidebarConnections[msg.dstWinId]?.port
  } else if (msg.dstType === InstanceType.search) {
    port = IPC.searchPopupConnection?.port
  }

  // No port, use fallback method
  if (!port || port.error) return browser.runtime.sendMessage(msg)

  return new Promise(ok => {
    if (!port) return

    const msgId = msgCounter++
    msg.id = msgId
    port.postMessage(msg)

    // Wait confirmation
    const timeout = setTimeout(() => {
      // No confirmation, use fallback method
      ok(browser.runtime.sendMessage(msg))
      msgsWaitingForAnswer.delete(msgId)

      if (port) port.error = { message: 'No confirmation' }

      // Try to reconnect
      if (reconnectTryCount++ < 3 && (!port || port?.error) && msg.dstType !== undefined) {
        connectTo(msg.dstType, msg.dstWinId ?? NOID)
      }
    }, 1000)
    msgsWaitingForAnswer.set(msgId, { timeout, cb: ok, portName: port.name })
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
    return Logs.err('IPC.onConnect: Cannot part PortName')
  }
  if (portNameData.dstType !== Info.instanceType) return
  if (portNameData.dstWinId !== undefined && portNameData.dstWinId !== Windows.id) return

  // Listen for messages
  const postListener = <T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) => {
    onPostMsg(msg, port)
  }
  port.onMessage.addListener(postListener)

  const connection: ConnectionInfo = { ...portNameData, port, reconnectCount: 0 }

  // On sidebar connection
  if (portNameData.srcType === InstanceType.sidebar) {
    if (portNameData.srcWinId === undefined) {
      return Logs.err('IPC.onConnect: Sidebar: No srcWinId')
    }
    IPC.sidebarConnections[portNameData.srcWinId] = connection
  }

  // On search popup connection
  else if (portNameData.srcType === InstanceType.search) {
    IPC.searchPopupConnection = connection
  }

  // Handle disconnect
  const disconnectListener = (port: browser.runtime.Port) => {
    port.onMessage.removeListener(postListener)
    port.onDisconnect.removeListener(disconnectListener)

    if (!portNameData) return

    // Handle unfinished communications
    for (const [msgId, waiting] of msgsWaitingForAnswer.entries()) {
      if (waiting.portName === port.name) {
        clearTimeout(waiting.timeout)
        if (waiting.cb) waiting.cb()
        msgsWaitingForAnswer.delete(msgId)
      }
    }

    // On sidebar disconnection
    if (portNameData.srcType === InstanceType.sidebar) {
      delete IPC.sidebarConnections[portNameData.srcWinId]

      if (Info.isBg && Windows.byId[portNameData.srcWinId]) {
        browser.windows.update(portNameData.srcWinId, { titlePreface: '' })
      }
    }

    // On search popup disconnection
    else if (portNameData.srcType === InstanceType.search) {
      IPC.searchPopupConnection = undefined
    }
  }
  port.onDisconnect.addListener(disconnectListener)
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
      if (waiting.cb) waiting.cb(msg.result)
      msgsWaitingForAnswer.delete(msg.id)
    }
    return
  }

  // Run an action
  let result
  try {
    result = runActionFor(msg)
  } catch (err) {
    Logs.err(`IPC.onPostMsg: Error on running "${String(msg.action)}" action:`, err)
  }

  // Send the result
  if (msg.id && port) {
    if (result instanceof Promise) {
      // Send confirmation message
      port.postMessage(msg.id)
      // ...then wait for result and send it too
      port.postMessage({ id: msg.id, result: await result })
    } else {
      port.postMessage({ id: msg.id, result })
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
