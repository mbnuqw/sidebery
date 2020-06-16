import { DEFAULT_CONTAINER } from '../../addon/defaults'

/**
 * Normalize containers data and put it in state
 */
async function loadContainers() {
  let saveNeeded = false
  let [ffContainers, storage] = await Promise.all([
    browser.contextualIdentities.query({}),
    browser.storage.local.get({ containers_v4: null }),
  ])
  let containers = storage.containers_v4 ? storage.containers_v4 : {}
  let ctxMenuRules = this.actions.parseCtxMenuContainersRules(this.state.ctxMenuIgnoreContainers)

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

  this.state.ctxMenuIgnoreContainersRules = {}
  for (let container of Object.values(containers)) {
    let ffContainer = ffContainers.find(c => c.cookieStoreId === container.id)
    if (!ffContainer) {
      delete containers[container.id]
      continue
    }

    for (let k of Object.keys(DEFAULT_CONTAINER)) {
      if (container[k] === undefined) container[k] = DEFAULT_CONTAINER[k]
    }

    if (ctxMenuRules) {
      let ignore = this.actions.checkCtxMenuContainer(container, ctxMenuRules)
      this.state.ctxMenuIgnoreContainersRules[container.id] = ignore
    }
  }

  this.state.containers = containers
  this.actions.infoLog('Containers loaded')

  if (saveNeeded) this.actions.saveContainers()
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
  saveContainers,
  saveContainersDebounced,
}
