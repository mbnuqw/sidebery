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
  this.permWebRequestBlocking = await browser.permissions.contains({ permissions: ['webRequest', 'webRequestBlocking'] })

  if (!this.permAllUrls) {
    for (let c of Object.values(this.containers)) {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.includeHostsActive) c.includeHostsActive = false
      if (c.excludeHostsActive) c.excludeHostsActive = false
      if (c.userAgentActive) c.userAgentActive = false
    }
  }

  if (!this.permWebRequestBlocking) {
    for (let c of Object.values(this.containers)) {
      if (c.userAgentActive) c.userAgentActive = false
    }
  }
}

export default {
  initToolbarButton,
  loadPermissions,
}