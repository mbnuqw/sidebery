/**
 * Handle click on browser-action button
 */
function initToolbarButton() {
  browser.browserAction.onClicked.addListener(async () => {
    browser.sidebarAction.open()
  })

  browser.menus.create({
    id: 'open_settings',
    title: 'Open settings',
    onclick: () => browser.runtime.openOptionsPage(),
    contexts: ['browser_action']
  })
}

/**
 * Load permissions
 */
async function loadPermissions() {
  this.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
  this.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

  if (!this.permAllUrls) {
    for (let c of Object.values(this.containers)) {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.includeHostsActive) c.includeHostsActive = false
      if (c.excludeHostsActive) c.excludeHostsActive = false
    }
  }
}

export default {
  initToolbarButton,
  loadPermissions,
}