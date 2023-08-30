import { DragInfo, DstPlaceInfo, ItemInfo, Panel, PanelType, Tab, TabsPanel } from 'src/types'
import { ASKID, CONTAINER_ID, GROUP_URL, INITIAL_TITLE_RE, NEWID, NOID } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import * as IPC from 'src/services/ipc'
import * as Popups from 'src/services/popups'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

/**
 * Create tab after another tab
 */
export function createTabAfter(tabId: ID): void {
  // Get target tab
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  // Get index and parentId for new tab
  const parentId = targetTab.parentId
  let index = targetTab.index + 1
  while (Tabs.list[index] && Tabs.list[index].lvl > targetTab.lvl) {
    index++
  }

  Tabs.setNewTabPosition(index, parentId, targetTab.panelId)

  browser.tabs
    .create({
      index,
      cookieStoreId: targetTab.cookieStoreId,
      windowId: Windows.id,
    })
    .catch(err => {
      Logs.err('Tabs.createTabAfter: Cannot create tab:', err)
    })
}

/**
 * Create child tab
 */
export function createChildTab(tabId: ID, url?: string, containerId?: string): void {
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  const panel = Sidebar.panelsById[targetTab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  const conf = { openerTabId: tabId, autoGroupped: false, index: targetTab.index + 1 }
  const targetIndex = Tabs.getIndexForNewTab(panel, conf)

  Tabs.setNewTabPosition(targetIndex, targetTab.id, targetTab.panelId)

  const config: browser.tabs.CreateProperties = {
    index: targetIndex,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: Windows.id,
  }

  if (url) config.url = url
  if (containerId) config.cookieStoreId = containerId

  browser.tabs.create(config).catch(err => {
    Logs.err('Tabs.createChildTab: Cannot create tab:', err)
  })
}

let _creatingTabInPanel = false
const _createTabInPanelQueue: (() => Promise<void>)[] = []
/**
 * Create new tab in panel
 */
export async function createTabInPanel(panel: Panel, conf?: browser.tabs.CreateProperties) {
  if (!Utils.isTabsPanel(panel)) return
  if (_creatingTabInPanel) {
    _createTabInPanelQueue.push(() => createTabInPanel(panel, conf))
    return
  }

  if (Tabs.moveRules.length && conf?.cookieStoreId) {
    const rule = Tabs.findMoveRuleBy(conf.cookieStoreId)
    if (rule) {
      const panelByRule = Sidebar.panelsById[rule.panelId]
      if (Utils.isTabsPanel(panelByRule)) panel = panelByRule
    }
  }

  const tabShell = {} as Tab
  let index = Tabs.getIndexForNewTab(panel, tabShell)
  const parentId = Tabs.getParentForNewTab(panel)
  if (!Utils.isTabsPanel(panel)) return
  if (index === undefined && panel.nextTabIndex > -1) index = panel.nextTabIndex

  const config: browser.tabs.CreateProperties = {
    index,
    windowId: Windows.id,
    cookieStoreId: conf?.cookieStoreId,
  }

  if (conf?.url) config.url = conf.url
  if (conf?.active !== undefined) config.active = conf.active
  if (index !== undefined) Tabs.setNewTabPosition(index, parentId ?? NOID, panel.id)
  if (panel.newTabCtx !== 'none' && !conf?.cookieStoreId) config.cookieStoreId = panel.newTabCtx

  _creatingTabInPanel = true
  await browser.tabs.create(config).catch(err => {
    Logs.err('Tabs.createTabInPanel: Cannot create tab:', err)
  })
  _creatingTabInPanel = false

  if (_createTabInPanelQueue.length) {
    const cb = _createTabInPanelQueue.shift()
    if (cb) cb()
  }
}

export function handleReopening(tabId: ID, dstContainerId?: string): number | undefined {
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  if (!dstContainerId) dstContainerId = CONTAINER_ID

  targetTab.reopening = { id: NOID }

  let parentId: ID = -1
  let panel: TabsPanel | undefined
  let panelId
  let index

  if (Tabs.moveRules.length) {
    const rule = Tabs.findMoveRuleBy(dstContainerId, targetTab.lvl)
    if (rule) {
      panel = Sidebar.panelsById[rule.panelId] as TabsPanel | undefined
    }
  }

  if (panel) {
    index = Tabs.getIndexForNewTab(panel, {} as Tab)
    if (index === undefined) index = panel.nextTabIndex
    panelId = panel.id
  } else {
    parentId = targetTab.parentId
    panelId = targetTab.panelId
  }

  if (index === undefined) index = targetTab.index

  Tabs.setNewTabPosition(index, parentId, panelId)

  return index
}

export async function createFromDragEvent(e: DragEvent, dst: DstPlaceInfo): Promise<void> {
  // Handle sidebery dnd info from another firefox profile
  const dndInfo = e.dataTransfer?.getData('application/x-sidebery-dnd')
  if (dndInfo) {
    let info: DragInfo
    try {
      info = JSON.parse(dndInfo) as DragInfo
    } catch (err) {
      return
    }
    if (info.items) {
      const groupUrlStartRe = /^moz-extension:\/\/.{36}\/(page.)?group\/group\.html(.+)$/
      // Update sidebery internal urls
      for (const item of info.items) {
        if (item.url && groupUrlStartRe.test(item.url)) {
          item.url = item.url.replace(groupUrlStartRe, (_, _1, $2: string) => GROUP_URL + $2)
        }
      }

      Tabs.open(info.items, dst)
    }
    return
  }

  const result = await Utils.parseDragEvent(e)
  const panel = Sidebar.panelsById[dst.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) return

  const container = Containers.reactive.byId[panel.newTabCtx]
  const inside = dst.index === -1
  if (dst.parentId === undefined) dst.parentId = NOID
  if (inside) {
    const parentTab = Tabs.byId[dst.parentId]
    if (parentTab) dst.index = parentTab.index + 1
  }

  if (result?.file) result.url = URL.createObjectURL(result.file)

  if (result?.text && !result?.url) {
    const trimmedText = result.text.trim()
    if (/^https?:\/\/[^\s]{4,}$/.test(trimmedText)) result.url = trimmedText
  }

  if (result?.url) {
    // With Shift: Open URL in target tab
    if (dst.inside && +dst.parentId > -1 && e.shiftKey) {
      browser.tabs.update(dst.parentId, { url: result.url }).catch(err => {
        Logs.err('Tabs.createFromDragEvent: Cannot update tab url:', err)
      })
    } else {
      const conf: browser.tabs.CreateProperties = {
        active: Settings.state.dndActTabFromLink,
        url: Utils.normalizeUrl(result.url),
        index: dst.index,
        cookieStoreId: container?.id,
        windowId: Windows.id,
        pinned: dst.pinned,
      }

      // With Ctrl: Open inactive (background) tab
      if (e.ctrlKey) conf.active = false

      // With Alt: Open discarded (unloaded) tab
      if (e.altKey) {
        conf.active = false
        conf.discarded = true
        conf.title = result.text || result.url
      }

      Tabs.setNewTabPosition(dst.index ?? 0, dst.parentId, panel.id)
      browser.tabs.create(conf).catch(err => {
        Logs.err('Tabs.createFromDragEvent: Cannot create tab:', err)
      })
    }
    return
  }

  if (result?.text) {
    let tabId: ID
    // With Shift: Search in target tab
    if (dst.inside && +dst.parentId > -1 && e.shiftKey) tabId = dst.parentId
    else {
      const conf: browser.tabs.CreateProperties = {
        active: Settings.state.dndActSearchTab,
        index: dst.index,
        cookieStoreId: container?.id,
        windowId: Windows.id,
        pinned: dst.pinned,
      }

      // With Ctrl: Search in inactive (background) tab
      if (e.ctrlKey) conf.active = false

      Tabs.setNewTabPosition(dst.index ?? 0, dst.parentId, panel.id)
      const tab = await browser.tabs.create(conf)
      tabId = tab.id
    }
    browser.search.search({ query: result.text, tabId })
  }
}

export async function reopen(
  tabsInfo: ItemInfo[],
  dst: DstPlaceInfo,
  idsMap?: Record<ID, ID>
): Promise<void> {
  // Sort target tabs
  let minIndex = tabsInfo[0]?.index ?? 999999
  let maxIndex = tabsInfo[0]?.index ?? 0
  tabsInfo.sort((a, b) => {
    if (a.index === undefined || b.index === undefined) return 0
    if (minIndex > a.index) minIndex = a.index
    if (minIndex > b.index) minIndex = b.index
    if (maxIndex < a.index) maxIndex = a.index
    if (maxIndex < b.index) maxIndex = b.index
    return a.index - b.index
  })

  // Save tree to restore it later
  const treeUpdate: Record<ID, ID[]> = {}
  for (const info of tabsInfo) {
    const tab = Tabs.byId[info.id]
    if (!tab) continue
    treeUpdate[tab.id] = []

    for (let i = tab.index + 1; i < Tabs.list.length; i++) {
      const nextTab = Tabs.list[i]
      if (!nextTab || nextTab.lvl <= tab.lvl) break
      if (maxIndex < nextTab.index) maxIndex = nextTab.index
      if (nextTab.parentId === tab.id) treeUpdate[tab.id].push(nextTab.id)
    }
  }

  // Open new tabs
  if (!idsMap) idsMap = {}
  const result = await open(tabsInfo, dst, idsMap)
  if (!result) return Logs.err('Tabs: Cannot reopen tabs')

  // Update succession on reopening in another window
  const ids = tabsInfo.map(ti => ti.id)
  if (dst.windowId !== undefined && dst.windowId !== Windows.id && ids.includes(Tabs.activeId)) {
    Tabs.updateSuccessionDebounced(0, ids)
  }

  // Remove source tabs
  const toRemove = tabsInfo.map(t => t.id)
  Tabs.removingTabs = [...toRemove]
  await browser.tabs.remove(toRemove)

  // Fix tree
  let treeUpdateNeeded = false
  for (const oldId of Object.keys(treeUpdate)) {
    const children = treeUpdate[oldId]
    const newId = idsMap[oldId]
    if (!children?.length || newId === undefined) continue

    if (!treeUpdateNeeded) treeUpdateNeeded = true
    for (const childId of children) {
      const childTab = Tabs.byId[childId]
      if (childTab) childTab.parentId = newId
    }
  }
  if (treeUpdateNeeded) Tabs.updateTabsTree(minIndex, maxIndex + 1)
}

export async function open(
  items: ItemInfo[],
  dst: DstPlaceInfo,
  idsMap?: Record<ID, ID>
): Promise<boolean> {
  if (!idsMap) idsMap = {}
  if (dst.inside && dst.parentId === undefined) return true

  // Open tabs in new window
  if (dst.windowId === NEWID) {
    return await IPC.bg('createWindowWithTabs', items, { incognito: dst.incognito })
  }

  // Open tabs in another window
  if (dst.windowId !== undefined && dst.windowId !== Windows.id) {
    if (dst.windowId === ASKID) {
      if (dst.windowChooseConf === undefined) dst.windowId = await Windows.showWindowsPopup()
      else dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
      if (dst.windowId === undefined || dst.windowId === NOID) return true

      delete dst.windowChooseConf
    }

    await IPC.bg('openTabs', items, dst)
    return true
  }

  // Open tabs in current window
  // ---
  // Get dst panel
  let dstPanel: Panel | undefined = Sidebar.panelsById[dst.panelId ?? NOID]
  if (dst.panelId === undefined || !dstPanel || dstPanel.type !== PanelType.tabs) {
    dstPanel = Sidebar.panels.find(p => p.type === PanelType.tabs)
  }

  // Get fallback index - panel's end
  let fallbackIndex: number | undefined
  if (Utils.isTabsPanel(dstPanel)) {
    fallbackIndex = dstPanel.nextTabIndex
  }

  let index: number | undefined
  for (let item, i = 0; i < items.length; i++) {
    item = items[i]
    const groupCreationNeeded = item.title && !item.url
    const parent = Tabs.byId[dst.parentId ?? item.parentId ?? NOID]

    // Use dst index
    if (dst.index !== undefined) {
      index = dst.index + i
    }

    // Or use index value from item info
    else if (item.index !== undefined) {
      const prevTab = items[i - 1]
      const prevIndex = prevTab?.index

      // If not first and sequence is correct, place new tab right after the previous
      if (prevIndex !== undefined && index !== undefined && item.index - prevIndex === 1) {
        index++
      }

      // Or place new tab just in provided index shifted by count of previously opened tabs
      else {
        index = item.index + i
      }
    }

    // Or use fallback index
    else if (fallbackIndex !== undefined) {
      index = fallbackIndex + i
    }

    // Normalize index for pinned tab
    if (dst.pinned && index !== undefined) {
      const lastPinnedTab = Tabs.pinned[Tabs.pinned.length - 1]
      const pinIndex = lastPinnedTab ? lastPinnedTab.index + 1 : 0

      if (index > pinIndex) index = pinIndex + i
    }

    if (!item.url && !item.title) continue
    if (!Settings.state.tabsTree && groupCreationNeeded) continue
    if (!Sidebar.hasTabs && groupCreationNeeded) continue
    if (dst.pinned && groupCreationNeeded) continue
    // TODO: handle tree lvl limit
    if (Settings.state.tabsTreeLimit !== 'none' && groupCreationNeeded) continue

    const conf: browser.tabs.CreateProperties = {
      index: index,
      url: groupCreationNeeded
        ? Utils.createGroupUrl(item.title)
        : Utils.normalizeUrl(item.url, item.title),
      windowId: Windows.id,
      pinned: dst.pinned,
      active: !!item.active,
      cookieStoreId: dst.containerId ?? item.container,
    }

    if (dst.discarded === undefined && items.length > 1) dst.discarded = true
    if (dst.discarded && conf.url && !conf.url.startsWith('a') && !dst.pinned && !conf.active) {
      conf.discarded = true
      conf.title = item.title
    }

    let parentId = NOID
    if (!dst.pinned) {
      if (item.parentId !== undefined && +idsMap[item.parentId] >= 0) {
        parentId = idsMap[item.parentId] ?? NOID
      } else if (parent) {
        parentId = parent.id
      }
    }

    if (index !== undefined) {
      Tabs.setNewTabPosition(index, parentId, dstPanel?.id ?? NOID)
    }

    const tab = await browser.tabs.create(conf)
    idsMap[item.id] = tab.id

    if (item.customTitle) {
      const newTab = Tabs.byId[tab.id]
      if (newTab) newTab.reactive.customTitle = newTab.customTitle = item.customTitle
    }

    if (item.customColor) {
      const newTab = Tabs.byId[tab.id]
      if (newTab) newTab.reactive.customColor = newTab.customColor = item.customColor
    }
  }

  return true
}

export async function reopenInContainer(ids: ID[], containerId: string) {
  Tabs.sortTabIds(ids)
  const firstTab = Tabs.byId[ids[0]]
  if (!firstTab) return

  const idsMap: Record<ID, ID> = {}
  IPC.bg('disableAutoReopening', containerId, 1000)

  const items = Tabs.getTabsInfo(ids)
  setURLsFromTitles(items)
  const rule = Tabs.findMoveRuleBy(containerId, firstTab.lvl)
  const panel = Sidebar.panelsById[rule?.panelId ?? NOID]
  if (Utils.isTabsPanel(panel) && panel.id !== firstTab.panelId && !firstTab.pinned) {
    const dst = { panelId: panel.id, containerId: containerId, index: panel.nextTabIndex }
    await Tabs.reopen(items, dst, idsMap)
  } else {
    const dst = { panelId: firstTab.panelId, containerId, pinned: firstTab.pinned }
    await Tabs.reopen(items, dst, idsMap)
  }

  IPC.bg('enableAutoReopening', Object.values(idsMap))
}

function setURLsFromTitles(items: ItemInfo[]) {
  for (const item of items) {
    if (item.url !== 'about:blank') continue
    if (item.title && INITIAL_TITLE_RE.test(item.title)) {
      item.url = 'https://' + item.title
    }
  }
}

export async function openInContainer(ids: ID[], containerId: string) {
  Tabs.sortTabIds(ids)
  const firstTab = Tabs.byId[ids[0]]
  const lastTab = Tabs.byId[ids[ids.length - 1]]
  if (!firstTab || !lastTab) return

  const items = Tabs.getTabsInfo(ids)
  const rule = Tabs.findMoveRuleBy(containerId, firstTab.lvl)
  const panel = Sidebar.panelsById[rule?.panelId ?? NOID]
  if (Utils.isTabsPanel(panel) && panel.id !== firstTab.panelId && !firstTab.pinned) {
    const dst = { panelId: panel.id, containerId: containerId, index: panel.nextTabIndex }
    await Tabs.open(items, dst)
  } else {
    const dst = { panelId: firstTab.panelId, containerId: containerId, index: lastTab.index + 1 }
    await Tabs.open(items, dst)
  }
}

export async function createTabInNewContainer(): Promise<void> {
  const panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel)) throw 'Current panel is not TabsPanel'

  // Open config popup
  const result = await Popups.openContainerPopup(NOID)
  if (result === null) return

  const container = Containers.reactive.byId[result]
  if (!container) return

  const dst: DstPlaceInfo = { panelId: panel.id, containerId: container.id }
  await Tabs.open([{ id: -1, url: 'about:newtab' }], dst)
}

