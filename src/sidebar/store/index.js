import State from './state'

Vue.use(Vuex)

const store = new Vuex.Store({
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

export const getters = store.getters
export default store
