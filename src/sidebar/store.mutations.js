import Logs from '../libs/logs'
import { DEFAULT_SETTINGS } from './settings'

export default {
  // --------------------------------
  // --- --- --- Settings --- --- ---
  // --------------------------------
  /**
   * Set setting value
   */
  setSetting(state, keyVal) {
    if (!DEFAULT_SETTINGS.hasOwnProperty(keyVal.key)) return
    state[keyVal.key] = keyVal.val
  },

  /**
   * Reset settings to defaults
   * and store them to local storage
   */
  resetSettings(state) {
    for (const key in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
      if (state[key] == null || state[key] == undefined) continue
      state[key] = DEFAULT_SETTINGS[key]
    }
  },

  /**
   * Open settings panel.
   */
  openSettings(state) {
    if (state.settingsOpened) return
    state.lastPanelIndex = state.panelIndex
    state.panelIndex = -2
    state.settingsOpened = true
  },

  /**
   * Close settings panel and return to last one.
   */
  closeSettings(state) {
    if (!state.settingsOpened) return
    state.settingsOpened = false
    state.panelIndex = state.lastPanelIndex
  },

  //
  /**
   * Set panel index
   */
  setPanel(state, newIndex) {
    state.panelIndex = newIndex
    if (newIndex >= 0) state.lastPanelIndex = newIndex
  },

  // ------------------------------------
  // --- --- --- Context Menu --- --- ---
  // ------------------------------------
  /**
   * Close context menu
   */
  closeCtxMenu(state) {
    if (state.ctxMenu) {
      Logs.D('Close context menu')
      if (state.ctxMenu.off) state.ctxMenu.off()
      state.ctxMenu = null
    }
  },
}