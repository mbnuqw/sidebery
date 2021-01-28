import Debounce from '../directives/debounce'
import Dict from '../mixins/dict'
import { initMsgHandling } from '../event-bus'
import SetOption from './mixins/set-option'
import SwitchView from './mixins/switch-view'
import Store from './store'
import State from './store/state'
import Actions from './actions'
import Setup from './setup.vue'

Actions.updateActiveView()

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)
Vue.mixin(SetOption)
Vue.mixin(SwitchView)
Vue.directive('debounce', Debounce)

initMsgHandling(State, Actions)

export default new Vue({
  el: '#app',
  store: Store,

  async created() {
    window.addEventListener('hashchange', Actions.updateActiveView)

    State.instanceType = 'settings'

    await Promise.all([Actions.loadSettings(), Actions.loadContainers(), Actions.loadKeybindings()])
    await Actions.loadPanels()

    if (State.bgNoise) Actions.applyNoiseBg()

    Actions.loadCSSVars()
    Actions.loadCurrentWindowInfo()
    Actions.loadPlatformInfo()
    Actions.loadBrowserInfo()
    Actions.loadPermissions(true)
    Actions.loadCtxMenu()
    Actions.initialized()
    Actions.loadFavicons()
  },

  render: h => h(Setup),
})
