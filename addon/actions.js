import SnapshotsActions from './actions/snapshots.js'
import WindowsActions from './actions/windows.js'
import ContainersActions from './actions/containers.js'
import TabsActions from './actions/tabs.js'
import MsgActions from './actions/msg.js'
import ProxyActions from './actions/proxy.js'
import FaviconsActions from './actions/favicons.js'
import StorageActions from './actions/storage.js'
import LogsActions from './actions/logs.js'
import MiscActions from './actions/misc.js'

const Actions = {
  ...SnapshotsActions,
  ...WindowsActions,
  ...ContainersActions,
  ...TabsActions,
  ...MsgActions,
  ...ProxyActions,
  ...FaviconsActions,
  ...StorageActions,
  ...LogsActions,
  ...MiscActions,
}

/**
 * Inject any stuff to these actions
 */
export function injectInActions(injectable = {}) {
  for (let key of Object.keys(Actions)) {
    Actions[key] = Actions[key].bind(injectable)
  }
  Actions.initialized = true
  return injectable
}

export default Actions
