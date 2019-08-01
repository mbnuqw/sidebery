import SnapshotsActions from './actions/snapshots.js'
import WindowsActions from './actions/windows.js'
import ContainersActions from './actions/containers.js'
import PanelsActions from './actions/panels.js'
import TabsActions from './actions/tabs.js'
import MsgActions from './actions/msg.js'
import ProxyActions from './actions/proxy.js'

const Actions = {
  ...SnapshotsActions,
  ...WindowsActions,
  ...ContainersActions,
  ...PanelsActions,
  ...TabsActions,
  ...MsgActions,
  ...ProxyActions,
}

/**
 * Inject any stuff to these actions
 */
export function injectInActions(injectable = {}) {
  for (let action in Actions) {
    if (!Actions.hasOwnProperty(action)) continue

    Actions[action] = Actions[action].bind(injectable)
  }
  Actions.initialized = true
  return injectable
}

export default Actions