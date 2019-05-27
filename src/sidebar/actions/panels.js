import EventBus from '../../event-bus'
import Utils from '../../libs/utils'
import Logs from '../../libs/logs'
import Actions from '.'
import ReqHandler from '../proxy'
import { DEFAULT_PANELS } from '../store/state'

let recalcPanelScrollTimeout, updateReqHandlerTimeout, saveContainersTimeout

/**
 * Load Contextual Identities and containers
 * and merge them
 */
async function loadContainers(state) {
  // Get contextual identities
  const ctxs = await browser.contextualIdentities.query({})
  if (!ctxs) {
    Logs.push('[WARN] Cannot load contextual identities')
    state.containers = DEFAULT_PANELS
    return
  }

  // Get saved containers
  let ans = await browser.storage.local.get('containers')
  let containers = DEFAULT_PANELS
  if (!ans || !ans.containers) Logs.push('[WARN] Cannot load containers')
  if (ans && ans.containers && ans.containers.length) containers = ans.containers

  // Merge saved containers and queried contextualIdentities
  for (let ctx of ctxs) {
    let ctr = containers.find(c => c.id === ctx.cookieStoreId && c.type === 'ctx')
    if (!ctr) {
      containers.push({
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
      })
    } else {
      ctr.colorCode = ctx.colorCode
      ctr.color = ctx.color
      ctr.icon = ctx.icon
      ctr.iconUrl = ctx.iconUrl
      ctr.name = ctx.name
      if (ctr.lockedTabs === undefined) ctr.lockedTabs = false
      if (ctr.lockedPanel === undefined) ctr.lockedPanel = false
      if (ctr.proxy === undefined) ctr.proxy = null
      if (ctr.proxified === undefined) ctr.proxified = false
      if (ctr.noEmpty === undefined) ctr.noEmpty = false
      if (ctr.includeHostsActive === undefined) ctr.includeHostsActive = false
      if (ctr.includeHosts === undefined) ctr.includeHosts = ''
      if (ctr.excludeHostsActive === undefined) ctr.excludeHostsActive = false
      if (ctr.excludeHosts === undefined) ctr.excludeHosts = ''
      if (ctr.lastActiveTab === undefined) ctr.lastActiveTab = -1
    }
  }

  // Clean up
  const toRemove = []
  for (let ctr of containers) {
    if (ctr.type !== 'ctx') continue
    if (!ctxs.find(c => c.cookieStoreId === ctr.id)) toRemove.push(ctr.id)
  }
  for (let id of toRemove) {
    const rIndex = containers.findIndex(c => c.id === id)
    if (rIndex !== -1) containers.splice(rIndex, 1)
  }

  state.ctxs = ctxs
  state.containers = containers

  // Set requests handler (if needed)
  updateReqHandler(state)

  Logs.push('[INFO] Containers loaded')
}

/**
 * Update containers data
 */
async function updateContainers(state, containers) {
  if (!containers) return

  for (let localCtr of state.containers) {
    const newCtr = containers.find(nc => nc.id === localCtr.id)
    if (!newCtr) continue

    localCtr.lockedTabs = newCtr.lockedTabs
    localCtr.lockedPanel = newCtr.lockedPanel
    localCtr.proxy = newCtr.proxy
    localCtr.proxified = newCtr.proxified
    localCtr.noEmpty = newCtr.noEmpty
    localCtr.includeHostsActive = newCtr.includeHostsActive
    localCtr.includeHosts = newCtr.includeHosts
    localCtr.excludeHostsActive = newCtr.excludeHostsActive
    localCtr.excludeHosts = newCtr.excludeHosts
    localCtr.lastActiveTab = newCtr.lastActiveTab
  }

  updateReqHandlerDebounced(state)
}

/**
 * Save containers
 */
async function saveContainers(state) {
  if (!state.windowFocused) return
  const output = []
  for (let ctr of state.containers) {
    output.push({
      cookieStoreId: ctr.cookieStoreId,
      colorCode: ctr.colorCode,
      color: ctr.color,
      icon: ctr.icon,
      iconUrl: ctr.iconUrl,
      name: ctr.name,

      type: ctr.type,
      id: ctr.id,
      dashboard: ctr.dashboard,
      panel: ctr.panel,
      lockedTabs: ctr.lockedTabs,
      lockedPanel: ctr.lockedPanel,
      proxy: ctr.proxy,
      proxified: ctr.proxified,
      noEmpty: ctr.noEmpty,
      includeHostsActive: ctr.includeHostsActive,
      includeHosts: ctr.includeHosts,
      excludeHostsActive: ctr.excludeHostsActive,
      excludeHosts: ctr.excludeHosts,
      lastActiveTab: ctr.lastActiveTab,
      private: ctr.private,
      bookmarks: ctr.bookmarks,
    })
  }
  const cleaned = JSON.parse(JSON.stringify(output))
  await browser.storage.local.set({ containers: cleaned })
}
function saveContainersDebounced(state) {
  if (saveContainersTimeout) clearTimeout(saveContainersTimeout)
  saveContainersTimeout = setTimeout(() => saveContainers(state), 500)
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
function switchToPanel(state, panels, index) {
  Actions.closeCtxMenu(state)
  Actions.resetSelection(state)
  setPanel(state, index)

  if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
  const panel = panels[state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(state, panel.cookieStoreId)
  }

  if (state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(state, state.panelIndex)
  }

  recalcPanelScroll()
  Actions.updateTabsVisability(state, panels)
  EventBus.$emit('panelSwitched')
  Actions.savePanelIndex(state)
}

/**
 * Switch panel.
 */
async function switchPanel(state, panels, dir = 0) {
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
  for (; panels[i]; i += dir) {
    const p = panels[i]
    if (state.skipEmptyPanels && p.tabs && !p.tabs.length) continue
    if (!p.inactive) break
  }
  if (panels[i]) {
    state.panelIndex = i
    Actions.savePanelIndex(state)
  }
  state.lastPanelIndex = state.panelIndex

  if (state.activateLastTabOnPanelSwitching) {
    Actions.activateLastActiveTabOf(state, panels, state.panelIndex)
  }

  if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
  let panel = panels[state.panelIndex]
  if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
    Actions.createTab(state, panel.cookieStoreId)
  }

  recalcPanelScroll()
  Actions.updateTabsVisability(state, panels)
  EventBus.$emit('panelSwitched')
}

/**
 * Find active tab panel and switch to it.
 */
function goToActiveTabPanel(state, panels) {
  let i = Utils.GetPanelIndex(panels)
  if (i === -1) return
  switchToPanel(state, panels, i)
}

/**
 * Update request handler
 */
async function updateReqHandler(state) {
  state.proxies = {}
  state.includeHostsRules = []
  state.excludeHostsRules = {}

  for (let ctr of state.containers) {
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
  loadContainers,
  updateContainers,
  saveContainers,
  saveContainersDebounced,
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