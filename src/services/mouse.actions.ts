import { ItemBoundsType, SubPanelType, WheelDirection } from 'src/types'
import { PRE_SCROLL } from 'src/defaults'
import { Mouse, ResizingMode } from 'src/services/mouse'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { DnD } from 'src/services/drag-and-drop'

type TargetType =
  | 'sidebar'
  | 'nav'
  | 'hiddenPanel'
  | 'panel'
  | 'tab'
  | 'tab.expand'
  | 'tab.audio'
  | 'tab.close'
  | 'tab.new'
  | 'bookmark'
  | 'history'
  | 'download'
  | 'menu.option'
  | 'closedTab'
  | 'closedTab.branch'
type ResizingCallback = (start: number, delta: number) => void
type LongClickTargetType = 'tab' | 'bookmark' | 'panel'

let startY = 0

let multiSelectionStartId: ID | null = null
let multiSelectionStartY = 0
let multiSelectionPreselected: ID[] | undefined

let targetType: TargetType | null = null
let targetId: ID | undefined
let ctxTargetType: TargetType | null = null
let ctxTargetId: ID | undefined

export function setTarget(type: TargetType, id?: ID): void {
  targetType = type
  targetId = id
  ctxTargetType = type
  ctxTargetId = id
  Mouse.longClickApplied = false
}

export function resetTarget(): void {
  targetType = null
  targetId = undefined
  if (Mouse.resizing) stopResizing()
}

export function resetCtxTarget() {
  ctxTargetType = null
  ctxTargetId = undefined
}

export function isTarget(type: TargetType, id?: ID): boolean {
  if (id !== undefined) return id === targetId && targetType === type
  else return targetType === type
}

export function isCtxTarget(type: TargetType, id?: ID): boolean {
  if (id !== undefined) return id === ctxTargetId && ctxTargetType === type
  else return ctxTargetType === type
}

export function onMouseMove(e: MouseEvent): void {
  if (Mouse.resizing) {
    if (Mouse.resizing === 'x') {
      if (resizingStart === -1) resizingStart = e.clientX
      resizingDelta = e.clientX - resizingStart
    }
    if (Mouse.resizing === 'y') {
      if (resizingStart === -1) resizingStart = e.clientY
      resizingDelta = e.clientY - resizingStart
    }
    if (resizingCallback) resizingCallback(resizingStart, resizingDelta)
    return
  }

  if (multiSelectionStartId === null) return

  if (!Mouse.multiSelectionMode && Math.abs(e.clientY - multiSelectionStartY) > 5) {
    let activePanel
    if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
      activePanel = Sidebar.subPanels.bookmarks
    } else {
      activePanel = Sidebar.panelsById[Sidebar.activePanelId]
    }
    if (!activePanel) return

    Menu.close()
    Selection.resetSelection()
    Mouse.multiSelectionMode = true
    const tab = Tabs.byId[multiSelectionStartId]
    if (tab && !tab.pinned && tab.isParent && tab.folded) Selection.selectTabsBranch(tab)
    else Selection.select(multiSelectionStartId)
    Sidebar.updateBounds()
    stopLongClick()

    const scroll = activePanel.scrollEl?.scrollTop || 0
    startY = multiSelectionStartY - activePanel.topOffset + scroll

    return
  }

  if (Mouse.multiSelectionMode) {
    let activePanel
    if (Sidebar.subPanelType === SubPanelType.Bookmarks && Sidebar.subPanels.bookmarks) {
      activePanel = Sidebar.subPanels.bookmarks
    } else {
      activePanel = Sidebar.panelsById[Sidebar.activePanelId]
    }
    if (!activePanel || !activePanel.scrollEl) return

    const scroll = activePanel.scrollEl?.scrollTop || 0
    const y = e.clientY - activePanel.topOffset + scroll
    const topY = Math.min(startY, y)
    const bottomY = Math.max(startY, y)

    if (y - scroll < PRE_SCROLL) {
      activePanel.scrollEl.scrollTop = scroll - 15
    } else if (y - scroll > activePanel.scrollEl.offsetHeight - PRE_SCROLL) {
      activePanel.scrollEl.scrollTop = scroll + 15
    }

    for (const slot of activePanel.bounds) {
      // Inside
      if (slot.end >= topY && slot.start + 1 <= bottomY) {
        if (!Selection.includes(slot.id)) {
          if (slot.type === ItemBoundsType.Tab) {
            const tab = Tabs.byId[slot.id]
            if (tab && !tab.pinned && tab.isParent && tab.folded) Selection.selectTabsBranch(tab)
            else Selection.selectTab(slot.id)
          }
          if (slot.type === ItemBoundsType.Bookmarks) Selection.selectBookmark(slot.id)
        }
      } else {
        // Outside
        if (Selection.includes(slot.id)) {
          if (slot.type === ItemBoundsType.Tab) {
            const tab = Tabs.byId[slot.id]
            if (tab && !tab.pinned && tab.isParent && tab.folded) Selection.deselectTabsBranch(tab)
            else Selection.deselectTab(slot.id)
          }
          if (slot.type === ItemBoundsType.Bookmarks) Selection.deselectBookmark(slot.id)
        }
      }
    }
  }
}

