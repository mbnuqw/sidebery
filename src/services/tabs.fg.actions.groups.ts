import Utils from 'src/utils'
import { Tab, GroupConfig, GroupInfo, GroupedTabInfo } from 'src/types'
import { GroupUpdateInfo } from 'src/types'
import { Windows } from 'src/services/windows'
import { Settings } from 'src/services/settings'
import { Tabs } from './tabs.fg'
import { Favicons } from './favicons'
import { GroupConfigResult, Sidebar } from './sidebar'
import { IPC } from './ipc'
import { Logs } from './logs'

/**
 * Set relGroupId and relPinId props in related pinned and group tabs
 */
export function linkGroupWithPinnedTab(groupTab: Tab, tabs: Tab[]): void {
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
  await browser.tabs.move(pinnedTab.id, { index: groupTab.index - 1 })
  Utils.sleep(120)

  groupTab.parentId = pinnedTab.id
  Tabs.updateTabsTree()

  await browser.tabs.remove(groupTab.id)
}

/**
 * Group tabs
 */
export async function groupTabs(tabIds: ID[], conf?: GroupConfig): Promise<void> {
  const noConfig = !conf
  if (!conf) conf = {}

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
  if (tabs[0].lvl >= Settings.state.tabsTreeLimit) return

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
  if (noConfig) {
    const result = await Tabs.openGroupConfigPopup(conf)
    if (result === GroupConfigResult.Cancel) return
  }

  // Find index and create group tab
  Tabs.setNewTabPosition(tabs[0].index, tabs[0].parentId, tabs[0].panelId)
  const groupTab = await browser.tabs.create({
    active: !!conf.active,
    cookieStoreId: tabs[0].cookieStoreId,
    index: tabs[0].index,
    url: Utils.createGroupUrl(conf.title, conf),
    windowId: Windows.id,
  })

  // Set link between group and pinned tabs
  if (conf.pinnedTab) {
    conf.pinnedTab.relGroupId = groupTab.id
    setTimeout(() => {
      const localTab = Tabs.byId[groupTab.id]
      if (localTab && conf?.pinnedTab) localTab.relPinId = conf.pinnedTab.id
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

export async function openGroupConfigPopup(config: GroupConfig): Promise<GroupConfigResult> {
  return new Promise<GroupConfigResult>(ok => {
    Sidebar.reactive.groupConfigPopup = {
      config,
      done: result => ok(result),
    }
  })
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
  if (parentTab && parentTab.isGroup) {
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
    if (tab.isGroup) subGroupLvl = tab.lvl

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
  if (!Settings.state.tabsTree && !tab.lvl) return

  let i = tab.lvl || 0
  while (i--) {
    tab = Tabs.byId[tab.parentId]
    if (!tab) return
    if (tab && tab.isGroup) return tab
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
      if (tab.isGroup) subGroupLvl = tab.lvl

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
    if (parentTab && parentTab.isGroup) {
      msg.parentId = parentTab.id
    }

    IPC.groupPage(groupTab.id, msg)
  }, 256)
}

export function updateActiveGroupPage(): void {
  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return
  if (activeTab.isGroup) {
    updateGroupTab(activeTab)
  }
}

const updateGroupChildTimeouts: Record<ID, number> = {}
export function updateGroupChild(groupId: ID, childId: ID, delay = 250): void {
  clearTimeout(updateGroupChildTimeouts[childId])
  updateGroupChildTimeouts[childId] = setTimeout(() => {
    const groupTab = Tabs.byId[groupId]
    const childTab = Tabs.byId[childId]
    if (!groupTab || groupTab.discarded || !childTab) return

    const updateData = {
      name: 'updateTab',
      id: childTab.id,
      status: childTab.status,
      title: childTab.title,
      url: childTab.url,
      lvl: childTab.lvl - groupTab.lvl - 1,
      discarded: childTab.discarded,
      favIconUrl: childTab.favIconUrl || Favicons.getFavicon(childTab.url),
    }
    IPC.groupPage(groupTab.id, updateData)
  }, delay)
}
