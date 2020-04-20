/**
 * Handle new window
 */
function onWindowCreated(window) {
  if (window.id === this.state.windowId) return
  if (window.type !== 'normal') return
  if (!this.state.otherWindows) this.state.otherWindows = []
  this.state.otherWindows.push(window)
}

/**
 * Handle window removng
 */
function onWindowRemoved(windowId) {
  if (windowId === this.state.windowId || !this.state.otherWindows) return
  let index = this.state.otherWindows.findIndex(w => w.id === windowId)
  if (index >= 0) this.state.otherWindows.splice(index, 1)
}

/**
 * Set currently focused window
 */
function onFocusWindow(id) {
  this.state.windowFocused = id === this.state.windowId
  if (this.state.windowFocused) {
    this.actions.savePanelIndex()
  }
}

/**
 * Setup listeners
 */
function setupWindowsListeners() {
  browser.windows.onCreated.addListener(this.handlers.onWindowCreated)
  browser.windows.onRemoved.addListener(this.handlers.onWindowRemoved)
  browser.windows.onFocusChanged.addListener(this.handlers.onFocusWindow)
}

/**
 * Reset listeners
 */
function resetWindowsListeners() {
  browser.windows.onCreated.removeListener(this.handlers.onWindowCreated)
  browser.windows.onRemoved.removeListener(this.handlers.onWindowRemoved)
  browser.windows.onFocusChanged.removeListener(this.handlers.onFocusWindow)
}

export default {
  onWindowCreated,
  onWindowRemoved,
  onFocusWindow,
  setupWindowsListeners,
  resetWindowsListeners,
}
