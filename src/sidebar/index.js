import Vue from 'vue'
import { mapGetters } from 'vuex'
import Manifest from '../../addon/manifest.json'
import Sidebar from './sidebar.vue'
import Utils from '../libs/utils'
import Logs from '../libs/logs'
import Dict from '../mixins/dict'
import Store from './store'
import State from './store.state'
import Getters from './store.getters'
import DEFAULT_SETTINGS from './settings'

const DEFAULT_CTX = 'firefox-default'
const PRIVATE_CTX = 'firefox-private'

Vue.mixin(Dict)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    Sidebar,
  },

  data() {
    return {
      localID: '',
      version: Manifest.version,
      osInfo: null,
      os: null,
      ffInfo: null,
      ffVer: null,
      private: browser.extension.inIncognitoContext,
      windowId: 0,
      windowFocused: true,

      // --- Global State
      ctxMenu: null,
      winChoosing: false,
      activePanel: 3,
      syncPanels: [],
      lastSyncPanels: null,

      // --- Cached
      favicons: {},
    }
  },

  computed: {
    ...mapGetters(['fontSize']),

    themeClass() {
      return '-' + State.theme
    },

    animateClass() {
      if (State.animations) return '-animate'
      else return '-no-animate'
    },

    defaultCtx() {
      return State.private ? PRIVATE_CTX : DEFAULT_CTX
    },
  },

  watch: {
    fontSize() {
      this.updateFontSize()
    },
  },

  beforeCreate() {
    browser.windows.getCurrent()
      .then(win => {
        State.private = win.incognito
        State.windowId = win.id
      })

    browser.runtime.getPlatformInfo()
      .then(osInfo => {
        State.osInfo = osInfo
        State.os = osInfo.os
      })

    browser.runtime.getBrowserInfo()
      .then(ffInfo => {
        State.ffInfo = ffInfo
        State.ffVer = parseInt(ffInfo.version.slice(0, 2))
        if (isNaN(State.ffVer)) State.ffVer = 0
      })
  },

  async created() {
    browser.windows.onFocusChanged.addListener(this.onFocusWindow)
    browser.storage.onChanged.addListener(this.onChangeStorage)
    browser.commands.onCommand.addListener(this.onCmd)

    let debounced = Utils.Debounce(() => Store.dispatch('saveState'), 567)
    Store.watch(Getters.activePanel, debounced.func)
    // this.$watch('activePanel', debounced.func)

    await Store.dispatch('loadSettings')
    await Store.dispatch('loadState')
    await Store.dispatch('loadKebindings')
    await Store.dispatch('loadFavicons')
    await this.loadLocalID()
    await this.loadPanels()
  },

  mounted() {
    this.updateFontSize()
  },

  beforeDestroy() {
    browser.windows.onFocusChanged.removeListener(this.onFocusWindow)
    browser.storage.onChanged.removeListener(this.onChangeStorage)
    browser.commands.onCommand.removeListener(this.onCmd)
  },

  methods: {
    /**
     * Set currently focused window
     */
    onFocusWindow(id) {
      this.windowFocused = id === this.windowId
    },

    /**
     * Handle changes of all storages (update current state)
     */
    onChangeStorage(changes, type) {
      if (changes.settings) Store.dispatch('loadSettings')
      if (type === 'sync') {
        let ids = Object.keys(changes).filter(id => id !== this.localID)
        if (!ids.length) return
        let syncData
        ids.map(id => {
          if (!changes[id] || !changes[id].newValue) return
          try {
            let a = JSON.parse(changes[id].newValue)
            if (syncData && syncData.time > a.time) return
            else syncData = a
          } catch (err) {
            // pass
          }
        })
        this.lastSyncPanels = syncData
        this.updatePanels(syncData)
      }
    },

    updateFontSize() {
      const htmlEl = document.documentElement
      if (State.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
      else if (State.fontSize === 's') htmlEl.style.fontSize = '14px'
      else if (State.fontSize === 'm') htmlEl.style.fontSize = '14.5px'
      else if (State.fontSize === 'l') htmlEl.style.fontSize = '15px'
      else if (State.fontSize === 'xl') htmlEl.style.fontSize = '15.5px'
      else if (State.fontSize === 'xxl') htmlEl.style.fontSize = '16px'
      else htmlEl.style.fontSize = '14.5px'
    },

    // --- Favicons cache ---
    // async loadFavicons() {
    //   let ans = await browser.storage.local.get('favicons')
    //   if (!ans.favicons) return
    //   try {
    //     this.favicons = JSON.parse(ans.favicons) || {}
    //   } catch (err) {
    //     this.favicons = {}
    //   }
    // },

    /**
     * Store favicon to global state and
     * save to localstorage
     */
    async setFavicon(hostname, icon) {
      Logs.D(`Set favicon for '${hostname}'`)
      Vue.set(this.favicons, hostname, icon)

      // Do not cache favicon if it too big
      if (icon.length > 100000) return

      // Do not cache favicon in private mode
      if (this.private) return

      let faviStr = JSON.stringify(this.favicons)
      try {
        await browser.storage.local.set({ favicons: faviStr })
      } catch (err) {
        Logs.D(`Cannot cache favicon for '${hostname}'`, err)
      }
    },
    // ---

    /**
     * Find active tab panel and switch to it.
     */
    goToActiveTabPanel() {
      if (!this.$refs.sidebar) return
      let t = this.$refs.sidebar.allTabs.find(t => t.active)
      if (!t) return
      let i = this.$refs.sidebar.getPanelIndex(t.id)
      this.$refs.sidebar.switchToPanel(i)
    },

    /**
     * Copy to clipboard current state
     */
    copyDebugInfo() {
      if (!this.$refs.sidebar) return
      let AllTabs = this.$refs.sidebar.allTabs.map(t => {
        const dbgInfo = { ...t }
        dbgInfo.favIconUrl = t.favIconUrl ? t.favIconUrl.slice(0, 4) : false
        delete dbgInfo.url
        delete dbgInfo.title
        return dbgInfo
      })
      let Panels = this.$refs.sidebar.panels.map(p => {
        let pInfo = { id: p.cookieStoreId }
        if (p.tabs) {
          pInfo.tabs = p.tabs.map(t => `id: ${t.id}, index: ${t.index}`)
          pInfo.tabsCount = p.tabs.length
        }
        pInfo.startIndex = p.startIndex
        pInfo.endIndex = p.endIndex
        return pInfo
      })
      let Settings = {}
      for (const key in DEFAULT_SETTINGS) {
        if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
        if (this[key] == null || this[key] == undefined) continue
        Settings[key] = this[key]
      }
      return JSON.stringify({ AllTabs, Panels, Settings }, null, 2)
    },

    // --- Keybindings ---
    // Commands listeners
    onCmd(name) {
      if (!this.windowFocused) return
      Logs.D(`Run command: ${name}`)
      let funcName = 'cmd_' + name
      if (this[funcName]) this[funcName]()
    },
    cmd_next_panel() {
      if (!this.$refs.sidebar) return
      this.$refs.sidebar.switchToNextPanel()
    },
    cmd_prev_panel() {
      if (!this.$refs.sidebar) return
      this.$refs.sidebar.switchToPrevPanel()
    },
    cmd_new_tab_on_panel() {
      if (!this.$refs.sidebar) return
      let panel = this.$refs.sidebar.panels[this.activePanel]
      if (panel.cookieStoreId) {
        this.$refs.sidebar.createTab(panel.cookieStoreId)
      }
    },
    cmd_rm_tab_on_panel() {
      if (!this.$refs.sidebar) return
      let activeTab = this.$refs.sidebar.allTabs.find(t => t.active)
      this.$refs.sidebar.removeTab(activeTab)
    },
    // ---

    /**
     * Close context menu
     */
    closeCtxMenu() {
      if (this.ctxMenu) {
        Logs.D('Close context menu')
        if (this.ctxMenu.off) this.ctxMenu.off()
        this.ctxMenu = null
      }
    },

    /**
     * Get default panel
     */
    getDefaultPanel() {
      return this.$refs.sidebar.panels.find(p => p.cookieStoreId === this.defaultCtx)
    },

    /**
     * Get panel by id
     */
    getPanel(id = 'firefox-default') {
      return this.$refs.sidebar.panels.find(p => p.cookieStoreId === id)
    },

    /**
     * Show windows choosing panel
     */
    async chooseWin() {
      this.winChoosing = []
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
              this.winChoosing = null
              res(w.id)
            },
          }
        })

        Promise.all(wins).then(wins => {
          this.winChoosing = wins
        })
      })
    },

    /**
     * Load local id or create new
     */
    async loadLocalID() {
      let ans = await browser.storage.local.get('id')
      if (ans.id) {
        this.localID = ans.id
      } else {
        this.localID = Utils.Uid()
        browser.storage.local.set({ id: this.localID })
      }
    },

    /**
     * Load sync panels state
     */
    async loadPanels() {
      let ans = await browser.storage.sync.get()
      Object.keys(ans).filter(id => id !== this.local)

      let ids = Object.keys(ans).filter(id => id !== this.localID)
      if (!ids.length) return
      let syncData
      ids.map(id => {
        if (!ans[id] || !ans[id].newValue) return
        try {
          let a = JSON.parse(ans[id].newValue)
          if (syncData && syncData.time > a.time) return
          else syncData = a
        } catch (err) {
          // it's ok
        }
      })
      if (!syncData) return
      this.lastSyncPanels = syncData
      this.updatePanels(syncData)
    },

    /**
     * ReSync panels from last loaded state
     */
    async resyncPanels() {
      if (this.lastSyncPanels) this.updatePanels(this.lastSyncPanels)
    },

    /**
     * Sync panels
     */
    async savePanels() {
      if (!this.$refs.sidebar) return
      if (this.private) return

      if (this.savePanelsTimeout) clearTimeout(this.savePanelsTimeout)
      this.savePanelsTimeout = setTimeout(() => {

        const syncPanels = []
        this.syncPanels.map(pid => {
          let panel
          if (pid === 'pinned') panel = this.$refs.sidebar.panels.find(p => p.pinned)
          else panel = this.$refs.sidebar.panels.find(p => p.cookieStoreId === pid)
          if (!panel) return
  
          syncPanels.push({
            cookieStoreId: panel.cookieStoreId,
            name: panel.name,
            icon: panel.icon,
            color: panel.color,
            urls: panel.tabs.map(t => t.url),
          })
        })
        const syncPanelsData = {
          time: ~~(Date.now() / 1000),
          panels: syncPanels,
        }
        browser.storage.sync.set({ [this.localID]: JSON.stringify(syncPanelsData) })
      }, 500)
    },

    /**
     * Update current panels state
     */
    updatePanels(synced) {
      if (!this.$refs.sidebar) return

      synced.panels.map((syncPanel, i) => {
        if (!syncPanel) return
        const locPanel = this.$refs.sidebar.panels.find(p => p.name === syncPanel.name)
        if (!locPanel) return

        // Handle pinned tabs
        if (locPanel.pinned && this.syncPanels.indexOf('pinned') !== -1) {
          if (!syncPanel.urls) return
          syncPanel.urls.map(syncUrl => {
            if (locPanel.tabs.find(t => t.url === syncUrl)) return

            browser.tabs.create({
              windowId: this.windowId,
              pinned: true,
              url: syncUrl,
              active: false,
            })
          })

          // Reset last sync panel data
          this.lastSyncPanels.panels[i] = null
          return
        }

        // If sync is off
        if (!this.syncPanels.find(pid => pid === locPanel.cookieStoreId)) return

        // Reset last sync panel data
        this.lastSyncPanels.panels[i] = null

        // Update container
        if (locPanel.color !== syncPanel.color || locPanel.icon !== syncPanel.icon) {
          browser.contextualIdentities.update(locPanel.cookieStoreId, {
            color: syncPanel.color,
            icon: syncPanel.icon,
          })
        }

        // Update tabs
        if (!syncPanel.urls || !locPanel.tabs) return
        syncPanel.urls.map(syncUrl => {
          if (locPanel.tabs.find(t => t.url === syncUrl)) return

          browser.tabs.create({
            windowId: this.windowId,
            cookieStoreId: locPanel.cookieStoreId,
            url: syncUrl,
            active: false,
          })
        })
      })
    },

    /**
     * Reset settings to defaults
     * and store them to local storage
     */
    resetSettings() {
      for (const key in DEFAULT_SETTINGS) {
        if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
        if (this[key] == null || this[key] == undefined) continue
        Vue.set(this, key, DEFAULT_SETTINGS[key])
      }

      this.saveSettings()
    },

    /**
     * Remove all saved favicons
     */
    clearFaviCache() {
      this.favicons = {}
      browser.storage.local.set({ favicons: '{}' })
    },

    /**
     * Clear sync data
     */
    clearSyncData() {
      const syncPanelsData = {
        time: ~~(Date.now() / 1000),
        panels: [],
      }
      browser.storage.sync.set({ [this.localID]: JSON.stringify(syncPanelsData) })
    },
  },
})
