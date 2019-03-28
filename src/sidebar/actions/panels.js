import EventBus from '../event-bus'
import Utils from '../../libs/utils'
import ReqHandler from '../proxy'
import { DEFAULT_PANELS } from '../store.state'

let recalcPanelScrollTimeout, updateReqHandlerTimeout, saveContainersTimeout

export default {
  /**
   * Load Contextual Identities and containers
   * and merge them
   */
  async loadContainers({ state, dispatch }) {
    // Get contextual identities
    const ctxs = await browser.contextualIdentities.query({})

    // Get saved containers
    let ans = await browser.storage.local.get('containers')
    let containers = ans.containers
    if (!containers || !containers.length) containers = DEFAULT_PANELS

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
          sync: false,
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
        if (ctr.sync === undefined) ctr.sync = false
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
    dispatch('updateReqHandler')
  },

  /**
   * Update containers data
   */
  async updateContainers({ state, dispatch }, containers) {
    if (!containers) return

    for (let localCtr of state.containers) {
      const newCtr = containers.find(nc => nc.id === localCtr.id)
      if (!newCtr) continue

      localCtr.lockedTabs = newCtr.lockedTabs
      localCtr.lockedPanel = newCtr.lockedPanel
      localCtr.proxy = newCtr.proxy
      localCtr.proxified = newCtr.proxified
      localCtr.sync = newCtr.sync
      localCtr.noEmpty = newCtr.noEmpty
      localCtr.includeHostsActive = newCtr.includeHostsActive
      localCtr.includeHosts = newCtr.includeHosts
      localCtr.excludeHostsActive = newCtr.excludeHostsActive
      localCtr.excludeHosts = newCtr.excludeHosts
      localCtr.lastActiveTab = newCtr.lastActiveTab
    }

    dispatch('updateReqHandlerDebounced')
  },

  /**
   * Save containers
   */
  async saveContainers({ state }) {
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
        sync: ctr.sync,
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
  },
  saveContainersDebounced({ dispatch }) {
    if (saveContainersTimeout) clearTimeout(saveContainersTimeout)
    saveContainersTimeout = setTimeout(() => dispatch('saveContainers'), 500)
  },

  /**
   * Create new conte...
   */
  async createContext(_, { name, color, icon }) {
    const details = { name, color, icon }
    return await browser.contextualIdentities.create(details)
  },

  /**
   * Breadcast recalc panel's scroll event.
   */
  recalcPanelScroll() {
    if (recalcPanelScrollTimeout) clearTimeout(recalcPanelScrollTimeout)
    recalcPanelScrollTimeout = setTimeout(() => {
      EventBus.$emit('recalcPanelScroll')
      recalcPanelScrollTimeout = null
    }, 200)
  },

  /**
   * Switch current active panel by index
   */
  switchToPanel({ state, getters, commit, dispatch }, index) {
    commit('closeSettings')
    commit('closeCtxMenu')
    commit('resetSelection')
    commit('setPanel', index)
    if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
    const panel = getters.panels[state.panelIndex]
    if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
      dispatch('createTab', panel.cookieStoreId)
    }

    if (state.activateLastTabOnPanelSwitching) {
      dispatch('activateLastActiveTabOf', state.panelIndex)
    }

    dispatch('recalcPanelScroll')
    if (state.hideInact) dispatch('hideInactPanelsTabs')
    EventBus.$emit('panelSwitched')
    dispatch('savePanelIndex')
  },

  /**
   * Switch panel.
   */
  async switchPanel({ state, commit, getters, dispatch }, dir = 0) {
    // Debounce switching
    if (state.switchPanelPause) return
    state.switchPanelPause = setTimeout(() => {
      clearTimeout(state.switchPanelPause)
      state.switchPanelPause = null
    }, 128)

    commit('closeCtxMenu')
    commit('resetSelection')

    // Restore prev front panel
    if (state.panelIndex < 0) {
      if (state.lastPanelIndex < 0) state.panelIndex = 0
      else state.panelIndex = state.lastPanelIndex
    }

    // Update panel index
    let i = state.panelIndex + dir
    for (;getters.panels[i]; i += dir) {
      const p = getters.panels[i]
      if (state.skipEmptyPanels && p.tabs && !p.tabs.length) continue
      if (!p.inactive) break
    }
    if (getters.panels[i]) {
      state.panelIndex = i
      dispatch('savePanelIndex')
    }
    state.lastPanelIndex = state.panelIndex

    if (state.activateLastTabOnPanelSwitching) {
      dispatch('activateLastActiveTabOf', state.panelIndex)
    }

    if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
    let panel = getters.panels[state.panelIndex]
    if (panel.noEmpty && panel.tabs && !panel.tabs.length) {
      dispatch('createTab', panel.cookieStoreId)
    }

    dispatch('recalcPanelScroll')
    if (state.hideInact) dispatch('hideInactPanelsTabs')
    EventBus.$emit('panelSwitched')
  },

  /**
   * Find active tab panel and switch to it.
   */
  goToActiveTabPanel({ getters, dispatch }) {
    let i = Utils.GetPanelIndex(getters.panels)
    if (i === -1) return
    dispatch('switchToPanel', i)
  },

  /**
   * Update request handler
   */
  async updateReqHandler({ state, dispatch }) {
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
    if (incRulesOk || excRulesOk || proxyOk) dispatch('turnOnReqHandler')
    else dispatch('turnOffReqHandler')
  },

  /**
   * Update request handler debounced
   */
  updateReqHandlerDebounced({ dispatch }) {
    if (updateReqHandlerTimeout) clearTimeout(updateReqHandlerTimeout)
    updateReqHandlerTimeout = setTimeout(() => {
      dispatch('updateReqHandler')
      updateReqHandlerTimeout = null
    }, 500)
  },

  /**
   * Set request handler
   */
  turnOnReqHandler({ state }) {
    if (state.private) return
    if (!browser.proxy.onRequest.hasListener(ReqHandler)) {
      browser.proxy.onRequest.addListener(ReqHandler, { urls: ['<all_urls>'] })
    }
  },

  /**
   * Unset request handler
   */
  turnOffReqHandler({ state }) {
    if (state.private) return
    if (browser.proxy.onRequest.hasListener(ReqHandler)) {
      browser.proxy.onRequest.removeListener(ReqHandler)
    }
  },
}
