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
 * Normalize panels and put them to state
 */
async function loadPanels() {
  let saveNeeded = false
  let storage = await browser.storage.local.get({ panels_v4: null, panelIndex: null })

  // Try to use value from prev version
  if (!storage.panels_v4) {
    saveNeeded = true
    storage.panels_v4 = await this.actions.getNormPanels()
  }

  let panels = storage.panels_v4

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
    defaultPanelIndex = 1
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

    if (panel.newTabCtx !== 'none' && !this.state.containers[panel.newTabCtx]) {
      panel.newTabCtx = 'none'
    }
    if (panel.moveTabCtx !== 'none' && !this.state.containers[panel.moveTabCtx]) {
      panel.moveTabCtx = 'none'
    }

    normPanels.push(panel)
    panelsMap[panel.id] = panel
  }

  // Setup panel index
  if (!this.state.private) {
    let actPanel =  normPanels[storage.panelIndex]
    if (actPanel) this.state.panelIndex = storage.panelIndex
    else this.state.panelIndex = defaultPanelIndex
    this.state.lastPanelIndex = this.state.panelIndex
  }

  this.state.panels = normPanels
  this.state.panelsMap = panelsMap

  if (saveNeeded) this.actions.savePanels()
}

/**
 * Try to load panels from prev version or use defaults
 */
async function getNormPanels() {
  let { panels } = await browser.storage.local.get({ panels: null })
  if (panels) setTimeout(() => browser.storage.local.remove('panels'), 500)
  else panels = []

  let result = []
  for (let old of panels) {
    let defaults
    if (old.type === 'bookmarks') defaults = BOOKMARKS_PANEL_STATE
    else if (old.type === 'default') defaults = DEFAULT_PANEL_STATE
    else if (old.type === 'ctx') defaults = TABS_PANEL_STATE
    else continue

    let panel = Utils.cloneObject(defaults)

    if (old.type === 'bookmarks') {
      if (old.lockedPanel !== undefined) panel.lockedPanel = old.lockedPanel
    }
    if (old.type === 'default') {
      if (old.lockedTabs !== undefined) panel.lockedTabs = old.lockedTabs
      if (old.lockedPanel !== undefined) panel.lockedPanel = old.lockedPanel
      if (old.noEmpty !== undefined) panel.noEmpty = old.noEmpty
      if (old.newTabCtx !== undefined) panel.newTabCtx = old.newTabCtx
    }
    if (old.type === 'ctx') {
      if (old.id !== undefined) panel.id = Utils.uid()
      if (old.name !== undefined) panel.name = old.name
      if (old.icon !== undefined) panel.icon = old.icon
      if (old.color !== undefined) panel.color = old.color
      if (old.lockedTabs !== undefined) panel.lockedTabs = old.lockedTabs
      if (old.lockedPanel !== undefined) panel.lockedPanel = old.lockedPanel
      if (old.noEmpty !== undefined) panel.noEmpty = old.noEmpty
      panel.newTabCtx = old.cookieStoreId
      panel.moveTabCtx = old.cookieStoreId
    }

    result.push(panel)
  }

  if (result.length < 2) result = Utils.cloneArray(DEFAULT_PANELS_STATE)

  return result
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
 * Clean up panels info and save them
 */
async function savePanels() {
  let output = [], panelDefs
  for (let panel of this.state.panels) {
    if (panel.type === 'bookmarks') panelDefs = BOOKMARKS_PANEL
    else if (panel.type === 'default') panelDefs = DEFAULT_TABS_PANEL
    else if (panel.type === 'tabs') panelDefs = TABS_PANEL

    output.push(Utils.normalizeObject(panel, panelDefs))
  }
  browser.storage.local.set({ panels_v4: output })
}
function savePanelsDebounced() {
  if (this._savePanelsTimeout) clearTimeout(this._savePanelsTimeout)
  this._savePanelsTimeout = setTimeout(() => this.actions.savePanels(), 500)
}

export default {
  loadPanels,
  getNormPanels,
  parsePanelUrlRules,
  savePanels,
  savePanelsDebounced,
}