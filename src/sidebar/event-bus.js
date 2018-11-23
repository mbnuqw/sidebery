import Vue from 'vue'
const eb = new Vue()

// Handle messages from other parts of extension.
browser.runtime.onMessage.addListener(msg => {
  if (!msg.name) return
  eb.$emit(msg.name, msg.arg)
})

export default eb