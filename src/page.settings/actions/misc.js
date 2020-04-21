/**
 * Load current window info
 */
async function loadCurrentWindowInfo() {
  const win = await browser.windows.getCurrent()
  this.state.private = win.incognito
  this.state.windowId = win.id
}

/**
 * Load platform info
 */
async function loadPlatformInfo() {
  const info = await browser.runtime.getPlatformInfo()
  this.state.osInfo = info
  this.state.os = info.os
}

/**
 * Load browser info
 */
async function loadBrowserInfo() {
  const info = await browser.runtime.getBrowserInfo()
  this.state.ffInfo = info
  this.state.ffVer = parseInt(info.version.slice(0, 2))
  if (isNaN(this.state.ffVer)) this.state.ffVer = 0
}

/**
 * Retrieve current permissions
 */
async function loadPermissions(init) {
  this.state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
  this.state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })
  this.state.permClipboardWrite = await browser.permissions.contains({
    permissions: ['clipboardWrite'],
  })
  this.state.permWebRequestBlocking = await browser.permissions.contains({
    permissions: ['webRequest', 'webRequestBlocking'],
  })

  if (!this.state.permAllUrls) {
    for (let c of Object.values(this.state.containers)) {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.includeHostsActive) c.includeHostsActive = false
      if (c.excludeHostsActive) c.excludeHostsActive = false
      if (c.userAgentActive) c.userAgentActive = false
    }
    if (!init) this.actions.saveContainersDebounced()
  }

  if (!this.state.permTabHide) {
    this.state.hideInact = false
    this.state.hideFoldedTabs = false
    if (!init) this.actions.saveSettings()
  }

  if (!this.state.permWebRequestBlocking) {
    for (let c of Object.values(this.state.containers)) {
      if (c.userAgentActive) c.userAgentActive = false
    }
    if (!init) this.actions.saveContainersDebounced()
  }
}

function goToPerm(permId) {
  if (!this.state.permissionsRefs) return
  let scrollHighlightConf = { behavior: 'smooth', block: 'center' }
  let el = this.state.permissionsRefs[permId]
  if (el && el._isVue) el = el.$el

  if (el) el.scrollIntoView(scrollHighlightConf)

  document.title = 'Sidebery / Settings'
  this.state.activeView = 'Settings'
  this.state.highlightedField = permId
}

/**
 * Check url hash and update active view
 */
async function updateActiveView() {
  let hash = location.hash ? location.hash.slice(1) : location.hash
  let hashArg = hash.split('.')
  hash = hashArg[0]
  let arg = hashArg[1]
  let scrollSectionConf = { behavior: 'smooth', block: 'start' }

  if (this.__navLockTimeout) clearTimeout(this.__navLockTimeout)
  this.state.navLock = true
  this.state.activeSection = hash
  this.__navLockTimeout = setTimeout(() => {
    this.state.navLock = false
  }, 1250)

  await this.actions.waitForInit()

  if (hash === 'all-urls') return this.actions.goToPerm('all_urls')
  if (hash === 'tab-hide') return this.actions.goToPerm('tab_hide')
  if (hash === 'clipboard-write') return this.actions.goToPerm('clipboard_write')
  if (hash === 'web-request-blocking') return this.actions.goToPerm('web_request_blocking')

  if (hash.startsWith('menu_editor')) {
    setTimeout(
      () => {
        if (hash !== undefined && this.state.menuEditorRefs) {
          let el = this.state.menuEditorRefs[hash]
          if (el) el.scrollIntoView(scrollSectionConf)
        }
      },
      this.state.activeView === 'MenuEditor' ? 0 : 250
    )

    document.title = 'Sidebery / Menu Editor'
    this.state.activeView = 'MenuEditor'
    this.state.highlightedField = ''
    return
  }

  if (hash.startsWith('styles_editor')) {
    document.title = 'Sidebery / Styles Editor'
    this.state.activeView = 'StylesEditor'
    this.state.activeSection = 'styles_editor'
    this.state.highlightedField = ''
    return
  }

  if (hash.startsWith('snapshots')) {
    document.title = 'Sidebery / Snapshots'
    this.state.activeView = 'Snapshots'
    this.state.activeSection = 'snapshots'
    this.state.highlightedField = ''
    return
  }

  setTimeout(
    () => {
      if (hash !== undefined && this.state.settingsRefs) {
        let el = this.state.settingsRefs[hash]
        if (el && el._isVue) el = el.$el
        if (el) el.scrollIntoView(scrollSectionConf)
      }

      if (arg && hash === 'settings_containers') {
        setTimeout(() => {
          let container = this.state.containers[arg]
          if (container) this.state.selectedContainer = container
        }, 120)
      }

      if (arg && hash === 'settings_panels') {
        setTimeout(() => {
          let panel = this.state.panels.find(p => p.id === arg)
          if (panel) this.state.selectedPanel = panel
        }, 120)
      }
    },
    this.state.activeView === 'Settings' ? 0 : 250
  )

  document.title = 'Sidebery / Settings'
  this.state.activeView = 'Settings'
}

async function waitForInit() {
  return new Promise(res => {
    if (this.state.isReady) res()
    else this.state.readyStateResolve = res
  })
}

function initialized() {
  if (this.state.readyStateResolve) this.state.readyStateResolve()
  this.state.isReady = true
}

export default {
  loadCurrentWindowInfo,
  loadPlatformInfo,
  loadBrowserInfo,
  loadPermissions,
  goToPerm,
  updateActiveView,
  waitForInit,
  initialized,
}
