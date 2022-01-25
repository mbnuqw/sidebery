import Utils from 'src/utils'
import { Tab, SavedGroup, GroupConfig, GroupInfo, GroupedTabInfo, TabCache } from 'src/types'
import { GroupUpdateInfo } from 'src/types'
import { NOID, CONTAINER_ID, GROUP_URL } from 'src/defaults'
import { Logs } from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { Settings } from 'src/services/settings'
import { Tabs } from './tabs.fg'

/**
 * Recreate group tabs
 */
export async function recreateParentGroups(
  tabs: Tab[],
  groups: (SavedGroup | TabCache)[],
  idsMap: Record<ID, ID>,
  index: number
): Promise<void> {
  for (let group, j = 0; j < groups.length; j++) {
    group = groups[j]
    const groupId = Utils.getGroupId(group.url)
    const rawTitle = groupId.slice(0, -16)
    const groupRawParams = Utils.getGroupRawParams(group.url)
    const groupUrl = browser.runtime.getURL('page.group/group.html')
    const url = `${groupUrl}${groupRawParams}#${groupId}`
    const discarded = group.ctx === CONTAINER_ID || !group.ctx
    const groupTab = (await browser.tabs.create({
      windowId: Windows.id,
      index: index + j,
      url,
      cookieStoreId: group.ctx,
      active: false,
      discarded,
      title: discarded ? decodeURI(rawTitle) : undefined,
    })) as Tab
    groupTab.url = url

    if (url.startsWith(GROUP_URL)) linkGroupWithPinnedTab(groupTab, tabs)

    Tabs.normalizeTab(groupTab, NOID)

    tabs.splice(index + j, 0, groupTab)
    groupTab.panelId = group.panelId || NOID
    if (group.parentId === undefined) group.parentId = NOID
    if (idsMap[group.parentId] >= 0) groupTab.parentId = idsMap[group.parentId]
    groupTab.folded = !!group.folded
    idsMap[group.id] = groupTab.id

    Tabs.byId[groupTab.id] = groupTab
    Tabs.reactive.byId[groupTab.id] = Tabs.toReactive(groupTab)
  }

  Logs.info(`Recreated ${groups.length} groups at ${index} index`)
}

/**
 * Set relGroupId and relPinId props in related pinned and group tabs
 */
export function linkGroupWithPinnedTab(groupTab: Tab, tabs: Tab[]): void {
  // console.log('[DEBUG] tabs.linkGroupWithPinnedTab()')
  const info = new URL(groupTab.url)
  const pin = info.searchParams.get('pin')
  if (!pin) return

  const [ctx, url] = pin.split('::')
  const pinnedTab = tabs.find(t => t.pinned && t.cookieStoreId === ctx && t.url === url)
  if (!pinnedTab) {
    info.searchParams.delete('pin')
    groupTab.url = info.href
    browser.tabs.update(groupTab.id, { url: info.href })
    return
  }

  pinnedTab.relGroupId = groupTab.id
  groupTab.relPinId = pinnedTab.id
}

/**
 * ...
 */
export async function replaceRelGroupWithPinnedTab(groupTab: Tab, pinnedTab: Tab): Promise<void> {
  // console.log('[DEBUG] tabs.replaceRelGroupWithPinnedTab()')
  await browser.tabs.move(pinnedTab.id, { index: groupTab.index - 1 })
  Utils.sleep(120)

  groupTab.parentId = pinnedTab.id
  Tabs.updateTabsTree()

  await browser.tabs.remove(groupTab.id)
}

let saveGroupsTimeout: number | undefined
export function saveGroups(delay = 300): void {
  // console.log('[DEBUG] tabs.saveGroups()')
  clearTimeout(saveGroupsTimeout)
  saveGroupsTimeout = setTimeout(() => {
    const groups: Record<ID, SavedGroup> = {}

    for (const tab of Tabs.list) {
      if (!Utils.isGroupUrl(tab.url)) continue
      const prevTab = Tabs.list[tab.index - 1]
      const nextTab = Tabs.list[tab.index + 1]
      const groupInfo: SavedGroup = {
        id: tab.id,
        index: tab.index,
        ctx: tab.cookieStoreId,
        panelId: tab.panelId,
        parentId: tab.parentId,
        folded: tab.folded,
        url: tab.url,
      }
      if (prevTab) groupInfo.prevTab = prevTab.id
      if (nextTab) groupInfo.nextTab = nextTab.id
      groups[tab.id] = groupInfo
    }

    browser.sessions.setWindowValue(Windows.id, 'groups', groups)
  }, delay)
}

/**
 * Group tabs
 */
