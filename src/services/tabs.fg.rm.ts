import { ItemInfo, RecentlyClosedTabInfo, Tab } from 'src/types'
import { NOID } from 'src/defaults'
import { translate } from 'src/dict'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Containers } from 'src/services/containers'
import { Settings } from 'src/services/settings'
import { Notifications } from 'src/services/notifications'
import { Selection } from 'src/services/selection'
import { Windows } from 'src/services/windows'
import * as Popups from 'src/services/popups'
import * as Favicons from 'src/services/favicons.fg'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

export function removeBranches(ids: ID[]): void {
  for (const tab of Tabs.list) {
    if (ids.includes(tab.parentId)) ids.push(tab.id)
  }
  removeTabs(ids)
}

/**
 * Remove tabs descendants
 */
export function removeTabsDescendants(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

  const toRm: ID[] = []
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab || tabIds.includes(tab.parentId)) continue
    for (let i = tab.index + 1, t; i < Tabs.list.length; i++) {
      t = Tabs.list[i]
      if (!t || t.lvl <= tab.lvl) break
      if (!toRm.includes(t.id)) toRm.push(t.id)
    }
  }

  removeTabs(toRm)
}

/**
 * Remove tabs above
 */
export function removeTabsAbove(tabIds?: ID[]): void {
  if (!tabIds) tabIds = [Tabs.activeId]
  if (!tabIds.length) return

  let minIndex = 999999
  let startTab
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab && tab.index < minIndex) {
      minIndex = tab.index
      startTab = tab
    }
  }

  if (!startTab || startTab.pinned) return

  const toRm = []
  for (let i = startTab.index; i--; ) {
    const tab = Tabs.list[i]
    if (!tab || tab.pinned || tab.panelId !== startTab.panelId) break
    toRm.push(tab.id)
  }

  removeTabs(toRm)
}

/**
 * Remove tabs below
 */
export function removeTabsBelow(tabIds?: ID[]): void {
  if (!tabIds) tabIds = [Tabs.activeId]
  if (!tabIds.length) return

  let maxIndex = -1
  let startTab
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab && tab.index > maxIndex) {
      maxIndex = tab.index
      startTab = tab
    }
  }

  if (!startTab || startTab.pinned) return

  const toRm = []
  for (let i = startTab.index + 1; i < Tabs.list.length; i++) {
    const tab = Tabs.list[i]
    if (!tab || tab.panelId !== startTab.panelId) break
    toRm.push(tab.id)
  }

  removeTabs(toRm)
}

/**
 * Remove other tabs
 */
export function removeOtherTabs(tabIds?: ID[]): void {
  if (!tabIds) tabIds = [Tabs.activeId]
  if (!tabIds.length) return

  const firstTabId = tabIds[0]
  if (firstTabId === undefined) return

  const firstTab = Tabs.byId[firstTabId]
  if (!firstTab || firstTab.pinned) return

  const panel = Sidebar.panelsById[firstTab.panelId]
  if (!Utils.isTabsPanel(panel)) return
  const panelTabs = panel.tabs
  const toRm = []
  for (const tab of panelTabs) {
    if (!tabIds.includes(tab.id)) toRm.push(tab.id)
  }

  removeTabs(toRm)
}

const RECENTLY_REMOVED_LIMIT_MIN = 100
const RECENTLY_REMOVED_LIMIT_MAX = 150
export function rememberRemoved(tabs: Tab[]) {
  let minLvl = 0
  let parent
  let parentIndex = 0

  const timestamp = Date.now()

  for (const tab of tabs) {
    if (tab.reopening) continue

    if (tab.parentId === NOID || tab.parentId !== parent?.id) parent = undefined

    // If tab has parent
    if (tab.parentId !== NOID && tab.parentId !== parent?.id) {
      // Try to find it in recently removed
      const index = Tabs.recentlyRemoved.findIndex(t => t.id === tab.parentId)
      if (index !== -1) {
        parent = Tabs.recentlyRemoved[index] as RecentlyClosedTabInfo
        if (!parent.isParent) parent.isParent = true
        parentIndex = index
      } else {
        parent = undefined
      }
    }

    // Set lowest level of the branch to shift result level if parent is not found
    if (tab.parentId !== NOID && !parent) minLvl = tab.lvl
    else if (tab.parentId === NOID) minLvl = 0

    // Update insertion index
    if (!parent) parentIndex = 0
    else parentIndex++

    const removedTabInfo: RecentlyClosedTabInfo = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      parentId: parent?.id ?? NOID,
      isParent: false,
      lvl: parent ? tab.lvl - minLvl : 0,
      containerId: tab.cookieStoreId,
      containerColor: Containers.reactive.byId[tab.cookieStoreId]?.color,
      favIconUrl: tab.favIconUrl,
      favPlaceholder: Favicons.getFavPlaceholder(tab.url),
      time: timestamp,
    }

    Tabs.recentlyRemoved.splice(parentIndex, 0, removedTabInfo)
  }

  // Limit recentlyRemoved list
  if (Tabs.recentlyRemoved.length > RECENTLY_REMOVED_LIMIT_MAX) {
    Tabs.recentlyRemoved = Tabs.recentlyRemoved.slice(0, RECENTLY_REMOVED_LIMIT_MIN)
  }

  Tabs.reactive.recentlyRemovedLen = Tabs.recentlyRemoved.length
}

