import EventBus from '../../event-bus'
import Utils from '../../utils'
import CommonActions from '../../actions/panels'
import { TABS_PANEL_STATE } from '../../defaults'
import { BOOKMARKS_PANEL, DEFAULT_TABS_PANEL } from '../../defaults'
import { TABS_PANEL } from '../../defaults'

let recalcPanelScrollTimeout, updatePanelBoundsTimeout

/**
 * Update panels settings
 */
async function updatePanels(newPanels) {
  if (!newPanels) return

  // Handle removed panels
  if (newPanels.length < this.state.panels.length) {
    for (let panel of this.state.panels) {
      if (newPanels.find(np => np.id === panel.id)) continue
      if (this.state.panelIndex === panel.index) {
        if (this.state.panelIndex === 0) this.state.panelIndex++
        else this.state.panelIndex--
      }
      await this.actions.removeTabs(panel.tabs.map(t => t.id))
    }
  }

  // TODO: handle moved panels
  // TODO: go through newPanels
  // TODO: check if index and panel index is not the same
  // TODO: reset tabs listeners, move tabs, setup tabs listeners

  let panels = []
  let updateNeeded = false
  
  // TODO: check bookmarks and default tabs panels - same as in loadPanels

  let panelDefs
  this.state.urlRules = []
  for (let i = 0; i < newPanels.length; i++) {
    let newPanel = newPanels[i]
    let panel = this.state.panels.find(p => p.id === newPanel.id)

    if (!panel) {
      updateNeeded = true
      panel = Utils.normalizePanel(newPanel, TABS_PANEL_STATE)
    }

    if (panel.type !== newPanel.type) updateNeeded = true
    if (
      panel.urlRulesActive !== newPanel.urlRulesActive ||
      panel.urlRules !== newPanel.urlRules
    ) {
      this.actions.parsePanelUrlRules(panel)
    }

    panel.index = i

    if (newPanel.type === 'bookmarks') panelDefs = BOOKMARKS_PANEL
    if (newPanel.type === 'default') panelDefs = DEFAULT_TABS_PANEL
    if (newPanel.type === 'tabs') panelDefs = TABS_PANEL

    for (let k of Object.keys(panelDefs)) {
      if (newPanel[k] !== undefined) panel[k] = newPanel[k]
    }

    panels.push(panel)
  }

  this.state.panels = panels

  if (updateNeeded) this.actions.updatePanelsTabs()
  // if (reloadNeeded) {
  //   this.handlers.resetTabsListeners()
  //   await this.actions.loadTabs(false)
  //   this.handlers.setupTabsListeners()
  // }
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
      if (tab.panelId === panel.id) panel.tabs.push(tab)
      else if (tab.panelId === null) panel.tabs.push(tab)
      else break
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

/**
 * Save panels tabs ranges
 */
function savePanelsRanges() {
  for (let panel of this.state.panels) {
    if (panel.tabs && panel.tabs.length) {
      for (let tab of panel.tabs) {
        if (!tab.panelId || tab.panelId !== panel.id) {
          browser.sessions.setTabValue(tab.id, 'panelId', panel.id)
        }
      }
    }
  }
  // browser.sessions.setWindowValue(this.state.windowId, 'panelsRanges', ranges)
}
function savePanelsRangesDebounced(delay = 300) {
  if (this._savePanelsRangesTimeout) clearTimeout(this._savePanelsRangesTimeout)
  this._savePanelsRangesTimeout = setTimeout(() => {
    this._savePanelsRangesTimeout = null
    this.actions.savePanelsRanges()
  }, delay)
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
 * Try to load saved sidebar state
 */
async function loadPanelIndex() {
  let ans = await browser.storage.local.get('panelIndex')
  if (!ans) return

  if (!this.state.private && ans.panelIndex !== 1) {
    if (ans.panelIndex >= 0) {
      this.state.panelIndex = ans.panelIndex
      this.state.lastPanelIndex = this.state.panelIndex
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
    this.actions.createTab(panel.cookieStoreId)
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
async function switchPanel(dir = 0) {
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
    this.actions.createTab(panel.cookieStoreId)
  }

  this.actions.recalcPanelScroll()
  this.actions.updateTabsVisability()
  this.actions.updatePanelBoundsDebounced()
}

/**
 * Find panel with active tab and switch to it.
 */
function goToActiveTabPanel() {
  const activeTab = this.state.tabs.find(t => t.active)
  const panel = this.state.panelsMap[activeTab.cookieStoreId]
  if (panel) this.actions.switchToPanel(panel.index)
}

/**
 * Returns active panel info
 */
function getActivePanel() {
  return Utils.cloneObject(this.state.panels[this.state.panelIndex])
}

export default {
  ...CommonActions,

  updatePanels,
  updatePanelsTabs,
  updatePanelsRanges,

  getPanelStartIndex,
  getPanelEndIndex,
  getTabPanel,

  loadPanelIndex,
  setPanel,

  savePanelsRanges,
  savePanelsRangesDebounced,

  savePanelIndex,
  recalcPanelScroll,
  updatePanelBoundsDebounced,
  switchToPanel,
  switchToNeighbourPanel,
  switchPanel,
  goToActiveTabPanel,
  getActivePanel,
}
