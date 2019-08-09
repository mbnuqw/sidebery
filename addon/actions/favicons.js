import Actions from '../actions.js'

let faviconsSaveTimeout
let faviconsToSave = []

/**
 * Save favicon
 */
function saveFavicon(url, icon) {
  faviconsToSave.push([url, icon])

  if (faviconsSaveTimeout) clearTimeout(faviconsSaveTimeout)
  faviconsSaveTimeout = setTimeout(async () => {
    faviconsSaveTimeout = null

    let { favicons, favUrls } = await browser.storage.local.get({
      favicons: [],
      favUrls: {}
    })

    for (let [url, fav] of faviconsToSave) {
      let index = favicons.indexOf(fav)
      if (index === -1) index = favicons.indexOf(null)
      if (index === -1) favicons.push(icon)
      else favicons.splice(index, 1, icon)

      favUrls[url] = index
    }

    browser.storage.local.set({ favicons, favUrls })

    faviconsToSave = []
  }, 500)
}

/**
 * Remove (all|unneeded) cached favicons
 */
async function clearFaviCache(all) {
  // Remove all favs
  if (all) {
    await browser.storage.local.set({ favicons: [], favUrls: {} })
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

  await browser.storage.local.set({ favicons: favicons, favUrls: favUrls })
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
  saveFavicon,
  clearFaviCache,
  clearFaviCacheAfter,
}