import EventBus from '../../event-bus'
import Logs from '../../logs'
import Actions from '.'
import ReqHandler from '../proxy'
import { DEFAULT_PANELS } from '../config/panels'

let recalcPanelScrollTimeout, updateReqHandlerTimeout, savePanelsTimeout

/**
 * Load Contextual Identities and containers
 * and merge them
 */
async function loadPanels() {
  // Get contextual identities
  const containers = await browser.contextualIdentities.query({})
  if (!containers) {
    Logs.push('[WARN] Cannot load contextual identities')
    this.state.panels = DEFAULT_PANELS
    return
  }

  // Get saved panels
  // Changed storage: containers -> panels
  let ans = await browser.storage.local.get('panels')
  // ---------------------------- UNTIL 3.1.0 --------------------------------
  if (!ans || !ans.panels) {
    ans = await browser.storage.local.get('containers')
    ans.panels = ans.containers
  }
  // ---------------------------- UNTIL 3.1.0 --------------------------------
  let panels = DEFAULT_PANELS
  if (!ans || !ans.panels) Logs.push('[WARN] Cannot load panels')

  // allright, this is tmp
  if (ans && ans.panels && ans.panels.length) {
    panels[0].lockedPanel = ans.panels[0].lockedPanel
    // ---
    panels[2].noEmpty = ans.panels[2].noEmpty
    panels[2].lastActiveTab = ans.panels[2].lastActiveTab
    panels[2].lockedPanel = ans.panels[2].lockedPanel
    panels[2].lockedTabs = ans.panels[2].lockedTabs
  }

  // Merge saved containers and queried contextualIdentities
  for (let ctx of containers) {
    let panel = panels.find(p => p.cookieStoreId === ctx.cookieStoreId && p.type === 'ctx')
    if (!panel) {
      panels.push({
        ...ctx,
        type: 'ctx',
        id: ctx.cookieStoreId,
        dashboard: 'TabsDashboard',
        panel: 'TabsPanel',
        lockedTabs: false,
        lockedPanel: false,
        proxy: null,
        proxified: false,
        noEmpty: false,
        includeHostsActive: false,
        includeHosts: '',
        excludeHostsActive: false,
        excludeHosts: '',
        lastActiveTab: -1,
        tabs: [],
        startIndex: -1,
        endIndex: -1,
      })
    } else {
      panel.colorCode = ctx.colorCode
      panel.color = ctx.color
      panel.icon = ctx.icon
      panel.iconUrl = ctx.iconUrl
      panel.name = ctx.name
      if (panel.lockedTabs === undefined) panel.lockedTabs = false
      if (panel.lockedPanel === undefined) panel.lockedPanel = false
      if (panel.proxy === undefined) panel.proxy = null
      if (panel.proxified === undefined) panel.proxified = false
      if (panel.noEmpty === undefined) panel.noEmpty = false
      if (panel.includeHostsActive === undefined) panel.includeHostsActive = false
      if (panel.includeHosts === undefined) panel.includeHosts = ''
      if (panel.excludeHostsActive === undefined) panel.excludeHostsActive = false
      if (panel.excludeHosts === undefined) panel.excludeHosts = ''
      if (panel.lastActiveTab === undefined) panel.lastActiveTab = -1
      panel.tabs = []
      panel.startIndex = -1
      panel.endIndex = -1
    }
  }

  // Clean up
  const toRemove = []
  for (let ctr of panels) {
    if (ctr.type !== 'ctx') continue
    if (!containers.find(c => c.cookieStoreId === ctr.id)) toRemove.push(ctr.id)
  }
  for (let id of toRemove) {
    const rIndex = panels.findIndex(c => c.id === id)
    if (rIndex !== -1) panels.splice(rIndex, 1)
  }

  this.state.containers = containers
  this.state.panels = panels

  // Set requests handler (if needed)
  Actions.updateReqHandler()

  Logs.push('[INFO] Containers loaded')
}

/**
 * Update panels settings
 */
