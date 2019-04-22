import Vue from 'vue'
import NoiseBg from '../directives/noise-bg'
import Dict from '../mixins/dict'
import Store from '../sidebar/store'
import State from '../sidebar/store.state'
import StylesEditor from './styles.vue'

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)
Vue.directive('noise', NoiseBg)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    StylesEditor,
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
    browser.windows.getCurrent()
      .then(win => {
        State.private = win.incognito
        State.windowId = win.id
      })
    
    browser.runtime.getPlatformInfo()
      .then(osInfo => {
        State.osInfo = osInfo
        State.os = osInfo.os
      })

    browser.runtime.getBrowserInfo()
      .then(ffInfo => {
        State.ffInfo = ffInfo
        State.ffVer = parseInt(ffInfo.version.slice(0, 2))
        if (isNaN(State.ffVer)) State.ffVer = 0
      })

    await Store.dispatch('loadSettings')
    await Store.dispatch('loadState')
    await Store.dispatch('loadCtxMenu')
  },
})