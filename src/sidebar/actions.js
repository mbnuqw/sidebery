import FaviconsActions from '../actions/favicons'
import SettingsActions from './actions/settings'
import KeybindingsActions from './actions/keybindings'
import ContainersActions from './actions/containers'
import PanelsActions from './actions/panels'
import TabsActions from './actions/tabs'
import BookmarksActions from './actions/bookmarks'
import StylesActions from './actions/styles'
import CtxMenuActions from './actions/menu'
import LogsActions from '../actions/logs'
import MiscActions from './actions/misc'

const Actions = {
  ...SettingsActions,
  ...KeybindingsActions,
  ...FaviconsActions,
  ...ContainersActions,
  ...PanelsActions,
  ...TabsActions,
  ...BookmarksActions,
  ...StylesActions,
  ...CtxMenuActions,
  ...LogsActions,
  ...MiscActions,
}

// Inject vuex getters and state in actions
export function injectInActions(injectable = {}) {
  for (let action of Object.keys(Actions)) {
    Actions[action] = Actions[action].bind(injectable)
  }
}

export default Actions