async function updatePanels(newPanels) {
  if (!newPanels) return

  for (let panel of this.state.panels) {
    const newPanel = newPanels.find(nc => nc.id === panel.id)
    if (!newPanel) continue

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
  }

  Actions.updateReqHandlerDebounced()
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
  for (let panel of this.state.panels) {
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
      colorCode: panel.colorCode,
      color: panel.color,
      icon: panel.icon,
      iconUrl: panel.iconUrl,
      name: panel.name,

      type: panel.type,
      id: panel.id,
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
function recalcPanelScroll() {
  if (recalcPanelScrollTimeout) clearTimeout(recalcPanelScrollTimeout)
  recalcPanelScrollTimeout = setTimeout(() => {
    EventBus.$emit('recalcPanelScroll')
    recalcPanelScrollTimeout = null
  }, 200)
}

/**
 * Switch current active panel by index
 */
function switchToPanel(index) {
  Actions.closeCtxMenu()
  Actions.resetSelection()
  Actions.setPanel(index)

  if (this.state.dashboardOpened) EventBus.$emit('openDashboard', this.state.panelIndex)
  const panel = this.state.panels[this.state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(panel.cookieStoreId)
  }

  if (this.state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(this.state.panelIndex)
  }

  Actions.recalcPanelScroll()
  Actions.updateTabsVisability()
  EventBus.$emit('panelSwitched')
  Actions.savePanelIndex()
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

  if (this.state.dashboardOpened) EventBus.$emit('openDashboard', this.state.panelIndex)
  let panel = this.state.panels[this.state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(panel.cookieStoreId)
  }

  Actions.recalcPanelScroll()
  Actions.updateTabsVisability()
  EventBus.$emit('panelSwitched')
}

/**
 * Find panel with active tab and switch to it.
 */
function goToActiveTabPanel() {
  const panelIndex = this.state.panels.findIndex(p => p.tabs.find(t => t.active))
  if (panelIndex > -1) Actions.switchToPanel(panelIndex)
}

/**
 * Update request handler
 */
async function updateReqHandler() {
  this.state.proxies = {}
  this.state.includeHostsRules = []
  this.state.excludeHostsRules = {}

  for (let ctr of this.state.panels) {
    // Proxy
    if (ctr.proxified && ctr.proxy) this.state.proxies[ctr.id] = { ...ctr.proxy }

    // Include rules
    if (ctr.includeHostsActive) {
      for (let rawRule of ctr.includeHosts.split('\n')) {
        let rule = rawRule.trim()
        if (!rule) continue

        if (rule[0] === '/' && rule[rule.length - 1] === '/') {
          rule = new RegExp(rule.slice(1, rule.length - 1))
        }

        this.state.includeHostsRules.push({ ctx: ctr.id, value: rule })
      }
    }

    // Exclude rules
    if (ctr.excludeHostsActive) {
      this.state.excludeHostsRules[ctr.id] = ctr.excludeHosts
        .split('\n')
        .map(r => {
          let rule = r.trim()

          if (rule[0] === '/' && rule[rule.length - 1] === '/') {
            rule = new RegExp(rule.slice(1, rule.length - 1))
          }

          return rule
        })
        .filter(r => r)
    }
  }

  // Turn on request handler
  const incRulesOk = this.state.includeHostsRules.length > 0
  const excRulesOk = Object.keys(this.state.excludeHostsRules).length > 0
  const proxyOk = Object.keys(this.state.proxies).length > 0
  if (incRulesOk || excRulesOk || proxyOk) Actions.turnOnReqHandler()
  else Actions.turnOffReqHandler()
}

/**
 * Update request handler debounced
 */
function updateReqHandlerDebounced() {
  if (updateReqHandlerTimeout) clearTimeout(updateReqHandlerTimeout)
  updateReqHandlerTimeout = setTimeout(() => {
    Actions.updateReqHandler()
    updateReqHandlerTimeout = null
  }, 500)
}

/**
 * Set request handler
 */
function turnOnReqHandler() {
  if (this.state.private) return
  if (!browser.proxy.onRequest.hasListener(ReqHandler)) {
    browser.proxy.onRequest.addListener(ReqHandler, { urls: ['<all_urls>'] })
  }
}

/**
 * Unset request handler
 */
function turnOffReqHandler() {
  if (this.state.private) return
  if (browser.proxy.onRequest.hasListener(ReqHandler)) {
    browser.proxy.onRequest.removeListener(ReqHandler)
  }
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
  switchToPanel,
  switchPanel,
  goToActiveTabPanel,
  updateReqHandler,
  updateReqHandlerDebounced,
  turnOnReqHandler,
  turnOffReqHandler,
}