export async function reopenTabsInNewContainer(tabIds: ID[]): Promise<void> {
  const firstTab = Tabs.byId[tabIds[0]]
  if (!firstTab) return

  // Open config popup
  const result = await Popups.openContainerPopup(NOID)
  if (!result) return

  const container = Containers.reactive.byId[result]
  if (!container) return

  const items = Tabs.getTabsInfo(tabIds)
  await Tabs.reopen(items, { panelId: firstTab.panelId, containerId: container.id })
}

/**
 * Set expected position (parent/panel) of new tab by its index
 */
export function setNewTabPosition(
  index: number,
  parentId: ID,
  panelId: ID,
  unread?: boolean
): void {
  Tabs.newTabsPosition[index] = {
    parent: parentId,
    panel: panelId,
    unread: unread,
  }
}

/**
 * Find the nearest tabs panel
 */
function findTabsPanelNearToTabIndex(tabIndex: number): TabsPanel | undefined {
  let nearestPanel: TabsPanel | undefined
  const prevTab = Tabs.list[tabIndex - 1]
  const nextTab = Tabs.list[tabIndex + 1]

  if (prevTab && !prevTab.pinned) {
    nearestPanel = Sidebar.panelsById[prevTab.panelId] as TabsPanel
  }
  if (!nearestPanel && nextTab) {
    nearestPanel = Sidebar.panelsById[nextTab.panelId] as TabsPanel
  }
  if (!nearestPanel) {
    nearestPanel = Sidebar.panels.find(p => Utils.isTabsPanel(p)) as TabsPanel
  }

  return nearestPanel
}