/**
 * Remove tabs
 */
export async function removeTabs(
  tabIds: ID[],
  silent?: boolean,
  removedParent?: Tab
): Promise<void> {
  if (!tabIds || !tabIds.length) return

  const firstTabId = tabIds[0]
  if (firstTabId === undefined) return

  const firstTab = Tabs.byId[firstTabId]
  if (!firstTab) return

  const panelId = firstTab.panelId
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  Tabs.sortTabIds(tabIds)

  const rmChildTabsFolded = Settings.state.rmChildTabs === 'folded'
  const rmChildTabsFoldedAll = Settings.state.rmChildTabs === 'all'
  const tabsMap: Record<ID, Tab> = {}
  const tabs: Tab[] = []
  const toRemove: ID[] = []
  let hasInvisibleTab = false
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) continue
    if (tab.panelId !== panelId) continue

    if (!tabsMap[tab.id]) {
      tabsMap[id] = tab
      tabs.push(tab)
      toRemove.push(id)
      if (tab.invisible) hasInvisibleTab = true
    }

    if ((rmChildTabsFolded && tab.folded) || rmChildTabsFoldedAll) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (!t || t.lvl <= tab.lvl) break
        if (!tabsMap[t.id]) {
          tabsMap[t.id] = t
          tabs.push(t)
          toRemove.push(t.id)
          if (t.invisible) hasInvisibleTab = true
        }
      }
    }
  }

  let count = tabs.length
  const warn =
    Settings.state.warnOnMultiTabClose === 'any' ||
    (hasInvisibleTab && Settings.state.warnOnMultiTabClose === 'collapsed')
  if (!silent && warn && count > 1) {
    const pre = translate('confirm.tabs_close_pre', count)
    const post = translate('confirm.tabs_close_post', count)
    const ok = await Popups.confirm(pre + String(count) + post)
    if (!ok) {
      Tabs.updateTabsTree(panel.startTabIndex, panel.nextTabIndex)
      return
    }
  }

  // Set tabs to be removed
  const parents: Record<ID, ID> = {}
  const lastTabToo = panel.tabs[panel.tabs.length - 1]?.id === tabs[count - 1]?.id
  let visibleLen = 0
  let activeTab: Tab | undefined

  tabs.forEach(t => {
    parents[t.id] = t.parentId
    if (!t.invisible) visibleLen++
    t.invisible = true
    if (t.active) activeTab = t
  })

  if (tabs.length === 1) Sidebar.removeFromVisibleTabs(tabs[0].panelId, tabs[0].id)
  else Sidebar.recalcVisibleTabs(tabs[0]?.panelId ?? NOID)

  const tabsInfo = Tabs.getTabsInfo(toRemove, true)

  if (Tabs.removingTabs && Tabs.removingTabs.length) {
    Tabs.removingTabs = [...Tabs.removingTabs, ...toRemove]
  } else {
    Tabs.removingTabs = [...toRemove]
  }

  // Remember removed tabs
  Tabs.rememberRemoved(tabs)

  // No-empty panels
  if (count === panel.reactive.len && panel.noEmpty) {
    Tabs.createTabInPanel(panel)
  }

  // Update successorTabId if there is an active tab
  if (activeTab) Tabs.updateSuccessionDebounced(0, toRemove)

  if (!silent && count > 1 && Settings.state.tabsRmUndoNote && !warn) {
    if (removedParent) {
      const parentInfo = Tabs.getTabInfo(removedParent.id, true)
      if (parentInfo) {
        parents[removedParent.id] = removedParent.parentId
        tabsInfo.unshift(parentInfo)
        count++
      }
    }

    const nTabs = count > 3 ? tabsInfo.slice(0, 2) : tabsInfo
    let detailsList = nTabs.map(t => {
      return '- ' + t.title
    })
    if (count > 3) detailsList = detailsList.concat('- ...')

    Notifications.notify({
      icon: '#icon_trash',
      title: String(count) + translate('notif.tabs_rm_post', count),
      detailsList,
      ctrl: translate('notif.undo_ctrl'),
      callback: async () => undoRemove(tabsInfo, parents),
    })
  }

  if (!Selection.isSet() && visibleLen > 0) {
    Tabs.incrementScrollRetainer(panel, lastTabToo ? visibleLen - 1 : visibleLen)
  }

  // Reverse removing order (needed for reopening)
  toRemove.reverse()

  browser.tabs.remove(toRemove).catch(err => {
    Logs.err('Tabs.removeTabs: Cannot remove tabs:', err)
  })
  checkRemovedTabs()
}

