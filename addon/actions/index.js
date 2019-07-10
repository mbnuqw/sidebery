import SnapshotsActions from './snapshots.js'
import WindowsActions from './windows.js'
import ContainersActions from './containers.js'
import TabsActions from './tabs.js'

const Actions = {
  ...SnapshotsActions,
  ...WindowsActions,
  ...ContainersActions,
  ...TabsActions,
}

/**
 * Inject any stuff to these actions
 */
export function initActions(injectable = {}) {
  for (let action in Actions) {
    if (!Actions.hasOwnProperty(action)) continue

    Actions[action] = Actions[action].bind(injectable)
  }
  Actions.initialized = true
}

export default Actions