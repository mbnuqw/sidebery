import Vue from 'vue'
import Vuex from 'vuex'
import State from './state'
import Getters from './getters'

Vue.use(Vuex)

export default new Vuex.Store({ state: State, getters: Getters })