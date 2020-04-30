import Actions from '../actions.js'

const connectedSidebars = {}
let firstSidebarInitHandlers = []

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
      let win = this.windows[info.windowId]
      win.sidebarPort = port

      if (this.settings.markWindow) browser.windows.update(win.id, { titlePreface: '[Sidebery] ' })

      connectedSidebars[info.windowId] = port
      port.onMessage.addListener(onSidebarMsg)

      if (firstSidebarInitHandlers) {
        for (let handler of firstSidebarInitHandlers) {
          handler()
        }
        firstSidebarInitHandlers = null
      }
    }

    // Handle disconnect
    port.onDisconnect.addListener(port => {
      let info = JSON.parse(port.name)
      let targetPort = connectedSidebars[info.windowId]
      if (info.instanceType === 'sidebar' && targetPort) {
        let window = this.windows[info.windowId]
        delete window.sidebarPort

        if (this.settings.markWindow) browser.windows.update(info.windowId, { titlePreface: '' })

        targetPort.onMessage.removeListener(onSidebarMsg)
        delete connectedSidebars[info.windowId]
      }
    })
  })
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
}
