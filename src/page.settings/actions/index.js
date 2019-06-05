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

const Actions = {
  ...SettingsActions,
  ...KeybindingsActions,
  ...MenuActions,
  ...StylesActions,

  loadCurrentWindowInfo,
  loadPlatformInfo,
  loadBrowserInfo,
  loadPermissions,
}

// Inject vuex getters and state in actions
for (let action in Actions) {
  if (!Actions.hasOwnProperty(action)) continue

  Actions[action] = Actions[action].bind({ getters: Store.getters, state: State })
}

export default Actions

// import Logs from '../libs/logs'
// import SavedStateActions from './actions/saved-state'
// import SettingsActions from './actions/settings'
// import KeybindingsActions from './actions/keybindings'
// import FaviconsActions from './actions/favicons'
// import PanelsActions from './actions/panels'
// import TabsActions from './actions/tabs'
// import Bookmarks from './actions/bookmarks'
// import Snapshots from './actions/snapshots'
// import Styles from './actions/styles'
// import Themes from './actions/themes'
// import CtxMenuActions from './actions/context-menu'

// export default {
//   ...SavedStateActions,
//   ...SettingsActions,
//   ...KeybindingsActions,
//   ...FaviconsActions,
//   ...PanelsActions,
//   ...TabsActions,
//   ...Bookmarks,
//   ...Snapshots,
//   ...Styles,
//   ...Themes,
//   ...CtxMenuActions,

//   // --- --- --- Misc --- --- ---

//   /**
//    * Show windows choosing panel
//    */
//   async chooseWin({ state }) {
//     state.winChoosing = []
//     state.panelIndex = -5
//     let wins = await browser.windows.getAll({ populate: true })
//     wins = wins.filter(w => !w.focused)

//     return new Promise(res => {
//       wins = wins.map(async w => {
//         let tab = w.tabs.find(t => t.active)
//         if (!tab) return
//         if (w.focused) return
//         let screen = await browser.tabs.captureTab(tab.id)
//         return {
//           id: w.id,
//           title: w.title,
//           screen,
//           choose: () => {
//             state.winChoosing = null
//             state.panelIndex = state.lastPanelIndex
//             res(w.id)
//           },
//         }
//       })

//       Promise.all(wins).then(wins => {
//         state.winChoosing = wins
//       })
//     })
//   },

//   /**
//    * Retrieve current permissions
//    */
//   async loadPermissions({ state, dispatch }) {
//     state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
//     state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

//     if (!state.permAllUrls) {
//       state.proxiedPanels = {}
//       state.containers.map(c => {
//         if (c.proxified) c.proxified = false
//         if (c.proxy) c.proxy.type = 'direct'
//         if (c.includeHostsActive) c.includeHostsActive = false
//         if (c.excludeHostsActive) c.excludeHostsActive = false
//       })
//       dispatch('saveContainers')
//     }

//     if (!state.permTabHide) {
//       state.hideInact = false
//       state.hideFoldedTabs = false
//       dispatch('saveSettings')
//     }

//     Logs.push('[INFO] Permissions loaded')
//   },

//   /**
//    * Get all windows and check which current
//    */
//   async getAllWindows() {
//     return Promise.all([browser.windows.getCurrent(), browser.windows.getAll()]).then(
//       ([current, all]) => {
//         return all.map(w => {
//           if (w.id === current.id) w.current = true
//           return w
//         })
//       }
//     )
//   },

//   /**
//    * Undo remove tab
//    */
//   async undoRmTab() {
//     let closed = await browser.sessions.getRecentlyClosed()
//     if (closed && closed.length) {
//       const tab = closed.find(c => c.tab)
//       if (tab) await browser.sessions.restore(tab.sessionId)
//     }
//   },
// }
