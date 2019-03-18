import Vue from 'vue'
import State from './store.state'
import Store from './store'
const eb = new Vue()

// Handle messages from other parts of extension.
browser.runtime.onMessage.addListener(async msg => {
  if (!msg.name && !msg.action) return
  if (msg.windowId !== undefined && msg.windowId !== State.windowId) return

  // Emit
  if (msg.name) eb.$emit(msg.name, msg.arg)

  // Run action
  if (msg.action) {
    return await Store.dispatch(msg.action, msg.arg)
  }
})

export default eb