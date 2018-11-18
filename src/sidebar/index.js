import Vue from 'vue'
import { mapGetters } from 'vuex'
import Sidebar from './components/index.vue'
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
    ...mapGetters(['fontSize', 'defaultCtxId', 'panels']),

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

    const dSavingState = Utils.Debounce(() => Store.dispatch('saveState'), 567)
    Store.watch(Getters.activePanel, dSavingState.func)

    const dMakingSnapshot = Utils.Debounce(() => Store.dispatch('makeSnapshot'), 5000)
    Store.watch(Getters.tabs, dMakingSnapshot.func)

    await Store.dispatch('loadSettings')
    await Store.dispatch('loadState')
    await Store.dispatch('loadKebindings')
    await Store.dispatch('loadFavicons')
    await Store.dispatch('loadLocalID')
    await Store.dispatch('loadSyncPanels')
    await Store.dispatch('loadSnapshots')
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
      this.windowFocused = id === State.windowId
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
        Store.dispatch('updateSyncPanels', syncData)
      }
    },

    /**
     * Keybindings handler
     */
    onCmd(name) {
      if (!State.windowFocused) return
      Logs.D(`Run command: ${name}`)
      let cmdName = 'kb_' + name
      Store.dispatch(cmdName)
    },

    /**
     * Update font size for 'html' tag.
     */
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
      let Panels = this.panels.map(p => {
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
  },
})
