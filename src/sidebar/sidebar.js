import Vue from 'vue'
import Manifest from '../../addon/manifest.json'
import Sidebar from './sidebar.vue'
import Utils from '../libs/utils'
import Logs from '../libs/logs'
import Dict from '../mixins/dict'

const DEFAULT_CTX = 'firefox-default'
const PRIVATE_CTX = 'firefox-private'
const DEFAULT_SETTINGS = {
  activateLastTabOnPanelSwitching: true,
  createNewTabOnEmptyPanel: false,
  skipEmptyPanels: false,
  showTabRmBtn: true,
  hScrollThroughPanels: false,
  scrollThroughTabs: 'none',
  tabLongLeftClick: 'none',
  tabLongRightClick: 'none',
  fontSize: 'm',
  theme: 'dark',
  bgNoise: true,
  animations: true,
}

Vue.mixin(Dict)

new Vue({
  el: '#root',

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

      // --- Settings options
      scrollThroughTabsOpts: ['panel', 'global', 'none'],
      tabLongLeftClickOpts: ['close_down', 'reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
      tabLongRightClickOpts: ['close_down', 'reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
      fontSizeOpts: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
      themeOpts: ['dark', 'light'],

      // --- Settings
      settingsLoaded: false,
      activateLastTabOnPanelSwitching: DEFAULT_SETTINGS.activateLastTabOnPanelSwitching,
      createNewTabOnEmptyPanel: DEFAULT_SETTINGS.createNewTabOnEmptyPanel,
      skipEmptyPanels: DEFAULT_SETTINGS.skipEmptyPanels,
      showTabRmBtn: DEFAULT_SETTINGS.showTabRmBtn,
      hScrollThroughPanels: DEFAULT_SETTINGS.hScrollThroughPanels,
      scrollThroughTabs: DEFAULT_SETTINGS.scrollThroughTabs,
      tabLongLeftClick: DEFAULT_SETTINGS.tabLongLeftClick,
      tabLongRightClick: DEFAULT_SETTINGS.tabLongRightClick,
      fontSize: DEFAULT_SETTINGS.fontSize,
      theme: DEFAULT_SETTINGS.theme,
      bgNoise: DEFAULT_SETTINGS.bgNoise,
      animations: DEFAULT_SETTINGS.animations,
      keybindings: [],
      dragTabToPanels: false,

      // --- Cached
      favicons: {},
    }
  },

  computed: {
    themeClass() {
      return '-' + this.theme
    },

    animateClass() {
      if (this.animations) return '-animate'
      else return '-no-animate'
    },

    defaultCtx() {
      return this.private ? PRIVATE_CTX : DEFAULT_CTX
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
        this.private = win.incognito
        this.windowId = win.id
      })

    browser.runtime.getPlatformInfo()
      .then(osInfo => {
        this.osInfo = osInfo
        this.os = osInfo.os
      })

    browser.runtime.getBrowserInfo()
      .then(ffInfo => {
        this.ffInfo = ffInfo
        this.ffVer = parseInt(ffInfo.version.slice(0, 2))
        if (isNaN(this.ffVer)) this.ffVer = 0
      })
  },

  async created() {
    browser.windows.onFocusChanged.addListener(this.onFocusWindow)
    browser.storage.onChanged.addListener(this.onChangeStorage)
    browser.commands.onCommand.addListener(this.onCmd)

    let debounced = Utils.Debounce(() => this.saveState(), 567)
    this.$watch('activePanel', debounced.func)

    await this.loadSettings()
    await this.loadState()
    await this.loadKebindings()
    await this.loadFavicons()
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
      if (changes.settings) this.loadSettings()
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
      if (this.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
      else if (this.fontSize === 's') htmlEl.style.fontSize = '14px'
      else if (this.fontSize === 'm') htmlEl.style.fontSize = '14.5px'
      else if (this.fontSize === 'l') htmlEl.style.fontSize = '15px'
      else if (this.fontSize === 'xl') htmlEl.style.fontSize = '15.5px'
      else if (this.fontSize === 'xxl') htmlEl.style.fontSize = '16px'
      else htmlEl.style.fontSize = '14.5px'
    },

    // --- Settings ---
    /**
     * Try to load settings from local storage.
     */
    async loadSettings() {
      let ans = await browser.storage.local.get('settings')
      let settings = ans.settings
      if (!settings) {
        this.settingsLoaded = true
        return
      }

      for (const key in settings) {
        if (!settings.hasOwnProperty(key)) continue
        if (settings[key] === undefined) continue
        Vue.set(this, key, settings[key])
      }

      this.settingsLoaded = true
    },

    /**
     * Save settings to local storage
     */
    async saveSettings() {
      if (!this.settingsLoaded) return
      await browser.storage.local.set({
        settings: {
          activateLastTabOnPanelSwitching: this.activateLastTabOnPanelSwitching,
          createNewTabOnEmptyPanel: this.createNewTabOnEmptyPanel,
          skipEmptyPanels: this.skipEmptyPanels,
          showTabRmBtn: this.showTabRmBtn,
          hScrollThroughPanels: this.hScrollThroughPanels,
          scrollThroughTabs: this.scrollThroughTabs,
          tabLongLeftClick: this.tabLongLeftClick,
          tabLongRightClick: this.tabLongRightClick,
          fontSize: this.fontSize,
          theme: this.theme,
          bgNoise: this.bgNoise,
          animations: this.animations,
        },
      })
    },
    // ---

    // --- State ---
    async loadState() {
      let ans = await browser.storage.local.get('state')
      let state = ans.state
      if (!state) {
        this.stateLoaded = true
        return
      }

      if (!this.private && state.activePanel !== 2) {
        this.activePanel = state.activePanel
        this.$refs.sidebar.panel = this.activePanel
      }
      if (this.private) {
        this.activePanel = 2
        this.$refs.sidebar.panel = 2
      }
      if (state.syncPanels) {
        this.syncPanels = state.syncPanels
      }

      this.stateLoaded = true
    },

    async saveState() {
      if (!this.stateLoaded) return
      await browser.storage.local.set({
        state: {
          activePanel: this.activePanel,
          syncPanels: this.syncPanels,
        },
      })
    },
    // ---

    // --- Favicons cache ---
    async loadFavicons() {
      let ans = await browser.storage.local.get('favicons')
      if (!ans.favicons) return
      try {
        this.favicons = JSON.parse(ans['favicons']) || {}
      } catch (err) {
        this.favicons = {}
      }
    },

    /**
     * Store favicon to global state and
     * save to localstorage
     */
    async setFavicon(hostname, icon) {
      Logs.D(`Set favicon for '${hostname}'`)
      Vue.set(this.favicons, hostname, icon)

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
      let Settings = {
        settingsLoaded: this.settingsLoaded,
        activateLastTabOnPanelSwitching: this.activateLastTabOnPanelSwitching,
        createNewTabOnEmptyPanel: this.createNewTabOnEmptyPanel,
        skipEmptyPanels: this.skipEmptyPanels,
        showTabRmBtn: this.showTabRmBtn,
        hScrollThroughPanels: this.hScrollThroughPanels,
        scrollThroughTabs: this.scrollThroughTabs,
        tabLongLeftClick: this.tabLongLeftClick,
        tabLongRightClick: this.tabLongRightClick,
        fontSize: this.fontSize,
        theme: this.theme,
        bgNoise: this.bgNoise,
        animations: this.animations,
      }
      return JSON.stringify({ AllTabs, Panels, Settings }, null, 2)
    },

    // --- Keybindings ---
    /**
     * Load keybindings
     */
    async loadKebindings() {
      let commands = await browser.commands.getAll()
      this.keybindings = commands
    },

    /**
     * Update keybindings
     */
    async updateKeybinding(name, shortcut) {
      Logs.D(`Update keybinding: '${name}' to '${shortcut}'`)
      try {
        await browser.commands.update({ name, shortcut })
      } catch (err) {
        Logs.E(`Cannot find command '${name}'`, err)
      }
    },

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

    /**
     * Reset addon's keybindings
     */
    async resetKeybindings() {
      Logs.D('Reset keybindings')
      this.keybindings.map(async k => {
        await browser.commands.reset(k.name)
      })

      setTimeout(() => {
        this.loadKebindings()
      }, 120)
    },
    // ---

    /**
     * Close context menu
     */
    closeCtxMenu() {
      if (this.ctxMenu) {
        Logs.D('Close context menu')
        this.ctxMenu.off()
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
      this.activateLastTabOnPanelSwitching = DEFAULT_SETTINGS.activateLastTabOnPanelSwitching
      this.createNewTabOnEmptyPanel = DEFAULT_SETTINGS.createNewTabOnEmptyPanel
      this.skipEmptyPanels = DEFAULT_SETTINGS.skipEmptyPanels
      this.showTabRmBtn = DEFAULT_SETTINGS.showTabRmBtn
      this.hScrollThroughPanels = DEFAULT_SETTINGS.hScrollThroughPanels
      this.scrollThroughTabs = DEFAULT_SETTINGS.scrollThroughTabs
      this.tabLongLeftClick = DEFAULT_SETTINGS.tabLongLeftClick
      this.tabLongRightClick = DEFAULT_SETTINGS.tabLongRightClick
      this.fontSize = DEFAULT_SETTINGS.fontSize
      this.theme = DEFAULT_SETTINGS.theme
      this.bgNoise = DEFAULT_SETTINGS.bgNoise
      this.animations = DEFAULT_SETTINGS.animations

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
