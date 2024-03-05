import * as Logs from 'src/services/logs'
import { Tabs } from 'src/services/tabs.fg'
import { Sidebar } from './sidebar'
import { Settings } from './settings'
import { isTabsPanel } from 'src/utils'
import { NativeTab, Tab } from 'src/types'
import { Windows } from './windows'
import { Notifications } from './notifications'
import { translate } from 'src/dict'

export const enum By {
  Title = 1,
  Url = 2,
  ATime = 3,
}

let stopSorting = false

export async function sort(type: By, ids: ID[], dir = 0, tree?: boolean) {
  if (!ids.length || !dir) return

  if (tree) {
    // Include child tabs
    const treeIds: Set<ID> = new Set()
    for (const id of ids) {
      const tab = Tabs.byId[id]
      if (!tab || treeIds.has(tab.id)) continue
      treeIds.add(tab.id)
      if (tab.isParent) Tabs.getBranch(tab, false).forEach(t => treeIds.add(t.id))
    }
    ids = Array.from(treeIds)
  } else {
    // Exclude invisible (folded) tabs
    ids = ids.filter(id => {
      const tab = Tabs.byId[id]
      return !tab?.invisible
    })

    // Normalize selection with only one tab: Select all siblings
    if (ids.length === 1) {
      const siblings = getSiblings(ids[0])
      if (!siblings) return
      ids = siblings
    }
  }

  // Sort input
  Tabs.sortTabIds(ids)

  // Split by sorting chunks (per parent tab) and reverse them
  const sortingChunks = getSortingChunks(ids).reverse()

  // Lock sidebar and show progress notification
  Tabs.sorting = true
  let progressNotification
  stopSorting = false
  if (sortingChunks.length > 1 || ids.length > 2) {
    progressNotification = Notifications.progress({
      icon: getNotifIcon(By.Title, dir),
      title: translate('notif.tabs_sort'),
      progress: { percent: -1 },
      unconcealed: true,
      ctrl: translate('btn.stop'),
      callback: () => {
        stopSorting = true
      },
    })
  }

  // Sort by title
  if (type === By.Title) {
    const collatorOptions = { numeric: true }
    await sortTabsInChunks(sortingChunks, (aId, bId) => {
      const aTab = Tabs.byId[aId]
      const bTab = Tabs.byId[bId]
      if (!aTab || !bTab) return 0
      const aTitle = aTab.customTitle ?? aTab.title
      const bTitle = bTab.customTitle ?? bTab.title
      if (Settings.state.sortGroupsFirst && aTab.isGroup !== bTab.isGroup) {
        return aTab.isGroup ? -1 : 1
      }
      if (dir > 0) return aTitle.localeCompare(bTitle, undefined, collatorOptions)
      else return bTitle.localeCompare(aTitle, undefined, collatorOptions)
    }).catch(() => {})
  }

  // or Sort by URL
  else if (type === By.Url) {
    const collatorOptions = { numeric: true }
    const sortableLinks = new Map<ID, string>()
    await sortTabsInChunks(sortingChunks, (aId, bId) => {
      const aTab = Tabs.byId[aId]
      const bTab = Tabs.byId[bId]
      if (!aTab || !bTab) return 0
      if (Settings.state.sortGroupsFirst && aTab.isGroup !== bTab.isGroup) {
        return aTab.isGroup ? -1 : 1
      }
      const aLink = getSortableLink(sortableLinks, aTab)
      const bLink = getSortableLink(sortableLinks, bTab)
      if (dir > 0) return aLink.localeCompare(bLink, undefined, collatorOptions)
      else return bLink.localeCompare(aLink, undefined, collatorOptions)
    }).catch(() => {})
  }

  // or Sort by access time
  else if (type === By.ATime) {
    await sortTabsInChunks(sortingChunks, (aId, bId) => {
      const aTab = Tabs.byId[aId]
      const bTab = Tabs.byId[bId]
      if (!aTab || !bTab) return 0
      if (Settings.state.sortGroupsFirst && aTab.isGroup !== bTab.isGroup) {
        return aTab.isGroup ? -1 : 1
      }
      if (dir > 0) return aTab.lastAccessed - bTab.lastAccessed
      else return bTab.lastAccessed - aTab.lastAccessed
    }).catch(() => {})
  }

  // Unlock sidebar and hide progress notification
  if (progressNotification) Notifications.finishProgress(progressNotification)
  Tabs.sorting = false
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []
}

