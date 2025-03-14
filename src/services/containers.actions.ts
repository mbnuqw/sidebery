import * as Utils from 'src/utils'
import { Stored, Container, TabReopenRuleType } from 'src/types'
import { Containers } from 'src/services/containers'
import { DEFAULT_CONTAINER, RE_STR_RE } from 'src/defaults'
import { Store } from 'src/services/storage'
import { WebReq } from 'src/services/web-req'
import * as Logs from 'src/services/logs'
import { Menu } from 'src/services/menu'
import { Info } from 'src/services/info'
import { Settings } from './settings'
import { Tabs } from './tabs.fg'

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

    if (saveNeeded) Containers.saveContainers()
  } else {
    const storage = await browser.storage.local.get<Stored>('containers')
    if (storage.containers) {
      Containers.reactive.byId = storage.containers
      Menu.parseContainersRules()
    }
  }
}

let saveContainersTimeout: number | undefined
export async function saveContainers(delay?: number): Promise<void> {
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
  clearTimeout(saveContainersTimeout)

  if (!newContainers) return
  Containers.reactive.byId = newContainers

  if (Info.isBg) WebReq.updateReqHandlersDebounced()

  if (Info.isSidebar && Settings.state.ctxMenuIgnoreContainers) {
    Menu.parseContainersRules()
  }

  // Update colors in reactive tabs
  if (Info.isSidebar) {
    for (const tab of Tabs.list) {
      const container = newContainers[tab.cookieStoreId]
      if (container) tab.reactive.containerColor = container.color
    }
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
export function parseCUID(cuid: string): browser.contextualIdentities.CreateDetails | undefined {
  let result: string[] | undefined
  try {
    result = JSON.parse(`[${cuid}]`) as string[]
  } catch (err) {
    return
  }
  if (!result || result.length !== 3) return

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

/**
 * Parse match string for include/exclude rules. No error throwing.
 */
export function parseReopenRule(s: string): string | RegExp | undefined {
  const urlMatchStr = s.trim()
  if (!urlMatchStr) return

  const isMatchStrRe = RE_STR_RE.exec(urlMatchStr)
  if (isMatchStrRe?.groups?.re) {
    try {
      return new RegExp(isMatchStrRe?.groups?.re, isMatchStrRe?.groups?.flags)
    } catch {
      Logs.warn(`Containers.parseReopenRule: Cannot parse RegExp: ${urlMatchStr}`)
    }
  }
  return urlMatchStr
}

export function getContainerFor(url: string): string | undefined {
  for (const ctr of Object.values(Containers.reactive.byId)) {
    if (ctr.reopenRulesActive) {
      let matchedContainer = false

      for (const rule of ctr.reopenRules) {
        if (!rule.active) continue

        const subStrOrRE = parseReopenRule(rule.url)
        if (!subStrOrRE) continue

        if (subStrOrRE instanceof RegExp) {
          if (subStrOrRE.test(url)) {
            matchedContainer = true
            break
          }
        } else if (url.includes(subStrOrRE)) {
          matchedContainer = true
          break
        }
      }

      if (matchedContainer) return ctr.id
    }
  }

  return
}

export function sortContainers(containers: Container[]): Container[] {
  if (Settings.state.containersSortByName) {
    return containers.sort((a, b) => a.name.localeCompare(b.name))
  }
  return containers
}
