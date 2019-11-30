import Vue from 'vue'
import initNoiseBgDirective from '../directives/noise-bg'
import Debounce from '../directives/debounce'
import Dict from '../mixins/dict'
import Utils from '../utils'
import { initMsgHandling } from '../event-bus'
import { DEFAULT_SETTINGS } from '../defaults'
import { DEFAULT_PANELS_STATE } from '../defaults'
import Store from './store'
import State from './store/state'
import Actions from './actions'
import Settings from './settings.vue'
import MenuEditor from './components/menu-editor.vue'
import StylesEditor from './components/styles-editor.vue'
import Snapshots from './components/snapshots.vue'

Actions.updateActiveView()

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)

const noiseBg = initNoiseBgDirective(State, Store)
Vue.directive('noise', noiseBg)
Vue.directive('debounce', Debounce)

initMsgHandling(State, Actions)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    Settings,
    MenuEditor,
    StylesEditor,
    Snapshots,
  },

  data() {
    return {}
  },

  async created() {
    window.addEventListener('hashchange', Actions.updateActiveView)

    State.instanceType = 'settings'

    let [ storage, ffContainers ] = await Promise.all([
      browser.storage.local.get({
        settings: DEFAULT_SETTINGS,
        containers: {},
        panels: Utils.cloneArray(DEFAULT_PANELS_STATE)
      }),
      browser.contextualIdentities.query({}),
    ])
    let settings = storage.settings
    let containers = storage.containers
    let panels = storage.panels

    Actions.loadCSSVars()
    Actions.loadCurrentWindowInfo()
    Actions.loadPlatformInfo()
    Actions.loadBrowserInfo()
    Actions.loadPermissions(true)
    Actions.loadCtxMenu()
    Actions.loadSettings(settings)
    Actions.loadKeybindings()
    Actions.setupContainers(containers, ffContainers)
    Actions.setupPanels(panels)
  },

  methods: {
    /**
     * Update url hash
     */
    navigateTo(urlHash) {
      location.hash = urlHash
    }
  },
})