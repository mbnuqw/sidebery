import Actions from '../actions.js'

const connectedSidebars = {}
let firstSidebarInitHandlers = []
let connectPending = []

/**
 * Init global message handler
 */
function initGlobalMessaging() {
  browser.runtime.onMessage.addListener(msg => {
    if (!msg.action || !Actions[msg.action]) return
    if (msg.windowId !== undefined && msg.windowId !== -1) return
    if (msg.instanceType !== undefined && msg.instanceType !== 'bg') return

    // Run action
    if (msg.action && Actions[msg.action]) {
      let result
      if (msg.arg) result = Actions[msg.action](msg.arg)
      else if (msg.args) result = Actions[msg.action](...msg.args)
      else result = Actions[msg.action]()

      if (result instanceof Promise) return result
      else return Promise.resolve(result)
    }
  })
}

/**
 * Handle runtime messages
 */
function initMessaging() {
  browser.runtime.onConnect.addListener(port => {
    // Setup message handling
    let info = JSON.parse(port.name)
    if (info.instanceType === 'sidebar') {
      if (!this.windows[info.windowId]) return
      connectedSidebars[info.windowId] = port
      port.onMessage.addListener(onSidebarMsg)

      if (firstSidebarInitHandlers) {
        for (let handler of firstSidebarInitHandlers) {
          handler()
        }
        firstSidebarInitHandlers = null
      }

      for (let waiting of connectPending) {
        if (waiting.winId === null) waiting.resolve(true)
        else if (waiting.winId === info.windowId) waiting.resolve(true)
      }
    }

    // Handle disconnect
    port.onDisconnect.addListener(port => {
      let info = JSON.parse(port.name)
      let targetPort = connectedSidebars[info.windowId]
      if (info.instanceType === 'sidebar' && targetPort) {
        targetPort.onMessage.removeListener(onSidebarMsg)
        delete connectedSidebars[info.windowId]
      }
    })
  })
}

/**
 * Handle first sidebar init
 */
function onFirstSidebarInit(handler) {
  if (!firstSidebarInitHandlers) return handler()
  firstSidebarInitHandlers.push(handler)
}

/**
 * Wait for connecting sidebery instance of
 * target window.
 */
async function waitForSidebarConnect(winId, limit = 1000) {
  let waitingId = String(Math.random())
  let waiting = new Promise(res => {
    if (connectedSidebars[winId]) return res(true)

    connectPending.push({
      id: waitingId,
      winId,
      resolve: res,
    })

    setTimeout(() => {
      let index = connectPending.findIndex(w => w.id === waitingId)
      if (index > -1) connectPending.splice(index, 1)
      res(false)
    }, limit)
  })

  return waiting
}

/**
 * Handle message from sidebar
 */
function onSidebarMsg(msg) {
  if (!Actions.initialized) return
  if (msg.action !== undefined && Actions[msg.action]) {
    if (msg.arg) Actions[msg.action](msg.arg)
    else if (msg.args) Actions[msg.action](...msg.args)
    else Actions[msg.action]()
  }
}

export default {
  initGlobalMessaging,
  initMessaging,
  onSidebarMsg,
  onFirstSidebarInit,
  waitForSidebarConnect,
}