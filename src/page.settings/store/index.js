import Vue from 'vue'
import Vuex from 'vuex'
import State from './state'

Vue.use(Vuex)

export default new Vuex.Store({ state: State })