import Vue from 'vue'
import { mapGetters } from 'vuex'
import Sidebar from './sidebar.vue'
import Utils from '../libs/utils'
import Logs from '../libs/logs'
import Dict from '../mixins/dict'
import Store from './store'
import State from './store.state'
import Getters from './store.getters'
import DEFAULT_SETTINGS from './settings'

Vue.mixin(Dict)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    Sidebar,
  },

  data() {
    return {}
  },

  computed: {
    ...mapGetters(['fontSize', 'defaultCtxId']),

    themeClass() {
      return '-' + State.theme
    },

    animateClass() {
      if (State.animations) return '-animate'
      else return '-no-animate'
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

    await Store.dispatch('loadSettings')
    await Store.dispatch('loadState')
    await Store.dispatch('loadKebindings')
    await Store.dispatch('loadFavicons')
    await Store.dispatch('loadLocalID')
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

    /**
     * Find active tab panel and switch to it.
     */
    goToActiveTabPanel() {
      if (!this.$refs.sidebar) return
      let t = State.tabs.find(t => t.active)
      if (!t) return
      let i = this.$refs.sidebar.getPanelIndex(t.id)
      this.$refs.sidebar.switchToPanel(i)
    },

    /**
     * Copy to clipboard current state
     */
    copyDebugInfo() {
      if (!this.$refs.sidebar) return
      let AllTabs = State.tabs.map(t => {
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
     * Get default panel
     */
    getDefaultPanel() {
      return this.$refs.sidebar.panels.find(p => p.cookieStoreId === this.defaultCtxId)
    },

    /**
     * Get panel by id
     */
    getPanel(id = 'firefox-default') {
      return this.$refs.sidebar.panels.find(p => p.cookieStoreId === id)
    },

    /**
     * Load sync panels state
     */
    async loadPanels() {
      let ans = await browser.storage.sync.get()
      Object.keys(ans).filter(id => id !== State.localID)

      let ids = Object.keys(ans).filter(id => id !== State.localID)
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
      State.lastSyncPanels = syncData
      this.updatePanels(syncData)
    },

    /**
     * ReSync panels from last loaded state
     */
    async resyncPanels() {
      if (State.lastSyncPanels) this.updatePanels(State.lastSyncPanels)
    },

    /**
     * Sync panels
     */
    async savePanels() {
      if (!this.$refs.sidebar) return
      if (State.private) return

      if (this.savePanelsTimeout) clearTimeout(this.savePanelsTimeout)
      this.savePanelsTimeout = setTimeout(() => {

        const syncPanels = []
        State.syncPanels.map(pid => {
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
        browser.storage.sync.set({ [State.localID]: JSON.stringify(syncPanelsData) })
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
        if (locPanel.pinned && State.syncPanels.indexOf('pinned') !== -1) {
          if (!syncPanel.urls) return
          syncPanel.urls.map(syncUrl => {
            if (locPanel.tabs.find(t => t.url === syncUrl)) return

            browser.tabs.create({
              windowId: State.windowId,
              pinned: true,
              url: syncUrl,
              active: false,
            })
          })

          // Reset last sync panel data
          State.lastSyncPanels.panels[i] = null
          return
        }

        // If sync is off
        if (!State.syncPanels.find(pid => pid === locPanel.cookieStoreId)) return

        // Reset last sync panel data
        State.lastSyncPanels.panels[i] = null

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
  },
})