let longClickTimeout: number | undefined
export function startLongClick(
  e: MouseEvent,
  type: LongClickTargetType,
  id: ID,
  cb?: () => void
): void {
  clearTimeout(longClickTimeout)
  longClickTimeout = setTimeout(() => {
    if (DnD.reactive.isStarted) return
    Mouse.longClickApplied = true

    let action
    if (type === 'tab') {
      if (e.button === 0) {
        action = Settings.state.tabLongLeftClick
      } else if (e.button === 2) {
        action = Settings.state.tabLongRightClick
        stopMultiSelection()
        Selection.resetSelection()
      }

      const tab = Tabs.byId[id]
      if (!tab) return

      if (action === 'reload') Tabs.reloadTabs([tab.id])
      if (action === 'duplicate') Tabs.duplicateTabs([tab.id])
      if (action === 'pin') Tabs.repinTabs([tab.id])
      if (action === 'mute') Tabs.remuteTabs([tab.id])
      if (action === 'clear_cookies') Tabs.clearTabsCookies([tab.id])
      if (action === 'new_after') Tabs.createTabAfter(tab.id)
      if (action === 'new_child' && !tab.pinned) Tabs.createChildTab(tab.id)
      if (action === 'edit_title' && !tab.pinned) Tabs.editTabTitle([tab.id])

      if (action !== 'none') clickLock = true
    }

    longClickTimeout = undefined

    if (cb && clickLock) cb()
  }, Settings.state.longClickDelay)
}

export function stopLongClick(): void {
  clearTimeout(longClickTimeout)
  clickLock = false
}

let clickLock = false
export function isLocked(): boolean {
  return clickLock
}

export function resetClickLock(delay = 0): void {
  if (!clickLock) return
  if (delay) setTimeout(() => (clickLock = false), delay)
  else clickLock = false
}

export function startMultiSelection(e: MouseEvent, id: ID, preselected?: ID[]): void {
  if (Settings.state.ctxMenuNative && e.button === 2) return
  multiSelectionStartId = id
  multiSelectionStartY = e.clientY
  multiSelectionPreselected = preselected
}

export function stopMultiSelection(): ID[] | undefined {
  const preselected = multiSelectionPreselected
  multiSelectionStartId = null
  Mouse.multiSelectionMode = false
  multiSelectionStartY = 0
  multiSelectionPreselected = undefined
  return preselected
}

let resizingStart = -1
let resizingDelta = -1
let resizingCallback: ResizingCallback | null = null
let resizingEndCallback: ResizingCallback | null = null
export function startResizing(
  mode: ResizingMode,
  callback: ResizingCallback,
  endCallback: ResizingCallback
): void {
  Mouse.resizing = mode
  resizingEndCallback = endCallback
  resizingCallback = callback
}

export function stopResizing(): void {
  if (resizingEndCallback) {
    resizingEndCallback(resizingStart, resizingDelta)
    resizingEndCallback = null
  }
  resizingCallback = null
  Mouse.resizing = null
  resizingStart = -1
  resizingDelta = -1
}

/**
 * Returns the MouseWheel event listener. Callback will be called
 * when threshold of target direction will be exceeded.
 */
export function getWheelDebouncer(
  direction: WheelDirection,
  cb: (e: WheelEvent) => void
): (e: WheelEvent) => void {
  if (!Settings.state.wheelThreshold) return cb

  let stopTimeout: number | undefined
  let first = true
  let delta = 0
  let deltaBuf = 0

  return (e: WheelEvent) => {
    // Keep values in the callback so they can update with settings on the fly
    let threshold = 0
    let accumulation = true
    if (direction === WheelDirection.Vertical) {
      threshold = Settings.state.wheelThresholdY
      accumulation = Settings.state.wheelAccumulationY
    } else {
      threshold = Settings.state.wheelThresholdX
      accumulation = Settings.state.wheelAccumulationX
    }

    clearTimeout(stopTimeout)
    stopTimeout = setTimeout(() => {
      if (accumulation) {
        deltaBuf = 0
        first = true
      } else {
        delta = 0
      }
      stopTimeout = undefined
    }, 500)

    if (wheelYIsBlocked && direction === WheelDirection.Vertical) return
    if (wheelXIsBlocked && direction === WheelDirection.Horizontal) return

    if (e.deltaMode !== 0) return cb(e)

    delta = direction === WheelDirection.Vertical ? e.deltaY : e.deltaX
    if (accumulation) {
      if (!first && delta) deltaBuf += delta
      else first = false
    } else {
      deltaBuf = delta
    }

    if (deltaBuf > threshold || deltaBuf < -threshold) {
      if (accumulation) {
        deltaBuf = 0
      } else {
        delta = 0
      }
      cb(e)
    }
  }
}

let wheelXIsBlocked = false
let blockWheelXTimeout: number | undefined
let wheelYIsBlocked = false
let blockWheelYTimeout: number | undefined
/**
 * Block the wheel events for wheel debouncer (Mouse.getWheelDebouncer)
 */
export function blockWheel(direction?: WheelDirection): void {
  if (direction === undefined || direction === WheelDirection.Vertical) {
    wheelYIsBlocked = true
    clearTimeout(blockWheelYTimeout)
    blockWheelYTimeout = setTimeout(() => {
      wheelYIsBlocked = false
    }, 500)
  }
  if (direction === undefined || direction === WheelDirection.Horizontal) {
    wheelXIsBlocked = true
    clearTimeout(blockWheelXTimeout)
    blockWheelXTimeout = setTimeout(() => {
      wheelXIsBlocked = false
    }, 500)
  }
}
