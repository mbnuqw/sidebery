import EventBus from '../../event-bus'
import Logs from '../../libs/logs'
import Actions from '.'
import ReqHandler from '../proxy'
import { DEFAULT_PANELS } from '../store/state'

let recalcPanelScrollTimeout, updateReqHandlerTimeout, savePanelsTimeout

/**
 * Load Contextual Identities and containers
 * and merge them
 */
async function loadPanels(state) {
  // Get contextual identities
  const ctxs = await browser.contextualIdentities.query({})
  if (!ctxs) {
    Logs.push('[WARN] Cannot load contextual identities')
    state.panels = DEFAULT_PANELS
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
  if (ans && ans.panels && ans.panels.length) panels = ans.panels

  // hm...
  panels[1].tabs = []
  panels[1].startIndex = -1
  panels[1].endIndex = -1
  panels[2].tabs = []
  panels[2].startIndex = -1
  panels[2].endIndex = -1

  // Merge saved containers and queried contextualIdentities
  for (let ctx of ctxs) {
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
    if (!ctxs.find(c => c.cookieStoreId === ctr.id)) toRemove.push(ctr.id)
  }
  for (let id of toRemove) {
    const rIndex = panels.findIndex(c => c.id === id)
    if (rIndex !== -1) panels.splice(rIndex, 1)
  }

  state.ctxs = ctxs
  state.panels = panels

  // Set requests handler (if needed)
  updateReqHandler(state)

  Logs.push('[INFO] Containers loaded')
}

/**
 * Update panels data
 */
async function updatePanels(state, newPanels) {
  if (!newPanels) return

  for (let panel of state.panels) {
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

  updateReqHandlerDebounced(state)
}

/**
 * Save panels
 */
async function savePanels(state) {
  if (!state.windowFocused) return
  const output = []
  for (let panel of state.panels) {
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
function savePanelsDebounced(state) {
  if (savePanelsTimeout) clearTimeout(savePanelsTimeout)
  savePanelsTimeout = setTimeout(() => savePanels(state), 500)
}

/**
 * Try to load saved sidebar state
 */
async function loadPanelIndex(state) {
  let ans = await browser.storage.local.get('panelIndex')
  if (!ans) return

  if (!state.private && ans.panelIndex !== 1) {
    if (ans.panelIndex >= 0) {
      state.panelIndex = ans.panelIndex
    }
  }
}

/**
 * Set panel index
 */
function setPanel(state, newIndex) {
  if (state.panelIndex === newIndex) return
  state.panelIndex = newIndex
  if (newIndex >= 0) state.lastPanelIndex = newIndex
}

/**
 * Save panel index
 */
function savePanelIndex(state) {
  if (!state.windowFocused || state.private) return
  browser.storage.local.set({ panelIndex: state.panelIndex })
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
function switchToPanel(state, index) {
  Actions.closeCtxMenu(state)
  Actions.resetSelection(state)
  setPanel(state, index)

  if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
  const panel = state.panels[state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(state, panel.cookieStoreId)
  }

  if (state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(state, state.panelIndex)
  }

  recalcPanelScroll()
  Actions.updateTabsVisability(state)
  EventBus.$emit('panelSwitched')
  Actions.savePanelIndex(state)
}

/**
 * Switch panel.
 */
async function switchPanel(state, dir = 0) {
  // Debounce switching
  if (state.switchPanelPause) return
  state.switchPanelPause = setTimeout(() => {
    clearTimeout(state.switchPanelPause)
    state.switchPanelPause = null
  }, 128)

  Actions.closeCtxMenu(state)
  Actions.resetSelection(state)

  // Restore prev front panel
  if (state.panelIndex < 0) {
    if (state.lastPanelIndex < 0) state.panelIndex = 0
    else state.panelIndex = state.lastPanelIndex - dir
  }

  // Update panel index
  let i = state.panelIndex + dir
  for (; state.panels[i]; i += dir) {
    const p = state.panels[i]
    if (state.skipEmptyPanels && p.tabs && !p.tabs.length) continue
    if (!p.inactive) break
  }
  if (state.panels[i]) {
    state.panelIndex = i
    Actions.savePanelIndex(state)
  }
  state.lastPanelIndex = state.panelIndex

  if (state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(state, state.panelIndex)
  }

  if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
  let panel = state.panels[state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(state, panel.cookieStoreId)
  }

  recalcPanelScroll()
  Actions.updateTabsVisability(state)
  EventBus.$emit('panelSwitched')
}

/**
 * Find panel with active tab and switch to it.
 */
function goToActiveTabPanel(state) {
  const panelIndex = state.panels.findIndex(p => p.tabs.find(t => t.active))
  if (panelIndex > -1) switchToPanel(state, panelIndex)
}

/**
 * Update request handler
 */
async function updateReqHandler(state) {
  state.proxies = {}
  state.includeHostsRules = []
  state.excludeHostsRules = {}

  for (let ctr of state.panels) {
    // Proxy
    if (ctr.proxified && ctr.proxy) state.proxies[ctr.id] = { ...ctr.proxy }

    // Include rules
    if (ctr.includeHostsActive) {
      for (let rawRule of ctr.includeHosts.split('\n')) {
        let rule = rawRule.trim()
        if (!rule) continue

        if (rule[0] === '/' && rule[rule.length - 1] === '/') {
          rule = new RegExp(rule.slice(1, rule.length - 1))
        }

        state.includeHostsRules.push({ ctx: ctr.id, value: rule })
      }
    }

    // Exclude rules
    if (ctr.excludeHostsActive) {
      state.excludeHostsRules[ctr.id] = ctr.excludeHosts
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
  const incRulesOk = state.includeHostsRules.length > 0
  const excRulesOk = Object.keys(state.excludeHostsRules).length > 0
  const proxyOk = Object.keys(state.proxies).length > 0
  if (incRulesOk || excRulesOk || proxyOk) turnOnReqHandler(state)
  else turnOffReqHandler(state)
}

/**
 * Update request handler debounced
 */
function updateReqHandlerDebounced(state) {
  if (updateReqHandlerTimeout) clearTimeout(updateReqHandlerTimeout)
  updateReqHandlerTimeout = setTimeout(() => {
    updateReqHandler(state)
    updateReqHandlerTimeout = null
  }, 500)
}

/**
 * Set request handler
 */
function turnOnReqHandler(state) {
  if (state.private) return
  if (!browser.proxy.onRequest.hasListener(ReqHandler)) {
    browser.proxy.onRequest.addListener(ReqHandler, { urls: ['<all_urls>'] })
  }
}

/**
 * Unset request handler
 */
function turnOffReqHandler(state) {
  if (state.private) return
  if (browser.proxy.onRequest.hasListener(ReqHandler)) {
    browser.proxy.onRequest.removeListener(ReqHandler)
  }
}

export default {
  loadPanels,
  updatePanels,
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