import Logs from '../../libs/logs'
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
    if (state.panelMenuOpened) EventBus.$emit('openPanelMenu', state.panelIndex)
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

    Logs.D(`Try to switch panel from: ${state.panelIndex} to: ${state.panelIndex + dir}`)

    commit('closeCtxMenu')
    commit('resetSelection')
    if (state.settingsOpened) return commit('closeSettings')

    // Next
    if (dir > 0) {
      if (state.panelIndex < getters.panels.length - 1) state.panelIndex++
      let i = state.panelIndex
      while (getters.panels[i].hidden) {
        if (i >= getters.panels.length - 1) {
          i = state.panelIndex - 1
          break
        }
        i++
      }
      state.panelIndex = i
      if (state.skipEmptyPanels) {
        for (let i = state.panelIndex; i < getters.panels.length; i++) {
          if (getters.panels[i].tabs && getters.panels[i].tabs.length) {
            state.panelIndex = i
            break
          }
        }
      }
    }

    // Prev
    if (dir < 0) {
      if (state.panelIndex < 0) state.panelIndex = 0
      if (state.panelIndex > 0) state.panelIndex--
      while (getters.panels[state.panelIndex].hidden) {
        state.panelIndex--
      }
      if (state.skipEmptyPanels) {
        for (let i = state.panelIndex; i--; ) {
          if (getters.panels[i].tabs && getters.panels[i].tabs.length) {
            state.panelIndex = i
            break
          }
        }
      }
    }
    state.lastPanelIndex = state.panelIndex

    if (state.activateLastTabOnPanelSwitching) {
      dispatch('activateLastActiveTabOf', state.panelIndex)
    }

    if (state.panelMenuOpened) EventBus.$emit('openPanelMenu', state.panelIndex)
    if (state.createNewTabOnEmptyPanel) {
      let panel = getters.panels[state.panelIndex]
      if (panel.tabs && panel.tabs.length === 0) {
        dispatch('createTab', panel.cookieStoreId)
      }
    }

    dispatch('checkContextBindings', getters.panels[state.panelIndex].cookieStoreId)
    dispatch('recalcPanelScroll')
  },

  /**
   * Find active tab panel and switch to it.
   */
  goToActiveTabPanel({ getters, dispatch }) {
    let i = Utils.getPanelIndex(getters.panels)
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

  turnOnProxy() {
    if (!browser.proxy.onRequest.hasListener(ReqHandler)) {
      browser.proxy.onRequest.addListener(ReqHandler, { urls: ['<all_urls>'] })
    }
  },

  turnOffProxy() {
    if (browser.proxy.onRequest.hasListener(ReqHandler)) {
      browser.proxy.onRequest.removeListener(ReqHandler)
    }
  },
}
