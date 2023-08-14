import { DstPlaceInfo, ItemInfo, PanelType, SrcPlaceInfo, Tab } from 'src/types'
import { WindowChoosingDetails, TabToPanelMoveRule, TabToPanelMoveRuleConfig } from 'src/types'
import { DEFAULT_CONTAINER_ID, MOVEID, NEWID, NOID } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import * as IPC from 'src/services/ipc'
import * as Popups from 'src/services/popups'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

export async function move(
  tabsInfo: DeepReadonly<ItemInfo[]>,
  src: SrcPlaceInfo,
  dst: DstPlaceInfo
): Promise<void> {
  if (!tabsInfo.length) return

  // Ask about target window
  if (dst.windowChooseConf) {
    dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
    if (dst.windowId === NOID) return
  }

  // Move tabs from another window to this window
  if (src.windowId !== undefined && src.windowId !== Windows.id) {
    const tabIds = tabsInfo.map(t => t.id)
    let externalTabs
    try {
      externalTabs = await IPC.bg('getSidebarTabs', src.windowId, tabIds)
    } catch {
      Logs.warn('Tabs.move: Move tabs from another window: Cannot get tabs from sidebar')
    }
    if (!externalTabs) {
      const winNativeTabs = await browser.tabs.query({ windowId: src.windowId })
      externalTabs = []
      for (const tabInfo of tabsInfo) {
        const nativeTab = winNativeTabs.find(t => t.id === tabInfo.id)
        if (!nativeTab) continue
        const tab = Tabs.mutateNativeTabToSideberyTab(nativeTab)
        tab.panelId = tabInfo.panelId ?? dst.panelId ?? NOID
        externalTabs.push(tab)
      }
    }
    if (externalTabs) moveToThisWin(externalTabs, dst)
    return
  }

  // Move tabs to new window
  if (dst.windowId === NEWID) {
    Tabs.detachingTabIds = []
    const info: ItemInfo[] = tabsInfo.map(t => {
      Tabs.detachingTabIds.push(t.id)
      return {
        id: t.id,
        url: t.url,
        parentId: t.parentId,
        panelId: t.panelId ?? dst.panelId,
      }
    })
    const conf = { incognito: dst.incognito, tabId: MOVEID }
    IPC.bg('createWindowWithTabs', info, conf).finally(() => (Tabs.detachingTabIds = []))
    return
  }

  // Move tabs to another window
  if (dst.windowId !== undefined && dst.windowId !== Windows.id) {
    const tabIds = tabsInfo.map(t => t.id)
    return moveTabsToWin(tabIds, dst)
  }

  // Moving tabs inside current window
  // ---

  // Normalize dst info
  if (dst.parentId === undefined) dst.parentId = NOID
  if (dst.index === undefined) dst.index = 0
  if (dst.index === -1) {
    const panel = Sidebar.panelsById[dst.panelId ?? NOID]
    if (!Utils.isTabsPanel(panel)) return Logs.warn('Tabs.move: No panel')
    dst.index = panel.nextTabIndex
  }

  // Gather tabs by type (pinned/normal), get initial info
  const dstTab: Tab | undefined = Tabs.list[dst.index]
  const dstParent = Tabs.byId[dst.parentId]
  const pinnedTabs: Tab[] = []
  const normalTabs: Tab[] = []
  let toPin: Tab[] | undefined
  let toUnpin: Tab[] | undefined
  let tabs: Tab[] = []
  let isPinnedActive = false
  for (const info of tabsInfo) {
    const tab = Tabs.byId[info.id]
    if (!tab) continue
    // Logs.info('Tabs.move: tabId', tab.id)
    if (tab.pinned) pinnedTabs.push(tab)
    else normalTabs.push(tab)
    tabs.push(tab)
  }

  if (!tabs.length) return

  // Switch panelId of pinned tabs and exclude them from general list
  if (
    pinnedTabs.length &&
    dst.pinned === undefined &&
    Settings.state.pinnedTabsPosition === 'panel'
  ) {
    for (const tab of pinnedTabs) {
      if (!isPinnedActive && tab.active) isPinnedActive = true

      if (dst.panelId !== undefined) {
        if (tab.audible || tab.mutedInfo?.muted || tab.mediaPaused) {
          Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId)
          Sidebar.updateMediaStateOfPanelDebounced(100, dst.panelId)
        }

        tab.panelId = dst.panelId
      }
      Tabs.saveTabData(tab.id)
    }

    tabs = normalTabs
  }

  // Unpin
  else if (pinnedTabs.length && !dst.pinned) {
    for (const tab of pinnedTabs) {
      tab.reactive.pinned = tab.pinned = false
    }
    toUnpin = pinnedTabs
  }

  // Pin
  else if (normalTabs.length && dst.pinned) {
    for (const tab of normalTabs) {
      tab.reactive.pinned = tab.pinned = true
    }
    toPin = normalTabs
  }

  // All tabs are pinned and was handled
  if (!tabs.length) {
    Sidebar.recalcTabsPanels()
    Tabs.cacheTabsData()

    // Switch panel
    if (
      isPinnedActive &&
      dst.pinned === undefined &&
      dst.panelId !== undefined &&
      Settings.state.tabsPanelSwitchActMove
    ) {
      Sidebar.activatePanel(dst.panelId)
    }

    return
  }

  const ids = []
  let dstIndexIncluded = -1
  let prevIndex = 0
  let panelIsChanged = false
  let isActive = false
  let isMediaActive = false
  let mediaPrevPanelId
  let srcPanelId
  for (const tab of tabs) {
    // Cut tab from old index in sidebery list
    const index = Tabs.list.indexOf(tab, prevIndex)
    if (index === -1) continue
    Tabs.list.splice(index, 1)

    if (tab.active) isActive = true

    prevIndex = index
    ids.push(tab.id)

    // Get dstIndex if target tab included in moving tabs list
    if (dstTab && dstTab.id === tab.id) dstIndexIncluded = index

    // Update panelId
    if (dst.panelId !== undefined && tab.panelId !== dst.panelId) {
      if (!panelIsChanged) panelIsChanged = true
      srcPanelId = tab.panelId
      if (!isMediaActive && (tab.audible || tab.mutedInfo?.muted || tab.mediaPaused)) {
        isMediaActive = true
        mediaPrevPanelId = tab.panelId
      }
      tab.panelId = dst.panelId
    }

    // Update parent-child relation
    const oldParent = Tabs.byId[tab.parentId]
    if (!oldParent || !tabs.includes(oldParent)) {
      tab.parentId = dst.parentId

      if (dstParent) browser.tabs.update(tab.id, { openerTabId: dst.parentId })
      else browser.tabs.update(tab.id, { openerTabId: tab.id })
    }
  }

  // Paste tabs to the new index
  if (dstTab) {
    const dstIndex = dstIndexIncluded !== -1 ? dstIndexIncluded : Tabs.list.indexOf(dstTab)
    if (dstIndex === -1) return Logs.warn('Tabs.move: Cannot find index of the dstTab')
    Tabs.list.splice(dstIndex, 0, ...tabs)
  } else {
    Tabs.list.splice(Tabs.list.length, 0, ...tabs)
  }

  Tabs.updateTabsIndexes()
  Tabs.updateTabsTree()
  Sidebar.recalcTabsPanels()
  if (srcPanelId) Sidebar.recalcVisibleTabs(srcPanelId)
  if (dst.panelId && dst.panelId !== srcPanelId) Sidebar.recalcVisibleTabs(dst.panelId)

  // Update media state of panels
  if (isMediaActive && mediaPrevPanelId && dst.panelId) {
    Sidebar.updateMediaStateOfPanelDebounced(100, mediaPrevPanelId)
    Sidebar.updateMediaStateOfPanelDebounced(100, dst.panelId)
  }

  // Switch panel
  if (
    isActive &&
    dst.pinned === undefined &&
    dst.panelId !== undefined &&
    Settings.state.tabsPanelSwitchActMove
  ) {
    Sidebar.activatePanel(dst.panelId)
  }

  // Update branch colors
  if (Settings.state.colorizeTabsBranches) {
    for (const tab of tabs) {
      Tabs.setBranchColor(tab.id)
    }
  }

  // Activate folded parent tab
  if (isActive && dstParent && dstParent.folded) {
    browser.tabs.update(dstParent.id, { active: true }).catch(err => {
      Logs.err('Tabs.move: Cannot activate tab:', err)
    })
  }

  tabs.forEach(t => Tabs.saveTabData(t.id))
  Tabs.cacheTabsData()

  // Mark moving tabs
  Tabs.movingTabs.push(...ids)
  tabs.forEach(t => (t.moving = true))

  // Update native tabs
  // ---
  // Unpin tab
  if (toUnpin?.length) {
    for (const tab of toUnpin) {
      tab.unpinning = true
      await browser.tabs.update(tab.id, { pinned: false }).catch(err => {
        Logs.err('Tabs.move: Cannot unpin tab', err)
      })
      tab.unpinning = false
    }
  }

  // Pin tab
  if (toPin?.length) {
    for (const tab of toPin) {
      await browser.tabs.update(tab.id, { pinned: true, openerTabId: tab.id }).catch(err => {
        Logs.err('Tabs.move: Cannot pin tab', err)
      })
    }
  }

  // Move tabs
  const nativeDstIndex = dst.index <= tabs[0].index ? dst.index : dst.index - 1
  // TODO: Do not call this fn if: all tabs go one after another and srcIndex === dstIndex
  await browser.tabs.move(ids, { windowId: Windows.id, index: nativeDstIndex }).catch(err => {
    Logs.err('Tabs.move: Cannot move native tabs', err)
  })

  // Reset moving tabs marks
  tabs.forEach(t => (t.moving = undefined))
  Tabs.movingTabs = []

  // Update visibility
  if (Settings.state.hideFoldedTabs || (Settings.state.hideInact && panelIsChanged)) {
    Tabs.updateNativeTabsVisibility()
  }
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(tabIds: ID[], dst: DstPlaceInfo): Promise<void> {
  if (dst.windowId === undefined || dst.windowId === NOID) {
    if (dst.windowChooseConf) dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
    else dst.windowId = await Windows.showWindowsPopup()
  }

  // Sort
  Tabs.sortTabIds(tabIds)

  // Check if there is active tab and update successor id for it
  const activeTabId = tabIds.find(id => Tabs.byId[id]?.active)
  const activeTab = activeTabId !== undefined ? Tabs.byId[activeTabId] : undefined
  if (activeTab) {
    const target = Tabs.findSuccessorTab(activeTab, tabIds)
    if (target) await browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  const tabs = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) continue
    tabs.push(Utils.cloneObject(tab))
    Tabs.detachingTabIds.push(tab.id)
  }

  let sidebarIsOpen
  if (dst.windowId !== Windows.id) {
    sidebarIsOpen = await browser.sidebarAction
      .isOpen({ windowId: dst.windowId })
      .catch(() => false)
  }

  let moved
  if (sidebarIsOpen) {
    delete dst.windowChooseConf
    moved = await IPC.sidebar(dst.windowId, 'moveTabsToThisWin', tabs, dst).catch(() => false)
  }

  if (!moved) {
    await browser.tabs.move(
      tabs.map(t => t.id),
      { windowId: dst.windowId, index: -1 }
    )
  }

  Tabs.cacheTabsData()
}