export function getPanelForNewTab(tab: Tab): TabsPanel | undefined {
  const parentTab = Tabs.byId[tab.openerTabId ?? NOID]
  let activePanel: Panel | undefined = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) {
    activePanel = Sidebar.panelsById[Sidebar.lastTabsPanelId]
  }
  if (!Utils.isTabsPanel(activePanel)) activePanel = undefined

  // Find panel by move rule
  if (Tabs.moveRules.length) {
    const hasParent = Settings.state.tabsTree && parentTab && !parentTab.pinned
    const rule = Tabs.findMoveRuleBy(tab.cookieStoreId, hasParent ? 1 : 0)
    if (rule) {
      const panel = Sidebar.panelsById[rule.panelId]
      if (Utils.isTabsPanel(panel)) return panel
    }
  }

  // Find panel for tab opened from pinned tab
  if (parentTab && parentTab.pinned) {
    if (Settings.state.moveNewTabPin === 'start' || Settings.state.moveNewTabPin === 'end') {
      return activePanel || findTabsPanelNearToTabIndex(tab.index)
    }
  }

  // Find panel for tab opened from another tab
  if (parentTab && !parentTab.pinned) {
    const panelOfParent = Sidebar.panelsById[parentTab.panelId] as TabsPanel
    if (!Settings.state.moveNewTabParentActPanel || panelOfParent === activePanel) {
      return panelOfParent
    }
  }

  // Find panel in other cases
  if (Settings.state.moveNewTab === 'start' || Settings.state.moveNewTab === 'end') {
    return activePanel || findTabsPanelNearToTabIndex(tab.index)
  }
  if (
    Settings.state.moveNewTab === 'before' ||
    Settings.state.moveNewTab === 'after' ||
    Settings.state.moveNewTab === 'first_child' ||
    Settings.state.moveNewTab === 'last_child'
  ) {
    const activeTab = Tabs.byId[Tabs.activeId]
    const panelOfActiveTab = Sidebar.panelsById[activeTab?.panelId ?? NOID] as TabsPanel

    if (activeTab && !activeTab.pinned && panelOfActiveTab) return panelOfActiveTab
    else return activePanel || findTabsPanelNearToTabIndex(tab.index)
  }

  return findTabsPanelNearToTabIndex(tab.index)
}

