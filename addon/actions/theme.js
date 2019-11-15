const xmlSerializer = new XMLSerializer()

function updateIcons() {
  let colors = this.ffTheme.colors
  let color = '#b4b4b4'
  if (colors) color =
    colors.toolbar_field_text ||
    colors.tab_background_text ||
    '#b4b4b4'

  // Proxy page action icon
  let s = xmlSerializer.serializeToString(document.getElementById('icon_proxy'))
  s = '<svg fill="' + color + '" ' + s.slice(5)
  this.images.proxyIcon = 'data:image/svg+xml;base64,' + window.btoa(s)

  for (let win of Object.values(this.windows)) {
    if (!win || !win.tabs) continue
    for (let tab of win.tabs) {
      if (!tab) return
      if (this.proxies[tab.cookieStoreId]) {
        tab.proxified = true
        this.actions.showProxyBadge(tab.id)
      }
    }
  }
}
function updateIconsDebounced(delay = 500) {
  if (this._updateIconsTimeout) clearTimeout(this._updateIconsTimeout)
  this._updateIconsTimeout = setTimeout(() => this.actions.updateIcons(), delay)
}

async function loadFirefoxTheme() {
  this.ffTheme = await browser.theme.getCurrent()
  this.actions.updateIcons()
}

function onFirefoxThemeUpdated(info) {
  this.ffTheme = info.theme
  this.actions.updateIconsDebounced()
}

function setupFirefoxThemeListeners() {
  browser.theme.onUpdated.addListener(this.actions.onFirefoxThemeUpdated)
}

export default {
  updateIcons,
  updateIconsDebounced,

  loadFirefoxTheme,
  onFirefoxThemeUpdated,
  setupFirefoxThemeListeners,
}