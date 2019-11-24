import { BOOKMARKS_PANEL } from '../../defaults'
import { DEFAULT_TABS_PANEL } from '../../defaults'
import { TABS_PANEL } from '../../defaults'
import Utils from '../../utils'
import CommonActions from '../../actions/panels'

/**
 * Clean up panels info and run savePanels action in background
 */
async function savePanels() {
  let output = [], panelDefs
  for (let panel of this.state.panels) {
    if (panel.type === 'bookmarks') panelDefs = BOOKMARKS_PANEL
    else if (panel.type === 'default') panelDefs = DEFAULT_TABS_PANEL
    else if (panel.type === 'tabs') panelDefs = TABS_PANEL

    output.push(Utils.normalizePanel(panel, panelDefs))
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