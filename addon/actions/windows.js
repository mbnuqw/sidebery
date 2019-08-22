/**
 * Get windows
 */
async function getWindows() {
  const windows = await browser.windows.getAll({})
  const windowsMap = {}
  for (let window of windows) {
    windowsMap[window.id] = window
  }
  return windowsMap
}

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

function setupWindowsListeners() {
  browser.windows.onCreated.addListener(this.actions.onWindowCreated)
  browser.windows.onRemoved.addListener(this.actions.onWindowRemoved)
}

export default {
  getWindows,

  onWindowCreated,
  onWindowRemoved,

  setupWindowsListeners,
}