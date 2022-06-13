import Utils from 'src/utils'
import { translate } from 'src/dict'
import { BKM_OTHER_ID, CONTAINER_ID, NEWID, NOID, PRE_SCROLL } from 'src/defaults'
import { DragInfo, DragType, DropType, InstanceType, ItemBounds, ItemBoundsType } from 'src/types'
import { DstPlaceInfo, SrcPlaceInfo } from 'src/types'
import { DnD, DndPointerMode } from 'src/services/drag-and-drop'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Tabs } from 'src/services/tabs.fg'
import { Logs } from './logs'
import { Msg } from './msg'

/**
 * Start dragging something
 */
export function start(info: DragInfo, dstType?: DropType): void {
  if (info.windowId === undefined) info.windowId = Windows.id
  if (info.panelId === undefined) info.panelId = Sidebar.reactive.activePanelId

  Logs.info('DnD.start')

  if (
    (info.type === DragType.Tabs || info.type === DragType.TabsPanel) &&
    info.windowId === Windows.id &&
    info.items &&
    info.items.length > 1
  ) {
    const activeItem = info.items.find(i => i.id === Tabs.activeId)
    if (activeItem) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab) {
        const toExclude = info.items.map(i => i.id)
        const target = Tabs.findSuccessorTab(activeTab, toExclude)
        if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
      }
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
  DnD.reactive.dstPanelId = info.panelId

  if (dstType) DnD.reactive.dstType = dstType
  updateTooltip(info)

  DnD.reactive.isStarted = true
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
    const panel = Sidebar.reactive.panelsById[info.panelId ?? NOID]
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
  } else {
    DnD.reactive.dragTooltipTitle = '---'
    DnD.reactive.dragTooltipInfo = ''
  }
}

export function reset(): void {
  Logs.info('DnD.reset')

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

  DnD.reactive.dstIndex = -1
  DnD.reactive.dstPanelId = ''
  DnD.reactive.dstPin = false
  DnD.reactive.dstParentId = ''

  DnD.reactive.isStarted = false

  resetExpandTimeout()
  resetTabActivateTimeout()
  resetPanelSwitchTimeout()
}

