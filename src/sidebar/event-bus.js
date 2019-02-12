import Vue from 'vue'
import Store from './store'
const eb = new Vue()

// Handle messages from other parts of extension.
browser.runtime.onMessage.addListener(async msg => {
  if (!msg.name && !msg.action) return

  // Emit
  if (msg.name) eb.$emit(msg.name, msg.arg)

  // Run action
  if (msg.action) {
    return await Store.dispatch(msg.action, msg.arg)
  }
})

export default eb