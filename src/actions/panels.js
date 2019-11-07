import Utils from '../utils'
import {
  DEFAULT_PANELS_STATE,
  BOOKMARKS_PANEL_STATE,
  DEFAULT_PANEL_STATE,
  CTX_PANEL_STATE,
  TABS_PANEL_STATE,
} from '../defaults'

/**
 * Load Contextual Identities and containers
 * and merge them
 */
async function loadPanels() {
  let { panels } = await browser.storage.local.get({
    panels: Utils.cloneArray(DEFAULT_PANELS_STATE)
  })

  // Check if default panels are present
  let bookmarksPanelIndex = panels.findIndex(p => p.type === 'bookmarks')
  let defaultPanelIndex = panels.findIndex(p => p.type === 'default')
  if (bookmarksPanelIndex === -1 && this.state.bookmarksPanel) {
    panels.unshift(Utils.cloneObject(BOOKMARKS_PANEL_STATE))
    bookmarksPanelIndex = 0
  }
  if (defaultPanelIndex === -1) {
    let defaultPanelClone = Utils.cloneObject(DEFAULT_PANEL_STATE)
    panels.splice(bookmarksPanelIndex + 1, 0, defaultPanelClone)
  }

  // Normalize
  let panelDefs, panelsMap = {}, normPanels = []
  for (let i = 0; i < panels.length; i++) {
    let panel
    let loadedPanel = panels[i]

    if (loadedPanel.type === 'bookmarks') panelDefs = BOOKMARKS_PANEL_STATE
    else if (loadedPanel.type === 'default') panelDefs = DEFAULT_PANEL_STATE
    else if (loadedPanel.type === 'ctx') panelDefs = CTX_PANEL_STATE
    else if (loadedPanel.type === 'tabs') panelDefs = TABS_PANEL_STATE
    else continue

    panel = Utils.normalizePanel(loadedPanel, panelDefs)

    panel.index = i
    if (!panel.id) panel.id = Utils.uid()

    normPanels.push(panel)
    panelsMap[panel.id] = panel
  }

  this.state.panels = normPanels
  this.state.panelsMap = panelsMap
}

export default {
  loadPanels,
}