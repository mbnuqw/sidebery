import Vue from 'vue'
import { mapGetters } from 'vuex'
import Sidebar from './components/index.vue'
import Dict from '../mixins/dict'
import Store from './store'
import State from './store.state'

if (!State.tabsMap) State.tabsMap = []
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
    ...mapGetters(['fontSize', 'defaultCtxId', 'panels', 'pinnedTabs']),

    nativeScrollbarsClass() {
      return State.nativeScrollbars ? '-native-scroll' : '-custom-scroll'
    },

    themeClass() {
      return '-' + State.theme
    },

    animateClass() {
      if (State.animations) return '-animate'
      else return '-no-animate'
    },

    pinnedPosClass() {
      if (!this.pinnedTabs.length) return '-no-pinned-tabs'
      return '-pinned-tabs-' + State.pinnedTabsPosition
    },

    pinnedViewClass() {
      if (State.pinnedTabsList) return '-pinned-tabs-list'
      else return '-pinned-tabs-grid'
    },

    tabsLvlMarksClass() {
      if (State.tabsLvlDots) return '-tabs-lvl-marks'
      else return ''
    },
  },

  watch: {
    fontSize() {
      Store.dispatch('updateFontSize')
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

    await Store.dispatch('loadSettings')
    await Store.dispatch('loadState')
    await Store.dispatch('loadContainers')

    if (State.bookmarksPanel && State.panelIndex === 0) {
      await Store.dispatch('loadBookmarks')
    }

    await Store.dispatch('loadTabs')
    await Store.dispatch('loadCtxMenu')
    await Store.dispatch('loadLocalID')
    await Store.dispatch('loadStyles')
    Store.dispatch('scrollToActiveTab')
    Store.dispatch('loadKeybindings')
    Store.dispatch('loadSyncPanels')
    Store.dispatch('loadSnapshots')
    Store.dispatch('loadFavicons')
    Store.dispatch('loadPermissions')
    Store.dispatch('updateTabsSuccessors')


    // Try to clear unneeded favicons
    Store.dispatch('tryClearFaviCache', 86400)
  },

  mounted() {
    Store.dispatch('updateFontSize')
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
      State.windowFocused = id === State.windowId
      if (State.windowFocused) {
        if (State.tabsTree) Store.dispatch('saveTabsTree', 0)
        Store.dispatch('savePanelIndex')
      }
    },

    /**
     * Handle changes of all storages (update current state)
     */
    onChangeStorage(changes, type) {
      if (type === 'local' && State.windowFocused) return

      if (changes.settings) {
        Store.dispatch('updateSettings', changes.settings.newValue)
        Store.dispatch('reloadOptPermissions')
      }
      if (changes.styles) Store.dispatch('applyStyles', changes.styles.newValue)
      if (changes.containers) {
        Store.dispatch('updateContainers', changes.containers.newValue)
      }

      if (type === 'sync') {
        let ids = Object.keys(changes).filter(id => id !== this.localID)

        let syncData
        ids.map(id => {
          if (!changes[id] || !changes[id].newValue) return
          let data

          try {
            data = JSON.parse(changes[id].newValue)
          } catch (err) {
            return
          }

          if (syncData && syncData.time > data.time) return
          else syncData = data
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
      let cmdName = 'kb_' + name
      Store.dispatch(cmdName)
    },
  },
})
