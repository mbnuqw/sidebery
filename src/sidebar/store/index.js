import Vue from 'vue'
import Vuex from 'vuex'
import State from './state'

Vue.use(Vuex)

export default new Vuex.Store({
  getters: {
    pinnedTabs: state => {
      let pinned = []
      for (let tab of state.tabs) {
        if (!tab.pinned) break
        else pinned.push(tab)
      }
      return pinned
    },
  },

  state: State,
})