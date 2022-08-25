import EventBus from '../../event-bus'
import CommonActions from '../../actions/panels'
import { translate } from '../../../addon/locales/dict.js'
import { BOOKMARKS_PANEL_STATE, BOOKMARKS_PANEL } from '../../../addon/defaults'
import { DEFAULT_TABS_PANEL_STATE, DEFAULT_TABS_PANEL } from '../../../addon/defaults'
import { TABS_PANEL_STATE, TABS_PANEL } from '../../../addon/defaults'

let recalcPanelScrollTimeout, updatePanelBoundsTimeout

/**
 * Update panels settings
 */
async function updatePanels(newPanels) {
  if (!newPanels) return

  // Normalize panels
  let panels = []
  let panelsMap = {}
  for (let i = 0, newPanel; i < newPanels.length; i++) {
    newPanel = newPanels[i]

    let defaultState
    if (newPanel.type === 'bookmarks') defaultState = BOOKMARKS_PANEL_STATE
    if (newPanel.type === 'default') defaultState = DEFAULT_TABS_PANEL_STATE
    if (newPanel.type === 'tabs') defaultState = TABS_PANEL_STATE

    let normPanel = Utils.normalizeObject(newPanel, defaultState)
    normPanel.index = i

    panels.push(normPanel)
    panelsMap[normPanel.id] = normPanel
  }

  // Handle tabs of removed panels
  let panelId = panels.find(p => p.tabs).id
  for (let tab of this.state.tabs) {
    if (!panelsMap[tab.panelId]) tab.panelId = panelId
    else panelId = tab.panelId
  }

  // Update active panel
  let activePanel = this.state.panels[this.state.panelIndex]
  let newActPanelIndex = panels.findIndex(p => p.id === activePanel.id)
  if (newActPanelIndex === -1) {
    let activeTab = this.state.tabs.find(t => t.active)
    let activeTabPanel = activeTab ? panelsMap[activeTab.panelId] : undefined

    if (activeTabPanel) newActPanelIndex = activeTabPanel.index
    else newActPanelIndex = 0
  }

  // Get rearrangements for tabs
  let moves = []
  let tabIndex = this.state.tabs.findIndex(t => !t.pinned)
  if (tabIndex === -1) tabIndex = 0
  for (let panel of panels) {
    if (!panel.tabs) continue

    let panelTabs = this.state.tabs.filter(t => !t.pinned && t.panelId === panel.id)
    for (let tab of panelTabs) {
      if (tab.index !== tabIndex) moves.push([tab, tabIndex])
      tabIndex++
    }
  }

  // Move tabs
  this.state.ignoreTabsEvents = true
  let moving = []
  for (let move of moves) {
    let tab = move[0]
    if (tab.index !== move[1]) {
      moving.push(browser.tabs.move(tab.id, { index: move[1] }))
      this.state.tabs.splice(tab.index, 1)
      this.state.tabs.splice(move[1], 0, tab)
      let minIndex = Math.min(tab.index, move[1])
      let maxIndex = Math.max(tab.index, move[1]) + 1
      for (let i = minIndex; i < maxIndex; i++) {
        this.state.tabs[i].index = i
      }
    }
  }
  await Promise.all(moving)
  this.state.ignoreTabsEvents = false

  // Update state
  this.state.panels = panels
  this.state.panelsMap = panelsMap
  this.state.panelIndex = newActPanelIndex
  this.state.lastPanelIndex = newActPanelIndex
  this.actions.updatePanelsTabs()
  this.actions.savePanelIndex()

  // Update url rules
  this.state.urlRules = []
  for (let panel of panels) {
    if (panel.urlRulesActive && panel.urlRules) this.actions.parsePanelUrlRules(panel)
  }

  // Save state
  this.actions.saveTabsData()
  this.state.tabs.forEach(t => this.actions.saveTabData(t))
}

/**
 * Update tabs per panel with range indexes
 */
function updatePanelsTabs() {
  let lastIndex = this.getters.pinnedTabs.length
  let tabsCount = this.state.tabs.length
  let tab, i
  for (let panel of this.state.panels) {
    if (panel.type === 'bookmarks') continue

    panel.tabs = []
    for (i = lastIndex; i < tabsCount; i++) {
      tab = this.state.tabs[i]
      if (tab.panelId === panel.id) {
        panel.tabs.push(tab)
      } else if (tab.panelId === null) {
        tab.panelId = panel.id
        panel.tabs.push(tab)
      } else {
        break
      }
    }

    if (panel.tabs.length) {
      lastIndex = panel.tabs[panel.tabs.length - 1].index
      panel.startIndex = panel.tabs[0].index
      panel.endIndex = lastIndex
      lastIndex++
    } else {
      panel.startIndex = lastIndex
      panel.endIndex = panel.startIndex
    }
  }
}

