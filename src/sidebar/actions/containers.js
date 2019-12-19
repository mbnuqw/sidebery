import CommonActions from '../../actions/containers'

/**
 * Update containers data (on storage change)
 */
function updateContainers(newContainers) {
  if (!newContainers) return
  this.state.containers = newContainers
}

export default {
  ...CommonActions,

  updateContainers,
}
