import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { BKM_OTHER_ID, BKM_ROOT_ID, COLOR_NAMES, CONTAINER_ID, NEWID, NOID } from 'src/defaults'
import { BKM_MENU_ID, PRE_SCROLL } from 'src/defaults'
import { DragInfo, DragType, DropType, ItemBounds, ItemBoundsType, Panel } from 'src/types'
import { DstPlaceInfo, SrcPlaceInfo, InstanceType, ItemInfo, SubPanelType } from 'src/types'
import { DnD, DndPointerMode } from 'src/services/drag-and-drop'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Tabs } from 'src/services/tabs.fg'
import * as Logs from './logs'
import * as IPC from './ipc'
import { TabsSync } from './_services.fg'

let lastDragStartTime = 0

/**
 * Start dragging something
 */
export function start(info: DragInfo, dstType?: DropType): void {
  if (info.windowId === undefined) info.windowId = Windows.id
  if (info.panelId === undefined) info.panelId = Sidebar.activePanelId

  lastDragStartTime = Date.now()

  // Disable auto-switching active panel on mouseleave
  if (Sidebar.switchOnMouseLeave) Sidebar.switchOnMouseLeave = false

  if (
    (info.type === DragType.Tabs || info.type === DragType.TabsPanel) &&
    info.windowId === Windows.id &&
    info.items &&
    info.items.length > 1
  ) {
    const activeItem = info.items.find(i => i.id === Tabs.activeId)
    if (activeItem) {
      const dndIds = info.items.map(i => i.id)
      Tabs.updateSuccessionDebounced(0, dndIds)
    }
  }

  DnD.dropEventConsumed = false
  DnD.srcType = info.type
  DnD.isExternal = info.windowId !== Windows.id
  DnD.items = info.items || []
  DnD.startX = info.x
  DnD.startY = info.y
  DnD.srcIncognito = info.incognito ?? false
  DnD.srcPin = info.pinnedTabs ?? false
  DnD.srcWinId = info.windowId
  DnD.srcPanelId = info.panelId
  DnD.srcIndex = info.index ?? -1
  DnD.dropMode = info.copy ? 'copy' : 'auto'
  DnD.reactive.dstPanelId = info.panelId

  if (dstType) DnD.reactive.dstType = dstType
  updateTooltip(info)

  DnD.reactive.isStarted = true

  clearTimeout(dropEventWasConsumedTimeout)
}

function updateTooltip(info: DragInfo): void {
  if (!info.items) return
  if (info.type === DragType.Tabs) {
    if (info.items.length === 1) {
      DnD.reactive.dragTooltipTitle = info.items[0].title ?? ''
      DnD.reactive.dragTooltipInfo = info.items[0].url ?? ''
    } else {
      const label = translate('dnd.tooltip.tabs', info.items.length)
      DnD.reactive.dragTooltipTitle = `${info.items.length} ${label}`
      DnD.reactive.dragTooltipInfo = ''
    }
  } else if (info.type === DragType.Bookmarks) {
    if (info.items.length === 1) {
      DnD.reactive.dragTooltipTitle = info.items[0].title ?? ''
      DnD.reactive.dragTooltipInfo = info.items[0].url ?? ''
    } else {
      const label = translate('dnd.tooltip.bookmarks', info.items.length)
      DnD.reactive.dragTooltipTitle = `${info.items.length} ${label}`
      DnD.reactive.dragTooltipInfo = ''
    }
  } else if (info.type === DragType.BookmarksPanel) {
    DnD.reactive.dragTooltipTitle = translate('dnd.tooltip.bookmarks_panel')
    DnD.reactive.dragTooltipInfo = ''
  } else if (info.type === DragType.TabsPanel) {
    const panel = Sidebar.panelsById[info.panelId ?? NOID]
    if (panel?.name) {
      DnD.reactive.dragTooltipTitle = `"${panel.name}" ${translate('dnd.tooltip.tabs_panel')}`
      DnD.reactive.dragTooltipInfo = ''
    } else {
      DnD.reactive.dragTooltipTitle = '---'
      DnD.reactive.dragTooltipInfo = ''
    }
  } else if (info.type === DragType.NavItem) {
    DnD.reactive.dragTooltipTitle = translate('dnd.tooltip.nav_item')
    DnD.reactive.dragTooltipInfo = ''
  } else if (info.type === DragType.NewTab) {
    DnD.reactive.dragTooltipTitle = translate('dnd.tooltip.new_tab')
    DnD.reactive.dragTooltipInfo = ''
  } else if (info.type === DragType.History) {
    DnD.reactive.dragTooltipTitle = info.items[0].title ?? ''
    DnD.reactive.dragTooltipInfo = info.items[0].url ?? ''
  } else {
    DnD.reactive.dragTooltipTitle = '---'
    DnD.reactive.dragTooltipInfo = ''
  }
}

export function reset(): void {
  DnD.srcType = DragType.Nothing
  DnD.isExternal = false
  DnD.items = []
  DnD.startX = 0
  DnD.startY = 0
  DnD.srcIncognito = false
  DnD.srcPin = false
  DnD.srcWinId = NOID
  DnD.srcPanelId = NOID
  DnD.srcIndex = -1
  DnD.dropMode = 'auto'

  DnD.reactive.dstType = DropType.Nowhere
  DnD.reactive.dstIndex = -1
  DnD.reactive.dstPanelId = ''
  DnD.reactive.dstPin = false
  DnD.reactive.dstParentId = ''

  DnD.reactive.isStarted = false

  resetExpandTimeout()
  resetTabActivateTimeout()
  resetPanelSwitchTimeout()
  resetSubPanelOpenTimeout()
}

function resetDragPointer(): void {
  if (pointerEl) pointerEl.style.transform = 'translateY(0px)'

  DnD.reactive.pointerMode = DndPointerMode.None
  DnD.reactive.pointerExpanding = false
  DnD.reactive.pointerLvl = 0
  DnD.reactive.pointerHover = false

  xLock = false
  yLock = false
  pointerPos = 0
  dropLvlOffset = 0
  prevDropLvlOffset = 0
  dropPos = 0
  inPointerArea = false
}

