import EventBus, { initMsgHandling } from '../event-bus'
import Dict from '../mixins/dict'
import { initActionsMixin } from '../mixins/act'
import Store from './store'
import State from './store/state'
import Sidebar from './sidebar.vue'
import Actions, { injectInActions } from './actions'
import Handlers, { injectInHandlers } from './handlers'

const GLOB_CTX = {
  getters: Store.getters,
  state: State,
  actions: Actions,
  handlers: Handlers,
  eventBus: EventBus,
}

injectInActions(GLOB_CTX)
injectInHandlers(GLOB_CTX)

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
    pinnedTabsPosition() {
      if (!Store.getters.pinnedTabs.length) return 'none'
      return State.pinnedTabsPosition
    },
  },

  async created() {
    State.instanceType = 'sidebar'

    Actions.loadPlatformInfo()
    await Promise.all([Actions.loadWindowInfo(), Actions.loadSettings(), Actions.loadContainers()])

    Handlers.setupWindowsListeners()
    Handlers.setupContainersListeners()
    Handlers.setupStorageListeners()
    Handlers.setupResizeHandler()

    if (State.theme !== 'default') Actions.initTheme()
    if (State.sidebarCSS) Actions.loadCustomCSS()

    await Actions.loadPanels()

    if (State.bookmarksPanel) {
      if (State.panels[State.panelIndex].bookmarks) {
        await Actions.loadBookmarks()
      }
      Handlers.setupBookmarksListeners()
    }

    if (State.stateStorage === 'global') {
      await Actions.loadTabsFromGlobalStorage()
    }
    if (State.stateStorage === 'session') {
      await Actions.loadTabsFromSessionStorage()
    }
    Handlers.setupTabsListeners()

    Actions.loadKeybindings()
    Handlers.setupKeybindingListeners()

    Actions.loadCtxMenu(), Actions.loadCSSVars(), Actions.scrollToActiveTab()
    Actions.loadFavicons()
    Actions.loadPermissions(true)
    Actions.updateTabsVisability()
    if (State.stateStorage === 'global') Actions.saveTabsData()

    Actions.connectToBG()
    Actions.updateActiveGroupPage()
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
