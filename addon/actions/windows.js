/**
 * Handle new window
 */
async function onWindowCreated(window) {
  this.windows[window.id] = window
  window.tabs = await browser.tabs.query({ windowId: window.id })
}

/**
 * Handle window remove
 */
function onWindowRemoved(windowId) {
  delete this.windows[windowId]
}

export default {
  onWindowCreated,
  onWindowRemoved,
}