interface IndexForNewTabConf {
  openerTabId?: ID
  autoGroupped?: boolean
  index: number
}

/**
 * Find and return index for new tab.
 */
export function getIndexForNewTab(panel: TabsPanel, conf?: IndexForNewTabConf): number {
  const parent = Tabs.byId[conf?.openerTabId ?? NOID]
  const startIndex = panel.startTabIndex > -1 ? panel.startTabIndex : 0
  const nextIndex = panel.nextTabIndex > -1 ? panel.nextTabIndex : Tabs.list.length
  const activeTab = Tabs.byId[Tabs.activeId]
  const autoGroupped = conf ? conf.autoGroupped : false
  const fallbackIndex = conf ? conf.index : nextIndex

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) {
    if (Settings.state.moveNewTabPin === 'start') return startIndex
    if (Settings.state.moveNewTabPin === 'end') return nextIndex
  }

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (Settings.state.moveNewTabParent === 'before' && !autoGroupped) return parent.index
    if (Settings.state.moveNewTabParent === 'first_child') return parent.index + 1
    if (
      Settings.state.moveNewTabParent === 'sibling' ||
      Settings.state.moveNewTabParent === 'last_child' ||
      autoGroupped
    ) {
      if (Settings.state.tabsTree) {
        // Use levels to find the end of branch
        let t
        let index = parent.index + 1
        for (; index < Tabs.list.length; index++) {
          t = Tabs.list[index]
          if (t.lvl <= parent.lvl) break
        }
        return index
      } else {
        // Use ids map to find the end of branch
        const ids = { [parent.id]: true }
        let index = parent.index + 1
        for (let t; index < Tabs.list.length; index++) {
          t = Tabs.list[index]
          if (!ids[t.openerTabId ?? NOID]) break
          ids[t.id] = true
        }
        return index
      }
    }
    if (Settings.state.moveNewTabParent === 'start' && !autoGroupped) return startIndex
    if (Settings.state.moveNewTabParent === 'end' && !autoGroupped) return nextIndex
    if (Settings.state.moveNewTabParent === 'default' && !autoGroupped) return fallbackIndex
  }

  // Place new tab (for the other cases)
  if (Settings.state.moveNewTab === 'start') return startIndex
  if (Settings.state.moveNewTab === 'end') return nextIndex
  if (Settings.state.moveNewTab === 'before') {
    if (!activeTab || activeTab.panelId !== panel.id) return nextIndex
    else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else return activeTab.index
  }
  if (Settings.state.moveNewTab === 'after') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else {
      let index = activeTab.index + 1
      for (let t; index < Tabs.list.length; index++) {
        t = Tabs.list[index]
        if (t.lvl <= activeTab.lvl) break
      }
      return index
    }
  }
  if (Settings.state.moveNewTab === 'first_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else {
      return activeTab.index + 1
    }
  }
  if (Settings.state.moveNewTab === 'last_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else {
      let index = activeTab.index + 1
      for (let t; index < Tabs.list.length; index++) {
        t = Tabs.list[index]
        if (t.lvl <= activeTab.lvl) break
      }
      return index
    }
  }

  return fallbackIndex
}

