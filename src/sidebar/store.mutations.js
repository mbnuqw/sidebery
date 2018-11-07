import DEFAULT_SETTINGS from './settings.js'

export default {
  /**
   * Save settings to local storage
   */
  setSetting(state, keyVal) {
    state[keyVal.key] = keyVal.val
  },

  // saveSettings(state) {
  //   if (!state.settingsLoaded) return
  //   let settings = {}
  //   for (const key in DEFAULT_SETTINGS) {
  //     if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
  //     if (state[key] == null || state[key] == undefined) continue
  //     settings[key] = state[key]
  //   }
  //   browser.storage.local.set({ settings })
  // },
}