let isRmFinishedInterval: number | undefined
/**
 * Checks if there is no more removing tabs with polling Tabs.removingTabs.length
 * @param checkDelay - (default: 100ms) Polling interval in ms.
 * @param stopThreshold - (default: 3) Max count of the checks with the same length of removingTabs
 *                                     after which this function will return false.
 */
export function isRemovingFinished(checkDelay = 100, stopThreshold = 3): Promise<boolean> {
  clearInterval(isRmFinishedInterval)

  let prevLen = Tabs.removingTabs.length
  let sameCounter = 0

  return new Promise(res => {
    isRmFinishedInterval = setInterval(() => {
      if (Tabs.removingTabs.length === prevLen) sameCounter++
      prevLen = Tabs.removingTabs.length

      if (Tabs.removingTabs.length === 0) {
        clearInterval(isRmFinishedInterval)
        res(true)
      }
      if (sameCounter >= stopThreshold) {
        clearInterval(isRmFinishedInterval)
        res(false)
      }
    }, checkDelay)
  })
}

export async function undoRemove(tabs: ItemInfo[], parents: Record<ID, ID>): Promise<void> {
  const firstTab = tabs[0]
  if (!firstTab) return

  const panel = Sidebar.panelsById[firstTab.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) return

  const nextTabIndex = panel.nextTabIndex
  const oldNewIds: Record<ID, ID> = {}
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const index = nextTabIndex + i

    let parentId = oldNewIds[parents[tab.id]]
    const parent = Tabs.byId[parents[tab.id]]
    if (parentId === undefined && parent && parent.index < index) {
      parentId = parent.id
    }

    Tabs.setNewTabPosition(index, parentId, panel.id)

    const conf: browser.tabs.CreateProperties = {
      windowId: Windows.id,
      index,
      url: Utils.normalizeUrl(tab.url, tab.title),
      cookieStoreId: tab.container,
      active: false,
    }
    if (conf.url) {
      conf.discarded = true
      conf.title = tab.title
    }
    const newTab = await browser.tabs.create(conf)
    oldNewIds[tab.id] = newTab.id
  }
}

let checkRemovedTabsTimeout: number | undefined
/**
 * Helper function for checking if some of tabs
 * wasn't removed (e.g. tabs with onbeforeunload)
 */
export function checkRemovedTabs(delay = 750): void {
  clearTimeout(checkRemovedTabsTimeout)
  checkRemovedTabsTimeout = setTimeout(async () => {
    if (!Tabs.removingTabs || !Tabs.removingTabs.length) return
    const panelIds = new Set<ID>()
    const checking: Promise<void>[] = []

    for (const tabId of Tabs.removingTabs) {
      const t = Tabs.byId[tabId]
      if (t) panelIds.add(t.panelId)

      const checkingTab = browser.tabs
        .get(tabId)
        .then(() => {
          const tab = Tabs.byId[tabId]
          if (tab) {
            const parent = Tabs.byId[tab.parentId]

            tab.reactive.lvl = tab.lvl = parent ? parent.lvl + 1 : 0
            tab.invisible = false

            const rmIndex = Tabs.removingTabs.indexOf(tab.id)
            if (rmIndex !== -1) Tabs.removingTabs.splice(rmIndex, 1)
          }
        })
        .catch(() => {
          // Tab already removed
        })

      checking.push(checkingTab)
    }

    await Promise.all(checking)

    for (const panelId of panelIds) {
      Sidebar.recalcVisibleTabs(panelId)
    }
  }, delay)
}

/**
 * Undo remove tab
 */
export async function undoRmTab(): Promise<void> {
  const closed = await browser.sessions.getRecentlyClosed()
  if (closed && closed.length) {
    const session = closed.find(c => c.tab)
    if (session && session.tab?.sessionId) await browser.sessions.restore(session.tab.sessionId)
  }
}