/**
 * Find and return parent id
 */
export function getParentForNewTab(panel: Panel, openerTabId?: ID): ID | undefined {
  const activeTab = Tabs.byId[Tabs.activeId]

  let parent: Tab | undefined
  if (openerTabId) parent = Tabs.byId[openerTabId]

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) return

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (Settings.state.moveNewTabParent === 'before') return parent.parentId
    if (Settings.state.moveNewTabParent === 'sibling') return parent.parentId
    if (Settings.state.moveNewTabParent === 'first_child') return openerTabId
    if (Settings.state.moveNewTabParent === 'last_child') return openerTabId
    if (Settings.state.moveNewTabParent === 'start') return
    if (Settings.state.moveNewTabParent === 'end') return
    if (Settings.state.moveNewTabParent === 'default') return openerTabId
    if (Settings.state.moveNewTabParent === 'none') return openerTabId
  }

  // Place new tab (for the other cases)
  if (Settings.state.moveNewTab === 'start') return
  if (Settings.state.moveNewTab === 'end') return
  if (activeTab && activeTab.panelId === panel.id && !activeTab.pinned) {
    if (Settings.state.moveNewTab === 'before') return activeTab.parentId
    else if (Settings.state.moveNewTab === 'after') return activeTab.parentId
    else if (Settings.state.moveNewTab === 'first_child') return activeTab.id
    else if (Settings.state.moveNewTab === 'last_child') return activeTab.id
  }

  return openerTabId
}
