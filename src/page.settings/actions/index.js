// import Utils from '../libs/utils'
import Logs from '../../libs/logs'
import MenuActions from './menu'
import KeybindingsActions from './keybindings'
import SettingsActions from './settings'
import StylesActions from './styles'

/**
 * Load current window info
 */
async function loadCurrentWindowInfo(state) {
  const win = await browser.windows.getCurrent()
  state.private = win.incognito
  state.windowId = win.id
}

/**
 * Load platform info
 */
async function loadPlatformInfo(state) {
  const info = await browser.runtime.getPlatformInfo()
  state.osInfo = info
  state.os = info.os
}

/**
 * Load browser info
 */
async function loadBrowserInfo(state) {
  const info = await browser.runtime.getBrowserInfo()
  state.ffInfo = info
  state.ffVer = parseInt(info.version.slice(0, 2))
  if (isNaN(state.ffVer)) state.ffVer = 0
}

/**
 * Retrieve current permissions
 */
async function loadPermissions(state) {
  state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
  state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

  if (!state.permTabHide) {
    state.hideInact = false
    state.hideFoldedTabs = false
    SettingsActions.saveSettings(state)
  }

  Logs.push('[INFO] Permissions loaded')
}

export default {
  ...SettingsActions,
  ...KeybindingsActions,
  ...MenuActions,
  ...StylesActions,

  loadCurrentWindowInfo,
  loadPlatformInfo,
  loadBrowserInfo,
  loadPermissions,
}

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
