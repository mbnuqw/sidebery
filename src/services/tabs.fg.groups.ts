import type * as T from 'src/types'
import { GroupConfigResult } from 'src/enums'
import { DEFAULT_CONTAINER_ID, NOID, PAGE_HASH_RE } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Windows from 'src/services/windows.fg'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Favicons from 'src/services/favicons.fg'
import * as Logs from 'src/services/logs'
import * as Popups from 'src/services/popups.fg'
import * as AddonIPPC from 'src/services/ippc.addon'

/**
 * Set relGroupId prop in related pinned and group tabs
 */
export function linkGroupWithPinnedTab(groupTab: T.Tab, tabs: T.Tab[]): void {
  const info = new URL(groupTab.url)
  const pin = info.searchParams.get('pin')
  if (!pin) return

  const [ctx, url] = pin.split('::')
  let pinnedTab: T.Tab | undefined
  for (const tab of tabs) {
    if (!tab.pinned) break
    if (tab.pinned && tab.cookieStoreId === ctx && tab.url === url) {
      pinnedTab = tab
      break
    }
  }

  if (!pinnedTab) {
    info.searchParams.delete('pin')
    groupTab.url = info.href
    browser.tabs.update(groupTab.id, { url: info.href }).catch(err => {
      Logs.err('Tabs.linkGroupWithPinnedTab: Cannot update url:', err)
    })
    return
  }

  pinnedTab.relGroupId = groupTab.id
}

/**
 * ...
 */
export async function replaceRelGroupWithPinnedTab(
  groupTab: T.Tab,
  pinnedTab: T.Tab
): Promise<void> {
  await browser.tabs.move(pinnedTab.id, { index: groupTab.index - 1 })

  groupTab.parentId = pinnedTab.id
  Tabs.updateTabsTree()

  await browser.tabs.remove(groupTab.id)
}

/**
 * Group tabs
 */
