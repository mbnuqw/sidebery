/**
 * Handle new container
 */
function onContainerCreated({ contextualIdentity }) {
  this.containers[contextualIdentity.cookieStoreId] = contextualIdentity
}

/**
 * Handle removing container
 */
function onContainerRemoved({ contextualIdentity }) {
  delete this.containers[contextualIdentity.cookieStoreId]
}

/**
 * Handle container update
 */
function onContainerUpdated(info) {
  const ctr = info.contextualIdentity
  const id = ctr.cookieStoreId

  this.containers[id] = ctr
}

export default {
  onContainerCreated,
  onContainerRemoved,
  onContainerUpdated,
}