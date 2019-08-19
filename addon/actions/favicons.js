import Actions from '../actions.js'

let faviconsSaveTimeout
let faviconsToSave = []

/**
 * Load favicons
 */
async function loadFavicons() {
  let { favicons, favUrls } = await browser.storage.local.get({
    favicons: [],
    favUrls: {}
  })
  this.favicons = favicons
  this.favUrls = favUrls
}

/**
 * Save favicon
 */
function saveFavicon(url, icon) {
  faviconsToSave.push([url, icon])

  if (faviconsSaveTimeout) clearTimeout(faviconsSaveTimeout)
  faviconsSaveTimeout = setTimeout(async () => {
    faviconsSaveTimeout = null

    for (let [url, fav] of faviconsToSave) {
      let index = this.favicons.indexOf(fav)
      if (index === -1) index = this.favicons.indexOf(null)
      if (index === -1) index = this.favicons.push(icon) - 1

      if (index > -1) {
        this.favicons[index] = icon
        this.favUrls[url] = index
      }
    }

    browser.storage.local.set({ favicons: this.favicons, favUrls: this.favUrls })

    faviconsToSave = []
  }, 1000)
}

/**
 * Remove (all|unneeded) cached favicons
 */
async function clearFaviCache(all) {
  // Remove all favs
  if (all) {
    await browser.storage.local.set({ favicons: [], favUrls: {} })
    this.favicons = []
    this.favUrls = {}
    return
  }

  let { favicons, favUrls } = await browser.storage.local.get({
    favicons: [],
    favUrls: {}
  })

  let urls = []

  for (let tabId in this.tabsMap) {
    if (!this.tabsMap.hasOwnProperty(tabId)) continue
    urls.push(this.tabsMap[tabId].url)
  }

  let bookmarksRoot = await browser.bookmarks.getTree()
  const hWalk = nodes => {
    for (let n of nodes) {
      if (n.url) urls.push(n.url)
      if (n.children) hWalk(n.children)
    }
  }
  hWalk(bookmarksRoot[0].children)

  // Removes links (url - faviconIndex)
  for (let url in favUrls) {
    if (!favUrls.hasOwnProperty(url)) continue
    if (urls.includes(url)) continue
    delete favUrls[url]
  }

  // Remove favicons
  let indexesInUse = Object.values(favUrls)
  for (let i = 0; i < favicons.length; i++) {
    if (indexesInUse.includes(i)) continue
    favicons[i] = null
  }

  this.favicons = favicons
  this.favUrls = favUrls
  await browser.storage.local.set({ favicons, favUrls })
}

/**
 * Try to remove unused favicons.
 */
async function clearFaviCacheAfter(timeSec) {
  const now = ~~(Date.now() / 1000)

  let ans = await browser.storage.local.get('favAutoCleanTime')
  if (!ans.favAutoCleanTime) {
    await browser.storage.local.set({ favAutoCleanTime: now })
    return
  }

  if (ans.favAutoCleanTime < now - timeSec) {
    await Actions.clearFaviCache()
    await browser.storage.local.set({ favAutoCleanTime: now })
  }
}

export default {
  loadFavicons,
  saveFavicon,
  clearFaviCache,
  clearFaviCacheAfter,
}