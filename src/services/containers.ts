import type { Container, Reactivator } from 'src/types'
import { DEFAULT_CONTAINER, RE_STR_RE } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Settings from 'src/services/settings'
import * as Containers from './containers'

export interface ContainersState {
  byId: Record<string, Container>
}

export interface ContainerProxy {
  type: browser.proxy.ProxyType
  host: string
  port: string
}

export let reactive: ContainersState = { byId: {} }

export function reactivate(r: Reactivator<ContainersState>) {
  reactive = r(reactive)
}

export async function create(name: string, color: string, icon: string): Promise<Container> {
  Logs.info('Containers.create:', name, color, icon)
  const newRawContainer = await browser.contextualIdentities.create({ name, color, icon })
  const newContainer = Utils.recreateNormalizedObject(newRawContainer, DEFAULT_CONTAINER)
  newContainer.id = newRawContainer.cookieStoreId
  Containers.reactive.byId[newContainer.id] = newContainer
  return newContainer
}

/**
 * Get Container Props ID
 */
export function getCPID(container: Container): string {
  const parts = [container.name, container.icon, container.color]
  return JSON.stringify(parts).slice(1, -1)
}

/**
 * Parse Container Props ID
 */
export function parseCPID(cpid: string): browser.contextualIdentities.CreateDetails | undefined {
  let result: string[] | undefined
  try {
    result = JSON.parse(`[${cpid}]`) as string[]
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

export function onContainerCreated(info: browser.contextualIdentities.ChangeInfo): void {
  Logs.info('Containers.onContainerCreated:', info)
  const ffContainer = info.contextualIdentity
  const id = ffContainer.cookieStoreId
  const existedContainer = Containers.reactive.byId[id]
  const container = existedContainer ?? Utils.cloneObject(DEFAULT_CONTAINER)
  container.cookieStoreId = id
  container.id = id
  container.name = ffContainer.name
  container.icon = ffContainer.icon
  container.color = ffContainer.color
  if (!existedContainer) Containers.reactive.byId[id] = container
}
