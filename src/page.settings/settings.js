import Vue from 'vue'
import noiseBg from '../directives/noise-bg'
import Dict from '../mixins/dict'
import Store from './store'
import State from './store/state'
import Actions from './actions'
import Settings from './settings.vue'

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)
Vue.directive('noise', noiseBg)

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
    await Actions.loadSettings()
    // await Actions.loadState()
    // await Actions.loadContainers()
    Actions.loadKeybindings()

    // Store.dispatch('loadKeybindings')
    // Store.dispatch('loadSnapshots')
    // Store.dispatch('loadPermissions')
  },
})