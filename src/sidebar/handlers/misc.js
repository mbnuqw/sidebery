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
function onBroActionClick(tab, info) {
  if (tab.windowId !== this.state.windowId) return
  if (!info || info.button === 0) browser.sidebarAction.close()
}

/**
 * Handle hidding native context menu
 */
function onMenuHidden() {
  this.actions.resetSelection()
}

/**
 * ...
 */
function onBgDisconnect(port) {
  let info
  try {
    info = JSON.parse(port.name)
  } catch (err) {
    return
  }

  if (info.windowId !== this.state.windowId) return
  this.state.bg.onDisconnect.removeListener(this.handlers.onBgDisconnect)
  this.state.bg = null

  if (this.bgConnectTryCount++ >= 3) return

  this.actions.connectToBG()
}

/**
 * Setup listeners
 */
function setupHandlers() {
  window.addEventListener('resize', this.handlers.onSidebarResize)
  browser.browserAction.onClicked.addListener(this.handlers.onBroActionClick)
  browser.menus.onHidden.addListener(this.handlers.onMenuHidden)
}

/**
 * Reset listeners
 */
function resetHandlers() {
  window.removeEventListener('resize', this.handlers.onSidebarResize)
  browser.browserAction.onClicked.removeListener(this.handlers.onBroActionClick)
  browser.menus.onHidden.removeListener(this.handlers.onMenuHidden)
}

export default {
  onSidebarResize,
  onBroActionClick,
  onMenuHidden,
  onBgDisconnect,
  setupHandlers,
  resetHandlers,
}
