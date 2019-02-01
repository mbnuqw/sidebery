import EventBus from './event-bus'
import SavedStateActions from './actions/saved-state'
import SettingsActions from './actions/settings'
import KeybindingsActions from './actions/keybindings'
import FaviconsActions from './actions/favicons'
import SyncActions from './actions/sync'
import PanelsActions from './actions/panels'
import TabsActions from './actions/tabs'
import Bookmarks from './actions/bookmarks'
import Snapshots from './actions/snapshots'
import Styles from './actions/styles'

export default {
  ...SavedStateActions,
  ...SettingsActions,
  ...KeybindingsActions,
  ...FaviconsActions,
  ...SyncActions,
  ...PanelsActions,
  ...TabsActions,
  ...Bookmarks,
  ...Snapshots,
  ...Styles,

  // --- --- --- Misc --- --- ---

  /**
   * Show windows choosing panel
   */
  async chooseWin({ state }) {
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
  },

  /**
   * Breadcast recalc panel's scroll event.
   */
  recalcPanelScroll() {
    setTimeout(() => EventBus.$emit('recalcPanelScroll'), 33)
  },

  /**
   * Broadcast message to other parts of extension.
   */
  async broadcast(_, msg = {}) {
    browser.runtime.sendMessage(msg)
  },

  /**
   * Retrieve current permissions
   */
  async loadPermissions({ state, dispatch }) {
    const permsObj = await browser.permissions.getAll()
    state.permissions = [...permsObj.permissions, ...permsObj.origins]

    // Get optianal permissions state
    state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
    state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })
    if (state.hideInact) dispatch('hideInactPanelsTabs')
  },
}
