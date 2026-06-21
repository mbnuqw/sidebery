import * as T from 'src/types'
import * as E from 'src/enums'
import * as D from 'src/defaults'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Containers from 'src/services/containers'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as TabsSync from 'src/services/tabs.fg.sync'
import * as Permissions from 'src/services/permissions.fg'
import * as Search from 'src/services/search.fg'

import * as DnD from 'src/services/drag-and-drop.fg'

export const enum DndPointerMode {
  None = 0,
  Between = 1,
  Inside = 2,
}

export const DndPointerModeNames = {
  [DndPointerMode.None]: 'none',
  [DndPointerMode.Between]: 'between',
  [DndPointerMode.Inside]: 'inside',
}

export interface DragAndDropState {
  isStarted: boolean

  pointerExpanding: boolean
  pointerMode: DndPointerMode
  pointerLvl: number
  pointerHover: boolean
  pointerLeft: number

  dstType: E.DropType
  dstIndex: number
  dstParentId: ID
  dstPin: boolean
  dstPanelId: ID

  dragTooltipTitle: string
  dragTooltipInfo: string
}

export let reactive: DragAndDropState = {
  isStarted: false,
  pointerExpanding: false,
  pointerMode: DndPointerMode.None,
  pointerLvl: 0,
  pointerHover: false,
  pointerLeft: 0,
  dstType: E.DropType.Nowhere,
  dstIndex: -1,
  dstParentId: D.NOID,
  dstPanelId: D.NOID,
  dstPin: false,
  dragTooltipTitle: '',
  dragTooltipInfo: '',
}

export let dropMode: 'auto' | 'copy' = 'auto'
export let items: T.DragItem[] = []
export let isExternal = false
export let startX = 0
export let startY = 0

export let srcType = E.DragType.Nothing
export let srcIncognito = false
export let srcPin = false
export let srcWinId = D.NOID
export let srcPanelId = D.NOID
export let srcIndex = -1

export let dragEndedRecently = false
export let droppedRecently = false
export let dragInfo: T.DragInfo | null = null

let currentSearchQuery = ''
let lastDragStartTime = 0

export function reactivate(r: T.Reactivator<DragAndDropState>) {
  reactive = r(reactive)
}

/**
 * Start dragging something
 */