function getPanelStartIndex(id) {
  let panel = this.state.panelsMap[id]
  if (!panel || !panel.tabs) return -1

  let len = panel.tabs.length
  if (len) return panel.tabs[0].index

  let index = -2
  for (let panel of this.state.panels) {
    if (panel.tabs && len) index = panel.tabs[len - 1].index
    if (panel.id === id) return index + 1
  }
  return -1
}

function getPanelEndIndex(id) {
  let panel = this.state.panelsMap[id]
  if (!panel || !panel.tabs) return -1

  let len = panel.tabs.length
  if (len) return panel.tabs[len - 1].index

  let index = -2
  for (let panel of this.state.panels) {
    if (panel.tabs && len) index = panel.tabs[len - 1].index
    if (panel.id === id) return index + 1
  }
  return -1
}

/**
 *  Find and return panel of the tab.
 *
 * @param {object|number} tab - tab object or tabID
 * @return {object|null} panel object or null
 */
function getTabPanel(tab) {
  if (tab > -1) tab = this.state.tabsMap[tab]
  if (!tab) return null

  for (let panel of this.state.panels) {
    if (tab.cookieStoreId === panel.moveTabCtx) return panel
    if (panel.startIndex <= tab.index && panel.endIndex >= tab.index) {
      return panel
    }
  }
  return null
}

/**
 * Update panels ranges
 */
function updatePanelsRanges() {
  let lastIndex = this.getters.pinnedTabs.length
  let countOfPanels = this.state.panels.length
  for (let i = 0; i < countOfPanels; i++) {
    let panel = this.state.panels[i]
    panel.index = i
    if (!panel.tabs) continue
    if (panel.tabs.length) {
      lastIndex = panel.tabs[panel.tabs.length - 1].index
      panel.startIndex = panel.tabs[0].index
      panel.endIndex = lastIndex++
    } else {
      panel.startIndex = lastIndex
      panel.endIndex = panel.startIndex
    }
  }
}

/**
 * Set panel index
 */
function setPanel(newIndex) {
  if (this.state.panelIndex === newIndex) return
  this.state.panelIndex = newIndex
  if (newIndex >= 0) this.state.lastPanelIndex = newIndex

  if (this.state.selectBookmarkFolder) {
    if (this.state.selectBookmarkFolder.cancel) {
      this.state.selectBookmarkFolder.cancel()
    }
    this.state.selectBookmarkFolder = null
  }
}

/**
 * Save panel index
 */
function savePanelIndex() {
  if (!this.state.windowFocused || this.state.private) return
  browser.storage.local.set({ panelIndex: this.state.panelIndex })
}

/**
 * Breadcast recalc panel's scroll event.
 */
function recalcPanelScroll(delay = 200) {
  if (recalcPanelScrollTimeout) clearTimeout(recalcPanelScrollTimeout)
  recalcPanelScrollTimeout = setTimeout(() => {
    EventBus.$emit('recalcPanelScroll')
    recalcPanelScrollTimeout = null
  }, delay)
}

/**
 * Breadcast recalc panel's scroll event.
 */
function updatePanelBoundsDebounced(delay = 256) {
  if (updatePanelBoundsTimeout) clearTimeout(updatePanelBoundsTimeout)
  updatePanelBoundsTimeout = setTimeout(() => {
    EventBus.$emit('updatePanelBounds')
    updatePanelBoundsTimeout = null
  }, delay)
}

/**
 * Switch current active panel by index
 */
function switchToPanel(index, withoutTabActivation) {
  this.actions.closeCtxMenu()
  this.actions.resetSelection()
  this.actions.setPanel(index)

  const panel = this.state.panels[this.state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    this.actions.createTabInPanel(panel)
  }

  if (this.state.activateLastTabOnPanelSwitching && !withoutTabActivation) {
    this.actions.activateLastActiveTabOf(this.state.panelIndex)
  }

  this.actions.recalcPanelScroll()
  this.actions.updateTabsVisability()
  this.actions.updatePanelBoundsDebounced()
  this.actions.savePanelIndex()
}