export async function moveToThisWin(tabs: Tab[], dst?: DstPlaceInfo): Promise<boolean> {
  if (!tabs || !tabs.length) return false
  if (!Tabs.attachingTabs) Tabs.attachingTabs = [...tabs]
  else Tabs.attachingTabs.push(...tabs)

  const isPinned = tabs[0].pinned

  let panel = Sidebar.panelsById[dst?.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) panel = Sidebar.panelsById[tabs[0].panelId]

  let nextIndex
  if (Utils.isTabsPanel(panel) && panel.nextTabIndex > -1) nextIndex = panel.nextTabIndex
  else nextIndex = Tabs.list.length

  // Create dst
  if (!dst) dst = { panelId: tabs[0].panelId, parentId: -1 }

  // Set index
  if (dst.index === undefined) dst.index = isPinned ? Tabs.pinned.length : nextIndex

  const tabIds = tabs.map(t => t.id)

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const parent = Tabs.byId[dst.parentId ?? tab.parentId ?? NOID]
    const index = (dst.index ?? 0) + i
    if (!!tab.pinned !== !!dst.pinned) {
      await browser.tabs.update(tab.id, { pinned: !!dst.pinned })
      tab.pinned = !!dst.pinned
      tab.reactive.pinned = tab.pinned
    }
    // Reset "hidden" flag b/c moving hidden tabs between windows makes them not hidden
    tab.hidden = false
    // Check parent tab
    if (tab.parentId === -1 || (tab.parentId !== -1 && !tabIds.includes(tab.parentId))) {
      tab.reactive.lvl = tab.lvl = parent ? parent.lvl + 1 : 0
      tab.parentId = parent ? parent.id : -1
    }
    // Check child tabs
    if (tab.isParent && !tabs.find(t => t.parentId === tab.id)) {
      tab.isParent = false
      tab.folded = false
    }
    Tabs.setNewTabPosition(index, tab.parentId, dst.panelId ?? NOID)
    browser.tabs.move(tab.id, { windowId: Windows.id, index }).catch(err => {
      Logs.err('Tabs.moveToThisWin: Cannot move tab:', err)
    })
  }

  return true
}