let _expandTimeout: number | undefined
function expandTimeout(cb: () => void, delay?: number): void {
  clearTimeout(_expandTimeout)
  if (delay === 0) return cb()
  if (delay && delay < 0) return
  _expandTimeout = setTimeout(() => cb(), delay ?? Settings.state.dndExpDelay)
}
function resetExpandTimeout(): void {
  clearTimeout(_expandTimeout)
}

let _tabActivateTimeout: number | undefined
function tabActivateTimeout(cb: () => void, delay: number): void {
  clearTimeout(_tabActivateTimeout)
  if (delay === 0) return cb()
  if (delay < 0) return
  _tabActivateTimeout = setTimeout(() => cb(), delay)
}
function resetTabActivateTimeout(): void {
  clearTimeout(_tabActivateTimeout)
}

let _panelSwitchTimeout: number | undefined
function panelSwitchTimeout(cb: () => void, delay: number): void {
  clearTimeout(_panelSwitchTimeout)
  if (delay === 0) return cb()
  if (delay < 0) return
  _panelSwitchTimeout = setTimeout(() => cb(), delay)
}
function resetPanelSwitchTimeout(): void {
  clearTimeout(_panelSwitchTimeout)
}

let _subPanelOpenTimeout: number | undefined
function subPanelOpenTimeout(cb: () => void, delay: number) {
  clearTimeout(_subPanelOpenTimeout)
  if (delay === 0) return cb()
  if (delay < 0) return
  _subPanelOpenTimeout = setTimeout(() => cb(), delay)
}
function resetSubPanelOpenTimeout(): void {
  clearTimeout(_subPanelOpenTimeout)
}

function getDstInfo(): DstPlaceInfo {
  const info: DstPlaceInfo = {
    panelId: DnD.reactive.dstPanelId,
    parentId: DnD.reactive.dstParentId,
    index: DnD.reactive.dstIndex,
  }
  const toTabs = DnD.reactive.dstType === DropType.Tabs

  if (DnD.reactive.dstPin) info.pinned = true
  else if (toTabs) info.pinned = false

  const dstPanel = getDstPanel(DnD.reactive.dstType, info.panelId ?? NOID)
  if (!dstPanel) return info

  info.panelId = dstPanel.id

  if (Utils.isTabsPanel(dstPanel)) {
    const destContainer = Containers.reactive.byId[dstPanel.dropTabCtx ?? '']
    if (destContainer) info.containerId = dstPanel.dropTabCtx
  }

  if (info.index === -1) {
    info.index = getDstIndexInside(DnD.reactive.dstType, info)
    info.inside = true
  }
  return info
}

function getDstPanel(dstType: DropType, dstPanelId: ID): Panel | undefined {
  let dstPanel
  if (dstPanelId === Sidebar.subPanels.bookmarks?.id) dstPanel = Sidebar.subPanels.bookmarks
  else dstPanel = Sidebar.panelsById[dstPanelId]
  if (!dstPanel && dstType === DropType.Tabs) {
    const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
    if (Utils.isTabsPanel(actPanel)) dstPanel = actPanel
  }
  return dstPanel
}

function getDstIndexInside(dstType: DropType, dst: DstPlaceInfo): number {
  const dstPanel = getDstPanel(dstType, dst.panelId ?? NOID)
  if (!dstPanel) return 0

  // To the last position in branch/panel
  if (
    Utils.isTabsPanel(dstPanel) &&
    (dstType === DropType.Tabs || dstType === DropType.TabsPanel)
  ) {
    const parent = Tabs.byId[dst.parentId ?? NOID]
    if (parent) {
      const branchLen = Tabs.getBranchLen(parent.id) ?? 0
      return parent.index + branchLen + 1
    } else {
      return dstPanel.nextTabIndex ?? Tabs.list.length
    }
  }
  // To the last position in bookmarks children list
  else if (
    dstType === DropType.Bookmarks ||
    dstType === DropType.BookmarksPanel ||
    dstType === DropType.BookmarksSubPanelBtn
  ) {
    const parent = Bookmarks.reactive.byId[dst.parentId ?? NOID]
    return parent?.children?.length || 0
  }
  return 0
}

function getSrcInfo(): SrcPlaceInfo {
  return {
    windowId: DnD.srcWinId,
    panelId: DnD.srcPanelId,
    pinned: DnD.srcPin,
  }
}

function assertExpandMod(e: DragEvent): boolean {
  if (Settings.state.dndExpMod === 'alt' && e.altKey) return true
  else if (Settings.state.dndExpMod === 'shift' && e.shiftKey) return true
  else if (Settings.state.dndExpMod === 'ctrl' && e.ctrlKey) return true
  else return false
}

function assertTabActivateMod(e: DragEvent): boolean {
  if (Settings.state.dndTabActMod === 'alt' && e.altKey) return true
  else if (Settings.state.dndTabActMod === 'shift' && e.shiftKey) return true
  else if (Settings.state.dndTabActMod === 'ctrl' && e.ctrlKey) return true
  else return false
}

function applyLvlOffset(lvl: number, dst: DstPlaceInfo): void {
  if (lvl < 0) lvl = 0

  let panel
  if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.Bookmarks) {
    panel = Sidebar.subPanels.bookmarks
  } else {
    panel = Sidebar.panelsById[dst.panelId ?? NOID]
  }
  if (!panel) return
  let parentBounds = panel.bounds?.find(b => b.id === dst.parentId)
  let prevParentBounds: ItemBounds | undefined
  if (parentBounds && parentBounds.lvl >= lvl) {
    while (parentBounds && parentBounds.lvl >= lvl) {
      prevParentBounds = parentBounds
      parentBounds = panel.bounds?.find(b => b.id === parentBounds?.parent)
    }
    if (!parentBounds) {
      if (Utils.isTabsPanel(panel)) {
        dst.parentId = -1
      } else if (Utils.isBookmarksPanel(panel)) {
        if (panel.rootId !== NOID && panel.rootId !== BKM_ROOT_ID) {
          dst.parentId = panel.rootId
        } else {
          dst.parentId = BKM_OTHER_ID
        }
        const dstParent = Bookmarks.reactive.byId[dst.parentId]
        if (dstParent) dst.index = dstParent.children?.length ?? -1
      }
    } else {
      dst.parentId = parentBounds.id
      if (prevParentBounds && Utils.isBookmarksPanel(panel)) {
        dst.index = prevParentBounds.index + 1
      }
    }
  }
}

