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
    Actions.loadStyles(State)
    Actions.loadCurrentWindowInfo(State)
    Actions.loadPlatformInfo(State)
    Actions.loadBrowserInfo(State)
    await Actions.loadSettings(State)
    // await Actions.loadState(State)
    // await Actions.loadContainers(State)
    Actions.loadKeybindings(State)

    // Store.dispatch('loadKeybindings')
    // Store.dispatch('loadSnapshots')
    // Store.dispatch('loadPermissions')
  },
})