export async function moveToNewPanel(tabIds: ID[]): Promise<void> {
  if (!tabIds.length) return
  Tabs.sortTabIds(tabIds)

  const probeTab = Tabs.byId[tabIds[0]]
  if (!probeTab) return Logs.warn('Tabs.moveToNewPanel: No first tab')

  const srcPanel = Sidebar.panelsById[probeTab?.panelId ?? NOID]
  if (!Utils.isTabsPanel(srcPanel)) return Logs.warn('Tabs.moveToNewPanel: No src panel')

  const index = Sidebar.reactive.nav.indexOf(srcPanel.id)
  if (index === -1) return Logs.warn('Tabs.moveToNewPanel: Cannot find target index')

  // Create new panel
  const noTabsPanels = !Sidebar.hasTabs
  const result = await Popups.openPanelPopup({ type: PanelType.tabs }, index + 1)
  if (!result) return

  const dstPanel = Sidebar.panelsById[result]
  if (!Utils.isTabsPanel(dstPanel)) return

  Sidebar.activatePanel(dstPanel.id)

  if (noTabsPanels) await Tabs.load()

  // Move
  const items = Tabs.getTabsInfo(tabIds)
  const src = { windowId: Windows.id, panelId: srcPanel.id, pinned: probeTab.pinned }
  await Tabs.move(items, src, { panelId: dstPanel.id, index: dstPanel.nextTabIndex })
}

