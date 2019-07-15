import SnapshotsActions from './snapshots.js'
import WindowsActions from './windows.js'
import ContainersActions from './containers.js'
import TabsActions from './tabs.js'
import MsgActions from './msg.js'

const Actions = {
  ...SnapshotsActions,
  ...WindowsActions,
  ...ContainersActions,
  ...TabsActions,
  ...MsgActions,
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