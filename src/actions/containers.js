
import Utils from '../utils'
import { DEFAULT_CONTAINER } from '../../addon/defaults'

/**
 * Normalize containers data and put it in state
 */
async function loadContainers() {
  let saveNeeded = false
  let [ ffContainers, storage ] = await Promise.all([
    browser.contextualIdentities.query({}),
    browser.storage.local.get({ containers_v4: null })
  ])

  // Try to use value from prev version
  if (!storage.containers_v4) {
    saveNeeded = true
    storage.containers_v4 = await this.actions.getNormContainers(ffContainers)
  }

  let containers = storage.containers_v4

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
    if (!ffContainer) {
      delete containers[container.id]
      continue
    }

    for (let k of Object.keys(DEFAULT_CONTAINER)) {
      if (container[k] === undefined) container[k] = DEFAULT_CONTAINER[k]
    }
  }

  this.state.containers = containers

  if (saveNeeded) this.actions.saveContainers()
}

/**
 * Try to get containers from previous version
 * or just use defaults.
 */
async function getNormContainers(ffContainers) {
  let { panels } = await browser.storage.local.get({ panels: [] })
  let containers = {}

  for (let ffCtr of ffContainers) {
    let container = Utils.cloneObject(DEFAULT_CONTAINER)

    container.id = ffCtr.cookieStoreId
    container.name = ffCtr.name
    container.icon = ffCtr.icon
    container.color = ffCtr.color

    let old = panels.find(p => p.cookieStoreId === ffCtr.cookieStoreId)
    if (old) {
      if (old.proxified !== undefined) container.proxified = old.proxified
      if (old.proxy !== undefined) container.proxy = old.proxy
      if (old.includeHostsActive !== undefined) {
        container.includeHostsActive = old.includeHostsActive
      }
      if (old.includeHosts !== undefined) {
        container.includeHosts = old.includeHosts
      }
      if (old.excludeHostsActive !== undefined) {
        container.excludeHostsActive = old.excludeHostsActive
      }
      if (old.excludeHosts !== undefined) {
        container.excludeHosts = old.excludeHosts
      }
      if (old.userAgentActive !== undefined) {
        container.userAgentActive = old.userAgentActive
      }
    }

    containers[container.id] = container
  }

  return containers
}

/**
 * Save containers
 */
function saveContainers() {
  browser.storage.local.set({
    containers_v4: Utils.cloneObject(this.state.containers),
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
  loadContainers,
  getNormContainers,
  saveContainers,
  saveContainersDebounced,
}