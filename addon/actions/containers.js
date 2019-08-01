import Actions from '../actions.js'

/**
 * Handle new container
 */
function onContainerCreated({ contextualIdentity }) {
  Actions.appendSnapLayers(-1, {
    id: contextualIdentity.cookieStoreId,
    t: Date.now(),
    key: 'ctr',
    color: contextualIdentity.color,
    icon: contextualIdentity.icon,
    name: contextualIdentity.name,
  })

  this.containers[contextualIdentity.cookieStoreId] = contextualIdentity
}

/**
 * Handle removing container
 */
function onContainerRemoved({ contextualIdentity }) {
  Actions.appendSnapLayers(-1, {
    id: contextualIdentity.cookieStoreId,
    t: Date.now(),
  })

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