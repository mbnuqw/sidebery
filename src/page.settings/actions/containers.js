import Utils from '../../utils'
import CommonActions from '../../actions/containers'

/**
 * Save containers
 */
function saveContainers() {
  browser.storage.local.set({
    containers: Utils.cloneObject(this.state.containers),
  })
}
function saveContainersDebounced(delay = 500) {
  if (this._saveContainersTimeout) clearTimeout(this._saveContainersTimeout)
  this._saveContainersTimeout = setTimeout(() => {
    this._saveContainersTimeout = null
    this.actions.saveContainers()
  }, delay)
}

export default {
  ...CommonActions,

  saveContainers,
  saveContainersDebounced,
}