function isNativeTabs(event: DragEvent): boolean {
  if (!event.dataTransfer) return false
  return event.dataTransfer.types.includes('text/x-moz-text-internal')
}

function isContainerChanged(): boolean {
  // Check private container
  if (DnD.srcIncognito !== Windows.incognito) return true
  if (Windows.incognito) return false

  // Check if dst panel have dropTabCtx rule
  const dstPanel = Sidebar.panelsById[DnD.reactive.dstPanelId]
  let destContainer
  if (Utils.isTabsPanel(dstPanel)) destContainer = dstPanel.dropTabCtx
  if (!destContainer) return false

  const isDstDefaultContainer = destContainer === CONTAINER_ID
  const isDstContainerExists = isDstDefaultContainer || Containers.reactive.byId[destContainer]
  if (!isDstContainerExists) return false

  // Preserve container for globally pinned tabs
  if (DnD.reactive.dstPin && Settings.state.pinnedTabsPosition !== 'panel') return false

  // Check tabs
  for (const item of DnD.items) {
    if (item.container !== destContainer) return true
  }
  return false
}

export function onDragEnter(e: DragEvent): void {
  if (!(e.target as HTMLElement).getAttribute) return

  // Handle drag and drop from outside
  if (!DnD.reactive.isStarted && !e?.relatedTarget) {
    if (!e.dataTransfer?.items.length) return

    const dndInfo = e.dataTransfer?.getData('application/x-sidebery-dnd')

    Sidebar.updateBounds()

    // From other sidebery sidebar
    if (dndInfo) {
      let info: DragInfo
      try {
        info = JSON.parse(dndInfo) as DragInfo
      } catch (err) {
        return
      }
      DnD.start(info, DropType.Tabs)

      if (DnD.srcType === DragType.TabsPanel || DnD.srcType === DragType.BookmarksPanel) {
        Selection.selectNavItem(DnD.srcPanelId)
      } else {
        for (const item of DnD.items) {
          if (DnD.srcType === DragType.Tabs) Selection.selectTab(item.id)
          else if (DnD.srcType === DragType.Bookmarks) Selection.selectBookmark(item.id)
        }
      }
    }

    // Native
    else {
      const panel = Sidebar.panelsById[Sidebar.activePanelId]
      const leftOffset = panel?.leftOffset ?? 0
      DnD.start({
        x: (Sidebar.width >> 1) + leftOffset,
        y: e.clientX,
        type: DragType.Native,
        panelId: NOID,
        windowId: NOID,
      })
    }

    return
  }

  const type = (e.target as HTMLElement).getAttribute('data-dnd-type')
  const id = (e.target as HTMLElement).getAttribute('data-dnd-id')

  DnD.reactive.pointerHover = false

  resetPanelSwitchTimeout()
  resetSubPanelOpenTimeout()
  resetTabActivateTimeout()
  resetExpandTimeout()

  // Reset drag and drop if no type and id provided
  if (!type && !id) {
    DnD.reactive.dstType = DropType.Nowhere
    DnD.reactive.dstPin = false
    return
  }

  // Bookmarks sub-panel button
  if (type === 'bspb') {
    resetDragPointer()

    DnD.reactive.dstPin = false

    const panel = Sidebar.panelsById[Sidebar.activePanelId]
    if (!Utils.isTabsPanel(panel)) {
      DnD.reactive.dstType = DropType.Nowhere
      return
    }

    if (panel.bookmarksFolderId !== NOID && panel.bookmarksFolderId !== BKM_ROOT_ID) {
      DnD.reactive.dstParentId = panel.bookmarksFolderId
    } else {
      DnD.reactive.dstParentId = BKM_OTHER_ID
    }
    DnD.reactive.dstPanelId = panel.id
    DnD.reactive.dstType = DropType.BookmarksSubPanelBtn
    DnD.reactive.dstIndex = 0
    DnD.reactive.pointerMode = DndPointerMode.None

    // Open sub-panel
    subPanelOpenTimeout(() => Sidebar.openSubPanel(SubPanelType.Bookmarks, panel), 500)
  }

  // Sync sub-panel button
  if (type === 'sspb') {
    resetDragPointer()

    DnD.reactive.dstPin = false
    DnD.reactive.dstParentId = NOID

    const panel = Sidebar.panelsById[Sidebar.activePanelId]
    if (!Utils.isTabsPanel(panel)) {
      DnD.reactive.dstType = DropType.Nowhere
      return
    }

    DnD.reactive.dstType = DropType.SyncSubPanelBtn
    DnD.reactive.dstIndex = 0
    DnD.reactive.pointerMode = DndPointerMode.None
  }

  if (type === 'nav-item' && id) {
    DnD.reactive.dstPin = false
    DnD.reactive.dstParentId = NOID

    // Open hidden panels bar
    if (id === 'hidden_panels_btn') {
      DnD.reactive.dstType = DropType.Nowhere
      DnD.reactive.dstPanelId = NOID
      if (!Sidebar.reactive.hiddenPanelsPopup) {
        panelSwitchTimeout(() => Sidebar.openHiddenPanelsPopup(), 250)
      }
    }

    // Select nav element
    else {
      if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false

      const panel = Sidebar.panelsById[id]
      const isTabsPanel = Utils.isTabsPanel(panel)
      const isBookmarksPanel = Utils.isBookmarksPanel(panel)
      const isSyncPanel = Utils.isSyncPanel(panel)
      if (isTabsPanel) DnD.reactive.dstType = DropType.TabsPanel
      else if (isBookmarksPanel) DnD.reactive.dstType = DropType.BookmarksPanel
      else if (isSyncPanel) DnD.reactive.dstType = DropType.SyncPanel
      else DnD.reactive.dstType = DropType.NavItem

      if (panel) {
        DnD.reactive.dstPanelId = panel.id ?? NOID
      } else {
        if (id === 'add_tp') DnD.reactive.dstPanelId = id
      }
      DnD.reactive.dstIndex = Sidebar.reactive.nav.indexOf(id)

      const srcIsNav =
        DnD.srcType === DragType.NavItem ||
        DnD.srcType === DragType.TabsPanel ||
        DnD.srcType === DragType.BookmarksPanel

      if (!srcIsNav && (isTabsPanel || isBookmarksPanel)) {
        panelSwitchTimeout(() => Sidebar.switchToPanel(id), 750)
      }
    }
  }

  // Select hidden panel
  if (type === 'hidden-panel' && id) {
    DnD.reactive.dstType = DropType.TabsPanel
    DnD.reactive.dstPanelId = id
    DnD.reactive.dstIndex = Sidebar.reactive.nav.indexOf(id)
  }

  // Close hidden panels bar
  if (type === 'hidden-layer') {
    if (DnD.reactive.dstPanelId !== NOID && Sidebar.reactive.hiddenPanelsPopup) {
      Sidebar.closeHiddenPanelsPopup(true)
    }
  }

  if (type === 'pinned-bar') {
    const isPinnedTabsGlobal = Settings.state.pinnedTabsPosition !== 'panel'
    DnD.reactive.dstPin = true
    DnD.reactive.dstPanelId = id ?? NOID
    if (isPinnedTabsGlobal) {
      const pinnedTabsLen = Tabs.pinned.length
      const lastPinnedTab = Tabs.list[pinnedTabsLen - 1]
      DnD.reactive.dstIndex = pinnedTabsLen
      DnD.reactive.dstPanelId = lastPinnedTab?.panelId ?? NOID
    } else {
      const panel = Sidebar.panelsById[DnD.reactive.dstPanelId]
      if (Utils.isTabsPanel(panel) && panel.pinnedTabs.length) {
        const lastTab = panel.pinnedTabs[panel.pinnedTabs.length - 1]
        if (lastTab) DnD.reactive.dstIndex = lastTab.index + 1
      }
    }
  }

  if (type === 'tab' && id) {
    if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
    const tab = Tabs.byId[id]
    if (!tab) return
    DnD.reactive.dstType = DropType.Tabs
    DnD.reactive.dstPin = tab.pinned
    if (tab.pinned) DnD.reactive.dstIndex = tab.index
    else DnD.reactive.dstPanelId = tab.panelId

    if (Settings.state.dndTabAct && tab.pinned) {
      const delay = assertTabActivateMod(e) ? 0 : Settings.state.dndTabActDelay
      tabActivateTimeout(() => browser.tabs.update(tab.id, { active: true }), delay)
    }
  }

  if (type === 'bookmark' && id) {
    if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
    const bookmark = Bookmarks.reactive.byId[id]
    if (!bookmark) return

    let dstPanel
    if (Sidebar.subPanelActive) dstPanel = Sidebar.subPanels.bookmarks
    else dstPanel = Sidebar.panelsById[Sidebar.activePanelId]

    const panelId = dstPanel?.id
    DnD.reactive.dstType = DropType.Bookmarks
    DnD.reactive.dstPanelId = panelId ?? NOID
    DnD.reactive.dstPin = false
  }
}

