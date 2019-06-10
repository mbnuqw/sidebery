import Vue from 'vue'
const eb = new Vue()

/**
 * Init global msg exchange.
 * 
 * @param state - global vuex state
 * @param actions
 */
export function initMsgHandling(state, actions) {
  // Handle messages from other parts of extension.
  browser.runtime.onMessage.addListener(msg => {
    if (!msg.name && !msg.action) return
    if (msg.windowId !== undefined && msg.windowId !== state.windowId) return
    if (msg.instanceType !== undefined && msg.instanceType !== state.instanceType) return

    // Emit
    if (msg.name) eb.$emit(msg.name, msg.arg)

    // Run action
    if (msg.action && actions[msg.action]) {
      if (msg.arg) actions[msg.action](msg.arg)
      else if (msg.args) actions[msg.action](...msg.args)
      else actions[msg.action]()
    }
  })
}

export default eb