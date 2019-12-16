import initNoiseBgDirective from '../directives/noise-bg'
import Debounce from '../directives/debounce'
import Dict from '../mixins/dict'
import { initMsgHandling } from '../event-bus'
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

    await Promise.all([
      Actions.loadSettings(),
      Actions.loadContainers(),
    ])
    await Actions.loadPanels()

    Actions.loadKeybindings()
    Actions.loadCSSVars()
    Actions.loadCurrentWindowInfo()
    Actions.loadPlatformInfo()
    Actions.loadBrowserInfo()
    Actions.loadPermissions(true)
    Actions.loadCtxMenu()
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