import Vue from 'vue'
import { mapGetters } from 'vuex'
import EventBus from '../event-bus'
import Sidebar from './sidebar.vue'
import Dict from '../mixins/dict'
import Store from './store'
import State from './store/state'
import Actions from './actions'

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
    ...mapGetters(['defaultCtxId', 'panels', 'pinnedTabs']),

    pinnedTabsPosition() {
      if (!this.pinnedTabs.length) return 'none'
      return State.pinnedTabsPosition
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

    State.instanceType = 'sidebar'

    await Actions.loadSettings(State)
    Actions.initTheme(State)
    if (State.customTheme) Actions.loadCustomCSS(State)

    await Actions.loadPanelIndex(State)
    await Actions.loadPanels(State)

    if (State.bookmarksPanel && State.panelIndex === 0) {
      await Actions.loadBookmarks(State)
    }

    await Actions.loadTabs(State, Store.getters)
    await Actions.loadCtxMenu(State)
    await Actions.loadStyles()
    Actions.scrollToActiveTab(State)
    Actions.loadKeybindings(State)
    Actions.loadFavicons(State)
    Actions.loadPermissions(State)

    // Try to clear unneeded favicons
    Actions.tryClearFaviCache(State, 86400)

    // Hide / show tabs
    Actions.updateTabsVisability(State)

    EventBus.$on('CreateSnapshot', () => Actions.makeSnapshot(State, Store.getters.pinnedTabs))
  },

  mounted() {
    Actions.updateFontSize(State)
    Store.watch(Object.getOwnPropertyDescriptor(State, 'fontSize').get, function() {
      Actions.updateFontSize(State)
    })
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
        if (State.tabsTree) Actions.saveTabsTree(State, 0)
        Actions.savePanelIndex(State)
      }
    },

    /**
     * Handle changes of all storages (update current state)
     */
    onChangeStorage(changes, type) {
      if (type !== 'local') return

      if (changes.settings) {
        Actions.updateSettings(State, changes.settings.newValue)
      }
      if (changes.styles) {
        Actions.applyStyles(changes.styles.newValue)
      }
      if (changes.panels && !State.windowFocused) {
        Actions.updatePanels(State, changes.panels.newValue)
      }
      if (changes.tabsMenu) {
        State.tabsMenu = changes.tabsMenu.newValue
      }
      if (changes.bookmarksMenu) {
        State.bookmarksMenu = changes.bookmarksMenu.newValue
      }
    },

    /**
     * Keybindings handler
     */
    onCmd(name) {
      if (!State.windowFocused) return
      let cmdName = 'kb_' + name
      if (Actions[cmdName]) Actions[cmdName](State)
    },
  },
})
