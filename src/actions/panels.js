import Utils from '../utils'
import {
  DEFAULT_PANELS_STATE,
  BOOKMARKS_PANEL_STATE,
  DEFAULT_PANEL_STATE,
  TABS_PANEL_STATE,
  BOOKMARKS_PANEL,
  DEFAULT_TABS_PANEL,
  TABS_PANEL,
} from '../defaults'

/**
 * Load and setup panels
 */
async function loadPanels() {
  let { panels } = await browser.storage.local.get({
    panels: Utils.cloneArray(DEFAULT_PANELS_STATE)
  })
  this.actions.setupPanels(panels)
}

/**
 * Load Contextual Identities and containers
 * and merge them
 */
function setupPanels(panels) {
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
    else if (loadedPanel.type === 'tabs') panelDefs = TABS_PANEL_STATE
    else continue

    panel = Utils.normalizeObject(loadedPanel, panelDefs)

    panel.index = i
    if (!panel.id) panel.id = Utils.uid()

    if (panel.urlRulesActive && panel.urlRules) {
      this.actions.parsePanelUrlRules(panel)
    }

    normPanels.push(panel)
    panelsMap[panel.id] = panel
  }

  this.state.panels = normPanels
  this.state.panelsMap = panelsMap
}

function parsePanelUrlRules(panel) {
  if (!this.state.urlRules) this.state.urlRules = []

  for (let rawRule of panel.urlRules.split('\n')) {
    let rule = rawRule.trim()
    if (!rule) continue

    if (rule[0] === '/' && rule[rule.length - 1] === '/') {
      rule = new RegExp(rule.slice(1, rule.length - 1))
    }

    this.state.urlRules.push({ panelId: panel.id, value: rule })
  }
}

/**
 * Clean up panels info and run savePanels action in background
 */
async function savePanels() {
  let output = [], panelDefs
  for (let panel of this.state.panels) {
    if (panel.type === 'bookmarks') panelDefs = BOOKMARKS_PANEL
    else if (panel.type === 'default') panelDefs = DEFAULT_TABS_PANEL
    else if (panel.type === 'tabs') panelDefs = TABS_PANEL

    output.push(Utils.normalizeObject(panel, panelDefs))
  }
  browser.storage.local.set({ panels: output })
}
function savePanelsDebounced() {
  if (this._savePanelsTimeout) clearTimeout(this._savePanelsTimeout)
  this._savePanelsTimeout = setTimeout(() => this.actions.savePanels(), 500)
}

export default {
  loadPanels,
  setupPanels,
  parsePanelUrlRules,
  savePanels,
  savePanelsDebounced,
}