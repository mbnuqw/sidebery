import Logs from '../../libs/logs'

export default {
  /**
   * Load cached favicons
   */
  async loadFavicons({ state }) {
    let ans = await browser.storage.local.get('favicons')
    if (!ans.favicons) return
    try {
      state.favicons = JSON.parse(ans.favicons) || {}
    } catch (err) {
      state.favicons = {}
    }
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

    let faviStr = JSON.stringify(state.favicons)
    try {
      await browser.storage.local.set({ favicons: faviStr })
    } catch (err) {
      Logs.D(`Cannot cache favicon for '${hostname}'`, err)
    }
  },

  /**
   * Remove all saved favicons
   */
  async clearFaviCache({ state }) {
    state.favicons = {}
    await browser.storage.local.set({ favicons: '{}' })
  },
}
