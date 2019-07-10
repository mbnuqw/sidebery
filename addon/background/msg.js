import Actions from '../actions/index.js'

const connectedSidebars = {}

/**
 * Handle runtime messages
 */
export function initMessaging() {
  browser.runtime.onConnect.addListener(port => {
    // Setup message handling
    let info = JSON.parse(port.name)
    if (info.instanceType === 'sidebar') {
      connectedSidebars[info.windowId] = port
      port.onMessage.addListener(onSidebarMsg)
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
 * Handle message from sidebar
 */
export function onSidebarMsg(msg) {
  if (!Actions.initialized) return
  if (msg.action !== undefined && Actions[msg.action]) {
    if (msg.arg) Actions[msg.action](msg.arg)
    else if (msg.args) Actions[msg.action](...msg.args)
    else Actions[msg.action]()
  }
}
