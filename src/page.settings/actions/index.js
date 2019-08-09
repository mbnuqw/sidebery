// import Utils from '../libs/utils'
import Logs from '../../logs'
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
async function loadPermissions() {
  this.state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
  this.state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

  if (!this.state.permTabHide) {
    this.state.hideInact = false
    this.state.hideFoldedTabs = false
    Actions.saveSettings()
  }

  Logs.push('[INFO] Permissions loaded')
}

/**
 * Check url hash and update active view
 */
function updateActiveView() {
  const hash = location.hash ? location.hash.slice(1) : location.hash

  if (hash === 'all-urls') {
    document.title = 'Sidebery / Settings'
    this.state.activeView = 'Settings'
    this.state.highlight.allUrls = true
    this.state.highlight.tabHide = false
    return
  }

  if (hash === 'tab-hide') {
    document.title = 'Sidebery / Settings'
    this.state.activeView = 'Settings'
    this.state.highlight.allUrls = false
    this.state.highlight.tabHide = true
    return
  }

  if (hash === 'menu-editor') {
    document.title = 'Sidebery / Menu Editor'
    this.state.activeView = 'MenuEditor'
    this.state.highlight.allUrls = false
    this.state.highlight.tabHide = false
    return
  }

  if (hash === 'debug') {
    document.title = 'Sidebery / Debug'
    this.state.activeView = 'Debug'
    this.state.highlight.allUrls = false
    this.state.highlight.tabHide = false
    return
  }

  if (hash === 'styles-editor') {
    document.title = 'Sidebery / Styles Editor'
    this.state.activeView = 'StylesEditor'
    this.state.highlight.allUrls = false
    this.state.highlight.tabHide = false
    return
  }

  if (hash === 'snapshots') {
    document.title = 'Sidebery / Snapshots'
    this.state.activeView = 'Snapshots'
    this.state.highlight.allUrls = false
    this.state.highlight.tabHide = false
    return
  }

  document.title = 'Sidebery / Settings'
  this.state.activeView = 'Settings'
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
}

// Inject vuex getters and state in actions
for (let action in Actions) {
  if (!Actions.hasOwnProperty(action)) continue

  Actions[action] = Actions[action].bind({ getters: Store.getters, state: State })
}

export default Actions
