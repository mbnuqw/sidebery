import EventBus from '../../event-bus'
import Logs from '../../logs'
import Utils from '../../utils'
import Actions from '../actions'
import {
  DEFAULT_PANELS,
  DEFAULT_BOOKMARKS_PANEL,
  DEFAULT_PRIVATE_TABS_PANEL,
  DEFAULT_TABS_PANEL,
  DEFAULT_CTX_TABS_PANEL,
} from '../../defaults'

let recalcPanelScrollTimeout, savePanelsTimeout, updatePanelBoundsTimeout

/**
 * Load Contextual Identities and containers
 * and merge them
 */
async function loadPanels() {
  // Get contextual identities
  const containers = await browser.contextualIdentities.query({})
  if (!containers) {
    Logs.push('[WARN] Cannot load contextual identities')
    this.state.panels = Utils.cloneArray(DEFAULT_PANELS)
    return
  }

  // Get saved panels
  // Changed storage: containers -> panels
  let ans = await browser.storage.local.get({ panels: Utils.cloneArray(DEFAULT_PANELS) })
  // ---------------------------- UNTIL 3.1.0 --------------------------------
  // !! USE SPECIAL FUNCTION FOR CONVERTING !!
  // if (!ans || !ans.panels || !ans.panels.length) {
  //   ans = await browser.storage.local.get({ containers: Utils.cloneArray(DEFAULT_PANELS) })
  //   ans.panels = ans.containers
  // }
  // !! USE SPECIAL FUNCTION FOR CONVERTING !!
  // ---------------------------- UNTIL 3.1.0 --------------------------------

  const panels = []
  const panelsMap = {}
  let saveNeeded
  for (let i = 0; i < ans.panels.length; i++) {
    const loadedPanel = ans.panels[i]

    // Bookmarks panel
    if (loadedPanel.type === 'bookmarks') {
      let panel = Utils.cloneObject(DEFAULT_BOOKMARKS_PANEL)
      panel.index = panels.length
      panel.lockedPanel = loadedPanel.lockedPanel
      panels.push(panel)
      panelsMap['bookmarks'] = panel
    }

    // Default panel
    if (loadedPanel.type === 'default') {
      let panel
      if (this.state.private) {
        panel = Utils.cloneObject(DEFAULT_PRIVATE_TABS_PANEL)
      } else {
        panel = Utils.cloneObject(DEFAULT_TABS_PANEL)
        panel.lockedPanel = loadedPanel.lockedPanel
        panel.lockedTabs = loadedPanel.lockedTabs
        panel.noEmpty = loadedPanel.noEmpty
      }
      panel.index = panels.length
      panel.lastActiveTab = loadedPanel.lastActiveTab
      panels.push(panel)
      panelsMap[panel.cookieStoreId] = panel
    }

    // Container panel
    if (loadedPanel.type === 'ctx' && !this.state.private) {
      const container = containers.find(c => c.cookieStoreId === loadedPanel.cookieStoreId)
      const panel = Utils.cloneObject(DEFAULT_CTX_TABS_PANEL)

      // Native container props
      if (container) {
        panel.cookieStoreId = container.cookieStoreId
        panel.name = container.name
        panel.color = container.color
        panel.icon = container.icon
      } else {
        const conf = {
          name: loadedPanel.name,
          color: loadedPanel.color,
          icon: loadedPanel.icon,
        }
        const newCtr = await browser.contextualIdentities.create(conf)
        panel.cookieStoreId = newCtr.cookieStoreId
        panel.name = newCtr.name
        panel.color = newCtr.color
        panel.icon = newCtr.icon
        if (!saveNeeded) saveNeeded = true
      }

      // Sidebery props
      panel.loading = false
      panel.index = panels.length
      panel.lockedTabs = loadedPanel.lockedTabs
      panel.lockedPanel = loadedPanel.lockedPanel
      panel.proxy = loadedPanel.proxy
      panel.proxified = loadedPanel.proxified
      panel.noEmpty = loadedPanel.noEmpty
      panel.includeHostsActive = loadedPanel.includeHostsActive
      panel.includeHosts = loadedPanel.includeHosts
      panel.excludeHostsActive = loadedPanel.excludeHostsActive
      panel.excludeHosts = loadedPanel.excludeHosts
      panel.lastActiveTab = loadedPanel.lastActiveTab

      panels.push(panel)
      panelsMap[panel.cookieStoreId] = panel
    }
  }

  // Append not-saved native containers
  if (!this.state.private) {
    for (let container of containers) {
      if (!panelsMap[container.cookieStoreId]) {
        let panel = Utils.cloneObject(DEFAULT_CTX_TABS_PANEL)
        panel.cookieStoreId = container.cookieStoreId
        panel.name = container.name
        panel.color = container.color
        panel.icon = container.icon
        const len = panels.push(panel)
        panel.index = len - 1
        panelsMap[panel.cookieStoreId] = panel
        if (!saveNeeded) saveNeeded = true
      }
    }
  }

  this.state.containers = containers
  this.state.panels = panels
  this.state.panelsMap = panelsMap

  if (this.state.panelIndex >= this.state.panels.length) {
    this.state.panelIndex = 1
  }

  if (saveNeeded) Actions.savePanels()

  Logs.push('[INFO] Containers loaded')
}

