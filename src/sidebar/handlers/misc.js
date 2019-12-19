let resizeTimeout

/**
 * Update sidebar width value.
 */
function onSidebarResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    resizeTimeout = null
    if (this.state.width !== document.body.offsetWidth) {
      this.state.width = document.body.offsetWidth
    }
  }, 120)
}

/**
 * Handle click on browserAction button
 */
function onBroActionClick(tab) {
  if (tab.windowId !== this.state.windowId) return
  browser.sidebarAction.close()
}

/**
 * Setup listeners
 */
function setupResizeHandler() {
  window.addEventListener('resize', this.handlers.onSidebarResize)
  browser.browserAction.onClicked.addListener(this.handlers.onBroActionClick)
}

/**
 * Reset listeners
 */
function resetResizeHandler() {
  window.removeEventListener('resize', this.handlers.onSidebarResize)
  browser.browserAction.onClicked.removeListener(this.handlers.onBroActionClick)
}

export default {
  onSidebarResize,
  onBroActionClick,
  setupResizeHandler,
  resetResizeHandler,
}