export async function groupTabs(tabIds: ID[], conf?: T.NewGroupConfig): Promise<void> {
  Logs.info('Tabs.groupTabs')

  const noConfig = !conf
  if (!conf) conf = {}

  // Get sorted list of tabs
  const tabs = []
  for (const t of Tabs.list) {
    if (tabIds.includes(t.id)) tabs.push(t)
    else if (tabIds.includes(t.parentId)) {
      tabIds.push(t.id)
      tabs.push(t)
    }
  }

  if (!tabs.length) return
  if (Settings.state.tabsTreeLimit !== 'none' && tabs[0].lvl >= Settings.state.tabsTreeLimit) return

  // Find title for group tab
  if (!conf.title) {
    const titles = tabs.map(t => t.title)
    const commonPart = Utils.commonSubStr(titles)
    const isOk = commonPart ? commonPart[0] === commonPart[0].toUpperCase() : false
    let groupTitle = commonPart
      .replace(/^(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+/g, ' ')
      .replace(/(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+$/g, ' ')
      .trim()

    if (!isOk || groupTitle.length < 4) {
      const hosts = tabs.filter(t => !t.url.startsWith('about:')).map(t => t.url.split('/')[2])
      groupTitle = Utils.commonSubStr(hosts)
      if (groupTitle.startsWith('.')) groupTitle = groupTitle.slice(1)
      groupTitle = groupTitle.replace(/^www\./, '')
    }

    if (!isOk || groupTitle.length < 4) groupTitle = tabs[0].title

    conf.title = groupTitle
  }

  // Show config popup
  if (noConfig && Settings.state.showNewGroupConf) {
    const result = await Tabs.openGroupConfigPopup(conf)
    if (result === GroupConfigResult.Cancel) return
  }

  // Get panel
  const panelId = tabs[0].panelId
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  // Find index and create group tab
  Tabs.setNewTabPosition(tabs[0].index, tabs[0].parentId, tabs[0].panelId)
  const groupTab = await browser.tabs.create({
    active: !!conf.active,
    cookieStoreId: tabs[0].cookieStoreId,
    index: tabs[0].index,
    url: Utils.createGroupUrl(conf.title, conf?.pinnedTab?.url, conf?.pinnedTab?.cookieStoreId),
    windowId: Windows.id,
  })

  // Set link between group and pinned tabs
  if (conf.pinnedTab) {
    conf.pinnedTab.relGroupId = groupTab.id
  }

  // Move tabs if needed
  let properIndex = tabs[0].index
  const tabsToMove: T.Tab[] = []
  let indexToMoveTo = -1
  for (const tab of tabs) {
    if (tab.index !== properIndex) {
      if (indexToMoveTo === -1) indexToMoveTo = properIndex
      tabsToMove.push(tab)
    }
    properIndex++
  }
  const dst = { index: groupTab.index + 1, panelId: panel.id, parentId: groupTab.id }
  await Tabs.move(tabs, {}, dst)
}

export async function openGroupConfigPopup(config: T.NewGroupConfig): Promise<GroupConfigResult> {
  return new Promise<GroupConfigResult>(ok => {
    Popups.reactive.groupConfigPopup = {
      config,
      done: result => ok(result),
    }
  })
}

export function findGroupTabBoundToPinnedTab(pinnedTab: T.Tab): T.Tab | undefined {
  const param = encodeURIComponent(pinnedTab.cookieStoreId + '::' + pinnedTab.url)
  return Tabs.list.find(t => t.isGroup && t.url.lastIndexOf('pin=' + param) > -1)
}

function getPinInfo(groupUrl: string): T.GroupPin | undefined {
  if (!groupUrl.includes('pin=')) return

  const urlInfo = new URL(groupUrl)
  const pinValue = urlInfo.searchParams.get('pin')
  if (!pinValue) return

  const [ctr, url] = pinValue.split('::')
  const pinnedTab = Tabs.list.find(t => t.pinned && t.cookieStoreId === ctr && t.url === url)
  if (pinnedTab) {
    return {
      id: pinnedTab.id,
      title: pinnedTab.title,
      url: pinnedTab.url,
      favIconUrl: pinnedTab.favIconUrl ?? '',
    }
  }
}

/**
 * Get grouped tabs (for group page)
 */
export async function getGroupInfo(groupTabId: ID): Promise<T.GroupInfo | null> {
  if (!Tabs.ready) await Tabs.waitForTabsReady()
  if (!Favicons.ready) await Favicons.waitForFaviconsReady()

  const groupTab = Tabs.byId[groupTabId]
  if (!groupTab) {
    Logs.warn('Tabs.getGroupInfo: No group tab:', groupTabId)
    return null
  }

  const out: T.GroupInfo = { id: groupTab.id, tabs: [] as T.GroupedTabInfo[], favicons: {} }

  const parentTab = Tabs.byId[groupTab.parentId]
  if (parentTab && parentTab.isGroup) {
    out.parentId = parentTab.id
  }

  const pinInfo = getPinInfo(groupTab.url)
  if (pinInfo) out.pin = pinInfo

  let subGroupLvl = null
  for (let i = groupTab.index + 1; i < Tabs.list.length; i++) {
    const tab = Tabs.list[i]
    if (tab.lvl <= groupTab.lvl) break

    if (subGroupLvl && tab.lvl > subGroupLvl) continue
    else subGroupLvl = null
    if (tab.isGroup) subGroupLvl = tab.lvl

    const tabInfo = getGroupedTabInfo(tab, groupTab)
    const domain = Utils.getDomainOf(tab.url)
    if (tabInfo.favIconUrl && domain) {
      out.favicons[domain] = tabInfo.favIconUrl
      delete tabInfo.favIconUrl
    }
    out.tabs.push(tabInfo)
  }

  return out
}

export function getGroupTab(tab?: T.Tab): T.Tab | undefined {
  if (!tab) return
  if (!Settings.state.tabsTree && !tab.lvl) return

  let i = tab.lvl || 0
  while (i--) {
    tab = Tabs.byId[tab.parentId]
    if (!tab) return
    if (tab && tab.isGroup) return tab
  }
}

interface GroupOnClosingConf {
  ids: ID[]
  title: string
  active: boolean
}
let grouppingTimeout: number | undefined
const grouppingBuffers: Map<ID, GroupOnClosingConf> = new Map()
export function groupOnClosing(id: ID, title: string, active: boolean, childTabId: ID) {
  let conf = grouppingBuffers.get(id)
  if (!conf) {
    conf = { title, active, ids: [] }
    grouppingBuffers.set(id, conf)
  }
  conf.ids.push(childTabId)

  clearTimeout(grouppingTimeout)
  grouppingTimeout = setTimeout(() => {
    for (const [id, conf] of grouppingBuffers) {
      groupTabs(conf.ids, { title: conf.title, active: conf.active })
    }
    grouppingBuffers.clear()
  }, 250)
}

const updateGroupChildBuf = new WeakMap<T.Tab, { childIds?: Set<ID>; timerId?: number }>()

/**
 * Update group page info. Set childId to NOID for full update.
 */
export function updateGroupOrItsChild(groupTab: T.Tab, childId = NOID, delay = 500): void {
  Logs.info('tabs.fg.groups.updateGroupOrItsChild:', groupTab.id, childId, delay)

  if (!groupTab.isGroup) return

  let fullUpdate = childId === NOID
  let updInfo = updateGroupChildBuf.get(groupTab)

  // If the full update is already planned, mark this call as the full update too
  if (!fullUpdate && updInfo && updInfo.timerId && !updInfo.childIds) fullUpdate = true

  // Do not update if HashMessaging is used and there is lots of data
  if (groupTab.cookieStoreId !== DEFAULT_CONTAINER_ID) {
    const len = updInfo?.childIds?.size ?? 0
    if (fullUpdate || len > 25) return
  }

  // Create upd info / Clear timeout
  if (!updInfo) updateGroupChildBuf.set(groupTab, (updInfo = {}))
  else clearTimeout(updInfo.timerId)

  // On full update
  if (fullUpdate) {
    // Remove childIds
    if (updInfo.childIds) delete updInfo.childIds
  }

  // On children update
  else {
    // Append child for deferred update
    if (!updInfo.childIds) updInfo.childIds = new Set()
    updInfo.childIds.add(childId)
  }

  updInfo.timerId = setTimeout(() => {
    // Check target tab
    if (groupTab.discarded || !Tabs.byId[groupTab.id]) {
      delete updInfo.childIds
      delete updInfo.timerId
      return
    }

    // Update group children or perform a full update
    if (updInfo.childIds) updateGroupChildren(groupTab, updInfo.childIds)
    else updateGroup(groupTab)

    delete updInfo.childIds
    delete updInfo.timerId
  }, delay)
}

function updateGroupChildren(groupTab: T.Tab, childIds: Iterable<ID>) {
  const updatedTabs: T.GroupedTabInfo[] = []
  for (const cid of childIds) {
    const childTab = Tabs.byId[cid]
    if (!childTab) continue

    updatedTabs.push(getGroupedTabInfo(childTab, groupTab))
  }
  AddonIPPC.callGroupPage(groupTab, 'update', { updatedTabs })
}

function updateGroup(groupTab: T.Tab) {
  const tabsCount = Tabs.list.length
  const tabs: T.GroupedTabInfo[] = []
  let subGroupLvl = null

  for (let i = groupTab.index + 1; i < tabsCount; i++) {
    const tab = Tabs.list[i]
    if (tab.lvl <= groupTab.lvl) break

    if (subGroupLvl && tab.lvl > subGroupLvl) continue
    else subGroupLvl = null
    if (tab.isGroup) subGroupLvl = tab.lvl

    tabs.push(getGroupedTabInfo(tab, groupTab))
  }

  const msg: T.GroupUpdMsg = {
    windowId: Windows.id,
    parentId: groupTab.parentId,
    tabs,
  }

  const parentTab = Tabs.byId[groupTab.parentId]
  if (parentTab && parentTab.isGroup) {
    msg.parentId = parentTab.id
  }

  AddonIPPC.callGroupPage(groupTab, 'update', msg)
}

export function getGroupedTabInfo(tab: T.Tab, groupTab: T.Tab): T.GroupedTabInfo {
  const cachedFav = Favicons.getFavicon(tab.url)
  let favIconUrl = tab.favIconUrl ?? ''
  if (cachedFav && tab.favIconUrl && cachedFav.length < tab.favIconUrl.length) {
    favIconUrl = cachedFav
  }

  let title = tab.customTitle ?? tab.title
  if (title.length > 256) title = title.slice(0, 256) + '...'

  let url = tab.url
  if (url.length > 256) url = url.slice(0, 256) + '...'

  return {
    id: tab.id,
    url,
    title,
    index: tab.index - groupTab.index - 1,
    lvl: tab.lvl - groupTab.lvl - 1,
    discarded: !!tab.discarded,
    favIconUrl,
  }
}

export async function setGroupName(groupTabId: ID, newName: string) {
  Logs.info('Tabs.setGroupName', groupTabId, newName)
  const groupTab = Tabs.byId[groupTabId]
  if (!groupTab) return

  const isDiscarded = groupTab.discarded
  if (!isDiscarded) {
    await AddonIPPC.callGroupPage(groupTab, 'update', { title: newName })
    Logs.info('Tabs.setGroupName: url after IPPC:', groupTab.url)
  } else {
    const newUrl = groupTab.url.replace(PAGE_HASH_RE, `#${encodeURIComponent(newName)}`)
    if (newUrl === groupTab.url) return
    browser.tabs.update(groupTabId, { url: newUrl }).catch(err => Logs.warn('setGroupName:', err))
  }
}
