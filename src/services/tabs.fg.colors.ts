import { NOID } from 'src/defaults'
import * as Utils from 'src/utils'
import { Containers } from './containers'
import { Settings } from './settings'
import { Tabs } from './tabs.fg'

const CONTAINER_COLORS: Record<string, string> = {
  blue: '#37adff',
  turquoise: '#00c79a',
  green: '#51cd00',
  yellow: '#ffcb00',
  orange: '#ff9f00',
  red: '#ff613d',
  pink: '#ff4bda',
  purple: '#af51f5',
}

export function colorizeTabs(): void {
  for (const tab of Tabs.list) {
    colorizeTab(tab.id)
  }
}

const colorizeTabTimeouts: Record<ID, number> = {}
export function colorizeTabDebounced(tabId: ID, delayMS = 500): void {
  clearTimeout(colorizeTabTimeouts[tabId])
  colorizeTabTimeouts[tabId] = setTimeout(() => {
    delete colorizeTabTimeouts[tabId]
    colorizeTab(tabId)
  }, delayMS)
}

export function colorizeTab(tabId: ID): void {
  const tab = Tabs.byId[tabId]
  if (!tab) return

  const rTab = Tabs.reactive.byId[tab.id]
  if (!rTab) return

  let srcStr, color
  if (Settings.state.colorizeTabsSrc === 'domain') {
    srcStr = Utils.getDomainOf(tab.url)
    color = Utils.colorFromString(srcStr, 60)
  } else {
    const container = Containers.reactive.byId[tab.cookieStoreId]
    if (container) {
      color = CONTAINER_COLORS[container.color]
    } else {
      color = null
    }
  }

  rTab.color = color
}

export function colorizeBranches(): void {
  for (const tab of Tabs.list) {
    if (tab.isParent && tab.lvl === 0) colorizeBranch(tab.id)
  }
}

export function colorizeBranch(rootId: ID): void {
  const rootTab = Tabs.byId[rootId]
  if (!rootTab || rootTab.lvl > 0) return

  const rRootTab = Tabs.reactive.byId[rootTab.id]
  if (!rRootTab) return

  let srcStr
  if (Settings.state.colorizeTabsBranchesSrc === 'url') {
    srcStr = rootTab.url
  } else {
    srcStr = Utils.getDomainOf(rootTab.url)
  }

  const color = Utils.colorFromString(srcStr, 60)
  rRootTab.branchColor = color

  for (let i = rootTab.index + 1; i < Tabs.list.length; i++) {
    const tab = Tabs.list[i]
    if (tab.lvl === 0) break

    const rTab = Tabs.reactive.byId[tab.id]
    if (rTab) rTab.branchColor = color
  }
}

export function setBranchColor(tabId: ID): void {
  const tab = Tabs.byId[tabId]
  if (!tab) return
  if (tab.parentId === NOID) {
    if (tab.isParent) Tabs.colorizeBranch(tab.id)
    else {
      const rTab = Tabs.reactive.byId[tab.id]
      if (rTab?.branchColor) rTab.branchColor = null
    }
    return
  }

  let parent = Tabs.byId[tab.parentId]
  while (parent && parent.lvl > 0) {
    parent = Tabs.byId[parent.parentId]
  }
  if (!parent) return

  const rParent = Tabs.reactive.byId[parent.id]
  if (!rParent) return

  if (rParent.branchColor) {
    const rTab = Tabs.reactive.byId[tabId]
    if (rTab) rTab.branchColor = rParent.branchColor
  } else {
    Tabs.colorizeBranch(parent.id)
  }
}

export function setCustomColor(tabIds: ID[], color: string): void {
  Tabs.sortTabIds(tabIds)

  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    const rTab = Tabs.reactive.byId[id]
    if (!tab || !rTab) continue

    tab.customColor = color !== 'toolbar' ? color : undefined
    rTab.customColor = tab.customColor ?? null

    Tabs.saveTabData(tab.id)
  }

  Tabs.cacheTabsData()
}