/**
 * Update panels settings
 */
async function updatePanels(newPanels) {
  if (!newPanels) return

  let panels = []
  let indexChanged = false
  for (let i = 0; i < newPanels.length; i++) {
    let newPanel = newPanels[i]
    let panel = this.state.panels.find(p => {
      return p.type === newPanel.type && p.cookieStoreId === newPanel.cookieStoreId
    })
    if (!panel) continue

    if (indexChanged || panel.index !== i) indexChanged = true

    panel.index = i
    panel.lockedTabs = newPanel.lockedTabs
    panel.lockedPanel = newPanel.lockedPanel
    panel.proxy = newPanel.proxy
    panel.proxified = newPanel.proxified
    panel.noEmpty = newPanel.noEmpty
    panel.includeHostsActive = newPanel.includeHostsActive
    panel.includeHosts = newPanel.includeHosts
    panel.excludeHostsActive = newPanel.excludeHostsActive
    panel.excludeHosts = newPanel.excludeHosts
    panel.lastActiveTab = newPanel.lastActiveTab

    panels.push(panel)
  }

  this.state.panels = panels

  if (indexChanged) Actions.loadTabs(false)
}

/**
 * Update tabs per panel with range indexes
 */
function updatePanelsTabs() {
  let lastIndex = this.getters.pinnedTabs.length
  for (let panel of this.state.panels) {
    if (panel.panel !== 'TabsPanel') continue

    panel.tabs = []
    for (let t of this.state.tabs) {
      if (t.pinned) continue
      if (t.cookieStoreId === panel.cookieStoreId) panel.tabs.push(t)
    }
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
 * Update panels ranges
 */
function updatePanelsRanges() {
  let lastIndex = this.getters.pinnedTabs.length
  let countOfPanels = this.state.panels.length
  for (let i = 0; i < countOfPanels; i++) {
    let panel = this.state.panels[i]
    panel.index = i
    if (panel.panel !== 'TabsPanel') continue
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
 * Save panels
 */
async function savePanels() {
  if (!this.state.windowFocused) return
  const output = []
  for (let panel of this.state.panels) {
    output.push({
      cookieStoreId: panel.cookieStoreId,
      color: panel.color,
      icon: panel.icon,
      name: panel.name,

      type: panel.type,
      dashboard: panel.dashboard,
      panel: panel.panel,
      lockedTabs: panel.lockedTabs,
      lockedPanel: panel.lockedPanel,
      proxy: panel.proxy,
      proxified: panel.proxified,
      noEmpty: panel.noEmpty,
      includeHostsActive: panel.includeHostsActive,
      includeHosts: panel.includeHosts,
      excludeHostsActive: panel.excludeHostsActive,
      excludeHosts: panel.excludeHosts,
      lastActiveTab: panel.lastActiveTab,
      private: panel.private,
      bookmarks: panel.bookmarks,
    })
  }
  const cleaned = JSON.parse(JSON.stringify(output))
  await browser.storage.local.set({ panels: cleaned })
}
function savePanelsDebounced() {
  if (savePanelsTimeout) clearTimeout(savePanelsTimeout)
  savePanelsTimeout = setTimeout(() => Actions.savePanels(), 500)
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
function switchToPanel(index) {
  Actions.closeCtxMenu()
  Actions.resetSelection()
  Actions.setPanel(index)

  if (this.state.dashboardIsOpen) Actions.openDashboard(this.state.panelIndex)
  const panel = this.state.panels[this.state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(panel.cookieStoreId)
  }

  if (this.state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(this.state.panelIndex)
  }

  Actions.recalcPanelScroll()
  Actions.updateTabsVisability()
  Actions.updatePanelBoundsDebounced()
  Actions.savePanelIndex()
}

/**
 * Try to find not hidden neighbour panel
 */
function switchToNeighbourPanel() {
  let target

  if (this.state.panelIndex < 0) target = this.state.panels[0]

  if (!target) {
    for (let i = this.state.panelIndex; i > 0; i--) {
      if (this.state.panels[i] && !this.state.panels[i].inactive) {
        target = this.state.panels[i]
        break
      }
    }
  }

  if (!target) {
    for (let i = this.state.panelIndex; i < this.state.panels.length; i++) {
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

  Actions.closeCtxMenu()
  Actions.resetSelection()

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
    Actions.savePanelIndex()
  }
  this.state.lastPanelIndex = this.state.panelIndex

  if (this.state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(this.state.panelIndex)
  }

  if (this.state.dashboardIsOpen) Actions.openDashboard(this.state.panelIndex)
  let panel = this.state.panels[this.state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(panel.cookieStoreId)
  }

  Actions.recalcPanelScroll()
  Actions.updateTabsVisability()
  Actions.updatePanelBoundsDebounced()
}

/**
 * Find panel with active tab and switch to it.
 */
function goToActiveTabPanel() {
  const activeTab = this.state.tabs.find(t => t.active)
  const panel = this.state.panelsMap[activeTab.cookieStoreId]
  if (panel) Actions.switchToPanel(panel.index)
}

/**
 * Returns active panel info
 */
function getActivePanel() {
  return Utils.cloneObject(this.state.panels[this.state.panelIndex])
}

async function movePanel(id, step) {
  let index
  if (id === 'bookmarks') index = this.state.panels.findIndex(p => p.bookmarks)
  else index = this.state.panels.findIndex(p => p.cookieStoreId === id)

  if (index === -1) return
  if (index + step < 0) return
  if (index + step >= this.state.panels.length) return

  let panel = this.state.panels.splice(index, 1)[0]
  this.state.panels.splice(index + step, 0, panel)
  this.state.panelIndex = index + step
  for (let i = 0; i < this.state.panels.length; i++) {
    this.state.panels[i].index = i
  }

  await Actions.loadTabs(false)

  Actions.savePanels()
}

export default {
  loadPanels,
  updatePanels,
  updatePanelsTabs,
  updatePanelsRanges,
  savePanels,
  savePanelsDebounced,
  loadPanelIndex,
  setPanel,
  savePanelIndex,
  recalcPanelScroll,
  updatePanelBoundsDebounced,
  switchToPanel,
  switchToNeighbourPanel,
  switchPanel,
  goToActiveTabPanel,
  getActivePanel,
  movePanel,
}
