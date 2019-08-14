import Vue from 'vue'
import Logs from '../../logs'

/**
 * Load cached favicons
 */
async function loadFavicons() {
  let { favicons, favUrls } = await browser.storage.local.get({
    favicons: [],
    favUrls: {},
  })

  this.state.favicons = favicons
  this.state.favUrls = favUrls
  Logs.push('[INFO] Favicons loaded')
}

/**
 * Store favicon to global state and
 * save to localstorage
 */
function setFavicon(url, icon) {
  if (!url || !icon) return

  // Do not cache favicon if it too big
  if (icon.length > 123456) return

  let index = this.state.favicons.indexOf(icon)
  let alreadyCached = index > -1 && this.state.favUrls[url] !== undefined

  if (index === -1) index = this.state.favicons.indexOf(null)
  if (index === -1) index = this.state.favicons.push(icon) - 1
  if (index > -1) Vue.set(this.state.favUrls, url, index)

  if (this.state.private || alreadyCached || !this.state.bg || this.state.bg.error) return
  this.state.bg.postMessage({
    action: 'saveFavicon',
    args: [url, icon],
  })
}

export default {
  loadFavicons,
  setFavicon,
}