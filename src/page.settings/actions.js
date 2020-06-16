import FaviconsActions from '../actions/favicons'
import MenuActions from '../actions/menu'
import LogsActions from '../actions/logs'
import Store from './store'
import State from './store/state'
import KeybindingsActions from './actions/keybindings'
import SettingsActions from './actions/settings'
import StylesActions from './actions/styles'
import ContainersActions from './actions/containers'
import PanelsActions from './actions/panels'
import MiscActions from './actions/misc'

const Actions = {
  ...FaviconsActions,
  ...SettingsActions,
  ...KeybindingsActions,
  ...MenuActions,
  ...StylesActions,
  ...ContainersActions,
  ...PanelsActions,
  ...LogsActions,
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
