import Store from './store'
import State from './store/state'
import SettingsActions from './actions/settings'
import KeybindingsActions from './actions/keybindings'
import FaviconsActions from './actions/favicons'
import PanelsActions from './actions/panels'
import TabsActions from './actions/tabs'
import BookmarksActions from './actions/bookmarks'
import StylesActions from './actions/styles'
import CtxMenuActions from './actions/menu'
import MiscActions from './actions/misc'

const Actions = {
  ...SettingsActions,
  ...KeybindingsActions,
  ...FaviconsActions,
  ...PanelsActions,
  ...TabsActions,
  ...BookmarksActions,
  ...StylesActions,
  ...CtxMenuActions,
  ...MiscActions,
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