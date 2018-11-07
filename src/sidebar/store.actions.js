import Logs from '../libs/logs'
import DEFAULT_SETTINGS from './settings.js'

export default {
  // -----------------------------------
  // --- --- --- Saved State --- --- ---
  // -----------------------------------
  /**
   * Try to load saved sidebar state
   */
  async loadState({ state }) {
    let ans = await browser.storage.local.get('state')
    let loadedState = ans.state
    if (!loadedState) {
      state.stateLoaded = true
      return
    }

    if (!state.private && loadedState.activePanel !== 2) {
      state.activePanel = loadedState.activePanel
      // this.$refs.sidebar.panel = this.activePanel
    }
    if (state.private) {
      state.activePanel = 2
      // this.$refs.sidebar.panel = 2
    }
    if (loadedState.syncPanels) {
      state.syncPanels = loadedState.syncPanels
    }

    state.stateLoaded = true
  },


  /**
   * Try to save some state values
   */
  async saveState({ state }) {
    if (!state.stateLoaded) return
    await browser.storage.local.set({
      state: {
        activePanel: state.activePanel,
        syncPanels: state.syncPanels,
      },
    })
  },

  // --------------------------------
  // --- --- --- Settings --- --- ---
  // --------------------------------
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
      // Vue.set(state, key, settings[key])
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

  // -----------------------------------
  // --- --- --- Keybindings --- --- ---
  // -----------------------------------
  /**
   * Load keybindings
   */
  async loadKebindings({ state }) {
    let commands = await browser.commands.getAll()
    state.keybindings = commands
  },

  /**
   * Update keybindings
   */
  async updateKeybinding(_, { name, shortcut }) {
    Logs.D(`Update keybinding: '${name}' to '${shortcut}'`)
    try {
      await browser.commands.update({ name, shortcut })
    } catch (err) {
      Logs.E(`Cannot find command '${name}'`, err)
    }
  },

  /**
   * Reset addon's keybindings
   */
  async resetKeybindings({ state, dispatch }) {
    Logs.D('Reset keybindings')
    state.keybindings.map(async k => {
      await browser.commands.reset(k.name)
    })

    setTimeout(() => {
      dispatch('loadKebindings')
    }, 120)
  },

  // --------------------------------
  // --- --- --- Favicons --- --- ---
  // --------------------------------
  /**
   * Load cached favicons
   */
  async loadFavicons({ state }) {
    let ans = await browser.storage.local.get('favicons')
    if (!ans.favicons) return
    try {
      state.favicons = JSON.parse(ans.favicons) || {}
    } catch (err) {
      state.favicons = {}
    }
  },

  // ----------------------------
  // --- --- --- Misc --- --- ---
  // ----------------------------
}