export function onDragLeave(e: DragEvent): void {
  if (e?.relatedTarget) return

  if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
  Selection.resetSelection()
  resetDragPointer()
  reset()
}

function onPointerEnter(e: DragEvent): void {
  resetTabActivateTimeout()

  if (DnD.reactive.pointerMode !== DndPointerMode.Inside) return

  let panel
  if (Sidebar.subPanelActive) panel = Sidebar.subPanels.bookmarks
  else panel = Sidebar.panelsById[DnD.reactive.dstPanelId]

  const isTabs = Utils.isTabsPanel(panel)
  const isBookmarks = Utils.isBookmarksPanel(panel)

  if (isTabs) {
    if (Settings.state.dndExp === 'pointer') {
      const delay = assertExpandMod(e) ? 0 : Settings.state.dndExpDelay
      const tab = Tabs.byId[DnD.reactive.dstParentId]
      if (!tab || !tab.isParent) return
      if (delay !== 0) DnD.reactive.pointerHover = true
      expandTimeout(() => {
        DnD.reactive.pointerHover = false
        DnD.reactive.pointerExpanding = true
        Tabs.toggleBranch(tab.id)
        Sidebar.updatePanelBoundsDebounced(128)
      }, delay)
    }
    return
  }

  if (isBookmarks) {
    if (Settings.state.dndExp === 'pointer') {
      const delay = assertExpandMod(e) ? 0 : Settings.state.dndExpDelay
      const bookmark = Bookmarks.reactive.byId[DnD.reactive.dstParentId]
      const isParent = !!bookmark?.children?.length
      if (!bookmark || !isParent) return
      if (delay !== 0) DnD.reactive.pointerHover = true
      expandTimeout(() => {
        DnD.reactive.pointerHover = false
        DnD.reactive.pointerExpanding = true
        Bookmarks.toggleBranch(bookmark.id, Sidebar.activePanelId)
        Sidebar.updatePanelBoundsDebounced(128)
      }, delay)
    }
    return
  }
}

const pointers: Map<ID, HTMLElement> = new Map()
export function initPointer(el: HTMLElement | null, panelId: ID): void {
  if (!el) return Logs.err('Drag and Drop: No pointer element')
  pointers.set(panelId, el)
}

let pointerEl: HTMLElement | null = null
export function setActivePointer(panelId: ID) {
  const el = pointers.get(panelId)
  if (el) pointerEl = el
  else pointerEl = null
}

export function updatePointerLeftPosition(left: number): void {
  DnD.reactive.pointerLeft = left
}

export function onPointerExpanded(): void {
  DnD.reactive.pointerExpanding = false
}

