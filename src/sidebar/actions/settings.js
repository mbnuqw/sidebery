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
    if (!state.settingsLoaded || !state.windowFocused) return
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
   * Update settings
   */
  updateSettings({ state }, settings) {
    if (!settings) return

    for (let k in settings) {
      if (!settings.hasOwnProperty(k)) continue
      if (settings[k] !== undefined) state[k] = settings[k]
    }
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

  /**
   * Provide debug data
   */
  getDbgInfo({ state, getters }) {
    const settings = {}
    for (let sKey in DEFAULT_SETTINGS) {
      if (!DEFAULT_SETTINGS.hasOwnProperty(sKey)) continue
      settings[sKey] = state[sKey]
    }

    const panels = []
    for (let panel of getters.panels) {
      // Get sanitized clone
      const panelClone = JSON.parse(JSON.stringify(panel))

      if (panelClone.tabs) panelClone.tabs = panelClone.tabs.length
      delete panelClone.name
      delete panelClone.iconUrl
      delete panelClone.includeHosts
      delete panelClone.excludeHosts
      delete panelClone.proxy
      panels.push(panelClone)
    }

    const tabs = []
    for (let tab of state.tabs) {
      // Get sanitized clone
      const tabClone = JSON.parse(JSON.stringify(tab))

      delete tabClone.title
      delete tabClone.host
      delete tabClone.width
      delete tabClone.height
      delete tabClone.lastAccessed
      tabClone.muted = tabClone.mutedInfo.muted
      delete tabClone.mutedInfo
      tabClone.url = tabClone.url.slice(0, 5) + '...'
      if (tabClone.favIconUrl && tabClone.favIconUrl.length > 5) {
        tabClone.favIconUrl = tabClone.favIconUrl.slice(0, 5) + '...'
      }
      tabs.push(tabClone)
    }

    return { settings, panels, tabs }
  },
}
