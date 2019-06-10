import Vue from 'vue'
import initNoiseBgDirective from '../directives/noise-bg'
import Dict from '../mixins/dict'
import { initMsgHandling } from '../event-bus'
import Store from './store'
import State from './store/state'
import Actions from './actions'
import Settings from './settings.vue'

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)

const noiseBg = initNoiseBgDirective(State, Store)
Vue.directive('noise', noiseBg)

initMsgHandling(State, Actions)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    Settings,
  },

  data() {
    return {}
  },

  async created() {
    State.instanceType = 'settings'

    Actions.loadStyles()
    Actions.loadCurrentWindowInfo()
    Actions.loadPlatformInfo()
    Actions.loadBrowserInfo()
    Actions.loadPermissions()
    await Actions.loadSettings()
    if (State.look !== 'none') Actions.initTheme()
    Actions.loadKeybindings()
  },
})