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
function onContainerUpdated({ contextualIdentity }) {
  this.containers[contextualIdentity.cookieStoreId] = contextualIdentity
}

export default {
  onContainerCreated,
  onContainerRemoved,
  onContainerUpdated,
}