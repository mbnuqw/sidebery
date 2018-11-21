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

  // --- --- --- Misc --- --- ---

  /**
   * Show windows choosing panel
   */
  async chooseWin({ state }) {
    state.winChoosing = []
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
  async recalcPanelScroll() {
    setTimeout(() => EventBus.$emit('recalcPanelScroll'), 33)
  },

  /**
   * Broadcast message to other parts of extension.
   */
  async broadcast(_, msg = {}) {
    return await browser.runtime.sendMessage(msg)
  },
}
