import type { Stored, Container, NewContainerConf, IPCNodeInfo } from 'src/types'
import { DEFAULT_CONTAINER } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage.bg'
import * as WebReq from 'src/services/web-req.bg'
import * as Omnibox from 'src/services/omnibox.bg'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'

import * as Containers from './containers'
export * from 'src/services/containers'

let ready = false
let deferredEventHandling: (() => void)[] = []

export async function load(): Promise<void> {
  Logs.info('Containers.load')
  const ts = performance.now()
  ready = false
  setupListeners()
  const [ffContainers, storage] = await Promise.all([
    browser.contextualIdentities.query({}),
    browser.storage.local.get<Stored>('containers'),
  ])
  const containers = storage.containers ?? {}
  let saveNeeded = false

  for (const ffContainer of ffContainers) {
    let container = containers[ffContainer.cookieStoreId]
    if (!container) {
      container = Utils.cloneObject(DEFAULT_CONTAINER)
      containers[ffContainer.cookieStoreId] = container
      if (!saveNeeded) saveNeeded = true
    }

    container.cookieStoreId = ffContainer.cookieStoreId
    container.id = ffContainer.cookieStoreId
    container.name = ffContainer.name
    container.icon = ffContainer.icon
    container.color = ffContainer.color
  }

  for (const id of Object.keys(containers)) {
    let container = containers[id]
    const ffContainer = ffContainers.find(c => c.cookieStoreId === container.id)
    if (!ffContainer) {
      try {
        container = await create(container)
      } catch {
        if (!saveNeeded) saveNeeded = true
        continue
      }
      delete containers[id]
      containers[container.id] = container
      if (!saveNeeded) saveNeeded = true
    }

    Utils.normalizeObject(container, DEFAULT_CONTAINER)
  }

  Containers.reactive.byId = containers

  if (saveNeeded) saveContainers()

  ready = true
  waitingForContainers.forEach(cb => cb())
  waitingForContainers = []

  // Call deferred event handlers
  if (deferredEventHandling.length) {
    Logs.warn('Containers: Deferred event handlers:', deferredEventHandling.length)
  }
  deferredEventHandling.forEach(cb => cb())
  deferredEventHandling = []
  Logs.info('Containers.load: Done:', performance.now() - ts)
}

let waitingForContainers: (() => void)[] = []
async function waitForContainersReady(): Promise<void> {
  if (ready) return
  return new Promise(ok => waitingForContainers.push(ok))
}

let saveContainersTimeout: number | undefined
export async function saveContainers(delay?: number, invoker?: IPCNodeInfo): Promise<void> {
  clearTimeout(saveContainersTimeout)

  if (!delay) {
    const containers = Utils.cloneObject(Containers.reactive.byId)
    if (invoker) return Store.setFromRemoteFg({ containers }, invoker)
    else return Store.set({ containers })
  } else {
    saveContainersTimeout = setTimeout(() => {
      Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) })
    }, delay)
  }
}

export async function getContainers() {
  await waitForContainersReady()
  return Containers.reactive.byId
}

let creating: string | undefined
export async function create(c: NewContainerConf): Promise<Container> {
  creating = c.name
  const newRawContainer = await browser.contextualIdentities
    .create({
      name: c.name,
      color: c.color,
      icon: c.icon,
    })
    .finally(() => {
      creating = undefined
    })
  const newContainer = Utils.recreateNormalizedObject(newRawContainer, DEFAULT_CONTAINER)
  newContainer.id = newRawContainer.cookieStoreId
  if (c.proxified !== undefined) newContainer.proxified = c.proxified
  if (c.proxy !== undefined) newContainer.proxy = c.proxy
  if (c.reopenRulesActive !== undefined) newContainer.reopenRulesActive = c.reopenRulesActive
  if (c.reopenRules !== undefined) newContainer.reopenRules = c.reopenRules
  if (c.userAgentActive !== undefined) newContainer.userAgentActive = c.userAgentActive
  if (c.userAgent !== undefined) newContainer.userAgent = c.userAgent

  Containers.reactive.byId[newContainer.id] = newContainer

  return newContainer
}

export async function createAndSave(
  c: NewContainerConf,
  invoker?: IPCNodeInfo
): Promise<Container> {
  const newContainer = await create(c)

  WebReq.updateReqHandlersDebounced()
  await saveContainers(0, invoker)

  return newContainer
}

