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
    // console.log('[DEBUG] SETTINGS ACTION saveSettings');
    if (!state.settingsLoaded) return
    let settings = {}
    for (const key in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
      if (state[key] == null || state[key] == undefined) continue
      if (state[key] instanceof Object) settings[key] = JSON.parse(JSON.stringify(state[key]))
      else settings[key] = state[key]
    }
    await browser.storage.local.set({ settings })
  },

  /**
   * Update font size for 'html' tag.
   */
  updateFontSize({ state }) {
    const htmlEl = document.documentElement
    if (state.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
    else if (state.fontSize === 's') htmlEl.style.fontSize = '14px'
    else if (state.fontSize === 'm') htmlEl.style.fontSize = '14.5px'
    else if (state.fontSize === 'l') htmlEl.style.fontSize = '15px'
    else if (state.fontSize === 'xl') htmlEl.style.fontSize = '15.5px'
    else if (state.fontSize === 'xxl') htmlEl.style.fontSize = '16px'
    else htmlEl.style.fontSize = '14.5px'
  },
}