export async function groupTabs(tabIds: ID[], conf: GroupConfig = {}): Promise<void> {
  // Get tabs
  const tabs = []
  for (const t of Tabs.list) {
    if (tabIds.includes(t.id)) tabs.push(t)
    else if (tabIds.includes(t.parentId)) {
      tabIds.push(t.id)
      tabs.push(t)
    }
  }

  if (!tabs.length) return
  if (tabs[0].lvl >= Settings.reactive.tabsTreeLimit) return

  // Find title for group tab
  let groupTitle
  if (conf.title) {
    groupTitle = conf.title
  } else {
    const titles = tabs.map(t => t.title)
    const commonPart = Utils.commonSubStr(titles)
    const isOk = commonPart ? commonPart[0] === commonPart[0].toUpperCase() : false
    groupTitle = commonPart
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
  }

  // Find index and create group tab
  Tabs.setNewTabPosition(tabs[0].index, tabs[0].parentId, tabs[0].panelId)
  const groupTab = await browser.tabs.create({
    active: !!conf.active,
    cookieStoreId: tabs[0].cookieStoreId,
    index: tabs[0].index,
    openerTabId: tabs[0].parentId < 0 ? undefined : tabs[0].parentId,
    url: Utils.createGroupUrl(groupTitle, conf),
    windowId: Windows.id,
  })

  // Set link between group and pinned tabs
  if (conf.pinnedTab) {
    conf.pinnedTab.relGroupId = groupTab.id
    setTimeout(() => {
      const localTab = Tabs.byId[groupTab.id]
      if (localTab && conf.pinnedTab) localTab.relPinId = conf.pinnedTab.id
    }, 500)
  }

  // Update parent of selected tabs
  tabs[0].parentId = groupTab.id
  for (let i = 1; i < tabs.length; i++) {
    const tab = tabs[i]
    const rTab = Tabs.reactive.byId[tab.id]

    if (tab.lvl <= tabs[0].lvl) {
      tab.parentId = groupTab.id
      tab.folded = false
      if (rTab) rTab.folded = false
    }
  }
  Tabs.updateTabsTree(tabs[0].index - 2, tabs[tabs.length - 1].index + 1)

  tabs.forEach(t => Tabs.saveTabData(t.id))
  Tabs.cacheTabsData()
}

/**
 * Get grouped tabs (for group page)
 */
export function getGroupInfo(groupTabId: ID): GroupInfo | null {
  const groupTab = Tabs.byId[groupTabId]
  if (!groupTab) return null

  const out: GroupInfo = {
    id: groupTab.id,
    index: groupTab.index,
    len: 0,
    tabs: [] as GroupedTabInfo[],
  }

  const parentTab = Tabs.reactive.byId[groupTab.parentId]
  if (parentTab && Utils.isGroupUrl(parentTab.url)) {
    out.parentId = parentTab.id
  }

  if (groupTab.url.includes('pin=')) {
    const urlInfo = new URL(groupTab.url)
    const pin = urlInfo.searchParams.get('pin')
    if (pin) {
      const [ctr, url] = pin.split('::')
      const pinnedTab = Tabs.list.find(t => t.pinned && t.cookieStoreId === ctr && t.url === url)
      if (pinnedTab) {
        out.pin = {
          id: pinnedTab.id,
          title: pinnedTab.title,
          url: pinnedTab.url,
          favIconUrl: pinnedTab.favIconUrl ?? '',
        }
      }
    }
  }

  let subGroupLvl = null
  for (let i = groupTab.index + 1; i < Tabs.list.length; i++) {
    const tab = Tabs.list[i]
    if (tab.lvl <= groupTab.lvl) break
    out.len++

    if (subGroupLvl && tab.lvl > subGroupLvl) continue
    else subGroupLvl = null
    if (Utils.isGroupUrl(tab.url)) subGroupLvl = tab.lvl

    out.tabs.push({
      id: tab.id,
      index: tab.index,
      lvl: tab.lvl - groupTab.lvl - 1,
      title: tab.title,
      url: tab.url,
      discarded: !!tab.discarded,
      favIconUrl: tab.favIconUrl ?? '',
    })
  }

  return out
}

export function getGroupTab(tab?: Tab): Tab | undefined {
  if (!tab) return
  if (!Settings.reactive.tabsTree && !tab.lvl) return

  let i = tab.lvl || 0
  while (i--) {
    tab = Tabs.byId[tab.parentId]
    if (!tab) return
    if (tab && Utils.isGroupUrl(tab.url)) return tab
  }
}

let updateGroupTabTimeout: number | undefined
export function resetUpdateGroupTabTimeout(): void {
  clearTimeout(updateGroupTabTimeout)
}
export function updateGroupTab(groupTab: Tab): void {
  clearTimeout(updateGroupTabTimeout)
  updateGroupTabTimeout = setTimeout(() => {
    const tabsCount = Tabs.list.length
    const tabs: GroupedTabInfo[] = []
    let subGroupLvl = null
    let len = 0

    for (let i = groupTab.index + 1; i < tabsCount; i++) {
      const tab = Tabs.list[i]
      if (tab.lvl <= groupTab.lvl) break
      len++

      if (subGroupLvl && tab.lvl > subGroupLvl) continue
      else subGroupLvl = null
      if (Utils.isGroupUrl(tab.url)) subGroupLvl = tab.lvl

      tabs.push({
        id: tab.id,
        index: tab.index,
        lvl: tab.lvl - groupTab.lvl - 1,
        title: tab.title,
        url: tab.url,
        discarded: !!tab.discarded,
        favIconUrl: tab.favIconUrl ?? '',
      })
    }

    const msg: GroupUpdateInfo = {
      name: 'update',
      id: groupTab.id,
      index: groupTab.index,
      len,
      tabs,
    }

    const parentTab = Tabs.reactive.byId[groupTab.parentId]
    if (parentTab && Utils.isGroupUrl(parentTab.url)) {
      msg.parentId = parentTab.id
    }

    browser.tabs.sendMessage(groupTab.id, msg).catch(() => {
      /** itsokay **/
    })
  }, 256)
}

export function updateActiveGroupPage(): void {
  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return
  if (Utils.isGroupUrl(activeTab.url)) {
    updateGroupTab(activeTab)
  }
}
