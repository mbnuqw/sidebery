import Logs from '../../logs'
import EventBus from '../../event-bus'
import Store from '../store'
import State from '../store/state'
import SettingsActions from './settings'
import KeybindingsActions from './keybindings'
import FaviconsActions from './favicons'
import PanelsActions from './panels'
import TabsActions from './tabs'
import BookmarksActions from './bookmarks'
import StylesActions from './styles'
import CtxMenuActions from './menu'

/**
 * Show window-select panel
 */
async function chooseWin() {
  this.state.winChoosing = []
  this.state.panelIndex = -5
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
          this.state.winChoosing = null
          this.state.panelIndex = this.state.lastPanelIndex
          res(w.id)
        },
      }
    })

    Promise.all(wins).then(wins => {
      this.state.winChoosing = wins
    })
  })
}

/**
 * Retrieve current permissions
 */
async function loadPermissions() {
  this.state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
  this.state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

  if (!this.state.permAllUrls) {
    this.state.proxiedPanels = {}
    this.state.panels.map(c => {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.includeHostsActive) c.includeHostsActive = false
      if (c.excludeHostsActive) c.excludeHostsActive = false
    })
    Actions.savePanels()
  }

  if (!this.state.permTabHide) {
    this.state.hideInact = false
    this.state.hideFoldedTabs = false
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
function resetSelection() {
  if (this.state.selected.length > 0) {
    this.state.selected = []
    EventBus.$emit('deselectTab')
    EventBus.$emit('deselectBookmark')
  }
}

/**
 * Set 'storageIsLocked' flag to true
 */
function lockStorage() {
  this.state.storageIsLocked = true
}

/**
 * Set 'storageIsLocked' flag to false
 */
function unlockStorage() {
  this.state.storageIsLocked = false
}

const Actions = {
  ...SettingsActions,
  ...KeybindingsActions,
  ...FaviconsActions,
  ...PanelsActions,
  ...TabsActions,
  ...BookmarksActions,
  ...StylesActions,
  ...CtxMenuActions,

  chooseWin,
  loadPermissions,
  getAllWindows,
  undoRmTab,
  resetSelection,
  lockStorage,
  unlockStorage,
}

// Inject vuex getters and state in actions
for (let action in Actions) {
  if (!Actions.hasOwnProperty(action)) continue

  Actions[action] = Actions[action].bind({
    getters: Store.getters,
    state: State,
    actions: Actions,
  })
}

export default Actions