let xLock = false
let yLock = false
let pointerPos = 0
let dropLvlOffset = 0
let prevDropLvlOffset = 0
let dropPos = 0
let inPointerArea = false
const prevEventKeys = { alt: false, ctrl: false, shift: false }
const path: ItemBounds[] = []
export function onDragMove(e: DragEvent): void {
  if (!DnD.reactive.isStarted) return
  if (!pointerEl) return
  if (Sidebar.reactive.hiddenPanelsPopup) return

  let panel
  if (
    Sidebar.subPanelActive &&
    Sidebar.subPanelType === SubPanelType.Bookmarks &&
    Sidebar.subPanels.bookmarks
  ) {
    panel = Sidebar.subPanels.bookmarks
  } else {
    panel = Sidebar.panelsById[Sidebar.activePanelId]
  }
  if (!panel || !panel.scrollEl) return

  const altKeyChanged = prevEventKeys.alt !== e.altKey
  const shiftKeyChanged = prevEventKeys.shift !== e.shiftKey
  const ctrlKeyChanged = prevEventKeys.ctrl !== e.ctrlKey
  const eventKeyChanged = altKeyChanged || shiftKeyChanged || ctrlKeyChanged
  prevEventKeys.alt = e.altKey
  prevEventKeys.shift = e.shiftKey
  prevEventKeys.ctrl = e.ctrlKey

  // Skip keyup event
  if (
    (altKeyChanged && !e.altKey) ||
    (shiftKeyChanged && !e.shiftKey) ||
    (ctrlKeyChanged && !e.ctrlKey)
  ) {
    return
  }

  // Reenter on target element if alt/shift/ctrl key was pressed
  if (eventKeyChanged && (xLock || yLock)) onDragEnter(e)

  const boundsLen = panel.bounds?.length ?? 0
  const bounds = panel.bounds
  const scroll = panel.scrollEl.scrollTop ?? 0
  const panelTopOffset = panel.topOffset ?? 0
  const panelRightOffset = panel.rightOffset ?? 0
  const panelBottomOffset = panel.bottomOffset ?? 0
  const y = e.clientY - panelTopOffset + scroll
  const x = e.clientX - (panel.leftOffset ?? 0)

  // Hide pointer if cursor out of drop area
  if (!yLock && (e.clientY < panelTopOffset || e.clientY > panelBottomOffset)) {
    DnD.reactive.pointerMode = DndPointerMode.None
    yLock = true
    return
  }
  if (
    yLock &&
    e.clientY > panelTopOffset &&
    e.clientY < panelBottomOffset &&
    DnD.reactive.pointerMode === DndPointerMode.None
  ) {
    yLock = false
    if (!xLock) {
      pointerPos--
      DnD.reactive.pointerMode = DndPointerMode.Between
    }
  }
  if (!xLock && (x < 0 || e.clientX > panelRightOffset)) {
    DnD.reactive.pointerMode = DndPointerMode.None
    xLock = true
    return
  }
  if (
    xLock &&
    x > 0 &&
    e.clientX < panelRightOffset &&
    DnD.reactive.pointerMode === DndPointerMode.None
  ) {
    xLock = false
    if (!yLock) {
      pointerPos--
      DnD.reactive.pointerMode = DndPointerMode.Between
    }
  }

  if (xLock || yLock) return

  dropLvlOffset = ~~((e.clientX - DnD.startX) / 12)
  const lvlChanged = prevDropLvlOffset !== dropLvlOffset
  prevDropLvlOffset = dropLvlOffset

  // Entering in the pointer aria
  if (x > 0 && x < 32 && (!inPointerArea || eventKeyChanged)) {
    inPointerArea = true
    onPointerEnter(e)
    return
  } else if (x > 32 && inPointerArea) {
    inPointerArea = false
    DnD.reactive.pointerHover = false
    pointerPos--
    resetExpandTimeout()
  }

  // Empty
  if (boundsLen === 0) {
    dropPos = -12
    if (pointerPos !== dropPos) {
      pointerPos = dropPos
      pointerEl.style.transform = `translateY(${pointerPos}px)`
      DnD.reactive.pointerMode = DndPointerMode.Between
      DnD.reactive.pointerLvl = 0
      const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
      DnD.reactive.dstIndex = Utils.isTabsPanel(activePanel) ? activePanel.startTabIndex : -1
      DnD.reactive.dstParentId = -1
    }
    return
  }

  // End
  if (y > bounds[boundsLen - 1].bottom) {
    const slot = bounds[boundsLen - 1]
    dropPos = slot.end - 12
    if (lvlChanged || pointerPos !== dropPos) {
      resetTabActivateTimeout()
      pointerPos = dropPos
      pointerEl.style.transform = `translateY(${pointerPos}px)`
      DnD.reactive.pointerMode = DndPointerMode.Between
      DnD.reactive.pointerLvl = dropLvlOffset < 0 ? slot.lvl + dropLvlOffset : slot.lvl
      DnD.reactive.dstIndex = slot.folded ? -1 : slot.index + 1
      DnD.reactive.dstParentId = slot.parent
    }

    return
  }

  for (let slot, i = 0; i < boundsLen; i++) {
    slot = bounds[i]

    if (y > slot.end) path[slot.lvl] = slot

    // Skip
    if (!lvlChanged && (y > slot.end || y < slot.start)) continue

    // Between
    if (slot.in ? y < slot.top : y < slot.center) {
      if (i === 0) dropPos = -12
      else dropPos = slot.start - 12
      if (lvlChanged || pointerPos !== dropPos) {
        resetTabActivateTimeout()
        pointerPos = dropPos
        pointerEl.style.transform = `translateY(${pointerPos}px)`
        const prevSlot = bounds[i - 1]
        if (!prevSlot) {
          DnD.reactive.pointerLvl = 0
          DnD.reactive.pointerMode = DndPointerMode.Between
          DnD.reactive.dstIndex = slot.index
          DnD.reactive.dstParentId = -1
          break
        }

        const slotIsTab = slot.type === ItemBoundsType.Tab

        const node = slotIsTab ? Tabs.byId[slot.id] : Bookmarks.reactive.byId[slot.id]
        const prevNode = slotIsTab ? Tabs.byId[prevSlot.id] : Bookmarks.reactive.byId[prevSlot.id]

        if (prevNode?.sel && node?.sel) DnD.reactive.pointerMode = DndPointerMode.None
        else DnD.reactive.pointerMode = DndPointerMode.Between

        // First child
        if (prevSlot.id === slot.parent) {
          DnD.reactive.pointerLvl = prevSlot.lvl + 1
          DnD.reactive.dstIndex = slot.index
          DnD.reactive.dstParentId = slot.parent
        }

        // or Second-Last child in group
        else {
          let lvl = prevSlot.lvl
          if (prevSlot.lvl > slot.lvl && lvlChanged && dropLvlOffset < 0) {
            lvl = prevSlot.lvl + dropLvlOffset
            if (lvl > prevSlot.lvl) lvl = prevSlot.lvl
            if (lvl < slot.lvl) lvl = slot.lvl
          }

          const parentSlot = path[lvl - 1]

          let index = -1
          if (DnD.reactive.dstType === DropType.Tabs) index = slot.index
          if (DnD.reactive.dstType === DropType.Bookmarks) {
            if (prevSlot.lvl === slot.lvl) index = prevSlot.index + 1
            else if (lvl === slot.lvl) index = slot.index
          }

          DnD.reactive.pointerLvl = lvl
          DnD.reactive.dstIndex = index
          DnD.reactive.dstParentId = parentSlot?.id ?? NOID
        }
      }
      break
    }

    // Inside
    if (slot.in && y < slot.bottom) {
      dropPos = slot.center - 12
      if (pointerPos !== dropPos || eventKeyChanged) {
        pointerPos = dropPos
        pointerEl.style.transform = `translateY(${pointerPos}px)`

        if (Selection.includes(slot.id)) DnD.reactive.pointerMode = DndPointerMode.None
        else DnD.reactive.pointerMode = DndPointerMode.Inside
        DnD.reactive.pointerLvl = slot.lvl + 1
        DnD.reactive.dstIndex = -1
        DnD.reactive.dstParentId = slot.id

        // Entering in the pointer aria
        if (x < 32 && Settings.state.dndExp === 'pointer') {
          onPointerEnter(e)
          break
        }

        // Pointer inside tab - activate / expand
        if (DnD.reactive.dstType === DropType.Tabs) {
          const targetId = slot.id
          if (Settings.state.dndTabAct) {
            const delay = assertTabActivateMod(e) ? 0 : Settings.state.dndTabActDelay
            tabActivateTimeout(() => browser.tabs.update(targetId, { active: true }), delay)
          }
          if (Settings.state.dndExp === 'hover') {
            const delay = assertExpandMod(e) ? 0 : Settings.state.dndExpDelay
            expandTimeout(() => {
              Tabs.toggleBranch(targetId)
              Sidebar.updatePanelBoundsDebounced(128)
            }, delay)
          }
        }

        // Pointer inside bookmark - expand
        if (DnD.reactive.dstType === DropType.Bookmarks) {
          const targetId = slot.id
          const bookmark = Bookmarks.reactive.byId[targetId]
          const isParent = !!bookmark?.children?.length
          if (isParent && Settings.state.dndExp === 'hover') {
            const delay = assertExpandMod(e) ? 0 : Settings.state.dndExpDelay
            expandTimeout(() => {
              Bookmarks.toggleBranch(targetId, Sidebar.activePanelId)
              Sidebar.updatePanelBoundsDebounced(128)
            }, delay)
          }
        }
      }
      break
    }
  }

  // Auto-scroll (needed if scrollbar-width: none)
  const locOffset = y - scroll
  if (locOffset < PRE_SCROLL) {
    panel.scrollEl.scrollTop = scroll - (PRE_SCROLL - locOffset)
  } else if (locOffset > panel.scrollEl.offsetHeight - PRE_SCROLL) {
    panel.scrollEl.scrollTop = scroll + (locOffset - (panel.scrollEl.offsetHeight - PRE_SCROLL))
  }
}