function getSortableLink(sortableUrls: Map<ID, string>, tab: Tab): string {
  let value = sortableUrls.get(tab.id)
  if (!value) {
    let parsedUrl
    try {
      parsedUrl = new URL(tab.url)
    } catch {
      return tab.url
    }
    const reversedHostname = parsedUrl.hostname.split('.').reverse().join('.')
    const hIndex = parsedUrl.protocol.length + 2
    const pIndex = tab.url.indexOf('/', hIndex)
    if (pIndex === -1) value = reversedHostname
    else value = reversedHostname + tab.url.slice(pIndex)
    sortableUrls.set(tab.id, value)
  }
  return value
}

function getNotifIcon(type: By, dir = 0): string | undefined {
  if (!dir) return

  let notifIcon: string | undefined
  if (type === By.Title) {
    if (dir > 0) notifIcon = '#icon_sort_name_asc'
    else notifIcon = '#icon_sort_name_des'
  } else if (type === By.Url) {
    if (dir > 0) notifIcon = '#icon_sort_url_asc'
    else notifIcon = '#icon_sort_url_des'
  } else if (type === By.ATime) {
    if (dir > 0) notifIcon = '#icon_sort_time_asc'
    else notifIcon = '#icon_sort_time_des'
  }

  return notifIcon
}

function getSiblings(id: ID): ID[] | undefined {
  const tab = Tabs.byId[id]
  if (!tab) return

  const panel = Sidebar.panelsById[tab.panelId]

  // Global pinned tabs
  if (tab.pinned && Settings.state.pinnedTabsPosition !== 'panel') {
    return Tabs.pinned.map(t => t.id)
  }

  // In panel pinned tabs
  else if (tab.pinned && isTabsPanel(panel)) {
    return panel.pinnedTabs.map(t => t.id)
  }

  // Normal tabs
  else if (isTabsPanel(panel)) {
    return panel.tabs.filter(t => t.parentId === tab.parentId).map(t => t.id)
  } else {
    return
  }
}

function getSortingChunks(ids: ID[]): ID[][] {
  const groups: ID[][] = []
  const parentIndexes: Partial<Record<ID, number>> = {}

  for (const id of ids) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    // Immediately return pinned tabs group
    if (tab.pinned) return [ids]

    let index = parentIndexes[tab.parentId]
    if (index === undefined) {
      index = groups.push([id]) - 1
      parentIndexes[tab.parentId] = index
    } else {
      groups[index].push(id)
    }
  }

  return groups
}

async function sortTabsInChunks(sortingGroups: ID[][], sortFn: (a: ID, b: ID) => number) {
  let tabProbe: Tab | undefined

  for (const group of sortingGroups) {
    if (group.length <= 1) continue

    // Get target index
    const startTab = Tabs.byId[group[0]]
    const startIndex = startTab?.index
    if (!startTab || startIndex === undefined) continue
    if (!tabProbe) tabProbe = startTab

    // Get list of tabs to cut (including child tabs)
    const branches: Record<ID, Tab[]> = {}
    const toCut: Tab[] = []
    for (const id of group) {
      const tab = Tabs.byId[id]
      if (!tab) continue
      toCut.push(tab)
      if (tab.isParent) {
        const branch = Tabs.getBranch(tab, false)
        branches[tab.id] = branch
        toCut.push(...branch)
      }
    }

    // Cut tabs from local list (reversely)
    for (let i = toCut.length; i--; ) {
      const tab = toCut[i]
      if (!tab) continue

      tab.moving = true
      Tabs.list.splice(tab.index, 1)
    }

    // Sort
    group.sort(sortFn)

    // Get list of tabs to paste (including child tabs)
    const toPaste: Tab[] = []
    for (const id of group) {
      const tab = Tabs.byId[id]
      if (!tab) continue
      toPaste.push(tab)
      const branch = branches[tab.id]
      if (branch) toPaste.push(...branch)
    }

    // Paste tabs to the new index
    Tabs.list.splice(startIndex, 0, ...toPaste)

    // Update indexes
    Tabs.updateTabsIndexes(startIndex)

    // Move native tabs
    const toPasteIds = toPaste.map(t => t.id)
    try {
      await browser.tabs.move(toPasteIds, { index: startIndex, windowId: Windows.id })
    } catch (err) {
      Logs.err('Tabs.sortNativeTabs: Cannot move tabs', err)
      return Tabs.reinitTabs()
    }
    toPaste.forEach(t => (t.moving = undefined))

    if (stopSorting) {
      stopSorting = false
      break
    }
  }

  // Update internal state
  Tabs.updateTabsTree()
  Sidebar.recalcTabsPanels()
  if (tabProbe && !tabProbe.pinned) {
    Sidebar.recalcVisibleTabs(tabProbe.panelId)
  }
}
