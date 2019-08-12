import Vue from 'vue'
import { mapGetters } from 'vuex'
import { initMsgHandling } from '../event-bus'
import Sidebar from './sidebar.vue'
import Dict from '../mixins/dict'
import { initActionsMixin } from '../mixins/act'
import Store from './store'
import State from './store/state'
import Actions from './actions'
import Handlers from './handlers'

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)
Vue.mixin(initActionsMixin(Actions))

initMsgHandling(State, Actions)

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
    ...mapGetters(['pinnedTabs']),

    pinnedTabsPosition() {
      if (!this.pinnedTabs.length) return 'none'
      return State.pinnedTabsPosition
    },
  },

  async created() {
    State.instanceType = 'sidebar'

    Actions.loadPlatformInfo()

    Handlers.setupWindowsListeners()
    Handlers.setupStorageListeners()
    Handlers.setupKeybindingListeners()

    await Actions.loadWindowInfo()
    await Actions.loadSettings()

    if (State.theme !== 'default') Actions.initTheme()
    if (State.sidebarCSS) Actions.loadCustomCSS()

    await Actions.loadPanelIndex()
    await Actions.loadPanels()

    if (State.bookmarksPanel && State.panels[State.panelIndex].bookmarks) {
      await Actions.loadBookmarks()
    }

    await Actions.loadTabs()
    await Actions.loadCtxMenu()
    await Actions.loadCSSVars()
    Actions.scrollToActiveTab()
    Actions.loadKeybindings()
    Actions.loadFavicons()
    Actions.loadPermissions()
    Actions.updateTabsVisability()
    Actions.connectToBG()
    Actions.saveTabsTree()

    Handlers.setupContainersListeners()
    Handlers.setupTabsListeners()
    Handlers.setupBookmarksListeners()
    Handlers.setupResizeHandler()
  },

  mounted() {
    Actions.updateSidebarWidth()
    Actions.updateFontSize()
    Store.watch(Object.getOwnPropertyDescriptor(State, 'fontSize').get, function() {
      Actions.updateFontSize()
    })
  },

  beforeDestroy() {
    Handlers.resetContainersListeners()
    Handlers.resetTabsListeners()
    Handlers.resetBookmarksListeners()
    Handlers.resetWindowsListeners()
    Handlers.resetStorageListeners()
    Handlers.resetKeybindingListeners()
    Handlers.resetResizeHandler()
  },
})
