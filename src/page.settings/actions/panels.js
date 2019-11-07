import CommonActions from '../../actions/panels'


/**
 * Clean up panels info and run savePanels action in background
 */
async function savePanels() {
  const output = []
  for (let panel of this.state.panels) {
    if (panel.type === 'ctx' && !panel.cookieStoreId) panel.type = 'tabs'
    output.push({
      type: panel.type,
      id: panel.id,
      name: panel.name,
      icon: panel.icon,
      color: panel.color,
      customIconSrc: panel.customIconSrc,
      customIcon: panel.customIcon,
      cookieStoreId: panel.cookieStoreId,
      lockedPanel: panel.lockedPanel,
      lockedTabs: panel.lockedTabs,
      noEmpty: panel.noEmpty,
      newTabCtx: panel.newTabCtx,
      private: panel.private,
      bookmarks: panel.bookmarks,
    })
  }
  browser.storage.local.set({ panels: output })
}
function savePanelsDebounced() {
  if (this._savePanelsTimeout) clearTimeout(this._savePanelsTimeout)
  this._savePanelsTimeout = setTimeout(() => this.actions.savePanels(), 500)
}

async function movePanel(id, step) {
  let index = this.state.panels.findIndex(p => p.id === id)
  if (index === -1) return
  if (index + step < 0) return
  if (index + step >= this.state.panels.length) return

  let panel = this.state.panels.splice(index, 1)[0]
  this.state.panels.splice(index + step, 0, panel)
  this.state.panelIndex = index + step
  for (let i = 0; i < this.state.panels.length; i++) {
    this.state.panels[i].index = i
  }

  this.actions.savePanels()

  let windows = await browser.windows.getAll()
  for (let window of windows) {
    browser.runtime.sendMessage({
      instanceType: 'sidebar',
      windowId: window.id,
      action: 'loadTabs'
    })
  }
}

export default {
  ...CommonActions,

  savePanels,
  savePanelsDebounced,
  movePanel,
}