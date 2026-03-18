import * as T from 'src/types'
import { PanelType } from 'src/enums'
import { DEFAULT_CONTAINER_ID, MOVEID, NEWID, NOID } from 'src/defaults'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Settings from 'src/services/settings'
import * as Windows from 'src/services/windows.fg'
import * as Containers from 'src/services/containers'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Search from 'src/services/search.fg'
import * as IPC from 'src/services/ipc'
import * as IPPC from 'src/services/ippc.addon'
import * as Popups from 'src/services/popups.fg'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import * as Links from 'src/services/links'

export let movingTabs: ID[] = []
export const setMovingTabs = (ids: ID[]) => (movingTabs = ids)
export let moveRules: T.TabToPanelMoveRule[] = []

export async function move(
  tabsInfo: DeepReadonly<T.ItemInfo[]>,
  src: T.SrcPlaceInfo,
  dst: T.DstPlaceInfo
): Promise<void> {
  if (!tabsInfo.length) return

  // Ask about target window
  if (dst.windowChooseConf) {
    dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
    if (dst.windowId === NOID) return
  }

  // Check if target panel exists
  if (dst.panelId) {
    const dstPanel = Sidebar.panelsById[dst.panelId]
    if (!Utils.isTabsPanel(dstPanel)) {
      Logs.warn('Tabs.move: wrong type of target panel:', Utils.clone(dstPanel))
      return
    }
  }

  // Move tabs from another window to this window
  if (src.windowId !== undefined && src.windowId !== Windows.id) {
    const tabIds = tabsInfo.map(t => t.id)
    let externalTabs
    let allInWin
    try {
      const detachedTabsInfo = await IPC.bg('detachSidebarTabs', src.windowId, tabIds)
      externalTabs = detachedTabsInfo?.tabs
      allInWin = detachedTabsInfo?.allInWin
    } catch {
      Logs.warn('Tabs.move: Move tabs from another window: Cannot detach tabs from sidebar')
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
    if (externalTabs) moveToThisWin(externalTabs, dst, allInWin)
    return
  }

  // Move tabs to new window
  if (dst.windowId === NEWID) {
    // Moving all tabs of this window to the new one... what?
    const allInWin = Tabs.list.length === tabsInfo.length
    if (allInWin && tabsInfo.length > 1) return

    Tabs.detachTabs(tabsInfo.map(t => t.id))
    const info = Utils.cloneArray<T.ItemInfo>(tabsInfo)
    const conf = { incognito: dst.incognito, tabId: MOVEID }
    if (dst.panelId) info.forEach(t => (t.panelId = dst.panelId))
    IPC.bg('createWindowWithTabs', info, conf).finally(() => Tabs.detachingTabIds.clear())
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
  const dstTab = Tabs.list[dst.index] as T.Tab | undefined
  const dstParent = Tabs.byId[dst.parentId]
  const srcParents: T.Tab[] = []
  const pinnedTabs: T.Tab[] = []
  const normalTabs: T.Tab[] = []
  let toPin: T.Tab[] | undefined
  let toUnpin: T.Tab[] | undefined
  let tabs: T.Tab[] = []
  let isPinnedActive = false
  for (const info of tabsInfo) {
    const tab = Tabs.byId[info.id]
    if (!tab) continue
    // Logs.info('Tabs.move: tabId', tab.id)
    if (tab.pinned) pinnedTabs.push(tab)
    else normalTabs.push(tab)
    tabs.push(tab)
  }

  if (dstTab?.pinned && !dst.pinned) return
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

  // Info about the moved tabs previous state:
  const oneAfterAnother = tabs.every((tab, ix) => ix === 0 || tab.index === tabs[ix - 1].index + 1)
  const srcIndex = tabs[0].index

  const ids = tabs.map(t => t.id)
  const orphansToSave: ID[] = []
  let dstIndexIncluded = -1
  let prevIndex = 0
  let panelIsChanged = false
  let isActive = false
  let isMediaActive = false
  let isUpdated = false
  let mediaPrevPanelId
  let srcPanelId
  for (const tab of tabs) {
    const parentStayStill = !ids.includes(tab.parentId)

    // Update parentId of orphans
    if (tab.isParent && parentStayStill) {
      const branch = Tabs.getBranch(tab, false)
      for (const child of branch) {
        if (ids.includes(child.id) || !ids.includes(child.parentId)) continue
        child.parentId = tab.parentId
        orphansToSave.push(child.id)
        if (tab.parentId !== NOID) browser.tabs.update(child.id, { openerTabId: tab.parentId })
        else browser.tabs.update(child.id, { openerTabId: child.id })
      }
    }

    // Set src parents
    if (tab.parentId !== NOID && parentStayStill) {
      const p = Tabs.byId[tab.parentId]
      if (p) srcParents.push(p)
    }

    // Cut tab from old index in sidebery list
    const index = Tabs.list.indexOf(tab, prevIndex)
    if (index === -1) continue
    Tabs.list.splice(index, 1)

    if (tab.active) isActive = true

    prevIndex = index

    // Get dstIndex if target tab included in moving tabs list
    if (dstTab && dstTab.id === tab.id) dstIndexIncluded = index

    // Update panelId
    if (dst.panelId !== undefined && tab.panelId !== dst.panelId) {
      if (!panelIsChanged) panelIsChanged = true
      srcPanelId = tab.panelId

      // Check if the media state of the panels needs to be updated
      if (!isMediaActive && (tab.audible || tab.mutedInfo?.muted || tab.mediaPaused)) {
        isMediaActive = true
        mediaPrevPanelId = tab.panelId
      }

      // Check if the "updated" state of the panels needs to be updated
      if (!isUpdated && tab.updated) isUpdated = true

      tab.panelId = dst.panelId
    }

    // Update parent-child relation
    const oldParent = Tabs.byId[tab.parentId]
    if (tab.parentId !== dst.parentId && (!oldParent || !tabs.includes(oldParent))) {
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

  // Recalc "updated" badge of panels
  if (isUpdated) {
    if (srcPanelId) {
      Sidebar.updateUpdatedStateOfPanel(Sidebar.panelsById[srcPanelId])
    }
    if (dst.panelId && dst.panelId !== srcPanelId) {
      Sidebar.updateUpdatedStateOfPanel(Sidebar.panelsById[dst.panelId])
    }
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

  // Update custom colors
  if (Settings.state.inheritCustomColor && dstParent && dstParent.customColor) {
    for (const tab of tabs) {
      if (tab.customColor === dstParent.customColor) continue
      tab.reactive.customColor = tab.customColor = dstParent.customColor
    }
  }

  // Activate folded parent tab
  if (isActive && dstParent && dstParent.folded) {
    browser.tabs.update(dstParent.id, { active: true }).catch(err => {
      Logs.err('Tabs.move: Cannot activate tab:', err)
    })
  }

  // Auto discard folded tabs
  if (dstParent?.folded && Settings.state.discardFolded) {
    Tabs.autoDiscardFolded(dstParent)
  }

  // Update group pages
  if (dstParent?.isGroup && !dstParent.discarded) Tabs.updateGroupOrItsChild(dstParent, NOID)
  for (const p of srcParents) {
    if (p?.isGroup && !p.discarded) Tabs.updateGroupOrItsChild(p, NOID)
  }

  tabs.forEach(t => Tabs.saveTabData(t.id))
  orphansToSave.forEach(id => Tabs.saveTabData(id))
  Tabs.cacheTabsData()

  // Mark moving tabs
  Tabs.movingTabs.push(...ids)
  tabs.forEach(t => (t.moving = true))

  // Update native tabs
  // ---
  // Unpin tab
  if (toUnpin?.length) {
    for (const tab of [...toUnpin].reverse()) {
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
  const samePosition = srcIndex === tabs[0].index
  const canSkipMove = oneAfterAnother && samePosition
  if (!canSkipMove) {
    const nativeDstIndex = dst.index <= tabs[0].index ? dst.index : dst.index - 1
    await browser.tabs.move(ids, { windowId: Windows.id, index: nativeDstIndex }).catch(err => {
      Logs.err('Tabs.move: Cannot move native tabs', err)
    })
  }

  // Reset moving tabs marks
  tabs.forEach(t => (t.moving = undefined))
  movingTabs = []

  // Update visibility
  if (Settings.state.hideFoldedTabs || (Settings.state.hideInact && panelIsChanged)) {
    Tabs.updateNativeTabsVisibility()
  }

  // Update filtered results
  if (Search.active) Search.search()
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(tabIds: ID[], dst: T.DstPlaceInfo): Promise<void> {
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

  const detachedTabsInfo = Tabs.detachTabs(tabIds)
  const tabs = detachedTabsInfo?.tabs
  if (!tabs) return

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

export async function moveToThisWin(
  tabs: T.Tab[],
  dst?: T.DstPlaceInfo,
  allInWin?: boolean
): Promise<boolean> {
  if (!tabs || !tabs.length) return false

  if (!Tabs.attachingTabs) Tabs.setAttachingTabs([...tabs])
  else Tabs.attachingTabs.push(...tabs)

  const probeTab = tabs[0]
  const isPinned = probeTab.pinned
  const toPinned = dst?.pinned || (probeTab.pinned && dst?.pinned === undefined && !dst?.parentId)
  const srcWinId = probeTab.windowId

  let panel = Sidebar.panelsById[dst?.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) panel = Sidebar.panelsById[probeTab.panelId]

  let indexFallback
  if (Utils.isTabsPanel(panel) && panel.nextTabIndex > -1) indexFallback = panel.nextTabIndex
  else indexFallback = Tabs.list.length

  // Create dst
  if (!dst) dst = { panelId: probeTab.panelId, parentId: -1 }

  // Set index
  if (dst.index === undefined) dst.index = isPinned ? Tabs.pinned.length : indexFallback
  if (isPinned && toPinned && dst.index > Tabs.pinned.length) dst.index = Tabs.pinned.length
  if (dst.index < 0) dst.index = 0

  const index = dst.index ?? 0
  const tabIds = tabs.map(t => t.id)
  const dstParent = Tabs.byId[dst.parentId ?? NOID]
  const panelIsActive = panel.id === Sidebar.activePanelId
  const groups: T.Tab[] = []
  const updatedTabIds: ID[] = []

  let updMediaBadges = false
  let updNativeTabsVisibility = Settings.state.hideInact && !panelIsActive
  let activateTabId = NOID

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]

    // Put this tab to the local state
    Tabs.byId[tab.id] = tab
    Tabs.list.splice(index + i, 0, tab)

    // Pin / Unpin
    if (!!tab.pinned !== !!dst.pinned) {
      if (!dst.pinned) tab.unpinning = true
      await browser.tabs.update(tab.id, { pinned: !!dst.pinned })
      tab.reactive.pinned = tab.pinned = !!dst.pinned
      if (tab.unpinning) tab.unpinning = false
    }

    // Update some tab props
    if (dst.windowId !== undefined) tab.windowId = dst.windowId
    if (dst.panelId) tab.panelId = dst.panelId
    tab.reactive.sel = tab.sel = false
    tab.index = index + i

    // Reset "hidden" flag b/c moving hidden tabs between windows makes them not hidden
    tab.hidden = false

    // Parent tab included
    if (tab.parentId === -1 || !tabIds.includes(tab.parentId)) {
      tab.parentId = dstParent ? dstParent.id : NOID
    }

    // Update tree level
    const parent = Tabs.byId[tab.parentId]
    tab.reactive.lvl = tab.lvl = parent ? parent.lvl + 1 : 0

    // Check child tabs
    if (tab.isParent && !tabs.find(t => t.parentId === tab.id)) {
      tab.reactive.isParent = tab.isParent = false
      tab.reactive.folded = tab.folded = false
    }

    // Check if media badges recalc is needed
    if (!updMediaBadges && (tab.audible || tab.mediaPaused || tab.mutedInfo?.muted)) {
      updMediaBadges = true
    }

    // Collect ids of tabs with updated title
    if (tab.updated) {
      updatedTabIds.push(tab.id)
    }

    // Set tab to activate
    if (panelIsActive && activateTabId === NOID && tab.active) {
      activateTabId = tab.id
    }

    // Check if native tabs visibility update is needed
    if (!updNativeTabsVisibility && Settings.state.hideFoldedTabs && tab.folded) {
      updNativeTabsVisibility = true
    }

    if (tab.isGroup) groups.push(tab)

    // Reactivate tab
    Tabs.reactivateTab(tab)
  }

  // Create new active empty tab if all tabs are moved and window will be closed.
  // This is needed to prevent unneeded sequential activation of tabs.
  let tmpLastTab
  if (allInWin && tabs.length > 1) {
    tmpLastTab = await browser.tabs.create({
      url: 'about:blank',
      active: true,
      index: 0,
      windowId: srcWinId,
    })
  }

  // Move native tabs
  await browser.tabs.move(tabIds, { windowId: Windows.id, index }).catch(err => {
    Logs.err('Tabs.moveToThisWin: Cannot move tab:', err)
  })

  // Close window with temp last tab
  if (tmpLastTab) {
    browser.windows.remove(srcWinId)
  }

  // Update/Recalc local state
  Tabs.updateTabsIndexes(index + tabs.length)
  Tabs.updateTabsTree()
  Sidebar.recalcTabsPanels()
  if (!probeTab.pinned) Sidebar.recalcVisibleTabs(panel.id)

  // Recalc updated flag
  if (Utils.isTabsPanel(panel) && updatedTabIds.length) {
    panel.updatedTabs.push(...updatedTabIds)
    panel.reactive.updated = panel.updatedTabs.length > 0
  }

  // Save new tabs data / cache
  tabs.forEach(tab => Tabs.saveTabData(tab.id, true))
  Tabs.cacheTabsData()

  // Update succession
  Tabs.updateSuccessionDebounced(0)

  // Update media badges
  if (updMediaBadges) {
    Sidebar.updateMediaStateOfPanelDebounced(100, panel.id)
  }

  // Activate tab
  if (activateTabId !== NOID) {
    await browser.tabs.update(activateTabId, { active: true })
  }

  // Update native tabs visibility
  if (updNativeTabsVisibility) {
    Tabs.updateNativeTabsVisibility()
  }

  // Update dst group page
  if (dstParent && dstParent.isGroup && !dstParent.discarded) {
    Tabs.updateGroupOrItsChild(dstParent, NOID)
  }

  // Update moved groups
  if (groups.length) {
    groups.forEach(t => !t.discarded && Tabs.updateGroupOrItsChild(t, NOID))
  }

  return true
}

export interface DetachedTabsInfo {
  tabs: T.Tab[]
  allInWin: boolean
}

export function detachTabs(tabIds: ID[]): DetachedTabsInfo | undefined {
  Tabs.sortTabIds(tabIds)

  Tabs.setDetachingTabIds(new Set([...tabIds]))

  const probeTab = Tabs.byId[tabIds[0]]
  if (!probeTab) return

  const detachedTabs: T.Tab[] = []
  const panel = Sidebar.panelsById[probeTab.panelId]
  const tabsLen = Tabs.list.length
  const toSave: ID[] = []
  let updMediaBadges = false

  for (let i = tabIds.length; i--; ) {
    const id = tabIds[i]
    const tab = Tabs.byId[id]
    if (!tab) continue

    // Update parentId of untouched child tabs
    if (tab.isParent && !tabIds.includes(tab.parentId)) {
      const branch = Tabs.getBranch(tab, false)
      for (const ct of branch) {
        if (ct.parentId === tab.id && !tabIds.includes(ct.id)) {
          ct.parentId = tab.parentId
          toSave.push(ct.id)
        }
      }
    }

    // Update parentId of detached tabs
    if (tab.parentId !== NOID && !tabIds.includes(tab.parentId)) {
      let parent = Tabs.byId[tab.parentId]
      while (parent) {
        if (tabIds.includes(parent.parentId)) break
        parent = Tabs.byId[parent.parentId]
      }
      tab.parentId = parent ? parent.parentId : NOID
    }

    // Prepend to output array
    detachedTabs.unshift(Utils.cloneObject(tab))

    // Remove from local state
    delete Tabs.byId[id]
    Tabs.list.splice(tab.index, 1)

    // Check if media badges recalc is needed
    if (!updMediaBadges && (tab.audible || tab.mediaPaused || tab.mutedInfo?.muted)) {
      updMediaBadges = true
    }

    // Update url counter
    Links.rmTab(tab)

    // Reload related group for pinned tab
    const pinGroupTab = Tabs.byId[tab.relGroupId]
    if (tab.pinned && pinGroupTab) {
      const groupUrl = new URL(pinGroupTab.url)
      groupUrl.searchParams.delete('pin')
      browser.tabs.update(tab.relGroupId, { url: groupUrl.href }).catch(err => {
        Logs.err('Tabs.detachTabs: Cannot reload related group page:', err)
      })
    }

    // Update group page info
    const groupTab = Tabs.getGroupTab(tab)
    if (groupTab && !groupTab.discarded) {
      Tabs.updateGroupOrItsChild(groupTab, NOID)
    }

    // Cleanup IPPC
    if (tab.isGroup) IPPC.reset(tab)
  }

  // Update/Recalc local state
  Tabs.updateTabsIndexes()
  Tabs.updateTabsTree()
  Sidebar.recalcTabsPanels()
  if (!probeTab.pinned) Sidebar.recalcVisibleTabs(panel.id)
  if (toSave.length) toSave.forEach(id => Tabs.saveTabData(id))

  // Remove updated flag
  if (Utils.isTabsPanel(panel) && panel.updatedTabs.length) {
    panel.updatedTabs = panel.updatedTabs.filter(id => !tabIds.includes(id))
    panel.reactive.updated = panel.updatedTabs.length > 0
  }

  // Save new tabs cache
  Tabs.cacheTabsData()

  // Update succession
  Tabs.updateSuccessionDebounced(0)

  // Update filtered results
  if (Search.active) Search.search()

  // Update media badges
  if (updMediaBadges) {
    Sidebar.updateMediaStateOfPanelDebounced(100, panel.id)
  }

  if (detachedTabs.length) return { tabs: detachedTabs, allInWin: tabsLen === tabIds.length }
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
  const rules: T.TabToPanelMoveRule[] = []

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

  moveRules = rules
}

function createMoveToPanelRule(
  config: T.TabToPanelMoveRuleConfig,
  panelId: ID
): T.TabToPanelMoveRule | undefined {
  const rule: T.TabToPanelMoveRule = { panelId }

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
    if (Utils.isTabsPanel(currentPanel) && currentPanel.moveRules.length > 0) {
      excludeTo = currentPanel.moveExcludedTo
    }

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

function moveTabToPanel(tab: T.Tab, panelId: ID) {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return
  // TODO: why I use moveNewTabParent here? add config specifically for this case (move by rule)
  const moveToPanelStart = Settings.state.moveNewTabParent === 'start'
  const index = moveToPanelStart ? panel.startTabIndex : panel.nextTabIndex
  const src: T.SrcPlaceInfo = { windowId: Windows.id, pinned: tab.pinned }
  const dst: T.DstPlaceInfo = { panelId, index }
  Utils.GLOBAL_QUEUE.add(Tabs.move, [tab], src, dst)

  if (tab.active && Settings.state.tabsPanelSwitchActMoveAuto) {
    Sidebar.switchToPanel(panelId, true, true)
  }
}

export function moveTabToPanelViaOmnibox(tabId: ID, panelId: ID) {
  const tab = Tabs.byId[tabId]
  if (!tab) return Logs.warn('Tabs.moveTabToPanelViaOmnibox: no such tab:', tabId)
  if (tab.panelId === panelId) {
    return Logs.warn('Tabs.moveTabToPanelViaOmnibox: same target:', panelId)
  }

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) {
    return Logs.warn('Tabs.moveTabToPanelViaOmnibox: no such tab panel:', panelId)
  }

  // TODO: make position configurable
  const index = panel.nextTabIndex
  const windowId = Windows.id

  const src: T.SrcPlaceInfo = { windowId, pinned: tab.pinned }
  const dst: T.DstPlaceInfo = { windowId, panelId, index }
  Utils.GLOBAL_QUEUE.add(Tabs.move, [tab], src, dst)

  if (tab.active) Sidebar.switchToPanel(panelId, true, true)
}

export function findMoveRuleBy(
  containerId: string,
  lvl?: number
): T.TabToPanelMoveRule | undefined {
  for (const rule of Tabs.moveRules) {
    if (rule.urlRE || rule.urlStr) continue
    if (rule.containerId && rule.containerId !== containerId) continue
    if (rule.topLvlOnly && lvl !== undefined && lvl > 0) continue
    return rule
  }
}

export function findMoveRule(tab: T.Tab): T.TabToPanelMoveRule | undefined {
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

export async function moveTabToGroupViaOmnibox(tabInfo: T.ItemInfo, srcWinId: ID, groupTabId: ID) {
  const groupTab = Tabs.byId[groupTabId]
  if (!groupTab) return Logs.warn('Tabs.moveTabToGroup: no target tab:', groupTabId)

  // TODO: make position configurable
  const index = groupTab.index + (Tabs.getBranchLen(groupTabId) ?? 0) + 1
  const panelId = groupTab.panelId
  const windowId = Windows.id

  if (!Windows.focused) browser.windows.update(Windows.id, { focused: true })
  if (Sidebar.activePanelId !== panelId) Sidebar.switchToPanel(panelId, true, true)
  if (groupTab.folded || groupTab.invisible) Tabs.expTabsBranch(groupTabId, false)

  const src: T.SrcPlaceInfo = { windowId: srcWinId }
  const dst: T.DstPlaceInfo = { windowId, panelId, parentId: groupTabId, index, pinned: false }
  await Utils.GLOBAL_QUEUE.add(Tabs.move, [tabInfo], src, dst)

  Tabs.scrollToTab(tabInfo.id)
}