let dropEventWasConsumedTimeout: number | undefined

/**
 * Temporary set DnD.dropEventConsumed to true.
 * It's needed to correctly handle dragEnd event.
 */
function dropEventWasConsumed(): void {
  DnD.dropEventConsumed = true
  clearTimeout(dropEventWasConsumedTimeout)
  dropEventWasConsumedTimeout = setTimeout(() => {
    DnD.dropEventConsumed = false
  }, 2000)
}

export function isDropEventConsumed(): boolean {
  return DnD.dropEventConsumed
}

/**
 * Drop event handler
 */
export async function onDrop(e: DragEvent): Promise<void> {
  dropEventWasConsumed()

  if (e.ctrlKey) DnD.dropMode = 'copy'

  // Handle native firefox tabs
  if (isNativeTabs(e)) {
    const result = await Utils.parseDragEvent(e, Windows.lastFocusedId)
    if (result?.matchedNativeTabs?.length) {
      if (result.matchedNativeTabs?.length) {
        const firstTab = result.matchedNativeTabs[0]
        DnD.srcWinId = firstTab.windowId
        DnD.srcIncognito = firstTab.incognito
        DnD.srcIndex = firstTab.index
        DnD.srcPanelId = NOID
        DnD.srcPin = firstTab.pinned
        DnD.srcType = DragType.Tabs
        DnD.items = result.matchedNativeTabs.map(tab => {
          return {
            id: tab.id,
            container: tab.cookieStoreId,
            pinned: tab.pinned,
            title: tab.title,
            url: tab.url,
          }
        })
      }
    }
  }

  const srcType = DnD.srcType
  let dstType = DnD.reactive.dstType
  const fromTabs = srcType === DragType.Tabs
  let toTabs = dstType === DropType.Tabs
  const fromTabsPanel = srcType === DragType.TabsPanel
  let toTabsPanel = dstType === DropType.TabsPanel
  const fromBookmarks = srcType === DragType.Bookmarks
  const toBookmarks = dstType === DropType.Bookmarks
  const fromBookmarksPanel = srcType === DragType.BookmarksPanel
  let toBookmarksPanel =
    dstType === DropType.BookmarksPanel || dstType === DropType.BookmarksSubPanelBtn
  const toSync = dstType === DropType.SyncSubPanelBtn || dstType === DropType.SyncPanel
  const fromNav = srcType === DragType.NavItem
  let toNav = dstType === DropType.NavItem
  const fromNewTabBar = srcType === DragType.NewTab
  const fromHistory = srcType === DragType.History
  const bookmarksWasUnloaded = !Bookmarks.reactive.tree.length

  const items = DnD.items
  const src = getSrcInfo()
  const dst = getDstInfo()

  if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup()
  if ((toTabs && !DnD.reactive.dstPin) || toBookmarks) {
    if (toTabs && Sidebar.subPanelActive && Sidebar.subPanels.bookmarks) {
      dstType = DropType.BookmarksPanel
      toTabs = false
      toBookmarksPanel = true
      dst.panelId = Sidebar.subPanels.bookmarks.id
    } else {
      dst.panelId = Sidebar.activePanelId
    }
    applyLvlOffset(DnD.reactive.pointerLvl, dst)
  }

  // Stop if dst parent is included in dragged items
  if (dst.parentId !== -1 && items.some(i => i.id === dst.parentId)) {
    resetDragPointer()
    DnD.resetOther()
    DnD.reset()
    Selection.resetSelection()
    return
  }

  // From new tab bar to tabs
  if (fromNewTabBar && toTabs) {
    const item = items[0]
    dst.containerId = item.container ?? CONTAINER_ID
    const newTabConf: ItemInfo = { id: NOID, url: item.url ?? 'about:newtab', active: true }
    await Tabs.open([newTabConf], dst)
  }

  // To new tabs panel
  let tabsPanelsSaveNeeded = false
  let newTabPanel
  if (dst.panelId === 'add_tp' && (fromTabs || fromBookmarks)) {
    newTabPanel = Sidebar.createTabsPanel({ color: Utils.getRandomFrom(COLOR_NAMES) })
    const index = Sidebar.getIndexForNewTabsPanel(true)
    Sidebar.addPanel(index, newTabPanel)
    Sidebar.recalcPanels()
    Sidebar.recalcTabsPanels()
    dst.panelId = newTabPanel.id
    dst.index = newTabPanel.nextTabIndex
    dstType = DropType.TabsPanel
    toNav = false
    toTabsPanel = true
    tabsPanelsSaveNeeded = true
  }

  // Get index when dropping to bookmarks panel
  if (toTabsPanel && !fromTabsPanel && !fromBookmarksPanel && !fromNav) {
    dst.index = getDstIndexInside(dstType, dst)
    dst.inside = true
  }

  // Prepare bookmarks
  if (toBookmarks || toBookmarksPanel) {
    const prepareResult = await Bookmarks.prepareBookmarks()
    if (!prepareResult) return Logs.warn('onDrop: bookmarks not prepared')
  }

  // Get index and set folder when dropping to bookmarks panel
  let setTabsPanelFolder = false
  if (toBookmarksPanel && !fromTabsPanel && !fromBookmarksPanel && !fromNav) {
    const dstPanel = getDstPanel(dstType, dst.panelId ?? NOID)
    if (!dstPanel) return

    dst.inside = true

    if (Utils.isBookmarksPanel(dstPanel)) {
      const existedFolder = Bookmarks.reactive.byId[dstPanel.rootId]
      dst.parentId = existedFolder ? dstPanel.rootId : BKM_OTHER_ID
      dst.index = getDstIndexInside(dstType, dst)
    } else if (Utils.isTabsPanel(dstPanel)) {
      let parentId
      if (
        dstPanel.bookmarksFolderId !== NOID &&
        dstPanel.bookmarksFolderId !== BKM_ROOT_ID &&
        Bookmarks.reactive.byId[dstPanel.bookmarksFolderId]
      ) {
        parentId = dstPanel.bookmarksFolderId
      } else {
        parentId = BKM_OTHER_ID
        setTabsPanelFolder = true
      }
      dst.parentId = parentId
      dst.index = getDstIndexInside(dstType, dst)
    }
  }

  // Tabs to tabs
  if ((fromTabs && toTabs) || (fromTabs && toTabsPanel) || (fromTabsPanel && toTabs)) {
    const reopenNeeded = isContainerChanged()

    if (DnD.dropMode === 'copy') await Tabs.open(items, dst)
    else if (reopenNeeded) await Tabs.reopen(items, dst)
    else await Tabs.move(items, src, dst)
  }

  // Tabs to bookmarks
  if (
    (fromTabs && toBookmarks) ||
    (fromTabs && toBookmarksPanel) ||
    (fromTabsPanel && toBookmarks)
  ) {
    const panel = Sidebar.panelsById[dst.panelId ?? NOID]
    const copyMode = DnD.dropMode === 'copy'
    const toRemove = Settings.state.dndMoveTabs && items.map(t => t.id)

    if (setTabsPanelFolder && Utils.isTabsPanel(panel)) {
      const result = await setFolderForTabsPanel(panel, dst)
      if (!result) {
        resetDragPointer()
        DnD.resetOther()
        DnD.reset()
        Selection.resetSelection()
        return
      }
    }

    // Recheck dst index if bookmarks was unloaded
    if (dst.index === 0 && bookmarksWasUnloaded && toBookmarksPanel) {
      const parent = Bookmarks.reactive.byId[dst.parentId ?? NOID]
      if (parent?.children?.length) dst.index = parent.children.length
    }

    await Bookmarks.createFrom(items, dst)

    if (toRemove && !copyMode) Tabs.removeTabs(toRemove, true)
  }

  // Tabs to Sync
  if (fromTabs && toSync) {
    const ids = items.map(t => t.id)
    TabsSync.sync(ids)
  }

  // Bookmarks to tabs
  if (
    (fromBookmarks && toTabs) ||
    (fromBookmarks && toTabsPanel) ||
    (fromBookmarksPanel && toTabs)
  ) {
    const ids = items.map(i => i.id)
    const copyMode = DnD.dropMode === 'copy'
    let ok = true

    const panel = Sidebar.panelsById[dst.panelId ?? NOID]
    if (dst.index === -1 && Utils.isTabsPanel(panel)) {
      dst.index = panel.nextTabIndex
    }

    try {
      await Bookmarks.open(ids, dst)
    } catch (err) {
      ok = false
      Logs.err('onDrop: Cannot open bookmark[s]', err)

      if (newTabPanel) {
        Sidebar.removePanel(newTabPanel.id, { tabsMode: 'close' })
      }
    }

    if (ok && Settings.state.dndMoveBookmarks && !copyMode) {
      Bookmarks.removeBookmarks(ids, { noNotif: true, noWarn: true })
    }

    if (newTabPanel) {
      Sidebar.activatePanel(newTabPanel.id)
    }
  }

  // Bookmarks to bookmarks
  if (fromBookmarks && toBookmarks) {
    let dstPanel
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.Bookmarks) {
      dstPanel = Sidebar.subPanels.bookmarks
    } else {
      dstPanel = Sidebar.panelsById[Sidebar.activePanelId]
    }

    if (Utils.isBookmarksPanel(dstPanel) && dstPanel.viewMode === 'tree') {
      if (DnD.dropMode === 'copy') Bookmarks.createFrom(items, dst)
      else {
        const ids = items.map(i => i.id)
        Bookmarks.move(ids, dst)
      }
    }
  }

  // History to tabs
  if ((fromHistory && toTabs) || (fromHistory && toTabsPanel)) {
    Tabs.open(items, dst)
  }

  // NavItem to NavItem
  if (
    (fromTabsPanel || fromBookmarksPanel || fromNav) &&
    (toTabsPanel || toBookmarksPanel || toNav)
  ) {
    Sidebar.moveNavItem(DnD.srcIndex, dst.index ?? 0)
  }

  // Native to tabs
  if (srcType === DragType.Native && (toTabs || toTabsPanel)) {
    Tabs.createFromDragEvent(e, dst)
  }

  // Native to bookmarks
  if (srcType === DragType.Native && (toBookmarks || toBookmarksPanel)) {
    Bookmarks.createFromDragEvent(e, dst)
  }

  resetDragPointer()
  DnD.resetOther()
  DnD.reset()
  Selection.resetSelection()

  if (tabsPanelsSaveNeeded) Sidebar.saveSidebar()
}

