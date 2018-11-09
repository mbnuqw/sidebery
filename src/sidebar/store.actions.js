import Logs from '../libs/logs'
import Utils from '../libs/utils'
import { DEFAULT_SETTINGS } from './settings.js'

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

  /**
   * Store favicon to global state and
   * save to localstorage
   */
  async setFavicon({ state }, { hostname, icon }) {
    if (!hostname) return
    Logs.D(`Set favicon for '${hostname}'`)
    state.favicons[hostname] = icon

    // Do not cache favicon if it too big
    if (icon.length > 100000) return

    // Do not cache favicon in private mode
    if (state.private) return

    let faviStr = JSON.stringify(state.favicons)
    try {
      await browser.storage.local.set({ favicons: faviStr })
    } catch (err) {
      Logs.D(`Cannot cache favicon for '${hostname}'`, err)
    }
  },

  /**
   * Remove all saved favicons
   */
  async clearFaviCache({ state }) {
    state.favicons = {}
    await browser.storage.local.set({ favicons: '{}' })
  },

  // ----------------------------
  // --- --- --- Sync --- --- ---
  // ----------------------------
  /**
   * Load local id or create new
   */
  async loadLocalID({ state }) {
    let ans = await browser.storage.local.get('id')
    if (ans.id) {
      state.localID = ans.id
    } else {
      state.localID = Utils.Uid()
      browser.storage.local.set({ id: state.localID })
    }
  },

  /**
   * Clear sync data.
   */
  async clearSyncData({ state }) {
    const syncPanelsData = {
      time: ~~(Date.now() / 1000),
      panels: [],
    }
    await browser.storage.sync.set({ [state.localID]: JSON.stringify(syncPanelsData) })
  },

  // ----------------------------
  // --- --- --- Misc --- --- ---
  // ----------------------------
  /**
   * Show windows choosing panel
   */
  async chooseWin({ state }) {
    state.winChoosing = []
    let wins = await browser.windows.getAll({ populate: true })
    wins = wins.filter(w => !w.focused && !w.incognito)

    return new Promise(res => {
      wins = wins.map(async w => {
        let tab = w.tabs.find(t => t.active)
        if (!tab) return
        if (w.focused) return
        let screen = await browser.tabs.captureTab(tab.id)
        return {
          id: w.id,
          title: w.title,
          screen,
          choose: () => {
            state.winChoosing = null
            res(w.id)
          },
        }
      })

      Promise.all(wins).then(wins => {
        state.winChoosing = wins
      })
    })
  },
}