import EventBus from '../event-bus'
import Utils from '../../libs/utils'
import ReqHandler from '../proxy'

export default {
  /**
   * Load Contextual Identities
   */
  async loadContexts({ state }) {
    state.ctxs = await browser.contextualIdentities.query({})
  },

  /**
   * Create new conte...
   */
  async createContext(_, { name, color, icon }) {
    const details = { name, color, icon }
    return await browser.contextualIdentities.create(details)
  },

  /**
   * Check context binding to bookmarks dir
   */
  async checkContextBindings({ state }, ctxId) {
    const ctx = state.ctxs.find(c => c.cookieStoreId === ctxId)
    if (!ctx) return

    const binding = ctx.name.split('@')[1]
    if (!binding) return

    let urls
    const findWalk = nodes => {
      return nodes.map(n => {
        if (!n.children) return
        if (n.children && n.title === binding) {
          urls = n.children.map(ch => ch.url)
        } else if (n.children && !urls) {
          findWalk(n.children)
        }
        return n
      })
    }
    findWalk(state.bookmarks)

    if (!urls) return
    for (let url of urls) {
      if (!ctx.tabs) continue
      if (ctx.tabs.find(t => t.url === url)) continue
      browser.tabs.create({ url: url, cookieStoreId: ctxId })
    }
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

    dispatch('checkContextBindings', getters.panels[state.panelIndex].cookieStoreId)
    dispatch('recalcPanelScroll')

    if (state.hideInact) dispatch('hideInactPanelsTabs')
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
    if (state.proxiedPanels.length) dispatch('turnOnProxy')
    else dispatch('turnOffProxy')
  },

  /**
   * Turn on proxy
   */
  turnOnProxy() {
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
