import { DEFAULT_CONTAINER } from '../defaults.js'

/**
 * Load containers (ff + sidebery data)
 */
async function loadContainers() {
  let saveNeeded = false
  let [ffContainers, storage] = await Promise.all([
    browser.contextualIdentities.query({}),
    browser.storage.local.get({ containers_v4: null }),
  ])
  let containers = storage.containers_v4 ? storage.containers_v4 : {}

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
  saveContainers,
  updateContainers,

  onContainerCreated,
  onContainerRemoved,
  onContainerUpdated,

  setupContainersListeners,
}
