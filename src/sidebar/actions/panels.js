import EventBus from '../event-bus'
import Utils from '../../libs/utils'
import ReqHandler from '../proxy'
import { DEFAULT_PANELS } from '../store.state'

let recalcPanelScrollTimeout

export default {
  /**
   * Load Contextual Identities and containers
   * and merge them
   */
  async loadContainers({ state }) {
    // console.log('[DEBUG] PANELS ACION loadContainers');
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

    // Set proxy configs
    state.proxies = {}
    for (let ctr of containers) {
      if (ctr.proxy) state.proxies[ctr.id] = { ...ctr.proxy }
    }
    
    state.ctxs = ctxs
    state.containers = containers
  },

  /**
   * Save containers
   */
  async saveContainers({ state }) {
    // console.log('[DEBUG] PANELS ACION saveContainers');
    const cleaned = JSON.parse(JSON.stringify(state.containers))
    await browser.storage.local.set({ containers: cleaned })
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
    if (state.createNewTabOnEmptyPanel) {
      let panel = getters.panels[state.panelIndex]
      if (panel.tabs && panel.tabs.length === 0) {
        dispatch('createTab', panel.cookieStoreId)
      }
    }

    if (state.activateLastTabOnPanelSwitching) {
      dispatch('activateLastActiveTabOf', state.panelIndex)
    }

    dispatch('recalcPanelScroll')
    if (state.hideInact) dispatch('hideInactPanelsTabs')
    EventBus.$emit('panelSwitched')
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
    if (getters.panels[i]) state.panelIndex = i
    state.lastPanelIndex = state.panelIndex

    if (state.activateLastTabOnPanelSwitching) {
      dispatch('activateLastActiveTabOf', state.panelIndex)
    }

    if (state.dashboardOpened) EventBus.$emit('openDashboard', state.panelIndex)
    if (state.createNewTabOnEmptyPanel) {
      let panel = getters.panels[state.panelIndex]
      if (panel.tabs && panel.tabs.length === 0) {
        dispatch('createTab', panel.cookieStoreId)
      }
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
   * Update proxied tabs.
   */
  updateProxiedTabs({ state, dispatch }) {
    if (state.containers.find(c => !!c.proxy)) dispatch('turnOnProxy')
    else dispatch('turnOffProxy')
  },

  /**
   * Turn on proxy
   */
  turnOnProxy() {
    // console.log('[DEBUG] PANELS ACION turnOnProxy');
    if (!browser.proxy.onRequest.hasListener(ReqHandler)) {
      browser.proxy.onRequest.addListener(ReqHandler, { urls: ['<all_urls>'] })
    }
  },

  /**
   * Turn off proxy
   */
  turnOffProxy() {
    if (browser.proxy.onRequest.hasListener(ReqHandler)) {
      browser.proxy.onRequest.removeListener(ReqHandler)
    }
  },
}
