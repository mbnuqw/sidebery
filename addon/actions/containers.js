import { DEFAULT_CONTAINER } from '../defaults.js'

/**
 * Load containers (ff + sidebery data)
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
      container = { ...DEFAULT_CONTAINER }
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
      await browser.contextualIdentities.create({
        name: container.name,
        color: container.color,
        icon: container.icon,
      })
      delete containers[container.id]
      continue
    }

    for (let k of Object.keys(DEFAULT_CONTAINER)) {
      if (container[k] === undefined) container[k] = DEFAULT_CONTAINER[k]
    }
  }

  this.containers = containers
  this.actions.updateReqHandler()

  if (saveNeeded) this.actions.saveContainers(0)
}

/**
 * Try to get containers from previous version
 * or just use defaults.
 */
async function getNormContainers(ffContainers) {
  let { panels } = await browser.storage.local.get({ panels: [] })
  let containers = {}

  for (let ffCtr of ffContainers) {
    let container = { ...DEFAULT_CONTAINER }

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
 * Save containers (sidebery data)
 */
function saveContainers(delay = 300) {
  if (this._saveContainersTimeout) clearTimeout(this._saveContainersTimeout)
  this._saveContainersTimeout = setTimeout(() => {
    this._saveContainersTimeout = null
    browser.storage.local.set({ containers_v4: this.containers })
  }, delay)
}

/**
 * Update containers data (on storage change)
 */
function updateContainers(newContainers) {
  if (!newContainers) return
  this.containers = newContainers
  this.actions.updateReqHandlerDebounced()
}

/**
 * Handle new container
 */
function onContainerCreated({ contextualIdentity }) {
  let cid = contextualIdentity.cookieStoreId
  let container = { ...DEFAULT_CONTAINER }
  container.id = cid
  container.name = contextualIdentity.name
  container.icon = contextualIdentity.icon
  container.color = contextualIdentity.color
  this.containers[cid] = container

  this.actions.saveContainers()
}

/**
 * Handle removing container
 */
function onContainerRemoved({ contextualIdentity }) {
  delete this.containers[contextualIdentity.cookieStoreId]

  this.actions.saveContainers()
}

/**
 * Handle container update
 */
function onContainerUpdated(info) {
  let ctr = info.contextualIdentity
  let id = ctr.cookieStoreId
  if (!ctr) {
    // console.warn('[DEBUG] BG.onContainerUpdated: Cannot find container')
    return
  }

  this.containers[id].name = ctr.name
  this.containers[id].icon = ctr.icon
  this.containers[id].color = ctr.color

  this.actions.saveContainers()
}

function setupContainersListeners() {
  browser.contextualIdentities.onCreated.addListener(this.actions.onContainerCreated)
  browser.contextualIdentities.onRemoved.addListener(this.actions.onContainerRemoved)
  browser.contextualIdentities.onUpdated.addListener(this.actions.onContainerUpdated)
}

export default {
  loadContainers,
  getNormContainers,
  saveContainers,
  updateContainers,

  onContainerCreated,
  onContainerRemoved,
  onContainerUpdated,

  setupContainersListeners,
}