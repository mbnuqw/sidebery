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
 * Setup listeners
 */
function setupResizeHandler() {
  window.addEventListener('resize', this.handlers.onSidebarResize)
}

/**
 * Reset listeners
 */
function resetResizeHandler() {
  window.removeEventListener('resize', this.handlers.onSidebarResize)
}

export default {
  onSidebarResize,
  setupResizeHandler,
  resetResizeHandler,
}