import Logs from '../../libs/logs'
import KeybindingsActions from '../../actions/keybindings'
import EventBus from '../../event-bus'
import SettingsActions from './settings'
import FaviconsActions from './favicons'
import PanelsActions from './panels'
import TabsActions from './tabs'
import BookmarksActions from './bookmarks'
import SnapshotsActions from './snapshots'
import StylesActions from './styles'
import CtxMenuActions from './menu'

/**
 * Show windows choosing panel
 */
async function chooseWin(state) {
  state.winChoosing = []
  state.panelIndex = -5
  let wins = await browser.windows.getAll({ populate: true })
  wins = wins.filter(w => !w.focused)

  return new Promise(res => {
    wins = wins.map(async w => {
      let tab = w.tabs.find(t => t.active)
      if (!tab) return
      if (w.focused) return
      let screen = await browser.tabs.captureTab(tab.id)
      return {
        id: w.id,
        title: w.title,
        screen,
        choose: () => {
          state.winChoosing = null
          state.panelIndex = state.lastPanelIndex
          res(w.id)
        },
      }
    })

    Promise.all(wins).then(wins => {
      state.winChoosing = wins
    })
  })
}

/**
 * Retrieve current permissions
 */
async function loadPermissions(state) {
  state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
  state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

  if (!state.permAllUrls) {
    state.proxiedPanels = {}
    state.panels.map(c => {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.includeHostsActive) c.includeHostsActive = false
      if (c.excludeHostsActive) c.excludeHostsActive = false
    })
    PanelsActions.savePanels(state)
  }

  if (!state.permTabHide) {
    state.hideInact = false
    state.hideFoldedTabs = false
  }

  Logs.push('[INFO] Permissions loaded')
}

/**
 * Get all windows and check which current
 */
async function getAllWindows() {
  return Promise.all([browser.windows.getCurrent(), browser.windows.getAll()]).then(
    ([current, all]) => {
      return all.map(w => {
        if (w.id === current.id) w.current = true
        return w
      })
    }
  )
}

/**
 * Undo remove tab
 */
async function undoRmTab() {
  let closed = await browser.sessions.getRecentlyClosed()
  if (closed && closed.length) {
    const tab = closed.find(c => c.tab)
    if (tab) await browser.sessions.restore(tab.sessionId)
  }
}

/**
 * Reset selection.
 */
function resetSelection(state) {
  if (state.selected.length > 0) {
    state.selected = []
    EventBus.$emit('deselectTab')
    EventBus.$emit('deselectBookmark')
  }
}

export default {
  ...SettingsActions,
  ...KeybindingsActions,
  ...FaviconsActions,
  ...PanelsActions,
  ...TabsActions,
  ...BookmarksActions,
  ...SnapshotsActions,
  ...StylesActions,
  ...CtxMenuActions,

  chooseWin,
  loadPermissions,
  getAllWindows,
  undoRmTab,
  resetSelection,
}