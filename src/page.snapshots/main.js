import Vue from 'vue'
import NoiseBg from '../directives/noise-bg'
import Dict from '../mixins/dict'
import Store from '../sidebar/store/store'
import State from '../sidebar/store/state'
import Snapshots from './snapshots.vue'

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)
Vue.directive('noise', NoiseBg)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    Snapshots,
  },

  data() {
    return {}
  },

  computed: {
    themeClass() {
      return '-' + State.theme
    },

    animateClass() {
      if (State.animations) return '-animate'
      else return '-no-animate'
    },
  },

  async created() {
    Store.dispatch('loadStyles')
    browser.storage.onChanged.addListener(this.onChangeStorage)

    browser.windows.getCurrent()
      .then(win => {
        State.private = win.incognito
        State.windowId = win.id
      })

    await Store.dispatch('loadSettings')
    await Store.dispatch('loadState')
    Store.dispatch('loadSnapshots')
  },

  beforeDestroy() {
    browser.storage.onChanged.removeListener(this.onChangeStorage)
  },

  methods: {
    /**
     * Handle changes of all storages (update current state)
     */
    onChangeStorage(changes, type) {
      if (type !== 'local') return

      if (changes.snapshots) {
        State.snapshots = changes.snapshots.newValue
        State.snapshots.reverse()
      }
    },
  },
})