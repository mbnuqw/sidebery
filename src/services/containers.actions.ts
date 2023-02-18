import * as Utils from 'src/utils'
import { Stored, Container, TabReopenRuleType, Container_v4, TabReopenRuleConfig } from 'src/types'
import { Containers } from 'src/services/containers'
import { DEFAULT_CONTAINER } from 'src/defaults'
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

      // TEMP update for b31
      if (updateReopeningRules(container) && !saveNeeded) {
        saveNeeded = true
      }
      // TEMP --------------
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

export function updateReopeningRules(container: Container): boolean {
  if (!container.reopenRules) container.reopenRules = []
  if (container.reopenRulesActive === undefined) container.reopenRulesActive = false

  let saveNeeded = false
  const initiallyEmpty = container.reopenRules.length === 0

  if (container.includeHosts) {
    const active = !!container.includeHostsActive
    for (const rawRule of container.includeHosts.split('\n')) {
      const ruleStr = rawRule.trim()
      if (!ruleStr) continue

      container.reopenRules.push({
        id: Utils.uid(),
        active,
        type: TabReopenRuleType.Include,
        url: ruleStr,
      })

      if (!saveNeeded) saveNeeded = true
    }
  }
  if (container.includeHosts !== undefined) delete container.includeHosts
  if (container.includeHostsActive !== undefined) delete container.includeHostsActive

  if (container.excludeHosts) {
    const active = !!container.excludeHostsActive
    for (const rawRule of container.excludeHosts.split('\n')) {
      const ruleStr = rawRule.trim()
      if (!ruleStr) continue

      container.reopenRules.push({
        id: Utils.uid(),
        active,
        type: TabReopenRuleType.Exclude,
        url: ruleStr,
      })

      if (!saveNeeded) saveNeeded = true
    }
  }
  if (container.excludeHosts !== undefined) delete container.excludeHosts
  if (container.excludeHostsActive !== undefined) delete container.excludeHostsActive

  if (initiallyEmpty && container.reopenRules.length > 0) {
    container.reopenRulesActive = true
  }

  return saveNeeded
}

function upgradeReopeningRules(oldCtr: Container_v4, newCtr: Container) {
  if (oldCtr.includeHosts) {
    const active = !!oldCtr.includeHostsActive
    for (const rawRule of oldCtr.includeHosts.split('\n')) {
      const ruleStr = rawRule.trim()
      if (!ruleStr) continue

      newCtr.reopenRules.push({
        id: Utils.uid(),
        active,
        type: TabReopenRuleType.Include,
        url: ruleStr,
      })

      if (!newCtr.reopenRulesActive) newCtr.reopenRulesActive = true
    }
  }

  if (oldCtr.excludeHosts) {
    const active = !!oldCtr.excludeHostsActive
    for (const rawRule of oldCtr.excludeHosts.split('\n')) {
      const ruleStr = rawRule.trim()
      if (!ruleStr) continue

      newCtr.reopenRules.push({
        id: Utils.uid(),
        active,
        type: TabReopenRuleType.Exclude,
        url: ruleStr,
      })

      if (!newCtr.reopenRulesActive) newCtr.reopenRulesActive = true
    }
  }
}

export function upgradeV4Containers(
  oldContainers: Record<ID, Container_v4>
): Record<ID, Container> {
  const output: Record<ID, Container> = {}

  for (const id of Object.keys(oldContainers)) {
    const oldContainer = oldContainers[id]
    const newContainer = Utils.cloneObject(DEFAULT_CONTAINER)

    newContainer.cookieStoreId = oldContainer.cookieStoreId
    if (oldContainer.name) newContainer.name = oldContainer.name
    if (oldContainer.icon) newContainer.icon = oldContainer.icon
    if (oldContainer.color) newContainer.color = oldContainer.color
    if (oldContainer.colorCode) newContainer.colorCode = oldContainer.colorCode
    newContainer.id = oldContainer.cookieStoreId
    if (oldContainer.proxified) newContainer.proxified = oldContainer.proxified
    if (oldContainer.proxy) newContainer.proxy = Utils.cloneObject(oldContainer.proxy)
    upgradeReopeningRules(oldContainer, newContainer)
    if (oldContainer.userAgentActive) newContainer.userAgentActive = oldContainer.userAgentActive
    if (oldContainer.userAgent) newContainer.userAgent = oldContainer.userAgent

    output[id] = newContainer
  }

  return output
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

  // Update colors in reactive tabs
  if (Info.isSidebar) {
    for (const tab of Tabs.list) {
      const container = newContainers[tab.cookieStoreId]
      if (container) {
        const rTab = Tabs.reactive.byId[tab.id]
        if (rTab) rTab.containerColor = container.color
      }
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
    if (ctr.reopenRulesActive) {
      let matchedContiner = false

      for (const rule of ctr.reopenRules) {
        if (!rule.active) continue

        const urlMatchStr = rule.url.trim()
        if (!urlMatchStr) continue

        let urlMatchRe
        if (urlMatchStr.startsWith('/') && urlMatchStr.endsWith('/')) {
          try {
            urlMatchRe = new RegExp(urlMatchStr.slice(1, -1))
            if (urlMatchRe.test(url)) {
              matchedContiner = true
              break
            }
          } catch {
            Logs.warn(`Containers.getContainerFor: Cannot parse RegExp: ${urlMatchStr}`)
          }
        } else if (url.includes(urlMatchStr)) {
          matchedContiner = true
          break
        }
      }

      if (matchedContiner) return ctr.id
    }
  }

  return
}
