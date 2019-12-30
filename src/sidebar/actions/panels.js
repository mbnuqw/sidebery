import EventBus from '../../event-bus'
import CommonActions from '../../actions/panels'
import { TABS_PANEL_STATE } from '../../../addon/defaults'
import { BOOKMARKS_PANEL, DEFAULT_TABS_PANEL } from '../../../addon/defaults'
import { TABS_PANEL } from '../../../addon/defaults'

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
      if (this.state.panelIndex > panel.index) this.state.panelIndex--

      let prevPanel = this.state.panels[panel.index - 1]
      panel.tabs.forEach(t => (t.panelId = null))
      if (!prevPanel || !prevPanel.tabs) {
        let nextPanel = this.state.panels.find(p => p.id !== panel.id && p.tabs)
        if (nextPanel) panel.tabs.forEach(t => (t.panelId = nextPanel.id))
      }
      this.actions.updatePanelsTabs()
      this.actions.savePanelIndex()
      break
    }
  }

  let activePanel = this.state.panels[this.state.panelIndex]
  let panels = []
  let panelsMap = {}
  let updateNeeded = false
  let reloadNeeded = false

  let panelDefs
  this.state.urlRules = []
  for (let i = 0; i < newPanels.length; i++) {
    let newPanel = newPanels[i]
    let panel = this.state.panels.find(p => p.id === newPanel.id)

    if (panel && panel.index !== i && panel.tabs && panel.tabs.length) {
      reloadNeeded = true
    }

    if (!panel) {
      updateNeeded = true
      panel = Utils.normalizeObject(newPanel, TABS_PANEL_STATE)
    }

    if (panel.type !== newPanel.type) updateNeeded = true

    if (panel.urlRulesActive && panel.urlRules) {
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
    panelsMap[panel.id] = panel
  }

  this.state.panels = panels
  this.state.panelsMap = panelsMap

  let activePanelIndex = this.state.panels.indexOf(activePanel)
  if (activePanelIndex !== -1) this.state.panelIndex = activePanelIndex

  if (updateNeeded) this.actions.updatePanelsTabs()
  if (reloadNeeded) {
    this.handlers.resetTabsListeners()

    let index = this.getters.pinnedTabs.length
    let windowId = this.state.windowId
    let allTabs = [...this.getters.pinnedTabs]
    for (let panel of this.state.panels) {
      if (!panel.tabs || !panel.tabs.length) continue
      for (let tab of panel.tabs) {
        if (tab.index !== index) {
          await browser.tabs.move(tab.id, { windowId, index })
        }
        allTabs.push(tab)
        index++
      }
    }
    allTabs.forEach((t, i) => (t.index = i))
    this.state.tabs = allTabs

    this.handlers.setupTabsListeners()
    this.actions.updatePanelsTabs()
    if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  }
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
}
