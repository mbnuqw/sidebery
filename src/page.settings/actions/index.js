import Utils from '../../utils'
import { DEFAULT_PANELS } from '../../defaults'
import Store from '../store'
import State from '../store/state'
import MenuActions from './menu'
import KeybindingsActions from './keybindings'
import SettingsActions from './settings'
import StylesActions from './styles'

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

  if (!this.state.permAllUrls) {
    this.state.panels.map(c => {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.includeHostsActive) c.includeHostsActive = false
      if (c.excludeHostsActive) c.excludeHostsActive = false
    })
    if (!init) this.actions.savePanels()
  }

  if (!this.state.permTabHide) {
    this.state.hideInact = false
    this.state.hideFoldedTabs = false
    if (!init) Actions.saveSettings()
  }
}

/**
 * Check url hash and update active view
 */
function updateActiveView() {
  let hash = location.hash ? location.hash.slice(1) : location.hash
  let hashArg = hash.split('.')
  hash = hashArg[0]
  let arg = hashArg[1]
  let scrollHighlightConf = { behavior: 'smooth', block: 'center' }
  let scrollSectionConf = { behavior: 'smooth', block: 'start' }

  if (hash === 'all-urls') {
    setTimeout(() => {
      if (hash !== undefined && this.state.settingsRefs) {
        let el = this.state.settingsRefs.all_urls
        if (el) el.scrollIntoView(scrollHighlightConf)
      }
    }, 250)
    
    document.title = 'Sidebery / Settings'
    this.state.activeView = 'Settings'
    this.state.highlightedField = 'all_urls'
    return
  }

  if (hash === 'tab-hide') {
    setTimeout(() => {
      if (hash !== undefined && this.state.settingsRefs) {
        let el = this.state.settingsRefs.tab_hide
        if (el) el.scrollIntoView(scrollHighlightConf)
      }
    }, 250)

    document.title = 'Sidebery / Settings'
    this.state.activeView = 'Settings'
    this.state.highlightedField = 'tab_hide'
    return
  }

  if (this.__navLockTimeout) clearTimeout(this.__navLockTimeout)
  this.state.navLock = true
  this.state.activeSection = hash
  this.__navLockTimeout = setTimeout(() => {
    this.state.navLock = false
  }, 1250)

  if (hash.startsWith('menu_editor')) {
    setTimeout(() => {
      if (hash !== undefined && this.state.menuEditorRefs) {
        let el = this.state.menuEditorRefs[hash]
        if (el) el.scrollIntoView(scrollSectionConf)
      }
    }, this.state.activeView === 'MenuEditor' ? 0 : 250)

    document.title = 'Sidebery / Menu Editor'
    this.state.activeView = 'MenuEditor'
    // this.state.activeSection = 'menu_editor_tabs'
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

  setTimeout(() => {
    if (hash !== undefined && this.state.settingsRefs) {
      let el = this.state.settingsRefs[hash]
      if (el) el.scrollIntoView(scrollSectionConf)
    }

    if (arg && hash === 'settings_panels') {
      setTimeout(() => {
        let panel = this.state.panels.find(p => p.cookieStoreId === arg)
        if (panel) this.state.selectedPanel = panel
      }, 120)
    }
  }, this.state.activeView === 'Settings' ? 0 : 250)

  document.title = 'Sidebery / Settings'
  this.state.activeView = 'Settings'
}

/**
 * Load panels
 */
async function loadPanels() {
  let ans = await browser.storage.local.get({
    panels: Utils.cloneArray(DEFAULT_PANELS)
  })

  if (ans && ans.panels) {
    this.state.panels = ans.panels
  }
}

/**
 * Clean up panels info and run savePanels action in background
 */
async function savePanels() {
  const output = []
  for (let panel of this.state.panels) {
    output.push({
      cookieStoreId: panel.cookieStoreId,
      color: panel.color,
      icon: panel.icon,
      name: panel.name,

      type: panel.type,
      panel: panel.panel,
      lockedTabs: panel.lockedTabs,
      lockedPanel: panel.lockedPanel,
      proxy: panel.proxy,
      proxified: panel.proxified,
      noEmpty: panel.noEmpty,
      includeHostsActive: panel.includeHostsActive,
      includeHosts: panel.includeHosts,
      excludeHostsActive: panel.excludeHostsActive,
      excludeHosts: panel.excludeHosts,
      private: panel.private,
      bookmarks: panel.bookmarks,
    })
  }
  const cleaned = JSON.parse(JSON.stringify(output))
  browser.runtime.sendMessage({
    instanceType: 'bg',
    action: 'savePanels',
    arg: cleaned
  })
}
function savePanelsDebounced() {
  if (this._savePanelsTimeout) clearTimeout(this._savePanelsTimeout)
  this._savePanelsTimeout = setTimeout(() => Actions.savePanels(), 500)
}

async function movePanel(id, step) {
  let index
  if (id === 'bookmarks') index = this.state.panels.findIndex(p => p.bookmarks)
  else index = this.state.panels.findIndex(p => p.cookieStoreId === id)

  if (index === -1) return
  if (index + step < 0) return
  if (index + step >= this.state.panels.length) return

  let panel = this.state.panels.splice(index, 1)[0]
  this.state.panels.splice(index + step, 0, panel)
  this.state.panelIndex = index + step
  for (let i = 0; i < this.state.panels.length; i++) {
    this.state.panels[i].index = i
  }

  Actions.savePanels()

  let windows = await browser.windows.getAll()
  for (let window of windows) {
    browser.runtime.sendMessage({
      instanceType: 'sidebar',
      windowId: window.id,
      action: 'loadTabs'
    })
  }
}

const Actions = {
  ...SettingsActions,
  ...KeybindingsActions,
  ...MenuActions,
  ...StylesActions,

  loadCurrentWindowInfo,
  loadPlatformInfo,
  loadBrowserInfo,
  loadPermissions,
  updateActiveView,

  loadPanels,
  savePanels,
  savePanelsDebounced,
  movePanel,
}

// Inject vuex getters and state in actions
for (let action of Object.keys(Actions)) {
  Actions[action] = Actions[action].bind({
    getters: Store.getters,
    state: State,
    actions: Actions,
  })
}

export default Actions