/**
 * Try to find not hidden neighbour panel
 */
function switchToNeighbourPanel() {
  let target

  if (this.state.panelIndex < 0) target = this.state.panels[0]

  if (!target) {
    for (let i = this.state.panelIndex - 1; i > 0; i--) {
      if (this.state.panels[i] && !this.state.panels[i].inactive) {
        target = this.state.panels[i]
        break
      }
    }
  }

  if (!target) {
    for (let i = this.state.panelIndex + 1; i < this.state.panels.length; i++) {
      if (this.state.panels[i] && !this.state.panels[i].inactive) {
        target = this.state.panels[i]
        break
      }
    }
  }

  if (target) {
    this.actions.switchToPanel(target.index)
  }
}

/**
 * Switch panel.
 */
function switchPanel(dir = 0) {
  // Debounce switching
  if (this.state.switchPanelPause) return
  this.state.switchPanelPause = setTimeout(() => {
    clearTimeout(this.state.switchPanelPause)
    this.state.switchPanelPause = null
  }, 128)

  this.actions.closeCtxMenu()
  this.actions.resetSelection()

  // Restore prev front panel
  if (this.state.panelIndex < 0) {
    if (this.state.lastPanelIndex < 0) this.state.panelIndex = 0
    else this.state.panelIndex = this.state.lastPanelIndex - dir
  }

  // Update panel index
  let i = this.state.panelIndex + dir
  for (; this.state.panels[i]; i += dir) {
    const p = this.state.panels[i]
    if (p.skipOnSwitching) continue
    if (this.state.skipEmptyPanels && p.tabs && !p.tabs.length) continue
    if (!p.inactive) break
  }
  if (this.state.panels[i]) {
    this.state.panelIndex = i
    this.actions.savePanelIndex()
  }
  this.state.lastPanelIndex = this.state.panelIndex
  if (this.state.selectBookmarkFolder) {
    if (this.state.selectBookmarkFolder.cancel) {
      this.state.selectBookmarkFolder.cancel()
    }
    this.state.selectBookmarkFolder = null
  }

  if (this.state.activateLastTabOnPanelSwitching) {
    this.actions.activateLastActiveTabOf(this.state.panelIndex)
  }

  let panel = this.state.panels[this.state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    this.actions.createTabInPanel(panel)
  }

  this.actions.recalcPanelScroll()
  this.actions.updateTabsVisability()
  this.actions.updatePanelBoundsDebounced()
}

/**
 * Find panel with active tab and switch to it.
 */
function goToActiveTabPanel() {
  let activeTab = this.state.tabsMap[this.state.activeTabId]
  if (!activeTab) activeTab = this.state.tabs.find(t => t.active)
  if (!activeTab) return

  let panel = this.state.panelsMap[activeTab.panelId]
  if (panel) this.actions.switchToPanel(panel.index)
}

/**
 * Returns active panel info
 */
function getActivePanel() {
  return Utils.cloneObject(this.state.panels[this.state.panelIndex])
}

/**
 * Remove panel
 */
async function removePanel(panelId) {
  let panel = this.state.panelsMap[panelId]
  let preMsg = translate('settings.panel_remove_confirm_1')
  let postMsg = translate('settings.panel_remove_confirm_2')
  let ok = await this.actions.confirm(preMsg + panel.name + postMsg)
  if (!ok) return

  let output = []
  let panelDefs
  for (let panel of this.state.panels) {
    if (panel.id === panelId) continue

    if (panel.type === 'bookmarks') panelDefs = BOOKMARKS_PANEL
    else if (panel.type === 'default') panelDefs = DEFAULT_TABS_PANEL
    else if (panel.type === 'tabs') panelDefs = TABS_PANEL

    output.push(Utils.normalizeObject(panel, panelDefs))
  }

  browser.storage.local.set({ panels_v4: output })
}

export default {
  ...CommonActions,

  updatePanels,
  updatePanelsTabs,
  updatePanelsRanges,

  getPanelStartIndex,
  getPanelEndIndex,
  getTabPanel,

  setPanel,

  savePanelIndex,
  recalcPanelScroll,
  updatePanelBoundsDebounced,
  switchToPanel,
  switchToNeighbourPanel,
  switchPanel,
  goToActiveTabPanel,
  getActivePanel,
  removePanel,
}
