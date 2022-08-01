import Utils from 'src/utils'
import { Stored, Container } from 'src/types'
import { Containers } from 'src/services/containers'
import { DEFAULT_CONTAINER } from 'src/defaults'
import { Store } from 'src/services/storage'
import { WebReq } from 'src/services/web-req'
import { Logs } from 'src/services/logs'
import { Menu } from 'src/services/menu'
import { Info } from 'src/services/info'
import { Settings } from './settings'

export async function load(): Promise<void> {
  if (Info.isBg) {
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

    WebReq.updateReqHandlers()
    if (saveNeeded) Containers.saveContainers()
  } else {
    const storage = await browser.storage.local.get<Stored>('containers')
    if (storage.containers) {
      Containers.reactive.byId = storage.containers
      Menu.parseContainersRules()
    }
  }
}

export async function saveContainers(delay?: number): Promise<void> {
  return Store.set({ containers: Utils.cloneObject(Containers.reactive.byId) }, delay)
}

export function updateContainers(newContainers?: Record<ID, Container> | null): void {
  if (!newContainers) return
  Containers.reactive.byId = newContainers

  if (Info.isBg) WebReq.updateReqHandlersDebounced()

  if (Info.isSidebar && Settings.state.ctxMenuIgnoreContainers) {
    Menu.parseContainersRules()
  }
}

export async function create(name: string, color: string, icon: string): Promise<Container> {
  const newRawContainer = await browser.contextualIdentities.create({ name, color, icon })
  const newContainer = Utils.recreateNormalizedObject(
    newRawContainer as Container,
    DEFAULT_CONTAINER
  )
  newContainer.id = newRawContainer.cookieStoreId
  Containers.reactive.byId[newContainer.id] = newContainer
  if (Info.isBg) WebReq.updateReqHandlersDebounced()
  return newContainer
}

/**
 * Get Container Unique ID
 */
export function getCUID(container: Container): string {
  const parts = [container.name, container.icon, container.color]
  return JSON.stringify(parts).slice(1, -1)
}

/**
 * Parse Container Unique ID
 */
export function parseCUID(cuid: string): browser.contextualIdentities.CreateDetails {
  let result: string[] | undefined
  try {
    result = JSON.parse(`[${cuid}]`) as string[]
  } catch (err) {
    throw Logs.err('Containers: Cannot parse CUID')
  }
  if (!result || result.length !== 3) throw Logs.err('Containers: Cannot parse CUID')

  return {
    name: result[0],
    icon: result[1],
    color: result[2] as browser.ColorName,
  }
}

export function findUnique(
  props?: Partial<browser.contextualIdentities.CreateDetails>
): Container | undefined {
  if (!props) return

  let container: Container | undefined
  for (const ctr of Object.values(Containers.reactive.byId)) {
    if (ctr.name === props.name && ctr.icon === props.icon && ctr.color === props.color) {
      if (!container) container = ctr
      else {
        container = undefined
        break
      }
    }
  }

  return container
}

export function getContainerFor(url: string): string | undefined {
  for (const ctr of Object.values(Containers.reactive.byId)) {
    // Include rules
    if (ctr.includeHostsActive) {
      let matchedContiner = false

      for (const rawRule of ctr.includeHosts.split('\n')) {
        let rule: RegExp | string = rawRule.trim()
        if (!rule) continue

        if (rule.startsWith('/') && rule.endsWith('/')) {
          try {
            rule = new RegExp(rule.slice(1, rule.length - 1))
          } catch {
            // ---
          }

          if ((Utils.isRegExp(rule) && rule.test(url)) || url.indexOf(rule as string) !== -1) {
            matchedContiner = true
            break
          }
        }
      }

      if (matchedContiner) return ctr.id
    }
  }

  return
}
