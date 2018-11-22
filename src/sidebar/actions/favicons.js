import Logs from '../../libs/logs'

export default {
  /**
   * Load cached favicons
   */
  async loadFavicons({ state }) {
    let ans = await browser.storage.local.get('favicons')
    if (!ans.favicons) return
    state.favicons = ans.favicons
  },

  /**
   * Store favicon to global state and
   * save to localstorage
   */
  async setFavicon({ state }, { hostname, icon }) {
    if (!hostname) return
    Logs.D(`Set favicon for '${hostname}'`)
    state.favicons[hostname] = icon

    // Do not cache favicon if it too big
    if (icon.length > 100000) return

    // Do not cache favicon in private mode
    if (state.private) return

    let favs = {...state.favicons}
    try {
      await browser.storage.local.set({ favicons: favs })
    } catch (err) {
      Logs.D(`Cannot cache favicon for '${hostname}'`, err)
    }
  },

  /**
   * Remove (all|unneeded) cached favicons
   */
  async clearFaviCache({ state }, { all } = {}) {
    const hosts = []
    for (let t of state.tabs) {
      let hn = t.url.split('/')[2]
      if (!hn) continue
      if (!hosts.includes(hn)) hosts.push(hn)
    }

    // Remove all favs
    if (all) {
      state.favicons = {}
      await browser.storage.local.set({ favicons: '{}' })
      return
    }

    const hWalk = nodes => {
      for (let n of nodes) {
        if (n.url) {
          let hn = n.url.split('/')[2]
          if (!hn) continue
          if (!hosts.includes(hn)) hosts.push(hn)
        }
        if (n.children) hWalk(n.children)
      }
    }
    hWalk(state.bookmarks)

    for (const hn in state.favicons) {
      if (!state.favicons.hasOwnProperty(hn)) continue
      if (hosts.includes(hn)) continue
      delete state.favicons[hn]
    }

    let favs = {...state.favicons}
    await browser.storage.local.set({ favicons: favs })
    state.favicons = favs
  },
}
