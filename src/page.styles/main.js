import Vue from 'vue'
import noiseBg from '../directives/noise-bg'
import Debounce from '../directives/debounce'
import Dict from '../mixins/dict'
import Store from '../sidebar/store/store'
import State from '../sidebar/store/state'
import StylesEditor from './styles.vue'

if (!State.tabsMap) State.tabsMap = []
Vue.mixin(Dict)
Vue.directive('noise', noiseBg)
Vue.directive('debounce', Debounce)

export default new Vue({
  el: '#root',
  store: Store,

  components: {
    StylesEditor,
  },

  data() {
    return {}
  },

  async created() {
    Store.dispatch('loadStyles')

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