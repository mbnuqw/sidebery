import Vue from 'vue'
import Logs from '../../libs/logs'

let saveFaviconsTimeout

/**
 * Load cached favicons
 */
async function loadFavicons(state) {
  let ans = await browser.storage.local.get('favicons')
  if (!ans.favicons) {
    Logs.push('[WARN] Cannot load favicons')
    return
  }
  state.favicons = ans.favicons
  Logs.push('[INFO] Favicons loaded')
}

/**
 * Store favicon to global state and
 * save to localstorage
 */
function setFavicon(state, hostname, icon) {
  if (!hostname) return
  Vue.set(state.favicons, hostname, icon)

  // Do not cache favicon if it too big
  if (icon.length > 100000) return

  // Do not cache favicon in private mode
  if (state.private) return

  saveFaviconsDebounced(state)
}

/**
 * Save favicons to store
 */
async function saveFaviconsDebounced(state) {
  if (saveFaviconsTimeout) clearTimeout(saveFaviconsTimeout)
  saveFaviconsTimeout = setTimeout(() => {
    browser.storage.local.set({ favicons: { ...state.favicons } })
  }, 500)
}

/**
 * Remove (all|unneeded) cached favicons
 */
async function clearFaviCache(state, all) {
  const hosts = []
  for (let t of state.tabs) {
    let hn = t.url.split('/')[2]
    if (!hn) continue
    if (!hosts.includes(hn)) hosts.push(hn)
  }

  // Remove all favs
  if (all) {
    state.favicons = {}
    await browser.storage.local.set({ favicons: {} })
    return
  }

  // Remove only unused
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

  let favs = { ...state.favicons }
  await browser.storage.local.set({ favicons: favs })
  state.favicons = favs
}

/**
 * Try to remove unused favicons.
 */
async function tryClearFaviCache(state, time) {
  if (!state.windowFocused) return
  const now = ~~(Date.now() / 1000)

  let ans = await browser.storage.local.get('favAutoCleanTime')
  if (!ans.favAutoCleanTime) {
    await browser.storage.local.set({ favAutoCleanTime: now })
    return
  }

  if (ans.favAutoCleanTime < now - time) {
    await clearFaviCache(state)
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