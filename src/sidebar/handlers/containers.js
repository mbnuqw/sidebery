/**
 * contextualIdentities.onRemoved
 */
async function onRemovedContainer({ contextualIdentity }) {
  let id = contextualIdentity.cookieStoreId

  for (let panel of this.state.panels) {
    if (panel.newTabCtx === id) panel.newTabCtx = 'none'
    if (panel.moveTabCtx === id) panel.moveTabCtx = 'none'
  }

  // Close tabs
  const orphanTabs = this.state.tabs.filter(t => t.cookieStoreId === id)
  this.state.removingTabs = orphanTabs.map(t => t.id)
  await browser.tabs.remove([...this.state.removingTabs])
}

/**
 * Setup listeners
 */
function setupContainersListeners() {
  browser.contextualIdentities.onRemoved.addListener(this.handlers.onRemovedContainer)
}

/**
 * Setup listeners
 */
function resetContainersListeners() {
  browser.contextualIdentities.onRemoved.removeListener(this.handlers.onRemovedContainer)
}

export default {
  onRemovedContainer,
  setupContainersListeners,
  resetContainersListeners,
}
