import type { Stored, Container } from 'src/types'
import { DEFAULT_CONTAINER } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage.bg'
import * as WebReq from 'src/services/web-req.bg'
import * as Omnibox from 'src/services/omnibox.bg'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'

import * as Containers from './containers'
export * from 'src/services/containers'

export async function load(): Promise<void> {
  Logs.info('Containers.bg.load')
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
    const container = containers[id]
    const ffContainer = ffContainers.find(c => c.cookieStoreId === container.id)
    if (!ffContainer) {
      const conf = { name: container.name, color: container.color, icon: container.icon }
      const newFFContainer = await browser.contextualIdentities.create(conf)
      delete containers[id]
      container.id = newFFContainer.cookieStoreId
      container.cookieStoreId = newFFContainer.cookieStoreId
      containers[container.id] = container
      if (!saveNeeded) saveNeeded = true
    }

    Utils.normalizeObject(container, DEFAULT_CONTAINER)
  }

  Containers.reactive.byId = containers

  if (saveNeeded) saveContainers()
}

let saveContainersTimeout: number | undefined
export async function saveContainers(delay?: number): Promise<void> {
  Logs.info('Containers.bg.saveContainers')
  clearTimeout(saveContainersTimeout)

  if (!delay) {
    return Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) })
  } else {
    saveContainersTimeout = setTimeout(() => {
      Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) })
    }, delay)
  }
}

export function updateContainers(newContainers?: Record<ID, Container> | null): void {
  Logs.info('Containers.bg.updateContainers')
  clearTimeout(saveContainersTimeout)

  if (!newContainers) return

  Containers.reactive.byId = newContainers

  WebReq.updateReqHandlersDebounced(0)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}

export async function create(name: string, color: string, icon: string): Promise<Container> {
  Logs.info('Containers.bg.create:', name, color, icon)
  const newContainer = await Containers.create(name, color, icon)
  WebReq.updateReqHandlersDebounced()
  return newContainer
}

export function setupListeners(): void {
  browser.contextualIdentities.onCreated.addListener(onContainerCreated)
  browser.contextualIdentities.onRemoved.addListener(onContainerRemoved)
  browser.contextualIdentities.onUpdated.addListener(onContainerUpdated)
  Store.onKeyChange('containers', updateContainers)
}

function onContainerCreated(info: browser.contextualIdentities.ChangeInfo): void {
  Containers.onContainerCreated(info)
  saveContainers(300)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}

function onContainerRemoved(info: browser.contextualIdentities.ChangeInfo): void {
  const id = info.contextualIdentity.cookieStoreId

  delete Containers.reactive.byId[id]
  saveContainers(300)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}

function onContainerUpdated(info: browser.contextualIdentities.ChangeInfo): void {
  const container = info.contextualIdentity
  const id = container.cookieStoreId

  if (!Containers.reactive.byId[id]) return

  Containers.reactive.byId[id].name = container.name
  Containers.reactive.byId[id].icon = container.icon
  Containers.reactive.byId[id].color = container.color

  saveContainers(300)

  if (Settings.state.omniReopenInCtr) Omnibox.updateCommandsDebounced(500)
}