export function recalcMoveRules() {
  const rules: TabToPanelMoveRule[] = []

  for (const panel of Sidebar.panels) {
    if (!Utils.isTabsPanel(panel)) continue

    if (panel.moveRules.length) {
      for (const ruleConf of panel.moveRules) {
        if (!ruleConf.active) continue

        const rule = createMoveToPanelRule(ruleConf, panel.id)
        if (!rule) continue

        rules.push(rule)
      }
    }
  }

  rules.sort((a, b) => {
    let aN = a.containerId ? 1 : 0
    aN += a.urlRE || a.urlStr ? 1 : 0
    let bN = b.containerId ? 1 : 0
    bN += b.urlRE || b.urlStr ? 1 : 0
    return bN - aN
  })

  Tabs.moveRules = rules
}

function createMoveToPanelRule(
  config: TabToPanelMoveRuleConfig,
  panelId: ID
): TabToPanelMoveRule | undefined {
  const rule: TabToPanelMoveRule = { panelId }

  // Match by container
  if (
    config.containerId &&
    (config.containerId === DEFAULT_CONTAINER_ID || Containers.reactive.byId[config.containerId])
  ) {
    rule.containerId = config.containerId
  }

  // Match by URL
  if (config.url) {
    if (config.url.startsWith('/') && config.url.endsWith('/')) {
      try {
        rule.urlRE = new RegExp(config.url.slice(1, -1))
      } catch {
        rule.urlStr = config.url
      }
    } else {
      rule.urlStr = config.url
    }
  }

  if (!rule.containerId && !rule.urlRE && !rule.urlStr) return

  if (config.topLvlOnly) rule.topLvlOnly = config.topLvlOnly

  return rule
}

const moveByRuleTimeouts: Map<ID, number> = new Map()
export function moveByRule(tabId: ID, delay: number) {
  let timeout = moveByRuleTimeouts.get(tabId)
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    const tab = Tabs.byId[tabId]
    if (!tab) return
    if (!Tabs.moveRules.length) return

    const currentPanel = Sidebar.panelsById[tab.panelId]
    let excludeTo = NOID
    if (Utils.isTabsPanel(currentPanel)) excludeTo = currentPanel.moveExcludedTo

    const rule = Tabs.findMoveRule(tab)
    if (rule) {
      if (rule.panelId === tab.panelId) return

      const panelId = rule.panelId
      moveTabToPanel(tab, panelId)
    } else if (
      excludeTo !== NOID &&
      excludeTo !== tab.panelId &&
      !tab.url.startsWith('a') &&
      !tab.url.startsWith('m')
    ) {
      moveTabToPanel(tab, excludeTo)
    }
  }, delay)
  moveByRuleTimeouts.set(tabId, timeout)
}

function moveTabToPanel(tab: Tab, panelId: ID) {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return
  const moveToPanelStart = Settings.state.moveNewTabParent === 'start'
  const index = moveToPanelStart ? panel.startTabIndex : panel.nextTabIndex
  const src: SrcPlaceInfo = { windowId: Windows.id, pinned: tab.pinned }
  const dst: DstPlaceInfo = { panelId, index }
  Utils.inQueue(Tabs.move, [tab], src, dst)

  if (tab.active && Settings.state.tabsPanelSwitchActMoveAuto) {
    Sidebar.switchToPanel(panelId, true, true)
  }
}

export function findMoveRuleBy(containerId: string, lvl?: number): TabToPanelMoveRule | undefined {
  for (const rule of Tabs.moveRules) {
    if (rule.urlRE || rule.urlStr) continue
    if (rule.containerId && rule.containerId !== containerId) continue
    if (rule.topLvlOnly && lvl !== undefined && lvl > 0) continue
    return rule
  }
}

export function findMoveRule(tab: Tab): TabToPanelMoveRule | undefined {
  for (const rule of Tabs.moveRules) {
    if (rule.topLvlOnly && tab.lvl > 0) continue

    if (rule.containerId && rule.containerId !== tab.cookieStoreId) continue

    if (rule.urlStr) {
      if (!tab.url.includes(rule.urlStr)) continue
    } else if (rule.urlRE) {
      if (!rule.urlRE.test(tab.url)) continue
    }

    return rule
  }
}
