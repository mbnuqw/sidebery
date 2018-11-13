import { DEFAULT_SETTINGS } from '../settings'

export default {
  /**
   * Try to load settings from local storage.
   */
  async loadSettings({ state }) {
    let ans = await browser.storage.local.get('settings')
    let settings = ans.settings
    if (!settings) {
      state.settingsLoaded = true
      return
    }

    for (const key in settings) {
      if (!settings.hasOwnProperty(key)) continue
      if (settings[key] === undefined) continue
      state[key] = settings[key]
    }

    state.settingsLoaded = true
  },

  /**
   * Save settings to local storage
   */
  async saveSettings({ state }) {
    if (!state.settingsLoaded) return
    let settings = {}
    for (const key in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
      if (state[key] == null || state[key] == undefined) continue
      settings[key] = state[key]
    }
    await browser.storage.local.set({ settings })
  },
}
