/**
 * Load cached favicons
 */
async function loadFavicons() {
  let { favicons, favUrls } = await browser.storage.local.get({
    favicons: [],
    favUrls: {},
  })

  if (this.state.tabs) {
    for (let tab of this.state.tabs) {
      if (tab.favIconUrl) continue
      if (favicons[favUrls[tab.url]]) tab.favIconUrl = favicons[favUrls[tab.url]]
    }
  }

  this.state.favicons = favicons
  this.state.favUrls = favUrls
}

/**
 * Store favicon to global state and
 * save to localstorage
 */
function setFavicon(url, icon) {
  if (!url || !icon) return
  if (icon.length > 123456) return
  if (url.startsWith('about')) return

  let index = this.state.favicons.indexOf(icon)
  let alreadyCached = index > -1 && this.state.favUrls[url] !== undefined

  if (index === -1) index = this.state.favicons.indexOf(null)
  if (index === -1) index = this.state.favicons.push(icon) - 1
  if (index > -1) Vue.set(this.state.favUrls, url, index)

  if (this.state.private || alreadyCached) return
  if (this.state.bg && !this.state.bg.error) {
    this.state.bg.postMessage({ action: 'saveFavicon', args: [url, icon] })
  } else {
    browser.runtime.sendMessage({
      action: 'saveFavicon',
      instanceType: 'bg',
      args: [url, icon],
    })
  }
}

export default {
  loadFavicons,
  setFavicon,
}
