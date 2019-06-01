import Vue from 'vue'
import Vuex from 'vuex'
import State from './state'

Vue.use(Vuex)

export default new Vuex.Store({
  getters: {
    pinnedTabs: s => s.tabs.filter(t => t.pinned),
  },

  state: State,
})