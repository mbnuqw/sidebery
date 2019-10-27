import Utils from '../utils'
import {
  DEFAULT_PANELS,
  BOOKMARKS_PANEL,
  DEFAULT_PANEL,
  CTX_PANEL,
  TABS_PANEL,
} from '../defaults'

/**
 * Load Contextual Identities and containers
 * and merge them
 */
async function loadPanels() {
  let { panels } = await browser.storage.local.get({
    panels: Utils.cloneArray(DEFAULT_PANELS)
  })

  // Check if default panels are present
  let bookmarksPanelIndex = panels.findIndex(p => p.type === 'bookmarks')
  let defaultPanelIndex = panels.findIndex(p => p.type === 'default')
  if (bookmarksPanelIndex === -1 && this.state.bookmarksPanel) {
    panels.unshift(Utils.cloneObject(BOOKMARKS_PANEL))
    bookmarksPanelIndex = 0
  }
  if (defaultPanelIndex === -1) {
    let defaultPanelClone = Utils.cloneObject(DEFAULT_PANEL)
    panels.splice(bookmarksPanelIndex + 1, 0, defaultPanelClone)
  }

  // Normalize
  let defaultPanel, panelsMap = {}
  for (let i = 0; i < panels.length; i++) {
    let panel = panels[i]
    panel.index = i
    if (!panel.id) panel.id = Utils.uid()

    if (panel.type === 'bookmarks') defaultPanel = BOOKMARKS_PANEL
    else if (panel.type === 'default') defaultPanel = DEFAULT_PANEL
    else if (panel.type === 'ctx') defaultPanel = CTX_PANEL
    else if (panel.type === 'tabs') defaultPanel = TABS_PANEL
    else defaultPanel = null

    if (defaultPanel) {
      for (let k of Object.keys(defaultPanel)) {
        if (panel[k] === undefined) panel[k] = defaultPanel[k]
      }
    }

    panelsMap[panel.id] = panel
  }

  this.state.panels = panels
  this.state.panelsMap = panelsMap
}

export default {
  loadPanels,
}