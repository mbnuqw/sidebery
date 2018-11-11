import Logs from '../../libs/logs'
import EventBus from '../event-bus'

export default {
  /**
   * Load Contextual Identities
   */
  async loadContexts({ state }) {
    state.ctxs = await browser.contextualIdentities.query({})
  },

  /**
   * Switch current active panel by index
   */
  switchToPanel({ state, getters, commit, dispatch }, index) {
    commit('closeSettings')
    commit('closeCtxMenu')
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

    dispatch('recalcPanelScroll')
  },
}
