import { AnyFunc, Actions, ConnectInfo, Message, InstanceType, ActionsKeys } from 'src/types'
import { ActionsType } from 'src/types'
import { NOID } from 'src/defaults'
import { Logs } from 'src/services/logs'
import { Info } from 'src/services/info'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'

const connectedSidebars: Record<ID, browser.runtime.Port> = {}
let actions: Actions | undefined

export const Msg = {
  bg: undefined as browser.runtime.Port | undefined,
  bgConnectTryCount: 0,
  windowId: NOID,

  registerActions,
  connectToBg,
  call,
  callSidebar,
  req,
  reqSidebar,

  setupConnections,
  setupListeners,
}

function registerActions(a: Actions): void {
  actions = a
}

function call<T extends InstanceType, A extends ActionsKeys<T>>(
  it: T,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  const msg: Message<T, A> = { instanceType: it, action, args }
  if (it === InstanceType.bg && Msg.bg && !Msg.bg.error) Msg.bg.postMessage(msg)
  else browser.runtime.sendMessage(msg)
}

function callSidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  winId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  if (Info.isBg) {
    const win = Windows.byId[winId]
    if (!win || !win.sidebarPort) return

    const msg: Message<T, A> = { instanceType: InstanceType.sidebar, windowId: winId, action, args }
    if (win.sidebarPort) win.sidebarPort.postMessage(msg)
    else browser.runtime.sendMessage(msg)
  } else {
    const msg: Message<T, A> = { instanceType: InstanceType.sidebar, windowId: winId, action, args }
    browser.runtime.sendMessage(msg)
  }
}

export async function req<T extends InstanceType, A extends ActionsKeys<T>>(
  it: T,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { instanceType: it, action, args }
  return browser.runtime.sendMessage<Message<T, A>, ReturnType<ActionsType<T>[A]>>(msg)
}

function reqSidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  windowId: ID,
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): Promise<ReturnType<ActionsType<T>[A]>> {
  const msg: Message<T, A> = { instanceType: InstanceType.sidebar, windowId, action, args }
  return browser.runtime.sendMessage(msg)
}

let connectingTimeout: number | undefined
function connectToBg(instanceType: InstanceType, windowId: ID): void {
  Logs.info('Msg: Connect to background')

  const connectInfo = JSON.stringify({ instanceType, windowId })

  if (Msg.windowId === NOID) Msg.windowId = windowId

  Msg.bg = browser.runtime.connect({ name: connectInfo })
  Msg.bg.onMessage.addListener(onMsgFromBgInFg)
  Msg.bg.onDisconnect.addListener(onBgDisconnect)

  clearTimeout(connectingTimeout)
  connectingTimeout = setTimeout(() => {
    if (Msg.bg) Msg.bgConnectTryCount = 0
    else Logs.err('Cannot connect to background process')
  }, 120)
}

function onSidebarMsg<T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>): void {
  if (!msg.action) return
  if (!actions) return
  const action = actions[msg.action] as AnyFunc

  if (msg.action !== undefined && action) {
    if (msg.arg) action(msg.arg)
    else if (msg.args) action(...msg.args)
    else action()
  }
}

function onBgDisconnect(port: browser.runtime.Port): void {
  let info: ConnectInfo
  try {
    info = JSON.parse(port.name) as ConnectInfo
  } catch (err) {
    return
  }

  if (info.windowId !== Msg.windowId) return
  Msg.bg?.onMessage.removeListener(onMsgFromBgInFg)
  Msg.bg?.onDisconnect.removeListener(onBgDisconnect)
  Msg.bg = undefined

  if (Msg.bgConnectTryCount++ >= 3) return

  clearTimeout(connectingTimeout)
  connectingTimeout = setTimeout(() => connectToBg(info.instanceType, Msg.windowId), 120)
}

function onConnectToBgInBg(port: browser.runtime.Port) {
  // Setup message handling
  const info = JSON.parse(port.name) as ConnectInfo

  // Sidebar
  if (info.instanceType === InstanceType.sidebar) {
    const win = Windows.byId[info.windowId]
    if (!win) return
    win.sidebarPort = port

    if (Settings.reactive.markWindow && win.id !== undefined) {
      browser.windows.update(win.id, { titlePreface: Settings.reactive.markWindowPreface })
    }

    connectedSidebars[info.windowId] = port
    port.onMessage.addListener(onSidebarMsg)

    Logs.info(`Sidebar (win: ${info.windowId}) connected`)
  }

  // Handle disconnect
  port.onDisconnect.addListener(onDisconnectFromBgInBg)
}

function onDisconnectFromBgInBg(port: browser.runtime.Port) {
  const info = JSON.parse(port.name) as ConnectInfo
  const targetPort = connectedSidebars[info.windowId]
  if (info.instanceType === InstanceType.sidebar && targetPort) {
    const window = Windows.byId[info.windowId]

    if (window) {
      delete window.sidebarPort
      if (Settings.reactive.markWindow) {
        browser.windows.update(info.windowId, { titlePreface: '' })
      }
    }

    targetPort.onMessage.removeListener(onSidebarMsg)
    delete connectedSidebars[info.windowId]

    Logs.info(`Sidebar (win: ${info.windowId}) disconnected`)
  }
}

function onMsgFromFgInBg<T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) {
  if (!msg.action) return
  if (!actions) return

  const action = actions[msg.action] as AnyFunc | undefined
  if (!action) return

  if (msg.windowId !== undefined && msg.windowId !== -1) return
  if (msg.instanceType !== undefined && msg.instanceType !== InstanceType.bg) return

  // Run action
  let result
  // prettier-ignore
  if (msg.arg) result = action(msg.arg) /* eslint-disable-line */
  else if (msg.args) result = action(...msg.args) /* eslint-disable-line */
  else result = action() /* eslint-disable-line */

  if (result instanceof Promise) return result
  else return Promise.resolve(result)
}

function onMsgFromBgInFg<T extends InstanceType, A extends keyof Actions>(msg: Message<T, A>) {
  if (msg.windowId !== undefined && msg.windowId !== Windows.id) return
  if (msg.instanceType !== undefined && msg.instanceType !== Info.instanceType) return

  // Run action
  if (msg.action && actions?.[msg.action]) {
    const action = actions?.[msg.action] as AnyFunc

    let result
    // prettier-ignore
    if (msg.arg) result = action(msg.arg) /* eslint-disable-line */
    else if (msg.args) result = action(...msg.args) /* eslint-disable-line */
    else result = action() /* eslint-disable-line */

    if (result instanceof Promise) return result
    else return Promise.resolve(result)
  }
}

function setupConnections(): void {
  browser.runtime.onConnect.addListener(onConnectToBgInBg)
}

function setupListeners(): void {
  if (Info.isBg) {
    browser.runtime.onMessage.addListener(onMsgFromFgInBg)
  } else {
    browser.runtime.onMessage.addListener(onMsgFromBgInFg)
  }
}
