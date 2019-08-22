/**
 * Get containers
 */
async function getContainers() {
  const containers = await browser.contextualIdentities.query({})
  const containersMap = {}
  for (let container of containers) {
    containersMap[container.cookieStoreId] = container
  }
  return containersMap
}

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

function setupContainersListeners() {
  browser.contextualIdentities.onCreated.addListener(this.actions.onContainerCreated)
  browser.contextualIdentities.onRemoved.addListener(this.actions.onContainerRemoved)
  browser.contextualIdentities.onUpdated.addListener(this.actions.onContainerUpdated)
}

export default {
  getContainers,

  onContainerCreated,
  onContainerRemoved,
  onContainerUpdated,

  setupContainersListeners,
}