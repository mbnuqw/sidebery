import Vue from 'vue'
import Vuex from 'vuex'
import State from './store.state.js'
import Getters from './store.getters.js'
import Mutations from './store.mutations.js'
import Actions from './store.actions.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: State,
  getters: Getters,
  mutations: Mutations,
  actions: Actions,
})