const removing = new Set<string>()
export async function removeAndSave(id: string, invoker?: IPCNodeInfo) {
  removing.add(id)
  try {
    await browser.contextualIdentities.remove(id).finally(() => removing.delete(id))
  } catch (rErr) {
    // Check if such container even exists
    const ctr = await browser.contextualIdentities.get(id).catch(() => undefined)
    // Container exists, throw that error
    if (ctr) throw rErr
    // No container, continue (cleanup local state)...
  }
  delete Containers.reactive.byId[id]
  await saveContainers(0, invoker)
}

export async function setContainers(containers: Record<string, Container>, invoker?: IPCNodeInfo) {
  // Change only listed containers, leave other untouched
  for (const id of Object.keys(containers)) {
    const newContainer = containers[id]
    if (!newContainer) continue

    await updateNativeContainer(newContainer)

    Containers.reactive.byId[id] = newContainer
  }

  await saveContainers(0, invoker)
}

const updating = new Set<string>()
async function updateNativeContainer(newContainer: Container) {
  const id = newContainer.id
  const oldContainer = Containers.reactive.byId[id]
  if (!oldContainer) return

  const upd: browser.contextualIdentities.UpdateDetails = {}
  let updNeeded = false
  if (oldContainer.name !== newContainer.name) {
    upd.name = newContainer.name
    updNeeded = true
  }
  if (oldContainer.icon !== newContainer.icon) {
    upd.icon = newContainer.icon
    updNeeded = true
  }
  if (oldContainer.color !== newContainer.color) {
    upd.color = newContainer.color
    updNeeded = true
  }

  if (updNeeded) {
    updating.add(id)
    await browser.contextualIdentities.update(id, upd).finally(() => {
      updating.delete(id)
    })
  }
}

export async function importContainers(
  importedContainers: Record<string, Container>,
  invoker?: IPCNodeInfo
): Promise<Record<string, string>> {
  const importedLocalIds: Record<string, string> = {}
  const localContainers = Object.values(Containers.reactive.byId)

  for (const id of Object.keys(importedContainers)) {
    const ic = importedContainers[id]
    if (!ic) continue

    let lc = localContainers.find(lc => {
      return lc.name === ic.name && lc.icon === ic.icon && lc.color === ic.color
    })

    if (!lc) lc = await create(ic).catch(() => undefined)
    if (!lc) continue

    importedLocalIds[ic.id] = lc.cookieStoreId
  }

  await saveContainers(0, invoker)

  return importedLocalIds
}

export function setupListeners(): void {
  browser.contextualIdentities.onCreated.addListener(onContainerCreated)
  browser.contextualIdentities.onRemoved.addListener(onContainerRemoved)
  browser.contextualIdentities.onUpdated.addListener(onContainerUpdated)
  Store.onKeyChange('containers', onStoredContainersUpdated)
}

export function onStoredContainersUpdated(newContainers?: Record<ID, Container> | null): void {
  clearTimeout(saveContainersTimeout)

  if (!newContainers) return

  Containers.reactive.byId = newContainers

  WebReq.updateReqHandlersDebounced(0)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}

function onContainerCreated(info: browser.contextualIdentities.ChangeInfo): void {
  // Container is created by Sidebery (most likely), skip
  if (creating === info.contextualIdentity.name) return

  if (!ready) {
    deferredEventHandling.push(() => onContainerCreated(info))
    return
  }

  Containers.onContainerCreated(info)
  saveContainers(300)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}

function onContainerRemoved(info: browser.contextualIdentities.ChangeInfo): void {
  const id = info.contextualIdentity.cookieStoreId
  // Container is removed by Sidebery, skip
  if (removing.has(id)) return

  if (!ready) {
    deferredEventHandling.push(() => onContainerRemoved(info))
    return
  }

  delete Containers.reactive.byId[id]
  saveContainers(300)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}

function onContainerUpdated(info: browser.contextualIdentities.ChangeInfo): void {
  const container = info.contextualIdentity
  const id = container.cookieStoreId
  // Container is updated by Sidebery or not existed, skip
  if (updating.has(id) || !Containers.reactive.byId[id]) return

  if (!ready) {
    deferredEventHandling.push(() => onContainerUpdated(info))
    return
  }

  Containers.reactive.byId[id].name = container.name
  Containers.reactive.byId[id].icon = container.icon
  Containers.reactive.byId[id].color = container.color

  saveContainers(300)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}