export function start(info: T.DragInfo, dstType?: E.DropType, dstPanelId?: ID): void {
  if (info.windowId === undefined) info.windowId = Windows.id
  if (info.panelId === undefined) info.panelId = Sidebar.activePanelId

  lastDragStartTime = Date.now()

  // Disable auto-switching active panel on mouseleave
  if (Sidebar.switchOnMouseLeave) Sidebar.setSwitchOnMouseLeaveState(false)

  if (
    (info.type === E.DragType.Tabs || info.type === E.DragType.TabsPanel) &&
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

  srcType = info.type
  isExternal = info.windowId !== Windows.id
  items = info.items || []
  startX = info.x
  startY = info.y
  srcIncognito = info.incognito ?? false
  srcPin = info.pinnedTabs ?? false
  srcWinId = info.windowId
  srcPanelId = info.panelId
  srcIndex = info.index ?? -1
  dropMode = info.copy ? 'copy' : 'auto'
  reactive.dstPanelId = dstPanelId ?? info.panelId

  if (dstType) DnD.reactive.dstType = dstType
  updateTooltip(info)

  DnD.reactive.isStarted = true

  currentSearchQuery = Search.query
  if (Search.active) {
    requestAnimationFrame(() => {
      Selection.preserveSelection()
      Search.stop(true)
      Selection.allowSelectionReset()
      Sidebar.updateBounds()
    })
  }
}

function updateTooltip(info: T.DragInfo): void {
  if (!info.items) return
  if (info.type === E.DragType.Tabs) {
    if (info.items.length === 1) {
      DnD.reactive.dragTooltipTitle = info.items[0].title ?? ''
      DnD.reactive.dragTooltipInfo = info.items[0].url ?? ''
    } else {
      const label = translate('dnd.tooltip.tabs', info.items.length)
      DnD.reactive.dragTooltipTitle = `${info.items.length} ${label}`
      DnD.reactive.dragTooltipInfo = ''
    }
  } else if (info.type === E.DragType.Bookmarks) {
    if (info.items.length === 1) {
      DnD.reactive.dragTooltipTitle = info.items[0].title ?? ''
      DnD.reactive.dragTooltipInfo = info.items[0].url ?? ''
    } else {
      const label = translate('dnd.tooltip.bookmarks', info.items.length)
      DnD.reactive.dragTooltipTitle = `${info.items.length} ${label}`
      DnD.reactive.dragTooltipInfo = ''
    }
  } else if (info.type === E.DragType.BookmarksPanel) {
    DnD.reactive.dragTooltipTitle = translate('dnd.tooltip.bookmarks_panel')
    DnD.reactive.dragTooltipInfo = ''
  } else if (info.type === E.DragType.TabsPanel) {
    const panel = Sidebar.panelsById[info.panelId ?? D.NOID]
    if (panel?.name) {
      DnD.reactive.dragTooltipTitle = `"${panel.name}" ${translate('dnd.tooltip.tabs_panel')}`
      DnD.reactive.dragTooltipInfo = ''
    } else {
      DnD.reactive.dragTooltipTitle = '---'
      DnD.reactive.dragTooltipInfo = ''
    }
  } else if (info.type === E.DragType.NavItem) {
    DnD.reactive.dragTooltipTitle = translate('dnd.tooltip.nav_item')
    DnD.reactive.dragTooltipInfo = ''
  } else if (info.type === E.DragType.NewTab) {
    DnD.reactive.dragTooltipTitle = translate('dnd.tooltip.new_tab')
    DnD.reactive.dragTooltipInfo = ''
  } else if (info.type === E.DragType.History) {
    DnD.reactive.dragTooltipTitle = info.items[0].title ?? ''
    DnD.reactive.dragTooltipInfo = info.items[0].url ?? ''
  } else {
    DnD.reactive.dragTooltipTitle = '---'
    DnD.reactive.dragTooltipInfo = ''
  }
}

export function reset(): void {
  srcType = E.DragType.Nothing
  isExternal = false
  items = []
  startX = 0
  startY = 0
  srcIncognito = false
  srcPin = false
  srcWinId = D.NOID
  srcPanelId = D.NOID
  srcIndex = -1
  dropMode = 'auto'

  reactive.dstType = E.DropType.Nowhere
  reactive.dstIndex = -1
  reactive.dstPanelId = D.NOID
  reactive.dstPin = false
  reactive.dstParentId = D.NOID

  reactive.isStarted = false

  resetExpandTimeout()
  resetTabActivateTimeout()
  resetPanelSwitchTimeout()
  resetSubPanelOpenTimeout()

  if (currentSearchQuery) {
    requestAnimationFrame(() => {
      Search.reactive.rawQuery = currentSearchQuery
      Search.search(currentSearchQuery)
      currentSearchQuery = ''
    })
  }
}

function resetDragPointer(): void {
  if (pointerEl) pointerEl.style.transform = 'translateY(0px)'

  reactive.pointerMode = DndPointerMode.None
  reactive.pointerExpanding = false
  reactive.pointerLvl = 0
  reactive.pointerHover = false

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

function getDstInfo(): T.DstPlaceInfo {
  const info: T.DstPlaceInfo = {
    panelId: DnD.reactive.dstPanelId,
    parentId: DnD.reactive.dstParentId,
    index: DnD.reactive.dstIndex,
  }
  const toTabs = DnD.reactive.dstType === E.DropType.Tabs

  if (DnD.reactive.dstPin) info.pinned = true
  else if (toTabs) info.pinned = false

  const dstPanel = getDstPanel(DnD.reactive.dstType, info.panelId ?? D.NOID)
  if (!dstPanel) return info

  info.panelId = dstPanel.id

  if (Windows.incognito !== DnD.srcIncognito) info.containerId = D.CONTAINER_ID

  if (Utils.isTabsPanel(dstPanel) && !Windows.incognito) {
    if (dstPanel.dropTabCtx === D.CONTAINER_ID) info.containerId = D.CONTAINER_ID
    else {
      const dstContainer = Containers.reactive.byId[dstPanel.dropTabCtx ?? '']
      if (dstContainer) info.containerId = dstPanel.dropTabCtx
    }
  }

  if (info.index === -1) {
    info.index = getDstIndexInside(DnD.reactive.dstType, info)
    info.inside = true
  }
  return info
}

function getInitialDstType(): E.DropType {
  const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (Utils.isTabsPanel(actPanel)) return E.DropType.Tabs
  if (Utils.isBookmarksPanel(actPanel)) return E.DropType.Bookmarks
  return E.DropType.Nowhere
}

function getDstPanel(dstType: E.DropType, dstPanelId: ID): T.Panel | undefined {
  let dstPanel
  if (dstPanelId === Sidebar.subPanels.bookmarks?.id) dstPanel = Sidebar.subPanels.bookmarks
  else dstPanel = Sidebar.panelsById[dstPanelId]
  if (!dstPanel && dstType === E.DropType.Tabs) {
    const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
    if (Utils.isTabsPanel(actPanel)) dstPanel = actPanel
  }
  return dstPanel
}

function getDstIndexInside(dstType: E.DropType, dst: T.DstPlaceInfo): number {
  const dstPanel = getDstPanel(dstType, dst.panelId ?? D.NOID)
  if (!dstPanel) return 0

  // To the last position in branch / configured position in panel
  if (
    Utils.isTabsPanel(dstPanel) &&
    (dstType === E.DropType.Tabs || dstType === E.DropType.TabsPanel)
  ) {
    const parent = Tabs.byId[dst.parentId ?? D.NOID]
    if (parent) {
      const branchLen = Tabs.getBranchLen(parent.id) ?? 0
      return parent.index + branchLen + 1
    } else {
      // Use the setting to determine whether to drop at start or end
      return Settings.state.dndTabToPanelPos === 'start'
        ? dstPanel.startTabIndex
        : (dstPanel.nextTabIndex ?? Tabs.list.length)
    }
  }
  // To the last position in bookmarks children list
  else if (
    dstType === E.DropType.Bookmarks ||
    dstType === E.DropType.BookmarksPanel ||
    dstType === E.DropType.BookmarksSubPanelBtn
  ) {
    const parent = Bookmarks.byId.get(dst.parentId ?? D.NOID)
    return parent?.children?.length || 0
  }
  return 0
}

function getSrcInfo(): T.SrcPlaceInfo {
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

function applyLvlOffset(lvl: number, dst: T.DstPlaceInfo): void {
  if (lvl < 0) lvl = 0

  let panel
  if (Sidebar.subPanelActive && Sidebar.subPanelType === E.SubPanelType.Bookmarks) {
    panel = Sidebar.subPanels.bookmarks
  } else {
    panel = Sidebar.panelsById[dst.panelId ?? D.NOID]
  }
  if (!panel) return
  let parentBounds = panel.bounds?.find(b => b.id === dst.parentId)
  let prevParentBounds: T.ItemBounds | undefined
  if (parentBounds && parentBounds.lvl >= lvl) {
    while (parentBounds && parentBounds.lvl >= lvl) {
      prevParentBounds = parentBounds
      parentBounds = panel.bounds?.find(b => b.id === parentBounds?.parent)
    }
    if (!parentBounds) {
      if (Utils.isTabsPanel(panel)) {
        dst.parentId = -1
      } else if (Utils.isBookmarksPanel(panel)) {
        if (panel.rootId !== D.NOID && panel.rootId !== D.BKM_ROOT_ID) {
          let offset = panel.reactive.rootOffset
          if (offset > 0) {
            let parent = Bookmarks.byId.get(panel.rootId)
            while (parent && offset--) {
              parent = Bookmarks.byId.get(parent.parentId)
            }
            dst.parentId = parent?.id ?? D.BKM_OTHER_ID
          } else {
            dst.parentId = panel.rootId
          }
        } else {
          dst.parentId = D.BKM_OTHER_ID
        }
        const dstParent = Bookmarks.byId.get(dst.parentId)
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
  let dstContainer
  if (Utils.isTabsPanel(dstPanel)) dstContainer = dstPanel.dropTabCtx
  if (!dstContainer) return false

  const isDstDefaultContainer = dstContainer === D.CONTAINER_ID
  const isDstContainerExists = isDstDefaultContainer || !!Containers.reactive.byId[dstContainer]
  if (!isDstContainerExists) return false

  // Preserve container for globally pinned tabs
  if (DnD.reactive.dstPin && Settings.state.pinnedTabsPosition !== 'panel') return false

  // Check tabs
  for (const item of DnD.items) {
    if (item.container !== dstContainer) return true
  }
  return false
}

export function onDragEnter(e: DragEvent): void {
  if (!(e.target as HTMLElement).getAttribute) return

  // Handle drag and drop from outside
  if (!DnD.reactive.isStarted && !e?.relatedTarget) {
    let dragInfo = DnD.dragInfo

    // Maybe there is data from another profile, try to get it
    if (!dragInfo && e.dataTransfer?.items.length) {
      const infoJSON = e.dataTransfer?.getData('application/x-sidebery-dnd')
      if (infoJSON) {
        try {
          dragInfo = JSON.parse(infoJSON) as T.DragInfo
        } catch (err) {
          Logs.err('DnD.onDragEnter: Cannot parse x-sidebery-dnd info:', err)
        }
      }

      // Remove containers info b/c it's a different profile, hence containerId
      // refers to a different container.
      if (dragInfo?.items) {
        dragInfo.items.forEach(i => (i.container = undefined))
      }
    }

    Sidebar.updateBounds()

    // From other sidebery sidebar
    if (dragInfo) {
      const dstType = getInitialDstType()
      DnD.start(dragInfo, dstType, getDstPanel(dstType, D.NOID)?.id)

      if (DnD.srcType === E.DragType.TabsPanel || DnD.srcType === E.DragType.BookmarksPanel) {
        Selection.selectNavItem(DnD.srcPanelId)
      } else {
        for (const item of DnD.items) {
          if (DnD.srcType === E.DragType.Tabs) Selection.selectTab(item.id)
          else if (DnD.srcType === E.DragType.Bookmarks) Selection.selectBookmark(item.id)
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
        type: E.DragType.Native,
        panelId: D.NOID,
        windowId: D.NOID,
      })
    }
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
    DnD.reactive.dstType = E.DropType.Nowhere
    DnD.reactive.dstPin = false
    return
  }

  // Bookmarks sub-panel button
  if (type === 'bspb') {
    resetDragPointer()

    DnD.reactive.dstPin = false

    const panel = Sidebar.panelsById[Sidebar.activePanelId]
    if (!Utils.isTabsPanel(panel)) {
      DnD.reactive.dstType = E.DropType.Nowhere
      return
    }

    if (panel.bookmarksFolderId !== D.NOID && panel.bookmarksFolderId !== D.BKM_ROOT_ID) {
      DnD.reactive.dstParentId = panel.bookmarksFolderId
    } else {
      DnD.reactive.dstParentId = D.BKM_OTHER_ID
    }
    DnD.reactive.dstPanelId = panel.id
    DnD.reactive.dstType = E.DropType.BookmarksSubPanelBtn
    DnD.reactive.dstIndex = 0
    DnD.reactive.pointerMode = DndPointerMode.None

    // Open sub-panel
    subPanelOpenTimeout(() => Sidebar.openSubPanel(E.SubPanelType.Bookmarks, panel), 500)
  }

  // Sync sub-panel button
  if (type === 'sspb') {
    resetDragPointer()

    DnD.reactive.dstPin = false
    DnD.reactive.dstParentId = D.NOID

    const panel = Sidebar.panelsById[Sidebar.activePanelId]
    if (!Utils.isTabsPanel(panel)) {
      DnD.reactive.dstType = E.DropType.Nowhere
      return
    }

    DnD.reactive.dstType = E.DropType.SyncSubPanelBtn
    DnD.reactive.dstIndex = 0
    DnD.reactive.pointerMode = DndPointerMode.None
  }

  if (type === 'nav-item' && id) {
    DnD.reactive.dstPin = false
    DnD.reactive.dstParentId = D.NOID

    // Open hidden panels bar
    if (id === 'hidden_panels_btn') {
      DnD.reactive.dstType = E.DropType.Nowhere
      DnD.reactive.dstPanelId = D.NOID
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
      if (isTabsPanel) DnD.reactive.dstType = E.DropType.TabsPanel
      else if (isBookmarksPanel) DnD.reactive.dstType = E.DropType.BookmarksPanel
      else if (isSyncPanel) DnD.reactive.dstType = E.DropType.SyncPanel
      else DnD.reactive.dstType = E.DropType.NavItem

      if (panel) {
        DnD.reactive.dstPanelId = panel.id ?? D.NOID
      } else {
        if (id === 'add_tp') DnD.reactive.dstPanelId = id
      }
      DnD.reactive.dstIndex = Sidebar.reactive.nav.indexOf(id)

      const srcIsNav =
        DnD.srcType === E.DragType.NavItem ||
        DnD.srcType === E.DragType.TabsPanel ||
        DnD.srcType === E.DragType.BookmarksPanel

      if (!srcIsNav && (isTabsPanel || isBookmarksPanel)) {
        panelSwitchTimeout(() => Sidebar.switchToPanel(id), 750)
      }
    }
  }

  // Select hidden panel
  if (type === 'hidden-panel' && id) {
    DnD.reactive.dstType = E.DropType.TabsPanel
    DnD.reactive.dstPanelId = id
    DnD.reactive.dstIndex = Sidebar.reactive.nav.indexOf(id)
  }

  // Close hidden panels bar
  if (type === 'hidden-layer') {
    if (DnD.reactive.dstPanelId !== D.NOID && Sidebar.reactive.hiddenPanelsPopup) {
      Sidebar.closeHiddenPanelsPopup(true)
    }
  }

  if (type === 'pinned-bar') {
    const isPinnedTabsGlobal = Settings.state.pinnedTabsPosition !== 'panel'
    DnD.reactive.dstPin = true
    DnD.reactive.dstPanelId = id ?? D.NOID
    if (isPinnedTabsGlobal) {
      const pinnedTabsLen = Tabs.pinned.length
      const lastPinnedTab = Tabs.list[pinnedTabsLen - 1]
      DnD.reactive.dstIndex = pinnedTabsLen
      DnD.reactive.dstPanelId = lastPinnedTab?.panelId ?? D.NOID
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
    DnD.reactive.dstType = E.DropType.Tabs
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
    const bookmark = Bookmarks.byId.get(id)
    if (!bookmark) return

    let dstPanel
    if (Sidebar.subPanelActive) dstPanel = Sidebar.subPanels.bookmarks
    else dstPanel = Sidebar.panelsById[Sidebar.activePanelId]

    const panelId = dstPanel?.id
    DnD.reactive.dstType = E.DropType.Bookmarks
    DnD.reactive.dstPanelId = panelId ?? D.NOID
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
      const bookmark = Bookmarks.byId.get(DnD.reactive.dstParentId)
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
const path: T.ItemBounds[] = []
export function onDragMove(e: DragEvent): void {
  if (!DnD.reactive.isStarted) return
  if (!pointerEl) return
  if (Sidebar.reactive.hiddenPanelsPopup) return

  let panel
  if (
    Sidebar.subPanelActive &&
    Sidebar.subPanelType === E.SubPanelType.Bookmarks &&
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

  for (let prevSlot, slot, i = 0; i < boundsLen; i++) {
    prevSlot = bounds[i - 1]
    slot = bounds[i]

    if (y > slot.end) path[slot.lvl] = slot

    // Skip slots outside the target range if lvl was not changed.
    // Target range:
    // ...
    // - prevSlot-center
    // - prevSlot-bottom <-- start of the target range (inclusive)
    // - slot-start/prevSlot-end
    // - slot-top
    // - slot-center
    // - slot-bottom     <-- end of the target range (exclusive)
    // - nextSlot-start/slot-end
    // - nextSlot-top
    // ...
    if (!lvlChanged && (y < prevSlot?.bottom || y >= slot.bottom)) continue

    // Between (before)
    if (slot.in ? y < slot.top : y < slot.center) {
      if (i === 0) dropPos = -12
      else dropPos = slot.start - 12
      if (lvlChanged || pointerPos !== dropPos) {
        resetTabActivateTimeout()
        pointerPos = dropPos
        pointerEl.style.transform = `translateY(${pointerPos}px)`
        if (!prevSlot) {
          DnD.reactive.pointerLvl = 0
          DnD.reactive.pointerMode = DndPointerMode.Between
          DnD.reactive.dstIndex = slot.index
          DnD.reactive.dstParentId = -1
          break
        }

        const slotIsTab = slot.type === E.ItemBoundsType.Tab

        const node = slotIsTab ? Tabs.byId[slot.id] : Bookmarks.byId.get(slot.id)
        const prevNode = slotIsTab ? Tabs.byId[prevSlot.id] : Bookmarks.byId.get(prevSlot.id)

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
          if (DnD.reactive.dstType === E.DropType.Tabs) index = slot.index
          if (DnD.reactive.dstType === E.DropType.Bookmarks) {
            if (prevSlot.lvl === slot.lvl) index = prevSlot.index + 1
            else if (lvl === slot.lvl) index = slot.index
          }

          DnD.reactive.pointerLvl = lvl
          DnD.reactive.dstIndex = index
          DnD.reactive.dstParentId = parentSlot?.id ?? D.NOID
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
        if (DnD.reactive.dstType === E.DropType.Tabs) {
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
        if (DnD.reactive.dstType === E.DropType.Bookmarks) {
          const targetId = slot.id
          const bookmark = Bookmarks.byId.get(targetId)
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
  if (locOffset < D.PRE_SCROLL) {
    panel.scrollEl.scrollTop = scroll - (D.PRE_SCROLL - locOffset)
  } else if (locOffset > panel.scrollEl.offsetHeight - D.PRE_SCROLL) {
    panel.scrollEl.scrollTop = scroll + (locOffset - (panel.scrollEl.offsetHeight - D.PRE_SCROLL))
  }
}

let droppedRecentlyTimeout: number | undefined

/**
 * Drop event handler
 */
export async function onDrop(e: DragEvent): Promise<void> {
  droppedRecently = true
  clearTimeout(droppedRecentlyTimeout)
  droppedRecentlyTimeout = setTimeout(() => {
    droppedRecently = false
  }, 100)

  if (e.ctrlKey) dropMode = 'copy'

  // Handle native firefox tabs
  if (isNativeTabs(e)) {
    const result = await Utils.parseDragEvent(e, Windows.lastFocusedId)
    if (result?.matchedNativeTabs?.length) {
      if (result.matchedNativeTabs?.length) {
        const firstTab = result.matchedNativeTabs[0]
        srcWinId = firstTab.windowId
        srcIncognito = firstTab.incognito
        srcIndex = firstTab.index
        srcPanelId = D.NOID
        srcPin = firstTab.pinned
        srcType = E.DragType.Tabs
        items = result.matchedNativeTabs.map(tab => {
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

  let srcT = DnD.srcType
  let dstT = DnD.reactive.dstType
  const fromTabs = srcT === E.DragType.Tabs
  let toTabs = dstT === E.DropType.Tabs
  const fromTabsPanel = srcT === E.DragType.TabsPanel
  let toTabsPanel = dstT === E.DropType.TabsPanel
  let fromBookmarks = srcT === E.DragType.Bookmarks
  const toBookmarks = dstT === E.DropType.Bookmarks
  const fromBookmarksPanel = srcT === E.DragType.BookmarksPanel
  let toBookmarksPanel =
    dstT === E.DropType.BookmarksPanel || dstT === E.DropType.BookmarksSubPanelBtn
  const toSync = dstT === E.DropType.SyncSubPanelBtn || dstT === E.DropType.SyncPanel
  const fromNav = srcT === E.DragType.NavItem
  let toNav = dstT === E.DropType.NavItem
  const fromNewTabBar = srcT === E.DragType.NewTab
  const fromHistory = srcT === E.DragType.History
  const bookmarksWasUnloaded = !Bookmarks.tree.length

  const dndItems = DnD.items
  const src = getSrcInfo()
  const dst = getDstInfo()

  if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup()
  if ((toTabs && !DnD.reactive.dstPin) || toBookmarks) {
    if (toTabs && Sidebar.subPanelActive && Sidebar.subPanels.bookmarks) {
      dstT = E.DropType.BookmarksPanel
      toTabs = false
      toBookmarksPanel = true
      dst.panelId = Sidebar.subPanels.bookmarks.id
    } else {
      dst.panelId = Sidebar.activePanelId
    }
    applyLvlOffset(DnD.reactive.pointerLvl, dst)
  }

  // Check if it's a native bookmark
  if (srcT === E.DragType.Native) {
    fromBookmarks = await extractBookmarksFromNativeEvent(e, dndItems)
    if (fromBookmarks) srcT = E.DragType.Bookmarks
  }

  // Stop if dst parent is included in dragged items
  if (dst.parentId !== -1 && dndItems.some(i => i.id === dst.parentId)) {
    resetDragInfo()
    resetDragPointer()
    DnD.resetOther()
    DnD.reset()
    Selection.resetSelection()
    return
  }

  // From new tab bar to tabs
  if (fromNewTabBar && toTabs) {
    const item = dndItems[0]
    dst.containerId = item.container ?? D.CONTAINER_ID
    const newTabConf: T.ItemInfo = { id: D.NOID, url: item.url ?? 'about:newtab', active: true }
    await Tabs.open([newTabConf], dst)
  }

  // To new tabs panel
  let tabsPanelsSaveNeeded = false
  let newTabPanel
  if (dst.panelId === 'add_tp' && (fromTabs || fromBookmarks)) {
    newTabPanel = Sidebar.createTabsPanel({ color: Utils.getRandomFrom(D.COLOR_NAMES) })
    const index = Sidebar.getIndexForNewTabsPanel(true)
    Sidebar.addPanel(index, newTabPanel)
    Sidebar.recalcPanels()
    Sidebar.recalcTabsPanels()
    dst.panelId = newTabPanel.id
    dst.index = newTabPanel.nextTabIndex
    dstT = E.DropType.TabsPanel
    toNav = false
    toTabsPanel = true
    tabsPanelsSaveNeeded = true
  }

  // Get index when dropping to bookmarks panel
  if (toTabsPanel && !fromTabsPanel && !fromBookmarksPanel && !fromNav) {
    dst.index = getDstIndexInside(dstT, dst)
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
    const dstPanel = getDstPanel(dstT, dst.panelId ?? D.NOID)
    if (!dstPanel) return

    dst.inside = true

    if (Utils.isBookmarksPanel(dstPanel)) {
      const existedFolder = Bookmarks.byId.get(dstPanel.rootId)
      dst.parentId = existedFolder ? dstPanel.rootId : D.BKM_OTHER_ID
      dst.index = getDstIndexInside(dstT, dst)
    } else if (Utils.isTabsPanel(dstPanel)) {
      let parentId
      if (
        dstPanel.bookmarksFolderId !== D.NOID &&
        dstPanel.bookmarksFolderId !== D.BKM_ROOT_ID &&
        Bookmarks.byId.has(dstPanel.bookmarksFolderId)
      ) {
        parentId = dstPanel.bookmarksFolderId
      } else {
        parentId = D.BKM_OTHER_ID
        setTabsPanelFolder = true
      }
      dst.parentId = parentId
      dst.index = getDstIndexInside(dstT, dst)
    }
  }

  // Tabs to tabs
  if ((fromTabs && toTabs) || (fromTabs && toTabsPanel) || (fromTabsPanel && toTabs)) {
    const reopenNeeded = isContainerChanged()

    if (DnD.dropMode === 'copy') await Tabs.open(dndItems, dst)
    else if (reopenNeeded) await Tabs.reopen(dndItems, dst)
    else await Tabs.move(dndItems, src, dst)
  }

  // Tabs to bookmarks
  if (
    (fromTabs && toBookmarks) ||
    (fromTabs && toBookmarksPanel) ||
    (fromTabsPanel && toBookmarks)
  ) {
    const panel = Sidebar.panelsById[dst.panelId ?? D.NOID]
    const copyMode = DnD.dropMode === 'copy'
    const toRemove = Settings.state.dndMoveTabs && dndItems.map(t => t.id)

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
      const parent = Bookmarks.byId.get(dst.parentId ?? D.NOID)
      if (parent?.children?.length) dst.index = parent.children.length
    }

    await Bookmarks.createFrom(dndItems, dst)

    if (toRemove && !copyMode) Tabs.removeTabs(toRemove, true)
  }

  // Tabs to Sync
  if (fromTabs && toSync) {
    const ids = dndItems.map(t => t.id)
    TabsSync.sync(ids)
  }

  // Bookmarks to tabs
  if (
    (fromBookmarks && toTabs) ||
    (fromBookmarks && toTabsPanel) ||
    (fromBookmarksPanel && toTabs)
  ) {
    const ids = dndItems.map(i => i.id)
    const copyMode = DnD.dropMode === 'copy'
    let ok = true

    const panel = Sidebar.panelsById[dst.panelId ?? D.NOID]
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
    if (Sidebar.subPanelActive && Sidebar.subPanelType === E.SubPanelType.Bookmarks) {
      dstPanel = Sidebar.subPanels.bookmarks
    } else {
      dstPanel = Sidebar.panelsById[Sidebar.activePanelId]
    }

    if (Utils.isBookmarksPanel(dstPanel) && dstPanel.viewMode === 'tree') {
      if (DnD.dropMode === 'copy') Bookmarks.createFrom(dndItems, dst)
      else {
        const ids = dndItems.map(i => i.id)
        Bookmarks.move(ids, dst)
      }
    }
  }

  // History to tabs
  if ((fromHistory && toTabs) || (fromHistory && toTabsPanel)) {
    Tabs.open(dndItems, dst)
  }

  // NavItem to NavItem
  if (
    (fromTabsPanel || fromBookmarksPanel || fromNav) &&
    (toTabsPanel || toBookmarksPanel || toNav)
  ) {
    Sidebar.moveNavItem(DnD.srcIndex, dst.index ?? 0)
  }

  // Native to tabs
  if (srcT === E.DragType.Native && (toTabs || toTabsPanel)) {
    Tabs.createFromDragEvent(e, dst)
  }

  // Native to bookmarks
  if (srcT === E.DragType.Native && (toBookmarks || toBookmarksPanel)) {
    Bookmarks.createFromDragEvent(e, dst)
  }

  resetDragInfo()
  resetDragPointer()
  DnD.resetOther()
  DnD.reset()
  Selection.resetSelection()

  if (tabsPanelsSaveNeeded) Sidebar.saveSidebar()
}

async function extractBookmarksFromNativeEvent(
  e: DragEvent,
  items: T.ItemInfo[]
): Promise<boolean> {
  if (!e.dataTransfer?.items) return false
  if (items.length) return false

  let xMozPlaceItem
  for (const item of e.dataTransfer.items) {
    if (item.type === 'text/x-moz-place') xMozPlaceItem = item
  }

  if (xMozPlaceItem) {
    if (!Permissions.bookmarks) return false

    const value = await Utils.getStringFromDragItem(xMozPlaceItem)
    let placeInfo
    try {
      placeInfo = JSON.parse(value)
    } catch {
      return false
    }

    if (!Bookmarks.tree.length) await Bookmarks.load()

    if (placeInfo.type === 'text/x-moz-place-container') {
      const folder = Bookmarks.byId.get(placeInfo.itemGuid)
      if (!folder) return false

      items.push({ id: folder.id, title: folder.title, parentId: folder.parentId })
      items.push(...Bookmarks.convertTreeToDragItems(folder.id))
      return true
    } else if (placeInfo.type === 'text/x-moz-place') {
      items.push({
        id: placeInfo.itemGuid,
        url: placeInfo.url,
        title: placeInfo.title,
      })
      return true
    }
  }

  return false
}

async function setFolderForTabsPanel(panel: T.Panel, dst: T.DstPlaceInfo) {
  if (!Utils.isTabsPanel(panel)) return true
  if (Bookmarks.byId.has(panel.bookmarksFolderId)) return true

  const result = await Bookmarks.openBookmarksPopup({
    title: translate('popup.bookmarks.set_folder_for_tabs_panel'),
    name: panel.name,
    nameField: true,
    location: D.BKM_MENU_ID,
    locationField: true,
    locationTree: true,
    controls: [{ label: 'btn.save' }],
  })

  if (result && Bookmarks.byId.has(result.location ?? D.NOID)) {
    const parentId = result.location ?? D.NOID
    const parent = Bookmarks.byId.get(parentId)
    const index = parent?.children?.length ?? 0
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
    IPC.broadcast({ dstType: E.InstanceType.sidebar, action: 'stopDrag' })
  }, 150)
}

export function onExternalStop() {
  DnD.resetDragInfo()
  DnD.reset()
}

let dragEndedRecentlyTimeout: number | undefined

export async function onDragEnd(e: DragEvent): Promise<void> {
  dragEndedRecently = true
  clearTimeout(dragEndedRecentlyTimeout)
  dragEndedRecentlyTimeout = setTimeout(() => {
    dragEndedRecently = false
  }, 100)

  const info = DnD.dragInfo

  resetDragInfo()
  resetDragPointer()
  DnD.resetOther()
  let mode = DnD.dropMode
  if (DnD.reactive.isStarted) DnD.reset()
  Selection.resetSelection()

  if (e.ctrlKey) mode = 'copy'

  const droppedOutside = e.x < 0 || e.x > Sidebar.width || e.y < 0 || e.y > Sidebar.height

  // Drop to new window
  drop_new_win: if (
    // Dropped outside (although there is a bug with incorrect coordinates on fast dnd that trigger
    // opening new window when cursor is over the sidebar)
    droppedOutside &&
    // It's configured to open a new window on dropping outside
    Settings.state.dndOutside === 'win' &&
    // If the drop effect is 'none', otherwise it was consumed by another drop target
    // and creating a new window will be non-intuitive
    e.dataTransfer?.dropEffect === 'none' &&
    // Drag info is set
    info &&
    // The last bastion against the mis-triggered new window - check time between drag start/end
    Date.now() - lastDragStartTime > Settings.state.dndOutsideThresholdTimeout
  ) {
    const fromTabs = info.type === E.DragType.Tabs
    const fromTabsPanel = info.type === E.DragType.TabsPanel
    const fromBookmarks = info.type === E.DragType.Bookmarks
    const fromBookmarksPanel = info.type === E.DragType.BookmarksPanel

    if (fromTabs && info.items?.length) {
      const dst = { windowId: D.NEWID, incognito: Windows.incognito, panelId: info.panelId }
      if (mode === 'copy') Tabs.open(info.items, dst)
      else Tabs.move(info.items, {}, dst)
    }

    if (fromTabsPanel && info.items?.length) {
      const dst = { windowId: D.NEWID, incognito: Windows.incognito, panelId: info.panelId }
      if (mode === 'copy') Tabs.open(info.items, dst)
      else Tabs.move(info.items, {}, dst)
    }

    if (fromBookmarks && info.items?.length) {
      Bookmarks.openInNewWindow(info.items.map(i => i.id))
    }

    if (fromBookmarksPanel && info.items?.length) {
      const panelId = info.items[0]?.id ?? D.NOID
      const panel = Sidebar.panelsById[panelId]
      if (!Utils.isBookmarksPanel(panel)) break drop_new_win

      if (!Bookmarks.tree.length) await Bookmarks.load()

      const rootFolder = Bookmarks.byId.get(panel.rootId)
      if (!rootFolder || !rootFolder.children?.length) break drop_new_win

      Bookmarks.openInNewWindow(rootFolder.children.map(n => n.id))
    }
  }

  // Update succession of active tab
  const successionExclude = Tabs.detachingTabIds.size ? [...Tabs.detachingTabIds] : undefined
  Tabs.updateSuccessionDebounced(0, successionExclude)
}

export function broadcastDragInfo(info: T.DragInfo) {
  DnD.setDragInfo(info)
  IPC.broadcast({
    dstType: E.InstanceType.sidebar,
    action: 'setDragInfo',
    arg: info,
  })
}

export function setDragInfo(info: T.DragInfo) {
  dragInfo = info
}

export function resetDragInfo() {
  dragInfo = null
}