async function setFolderForTabsPanel(panel: Panel, dst: DstPlaceInfo) {
  if (!Utils.isTabsPanel(panel)) return true
  if (Bookmarks.reactive.byId[panel.bookmarksFolderId]) return true

  const result = await Bookmarks.openBookmarksPopup({
    title: translate('popup.bookmarks.set_folder_for_tabs_panel'),
    name: panel.name,
    nameField: true,
    location: BKM_MENU_ID,
    locationField: true,
    locationTree: true,
    controls: [{ label: 'btn.save' }],
  })

  if (result && Bookmarks.reactive.byId[result.location ?? NOID]) {
    const parentId = result.location ?? NOID
    const parent = Bookmarks.reactive.byId[parentId]
    const index = parent.children?.length ?? 0
    if (parent && result.name) {
      let rootFolder
      try {
        rootFolder = await browser.bookmarks.create({
          type: 'folder',
          title: result.name.trim(),
          parentId: parentId,
          index,
        })
      } catch (err) {
        Logs.err('DnD.onDrop: Cannot set folder for tabs panel', err)
      }
      if (rootFolder) {
        panel.bookmarksFolderId = rootFolder.id
        Sidebar.saveSidebar()

        dst.parentId = rootFolder.id
        dst.index = 0

        return true
      }
    }
  }
}

