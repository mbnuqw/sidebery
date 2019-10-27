
import Utils from '../utils'
import { DEFAULT_CONTAINER } from '../../addon/defaults'

/**
 * Load containers (ff + sidebery data)
 */
async function loadContainers() {
  let ffContainers = await browser.contextualIdentities.query({})
  let { containers } = await browser.storage.local.get({ containers: {} })

  for (let ffContainer of ffContainers) {
    let container = containers[ffContainer.cookieStoreId]
    if (!container) {
      container = Utils.cloneObject(DEFAULT_CONTAINER)
      containers[ffContainer.cookieStoreId] = container
    }

    container.id = ffContainer.cookieStoreId
    container.name = ffContainer.name
    container.icon = ffContainer.icon
    container.color = ffContainer.color
  }

  for (let container of Object.values(containers)) {
    let ffContainer = ffContainers.find(c => c.cookieStoreId === container.id)
    if (!ffContainer) continue

    for (let k of Object.keys(DEFAULT_CONTAINER)) {
      if (container[k] === undefined) container[k] = DEFAULT_CONTAINER[k]
    }
  }

  this.state.containers = containers
}

export default {
  loadContainers,
}