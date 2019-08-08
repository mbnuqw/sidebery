import Vue from 'vue'
import Logs from '../../logs'
import Actions from '../actions'

let saveFaviconsTimeout

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
  if (icon.length > 100000) return

  let index = this.state.favicons.indexOf(icon)
  if (index === -1) index = this.state.favicons.push(icon) - 1
  Vue.set(this.state.favUrls, url, index)

  // Do not cache favicon in private mode
  if (this.state.private) return

  Actions.saveFaviconsDebounced()
}

/**
 * Save favicons to store
 */
async function saveFaviconsDebounced() {
  if (saveFaviconsTimeout) clearTimeout(saveFaviconsTimeout)
  saveFaviconsTimeout = setTimeout(() => {
    browser.storage.local.set({
      favicons: this.state.favicons,
      favUrls: {...this.state.favUrls},
    })
  }, 500)
}

/**
 * Remove (all|unneeded) cached favicons
 */
async function clearFaviCache(all) {
  // Remove all favs
  if (all) {
    this.state.favicons = {}
    await browser.storage.local.set({ favicons: [], favUrls: {} })
    return
  }

  let urls = this.state.tabs.map(t => t.url)

  if (this.state.bookmarksPanel && !this.state.bookmarks.length) {
    await Actions.loadBookmarks()
  }

  // Remove only unused
  const hWalk = nodes => {
    for (let n of nodes) {
      if (n.url) urls.push(n.url)
      if (n.children) hWalk(n.children)
    }
  }
  hWalk(this.state.bookmarks)

  // Removes links (url - faviconIndex)
  for (let url in this.state.favUrls) {
    if (!this.state.favUrls.hasOwnProperty(url)) continue
    if (urls.includes(url)) continue
    delete this.state.favUrls[url]
  }

  // Remove favicons
  let indexesInUse = Object.values(this.state.favUrls)
  for (let i = 0; i < this.state.favicons.length; i++) {
    if (indexesInUse.includes(i)) continue
    this.state.favicons[i] = null
  }

  await browser.storage.local.set({
    favicons: this.state.favicons,
    favUrls: {...this.state.favUrls},
  })
}

/**
 * Try to remove unused favicons.
 */
async function tryClearFaviCache(time) {
  if (!this.state.windowFocused) return
  const now = ~~(Date.now() / 1000)

  let ans = await browser.storage.local.get('favAutoCleanTime')
  if (!ans.favAutoCleanTime) {
    await browser.storage.local.set({ favAutoCleanTime: now })
    return
  }

  if (ans.favAutoCleanTime < now - time) {
    await Actions.clearFaviCache()
    await browser.storage.local.set({ favAutoCleanTime: now })
  }

  Logs.push('[INFO] Favicons cleaned up')
}

export default {
  loadFavicons,
  setFavicon,
  saveFaviconsDebounced,
  clearFaviCache,
  tryClearFaviCache,
}