let resetOtherTimeout: number | undefined
export function resetOther(): void {
  clearTimeout(resetOtherTimeout)
  resetOtherTimeout = setTimeout(() => {
    IPC.broadcast({ dstType: InstanceType.sidebar, action: 'stopDrag' })
  }, 150)
}

let dragEndedRecentlyTimeout: number | undefined

export async function onDragEnd(e: DragEvent): Promise<void> {
  resetDragPointer()
  DnD.resetOther()
  let mode = DnD.dropMode
  if (DnD.reactive.isStarted) DnD.reset()
  Selection.resetSelection()

  if (e.ctrlKey) mode = 'copy'

  // Dropped outside sidebar
  if (
    !DnD.dropEventConsumed &&
    e.dataTransfer?.types.length === 1 &&
    Date.now() - lastDragStartTime > 250
  ) {
    const dndInfoStr = e.dataTransfer?.getData('application/x-sidebery-dnd')

    // Check if the drop event was consumed by another sidebar
    const requestingDropStatus: Promise<boolean>[] = []
    for (const win of Windows.otherWindows) {
      if (win.id) {
        const gettingStatus = browser.sidebarAction.isOpen({ windowId: win.id }).then(isOpen => {
          if (isOpen && win.id) return IPC.sidebar(win.id, 'isDropEventConsumed')
          else return false
        })
        requestingDropStatus.push(gettingStatus)
      }
    }
    let consumed
    try {
      consumed = await Utils.deadline(10000, [], Promise.all(requestingDropStatus))
    } catch (err) {
      Logs.err('DnD.onDragEnd: Cannot get drop status from other windows', err)
      return
    }
    if (consumed?.includes(true)) return

    // Parse transferred data
    if (!dndInfoStr) return
    let info: DragInfo
    try {
      info = JSON.parse(dndInfoStr) as DragInfo
    } catch (err) {
      return
    }

    const fromTabs = info.type === DragType.Tabs
    const fromTabsPanel = info.type === DragType.TabsPanel
    const fromBookmarks = info.type === DragType.Bookmarks
    const fromBookmarksPanel = info.type === DragType.BookmarksPanel

    if (fromTabs && info.items?.length) {
      const dst = { windowId: NEWID, incognito: Windows.incognito, panelId: info.panelId }
      if (mode === 'copy') Tabs.open(info.items, dst)
      else Tabs.move(info.items, {}, dst)
    }

    if (fromTabsPanel && info.items?.length) {
      const dst = { windowId: NEWID, incognito: Windows.incognito, panelId: info.panelId }
      if (mode === 'copy') Tabs.open(info.items, dst)
      else Tabs.move(info.items, {}, dst)
    }

    if (fromBookmarks && info.items?.length) {
      Bookmarks.openInNewWindow(info.items.map(i => i.id))
    }

    if (fromBookmarksPanel && info.items?.length) {
      const panelId = info.items[0]?.id ?? NOID
      const panel = Sidebar.panelsById[panelId]
      if (!Utils.isBookmarksPanel(panel)) return

      if (!Bookmarks.reactive.tree.length) await Bookmarks.load()

      const rootFolder = Bookmarks.reactive.byId[panel.rootId]
      if (!rootFolder || !rootFolder.children?.length) return

      Bookmarks.openInNewWindow(rootFolder.children.map(n => n.id))
    }
  }

  // Set "dragEndedRecently" flag for 100ms.
  // This is needed for detecting mouseLeave
  // event right after dragEnd
  // (at least on Linux)
  DnD.dragEndedRecently = true
  clearTimeout(dragEndedRecentlyTimeout)
  dragEndedRecentlyTimeout = setTimeout(() => {
    DnD.dragEndedRecently = false
  }, 100)

  // Update succession of active tab
  const successionExclude = Tabs.detachingTabIds.size ? [...Tabs.detachingTabIds] : undefined
  Tabs.updateSuccessionDebounced(0, successionExclude)
}