function resetDragPointer(): void {
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
  _expandTimeout = setTimeout(() => cb(), delay ?? Settings.reactive.dndExpDelay)
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

function getDestInfo(): DstPlaceInfo {
  const info: DstPlaceInfo = {
    panelId: DnD.reactive.dstPanelId,
    parentId: DnD.reactive.dstParentId,
    index: DnD.reactive.dstIndex,
  }
  if (DnD.reactive.dstPin) info.pinned = DnD.reactive.dstPin

  const dstPanel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
  if (!dstPanel) return info

  if (Utils.isTabsPanel(dstPanel)) {
    const destContainer = Containers.reactive.byId[dstPanel.dropTabCtx ?? '']
    if (destContainer) info.containerId = dstPanel.dropTabCtx
    else info.containerId = CONTAINER_ID
  }
  if (info.index === -1) {
    // To the last position in branch/panel
    if (
      Utils.isTabsPanel(dstPanel) &&
      (DnD.reactive.dstType === DropType.Tabs || DnD.reactive.dstType === DropType.TabsPanel)
    ) {
      if (DnD.reactive.dstType === DropType.Tabs) info.inside = true
      const parent = Tabs.byId[DnD.reactive.dstParentId]
      if (parent) info.index = parent.index + 1
      else info.index = dstPanel.nextTabIndex ?? Tabs.list.length
    }
    // To the last position in bookmarks children list
    else if (
      DnD.reactive.dstType === DropType.Bookmarks ||
      DnD.reactive.dstType === DropType.BookmarksPanel
    ) {
      if (DnD.reactive.dstType === DropType.Bookmarks) info.inside = true
      const parent = Bookmarks.reactive.byId[DnD.reactive.dstParentId]
      info.index = parent?.children?.length || 0
    }
  }
  return info
}

function getSrcInfo(): SrcPlaceInfo {
  return {
    windowId: DnD.srcWinId,
    panelId: DnD.srcPanelId,
    pinned: DnD.srcPin,
  }
}

function assertExpandMod(e: DragEvent): boolean {
  if (Settings.reactive.dndExpMod === 'alt' && e.altKey) return true
  else if (Settings.reactive.dndExpMod === 'shift' && e.shiftKey) return true
  else if (Settings.reactive.dndExpMod === 'ctrl' && e.ctrlKey) return true
  else return false
}

function assertTabActivateMod(e: DragEvent): boolean {
  if (Settings.reactive.dndTabActMod === 'alt' && e.altKey) return true
  else if (Settings.reactive.dndTabActMod === 'shift' && e.shiftKey) return true
  else if (Settings.reactive.dndTabActMod === 'ctrl' && e.ctrlKey) return true
  else return false
}

function applyLvlOffset(lvl: number): void {
  if (lvl < 0) lvl = 0
  const panel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
  if (!panel) return
  let parentBounds = panel.bounds?.find(b => b.id === DnD.reactive.dstParentId)
  let prevParentBounds: ItemBounds | undefined
  if (parentBounds && parentBounds.lvl >= lvl) {
    while (parentBounds && parentBounds.lvl >= lvl) {
      prevParentBounds = parentBounds
      parentBounds = panel.bounds?.find(b => b.id === parentBounds?.parent)
    }
    if (!parentBounds) DnD.reactive.dstParentId = -1
    else {
      DnD.reactive.dstParentId = parentBounds.id
      if (prevParentBounds && DnD.reactive.dstPanelId === 'bookmarks') {
        DnD.reactive.dstIndex = prevParentBounds.index + 1
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
  const dstPanel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
  let destContainer
  if (Utils.isTabsPanel(dstPanel)) destContainer = dstPanel.dropTabCtx
  if (!destContainer) return false

  const isDstDefaultContainer = destContainer === CONTAINER_ID
  const isDstContainerExists = isDstDefaultContainer || Containers.reactive.byId[destContainer]
  if (!isDstContainerExists) return false

  // Preserve container for globally pinned tabs
  if (DnD.reactive.dstPin && Settings.reactive.pinnedTabsPosition !== 'panel') return false

  // Check tabs
  for (const item of DnD.items) {
    if (item.container !== destContainer) return true
  }
  return false
}

function dbgState(msg = 'Drag and Drop state'): void {
  // b/c console.table is meh...
  const h = ['-', 'TYPE', 'WIN', 'PANEL', 'PIN', 'INDEX', 'PARENT']
  const s = ['SRC:', DnD.srcType, DnD.srcWinId, DnD.srcPanelId, DnD.srcPin].map(String)
  const d = [
    'DST:',
    DnD.reactive.dstType,
    Windows.id,
    DnD.reactive.dstPanelId,
    DnD.reactive.dstPin,
    DnD.reactive.dstIndex,
    DnD.reactive.dstParentId,
  ].map(String)
  h.map((t, i) => Math.max(t.length, s[i]?.length || 0, d[i]?.length || 0)).forEach((l, i) => {
    if (h[i]) h[i] = h[i].padEnd(l)
    if (s[i]) s[i] = s[i].padEnd(l)
    if (d[i]) d[i] = d[i].padEnd(l)
  })

  console.log(`${msg}\n${h.join('  ')}\n${s.join('  ')}\n${d.join('  ')}`)
}

export function onDragEnter(e: DragEvent): void {
  if (!(e.target as HTMLElement).getAttribute) return
  const type = (e.target as HTMLElement).getAttribute('data-dnd-type')
  const id = (e.target as HTMLElement).getAttribute('data-dnd-id')

  DnD.reactive.pointerHover = false

  resetPanelSwitchTimeout()
  resetTabActivateTimeout()
  resetExpandTimeout()

  // Handle drag and drop from outside
  if (!DnD.reactive.isStarted && !e?.relatedTarget) {
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
      DnD.start({
        x: Sidebar.reactive.width >> 1,
        y: e.clientX,
        type: DragType.Native,
        panelId: NOID,
        windowId: NOID,
      })
    }

    return
  }

  // Reset drag and drop if no type and id provided
  if (!type && !id) {
    DnD.reactive.dstType = DropType.Nowhere
    DnD.reactive.dstPin = false
    return
  }

  if (type === 'nav-item' && id) {
    DnD.reactive.dstPin = false
    DnD.reactive.dstParentId = NOID

    // Open/Close hidden panels bar
    if (id === 'hidden-bar') {
      DnD.reactive.dstType = DropType.Nowhere
      if (!Sidebar.reactive.hiddenPanelsBar) {
        panelSwitchTimeout(() => (Sidebar.reactive.hiddenPanelsBar = true), 250)
      }
    } else {
      if (Sidebar.reactive.hiddenPanelsBar) Sidebar.reactive.hiddenPanelsBar = false

      const panel = Sidebar.reactive.panelsById[id]
      const isTabsPanel = Utils.isTabsPanel(panel)
      const isBookmarksPanel = Utils.isBookmarksPanel(panel)
      if (isTabsPanel) DnD.reactive.dstType = DropType.TabsPanel
      else if (isBookmarksPanel) DnD.reactive.dstType = DropType.BookmarksPanel
      else DnD.reactive.dstType = DropType.NavItem

      DnD.reactive.dstPanelId = panel?.id ?? NOID
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

  if (type === 'hidden-panel' && id) {
    DnD.reactive.dstType = DropType.TabsPanel
    DnD.reactive.dstPanelId = id
    DnD.reactive.dstIndex = Sidebar.reactive.nav.indexOf(id)
  }

  if (type === 'hidden-layer') {
    if (Sidebar.reactive.hiddenPanelsBar) Sidebar.reactive.hiddenPanelsBar = false
  }

  if (type === 'pinned-bar') {
    const panel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
    DnD.reactive.dstPin = true
    if (Utils.isTabsPanel(panel) && panel.pinnedTabs.length) {
      const rLastTab = panel.pinnedTabs[panel.pinnedTabs.length - 1]
      const lastTab = Tabs.byId[rLastTab.id]
      if (lastTab) DnD.reactive.dstIndex = lastTab.index + 1
    } else {
      DnD.reactive.dstIndex = Tabs.reactive.pinned.length
    }
  }

  if (type === 'tab' && id) {
    if (Sidebar.reactive.hiddenPanelsBar) Sidebar.reactive.hiddenPanelsBar = false
    const tab = Tabs.byId[id]
    if (!tab) return
    DnD.reactive.dstType = DropType.Tabs
    DnD.reactive.dstPin = tab.pinned
    if (tab.pinned) DnD.reactive.dstIndex = tab.index
    else DnD.reactive.dstPanelId = tab.panelId

    if (Settings.reactive.dndTabAct && tab.pinned) {
      const delay = assertTabActivateMod(e) ? 0 : Settings.reactive.dndTabActDelay
      tabActivateTimeout(() => browser.tabs.update(tab.id, { active: true }), delay)
    }
  }

  if (type === 'bookmark' && id) {
    if (Sidebar.reactive.hiddenPanelsBar) Sidebar.reactive.hiddenPanelsBar = false
    const bookmark = Bookmarks.reactive.byId[id]
    if (!bookmark) return
    const panelId = Bookmarks.findBookmarkPanelOf(bookmark)
    DnD.reactive.dstType = DropType.Bookmarks
    DnD.reactive.dstPanelId = panelId ?? NOID
    DnD.reactive.dstPin = false
  }
}

export function onDragLeave(e: DragEvent): void {
  if (e?.relatedTarget) return
  if (Sidebar.reactive.hiddenPanelsBar) Sidebar.reactive.hiddenPanelsBar = false
  Selection.resetSelection()
  resetDragPointer()
  reset()
}

function onPointerEnter(e: DragEvent): void {
  resetTabActivateTimeout()

  const panel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
  const isTabs = Utils.isTabsPanel(panel)
  const isBookmarks = Utils.isBookmarksPanel(panel)

  if (isTabs) {
    if (Settings.reactive.dndExp === 'pointer') {
      const delay = assertExpandMod(e) ? 0 : Settings.reactive.dndExpDelay
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
    if (Settings.reactive.dndExp === 'pointer') {
      const delay = assertExpandMod(e) ? 0 : Settings.reactive.dndExpDelay
      const bookmark = Bookmarks.reactive.byId[DnD.reactive.dstParentId]
      const isParent = !!bookmark?.children?.length
      if (!bookmark || !isParent) return
      if (delay !== 0) DnD.reactive.pointerHover = true
      expandTimeout(() => {
        DnD.reactive.pointerHover = false
        DnD.reactive.pointerExpanding = true
        Bookmarks.toggleBranch(bookmark.id, Sidebar.reactive.activePanelId)
        Sidebar.updatePanelBoundsDebounced(128)
      }, delay)
    }
    return
  }
}

let pointerEl: HTMLElement | null = null
export function initPointer(el: HTMLElement | null): void {
  if (!el) return Logs.err('Drag and Drop: No pointer element')
  pointerEl = el
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
  if (Sidebar.reactive.hiddenPanelsBar) return

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
  const y = e.clientY - panelTopOffset + scroll
  const x = e.clientX - (panel.leftOffset ?? 0)

  // Hide pointer if cursor out of drop area
  if (!yLock && e.clientY < panelTopOffset) {
    DnD.reactive.pointerMode = DndPointerMode.None
    yLock = true
    return
  }
  if (yLock && DnD.reactive.pointerMode === DndPointerMode.None && e.clientY > panelTopOffset) {
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
    DnD.reactive.pointerMode === DndPointerMode.None &&
    x > 0 &&
    e.clientX < panelRightOffset
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
    dropPos = scroll - 12 + (panel.topOffset - Sidebar.panelsTop)
    if (!xLock && !yLock && pointerPos !== dropPos) {
      pointerPos = dropPos
      pointerEl.style.transform = `translateY(${pointerPos}px)`
      DnD.reactive.pointerMode = DndPointerMode.Between
      DnD.reactive.pointerLvl = 0
      const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
      DnD.reactive.dstIndex = Utils.isTabsPanel(activePanel) ? activePanel.startTabIndex : -1
      DnD.reactive.dstParentId = -1
    }
    return
  }

  // End
  if (y > bounds[boundsLen - 1].bottom) {
    const slot = bounds[boundsLen - 1]
    dropPos = slot.end - 12 - scroll + (panel.topOffset - Sidebar.panelsTop)
    if (lvlChanged || (!xLock && !yLock && pointerPos !== dropPos)) {
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
      dropPos = slot.start - 12 - scroll + (panel.topOffset - Sidebar.panelsTop)
      if (lvlChanged || (!xLock && !yLock && pointerPos !== dropPos)) {
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
      dropPos = slot.center - 12 - scroll + (panel.topOffset - Sidebar.panelsTop)
      if (!xLock && !yLock && (pointerPos !== dropPos || eventKeyChanged)) {
        pointerPos = dropPos
        pointerEl.style.transform = `translateY(${pointerPos}px)`

        if (Selection.includes(slot.id)) DnD.reactive.pointerMode = DndPointerMode.None
        else DnD.reactive.pointerMode = DndPointerMode.Inside
        DnD.reactive.pointerLvl = slot.lvl + 1
        DnD.reactive.dstIndex = -1
        DnD.reactive.dstParentId = slot.id

        // Entering in the pointer aria
        if (x < 32 && Settings.reactive.dndExp === 'pointer') {
          onPointerEnter(e)
          break
        }

        // Pointer inside tab - activate / expand
        if (DnD.reactive.dstType === DropType.Tabs) {
          const targetId = slot.id
          if (Settings.reactive.dndTabAct) {
            const delay = assertTabActivateMod(e) ? 0 : Settings.reactive.dndTabActDelay
            tabActivateTimeout(() => browser.tabs.update(targetId, { active: true }), delay)
          }
          if (Settings.reactive.dndExp === 'hover') {
            const delay = assertExpandMod(e) ? 0 : Settings.reactive.dndExpDelay
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
          const isParent = !!bookmark.children?.length
          if (isParent && Settings.reactive.dndExp === 'hover') {
            const delay = assertExpandMod(e) ? 0 : Settings.reactive.dndExpDelay
            expandTimeout(() => {
              Bookmarks.toggleBranch(targetId, Sidebar.reactive.activePanelId)
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
  }, 1500)
}

export function isDropEventConsumed(): boolean {
  Logs.info('DnD.isDropEventConsumed', DnD.dropEventConsumed)
  return DnD.dropEventConsumed
}

/**
 * Drop event handler
 */
export async function onDrop(e: DragEvent): Promise<void> {
  dropEventWasConsumed()

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
  const dstType = DnD.reactive.dstType
  const fromTabs = srcType === DragType.Tabs
  const toTabs = dstType === DropType.Tabs
  const fromTabsPanel = srcType === DragType.TabsPanel
  let toTabsPanel = dstType === DropType.TabsPanel
  const fromBookmarks = srcType === DragType.Bookmarks
  const toBookmarks = dstType === DropType.Bookmarks
  const fromBookmarksPanel = srcType === DragType.BookmarksPanel
  const toBookmarksPanel = dstType === DropType.BookmarksPanel
  const fromNav = srcType === DragType.NavItem
  const toNav = dstType === DropType.NavItem

  if (Sidebar.reactive.hiddenPanelsBar) Sidebar.closeHiddenPanelsBar()
  if ((toTabs && !DnD.reactive.dstPin) || toBookmarks) {
    DnD.reactive.dstPanelId = Sidebar.reactive.activePanelId
    applyLvlOffset(DnD.reactive.pointerLvl)
  }

  dbgState('Sidebar.onDrop()')

  // To new tabs panel
  let tabsPanelsSaveNeeded = false
  if (DnD.reactive.dstPanelId === 'add' && (fromTabs || fromBookmarks)) {
    const panel = Sidebar.createTabsPanel()
    DnD.reactive.dstPanelId = panel.id
    DnD.reactive.dstIndex = -1
    toTabsPanel = true
    tabsPanelsSaveNeeded = true
  }

  // Reset index when dropping to tabs panel
  if (toTabsPanel && !fromTabsPanel && !fromBookmarksPanel && !fromNav) {
    DnD.reactive.dstIndex = -1
  }

  // Reset index and set folder when dropping to bookmarks panel
  if (toBookmarksPanel && !fromTabsPanel && !fromBookmarksPanel && !fromNav) {
    DnD.reactive.dstIndex = -1
    const panel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
    if (Utils.isBookmarksPanel(panel)) {
      const existedFolder = Bookmarks.reactive.byId[panel.rootId]
      DnD.reactive.dstParentId = existedFolder ? panel.rootId : BKM_OTHER_ID
    }
  }

  // Tabs to tabs
  if ((fromTabs && toTabs) || (fromTabs && toTabsPanel) || (fromTabsPanel && toTabs)) {
    const srcInfo = getSrcInfo()
    const destInfo = getDestInfo()
    const reopenNeeded = isContainerChanged()

    if (reopenNeeded) await Tabs.reopen(DnD.items, destInfo)
    else await Tabs.move(DnD.items, srcInfo, destInfo)
  }

  // Tabs to bookmarks
  if (
    (fromTabs && toBookmarks) ||
    (fromTabs && toBookmarksPanel) ||
    (fromTabsPanel && toBookmarks)
  ) {
    Bookmarks.createFrom(DnD.items, getDestInfo())
  }

  // Bookmarks to tabs
  if (
    (fromBookmarks && toTabs) ||
    (fromBookmarks && toTabsPanel) ||
    (fromBookmarksPanel && toTabs)
  ) {
    const dst = getDestInfo()
    const ids = DnD.items.map(i => i.id)

    await Bookmarks.open(ids, dst)
  }

  // Bookmarks to bookmarks
  if (fromBookmarks && toBookmarks) {
    const dstPanel = Sidebar.reactive.panelsById[DnD.reactive.dstPanelId]
    if (Utils.isBookmarksPanel(dstPanel) && dstPanel.viewMode === 'tree') {
      const ids = DnD.items.map(i => i.id)
      Bookmarks.move(ids, getDestInfo())
    }
  }

  // NavItem to NavItem
  if (
    (fromTabsPanel || fromBookmarksPanel || fromNav) &&
    (toTabsPanel || toBookmarksPanel || toNav)
  ) {
    Sidebar.moveNavItem(DnD.srcIndex, DnD.reactive.dstIndex)
  }

  // Native to tabs
  if (srcType === DragType.Native && (toTabs || toTabsPanel)) {
    Tabs.createFromDragEvent(e, getDestInfo())
  }

  // Native to bookmarks
  if (srcType === DragType.Native && (toBookmarks || toBookmarksPanel)) {
    Bookmarks.createFromDragEvent(e, getDestInfo())
  }

  resetDragPointer()
  DnD.resetOther()
  DnD.reset()
  Selection.resetSelection()

  if (tabsPanelsSaveNeeded) Sidebar.saveSidebar()
}

let resetOtherTimeout: number | undefined
export function resetOther(): void {
  clearTimeout(resetOtherTimeout)
  resetOtherTimeout = setTimeout(() => {
    Msg.call(InstanceType.sidebar, 'stopDrag')
  }, 150)
}

let droppedRecentlyTimeout: number | undefined

export async function onDragEnd(e: DragEvent): Promise<void> {
  Logs.info('DnD.onDragEnd')

  DnD.resetOther()
  if (DnD.reactive.isStarted) DnD.reset()

  // Dropped outside sidebar
  if (!DnD.dropEventConsumed && e.dataTransfer?.types.length === 1) {
    const dndInfoStr = e.dataTransfer?.getData('application/x-sidebery-dnd')

    // Check if the drop event was consumed by another sidebar
    const requestingDropStatus: Promise<boolean>[] = []
    for (const win of Windows.otherWindows) {
      if (win.id) requestingDropStatus.push(Msg.reqSidebar(win.id, 'isDropEventConsumed'))
    }
    let consumed
    try {
      consumed = await Promise.all(requestingDropStatus)
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
      Tabs.move(info.items, {}, dst)
    }

    if (fromTabsPanel && info.items?.length) {
      const dst = { windowId: NEWID, incognito: Windows.incognito, panelId: info.panelId }
      Tabs.move(info.items, {}, dst)
    }

    if (fromBookmarks && info.items?.length) {
      Bookmarks.openInNewWindow(info.items.map(i => i.id))
    }

    if (fromBookmarksPanel && info.items?.length) {
      const panelId = info.items[0]?.id ?? NOID
      const panel = Sidebar.reactive.panelsById[panelId]
      if (!Utils.isBookmarksPanel(panel)) return

      if (!Bookmarks.reactive.tree.length) await Bookmarks.load()

      const rootFolder = Bookmarks.reactive.byId[panel.rootId]
      if (!rootFolder || !rootFolder.children?.length) return

      Bookmarks.openInNewWindow(rootFolder.children.map(n => n.id))
    }
  }

  // Set "droppedRecently" flag for 100ms.
  // This is needed for detecting mouseLeave
  // event right after dragEnd
  // (at least on Linux)
  DnD.droppedRecently = true
  clearTimeout(droppedRecentlyTimeout)
  droppedRecentlyTimeout = setTimeout(() => {
    DnD.droppedRecently = false
  }, 100)

  // Update succession of active tab
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab) {
    const target = Tabs.findSuccessorTab(activeTab)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }
}
