import Vue from 'vue'
import { mapGetters } from 'vuex'
import EventBus, { initMsgHandling } from '../event-bus'
import Dict from '../mixins/dict'
import Utils from '../utils'
import { initActionsMixin } from '../mixins/act'
import { DEFAULT_SETTINGS } from '../defaults'
import { DEFAULT_PANELS_STATE } from '../defaults'
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
    ...mapGetters(['pinnedTabs']),

    pinnedTabsPosition() {
      if (!this.pinnedTabs.length) return 'none'
      return State.pinnedTabsPosition
    },
  },

  async created() {
    State.instanceType = 'sidebar'

    Actions.loadPlatformInfo()
    let [ storage, currentWindow, ffContainers ] = await Promise.all([
      browser.storage.local.get({
        settings: DEFAULT_SETTINGS,
        containers: {},
        panelIndex: 0,
        panels: Utils.cloneArray(DEFAULT_PANELS_STATE)
      }),
      browser.windows.getCurrent(),
      browser.contextualIdentities.query({}),
    ])
    let settings = storage.settings
    let containers = storage.containers
    let panelIndex = storage.panelIndex
    let panels = storage.panels

    Actions.loadWindowInfo(currentWindow),
    Handlers.setupWindowsListeners()

    Actions.loadSettings(settings),

    Actions.setupContainers(containers, ffContainers),
    Handlers.setupContainersListeners()

    Handlers.setupStorageListeners()
    Handlers.setupResizeHandler()

    if (State.theme !== 'default') Actions.initTheme()
    if (State.sidebarCSS) Actions.loadCustomCSS()

    Actions.loadPanelIndex(panelIndex),
    Actions.setupPanels(panels)

    if (State.bookmarksPanel && State.panels[State.panelIndex].bookmarks) {
      await Actions.loadBookmarks()
    }
    Handlers.setupBookmarksListeners()

    if (State.stateStorage === 'global') {
      await Actions.loadTabsFromGlobalStorage()
    }
    if (State.stateStorage === 'session') {
      await Actions.loadTabsFromSessionStorage()
    }
    Handlers.setupTabsListeners()

    Actions.loadKeybindings()
    Handlers.setupKeybindingListeners()

    await Actions.loadCtxMenu()
    await Actions.loadCSSVars()
    Actions.scrollToActiveTab()
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
