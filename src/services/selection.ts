import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { Tab, Bookmark, SelectionType, ItemInfo } from 'src/types'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Bookmarks } from 'src/services/bookmarks'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { History } from 'src/services/history'
import { NOID } from 'src/defaults'

let resetStop = false

let normType = SelectionType.Nothing
let normal: ID[] = []
let normFirst: ID | null = null
let normLast: ID | null = null

let lockType = SelectionType.Nothing
let locked = new Set<ID>()

export let selected = new Set<ID>()

export function getLength(): number {
  return selected.size
}

/**
 * Get first selected (non-locked) id
 */
export function getFirst(): ID {
  return normFirst ?? normal[0] ?? NOID
}

/**
 * Get last selected (non-locked) id
 */
export function getLast(): ID {
  return normLast ?? normal[normal.length - 1] ?? NOID
}

export const isTabs = (): boolean => normType === SelectionType.Tabs
export const isBookmarks = (): boolean => normType === SelectionType.Bookmarks
export const isHistory = (): boolean => normType === SelectionType.History
export const isNavItem = (): boolean => normType === SelectionType.NavItem
export const isNewTabBar = (): boolean => normType === SelectionType.NewTabBar
export const isHeader = (): boolean => normType === SelectionType.Header
export const isSet = (): boolean => normType !== SelectionType.Nothing

/**
 * Returns new array of ids of selected items
 */
export function ids(): ID[] {
  return [...selected]
}

export function getTabsInfo(setPanelId?: boolean): ItemInfo[] {
  if (normType !== SelectionType.Tabs) return []

  const tabIds = [...selected]
  Tabs.sortTabIds(tabIds)
  // Logs.info('Sel.getTabsInfo', tabIds)

  return Tabs.getTabsInfo(tabIds, setPanelId)
}

export function lockSelection() {
  if (normType === SelectionType.Nothing) return
  if (!normal.length) return

  if (normType === SelectionType.Tabs) {
    const firstItem = Tabs.byId[normal[0]]
    if (!firstItem) return

    const isSelLocked = firstItem.selLock
    for (const id of normal) {
      const tab = Tabs.byId[id]
      if (tab) tab.reactive.selLock = tab.selLock = !isSelLocked
    }
  } else if (normType === SelectionType.Bookmarks) {
    const firstItem = Bookmarks.reactive.byId[normal[0]]
    if (!firstItem) return

    const isSelLocked = firstItem.selLock
    for (const id of normal) {
      const bkmNode = Bookmarks.reactive.byId[id]
      if (bkmNode) bkmNode.selLock = bkmNode.selLock = !isSelLocked
    }
  }

  lockType = normType
  locked = locked.union(new Set(normal))

  selected = new Set(locked)
}

export function unlockSelection() {
  if (lockType === SelectionType.Nothing) return
  if (!locked.size) return

  if (lockType === SelectionType.Tabs) {
    for (const id of locked) {
      const tab = Tabs.byId[id]
      if (tab) tab.reactive.selLock = tab.selLock = false
    }
  } else if (lockType === SelectionType.Bookmarks) {
    for (const id of locked) {
      const bkmNode = Bookmarks.reactive.byId[id]
      if (bkmNode) bkmNode.selLock = false
    }
  }

  lockType = SelectionType.Nothing
  locked.clear()

  selected = new Set(normal)
}

export function select(id: ID, type?: SelectionType): void {
  if (!type) {
    if (Tabs.byId[id]) type = SelectionType.Tabs
    else if (Bookmarks.reactive.byId[id]) type = SelectionType.Bookmarks
    else if (Sidebar.panelsById[id]) type = SelectionType.NavItem
    if (!type) return
  }

  if (type === SelectionType.Tabs) selectTab(id)
  else if (type === SelectionType.Bookmarks) selectBookmark(id)
  else if (type === SelectionType.History) selectHistory(id)
  else if (type === SelectionType.NavItem) selectNavItem(id)
  else if (type === SelectionType.Header) selectHeader(id)
}

function handleSelection(id: ID, type: SelectionType) {
  normal.push(id)
  selected.add(id)
  if (normFirst === null) normFirst = id
  normLast = id
  normType = type
}

export function selectHeader(id: ID): void {
  Sidebar.reactive.selectedHeader = id
  handleSelection(id, SelectionType.Header)
}

export function selectTab(tabId: ID): void {
  const target = Tabs.byId[tabId]
  if (!target) return

  if (normFirst !== null) {
    const firstTab = Tabs.byId[normFirst]
    if (firstTab && firstTab.pinned !== target.pinned) return
  }

  target.reactive.sel = target.sel = true

  handleSelection(tabId, SelectionType.Tabs)

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectTabs(tabIds: ID[]): void {
  for (const id of tabIds) {
    const target = Tabs.byId[id]
    if (!target) continue

    target.reactive.sel = target.sel = true
    normal.push(id)
    selected.add(id)
  }

  if (normFirst === null) normFirst = tabIds[0]
  normLast = tabIds[tabIds.length - 1]
  normType = SelectionType.Tabs

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectTabsRange(aTab: Tab, bTab?: Tab): void {
  if (!bTab && normFirst !== null) {
    bTab = aTab
    const firstTab = Tabs.byId[normFirst]
    if (!firstTab) return
    aTab = firstTab
  }
  if (!bTab) return

  if (aTab.pinned !== bTab.pinned || aTab.panelId !== bTab.panelId) return resetSelection()

  if (normal.length) {
    for (const id of normal) {
      const tab = Tabs.byId[id]
      if (tab) tab.reactive.sel = tab.sel = false
    }
    normal = []
  }

  const minIndex = Math.min(aTab.index, bTab.index)
  const maxIndex = Math.max(aTab.index, bTab.index)

  const panel = Sidebar.panelsById[aTab.panelId]
  if (!Utils.isTabsPanel(panel)) return resetSelection()

  // Select range in filtered list
  if (panel.filteredTabs && !aTab.pinned) {
    for (const tab of panel.filteredTabs) {
      if (tab.index >= minIndex && tab.index <= maxIndex) {
        tab.reactive.sel = tab.sel = true
        normal.push(tab.id)
      }
    }
  }

  // Select range in global list
  else {
    for (let i = minIndex; i <= maxIndex; i++) {
      const target = Tabs.list[i]

      target.reactive.sel = target.sel = true
      normal.push(target.id)
    }
  }

  normType = SelectionType.Tabs
  if (normFirst === null) normFirst = aTab.id
  normLast = bTab.id

  selected = locked.union(new Set(normal))

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectTabsBranch(parentTab: Tab): void {
  parentTab.reactive.sel = parentTab.sel = true
  normal.push(parentTab.id)
  if (normFirst === null) normFirst = parentTab.id

  if (Settings.state.tabsTree) {
    for (let tab, i = parentTab.index + 1; i < Tabs.list.length; i++) {
      tab = Tabs.list[i]
      if (tab.lvl <= parentTab.lvl) break

      tab.reactive.sel = tab.sel = true
      normal.push(tab.id)
      normLast = tab.id
    }
  }

  normType = SelectionType.Tabs

  selected = locked.union(new Set(normal))

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectBookmark(bookmarkId: ID): void {
  const target = Bookmarks.reactive.byId[bookmarkId]
  if (!target) return

  target.sel = true

  handleSelection(bookmarkId, SelectionType.Bookmarks)
}

export function selectBookmarks(ids: ID[]): void {
  for (const id of ids) {
    const target = Bookmarks.reactive.byId[id]
    if (!target) continue

    target.sel = true
    normal.push(id)
    selected.add(id)
  }

  if (normFirst === null) normFirst = ids[0]
  normLast = ids[ids.length - 1]
  normType = SelectionType.Bookmarks
}

export function selectBookmarksRange(aBookmark: Bookmark, bBookmark?: Bookmark): void {
  if (!bBookmark && normFirst !== null) {
    bBookmark = aBookmark
    const firstBmkNode = Bookmarks.reactive.byId[normFirst]
    if (!firstBmkNode) return
    aBookmark = firstBmkNode
  }
  if (!bBookmark) return

  Sidebar.updateBounds()

  if (normal.length) {
    normal.forEach(id => {
      const bkm = Bookmarks.reactive.byId[id]
      if (bkm) bkm.sel = false
    })
    normal = []
  }

  let inside = false
  let activePanel
  if (Sidebar.subPanelActive) activePanel = Sidebar.subPanels.bookmarks
  else activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (activePanel) {
    for (const bound of activePanel.bounds) {
      const bkm = Bookmarks.reactive.byId[bound.id]
      if (!bkm) continue

      if (bound.id === aBookmark.id || bound.id === bBookmark.id) {
        if (!inside) inside = true
        else {
          bkm.sel = true
          normal.push(bound.id)
          break
        }
      }
      if (inside) {
        bkm.sel = true
        normal.push(bound.id)
        if (aBookmark.id === bBookmark.id) break
      }
    }
  }

  normType = SelectionType.Bookmarks
  if (normFirst === null) normFirst = aBookmark.id
  normLast = bBookmark.id

  selected = locked.union(new Set(normal))
}

export function selectHistory(id: ID): void {
  const target = History.byId[id]
  if (!target) return

  target.reactive.sel = true

  handleSelection(id, SelectionType.History)
}

export function selectNewTabBtn(id: ID): void {
  const target = Sidebar.panelsById[id]
  if (!Utils.isTabsPanel(target)) return

  target.selNewTab = true
  target.reactive.selNewTab = true

  handleSelection(id, SelectionType.NewTabBar)
}

export function selectNavItem(id: ID): void {
  const index = Sidebar.reactive.nav.indexOf(id)
  if (index === -1) return

  Sidebar.reactive.selectedNavId = id

  handleSelection(id, SelectionType.NavItem)
}

function handleDeselection(id: ID, preserveLocked?: boolean) {
  const index = normal.indexOf(id)
  if (index >= 0) normal.splice(index, 1)

  if (!normal.length) normType = SelectionType.Nothing

  if (normFirst === id) normFirst = normal[0]
  if (normLast === id) normLast = normal[normal.length - 1]

  if (!preserveLocked) {
    locked.delete(id)
    selected.delete(id)
    if (!locked.size) lockType = SelectionType.Nothing
  }

  // Delete id from selected set (normal + locked)
  // if it was deleted from both normal and locked sets or
  // if it was deleted only from normal set and locked set
  // doesn't have this id
  if (!preserveLocked || !locked.has(id)) selected.delete(id)
}

export function deselectHeader(id: ID, preserveLocked?: boolean): void {
  handleDeselection(id, preserveLocked)

  Sidebar.reactive.selectedHeader = NOID
}

export function deselectTab(id: ID, preserveLocked?: boolean): void {
  handleDeselection(id, preserveLocked)

  const target = Tabs.byId[id]
  if (target) {
    target.reactive.sel = target.sel = false

    if (!preserveLocked) {
      target.reactive.selLock = target.selLock = false
    }
  }

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function deselectTabsBranch(parentTab: Tab, preserveLocked?: boolean): void {
  deselectTab(parentTab.id, preserveLocked)

  if (Settings.state.tabsTree) {
    for (let tab, i = parentTab.index + 1; i < Tabs.list.length; i++) {
      tab = Tabs.list[i]
      if (tab.lvl <= parentTab.lvl) break

      deselectTab(tab.id, preserveLocked)
    }
  }
}

export function deselectBookmark(id: ID, preserveLocked?: boolean): void {
  handleDeselection(id, preserveLocked)

  const target = Bookmarks.reactive.byId[id]
  if (target) {
    target.sel = false
    if (!preserveLocked) target.selLock = false
  }
}

export function deselectHistory(id: ID, preserveLocked?: boolean): void {
  handleDeselection(id, preserveLocked)

  const target = History.byId[id]
  if (target) target.reactive.sel = false
}

export function deselectNewTabBtn(id: ID, preserveLocked?: boolean): void {
  handleDeselection(id, preserveLocked)

  const target = Sidebar.panelsById[id]
  if (Utils.isTabsPanel(target)) target.reactive.selNewTab = target.selNewTab = false
}

export function deselectNavItem(id: ID, preserveLocked?: boolean): void {
  handleDeselection(id, preserveLocked)

  Sidebar.reactive.selectedNavId = NOID
}

export function resetSelection(forced?: boolean, preserveLocked?: boolean): void {
  if (!forced && resetStop) return
  if (!selected.size) return

  if (normType === SelectionType.Header) {
    Sidebar.reactive.selectedHeader = NOID
  }

  if (normType === SelectionType.Tabs) {
    for (const id of normal) {
      const target = Tabs.byId[id]
      if (target) target.reactive.sel = target.sel = false
    }

    if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
  }

  if (normType === SelectionType.Bookmarks) {
    for (const id of normal) {
      const target = Bookmarks.reactive.byId[id]
      if (target) target.sel = false
    }
  }

  if (normType === SelectionType.History) {
    for (const id of normal) {
      const target = History.byId[id]
      if (target) target.reactive.sel = false
    }
  }

  if (normType === SelectionType.NewTabBar) {
    for (const id of normal) {
      const target = Sidebar.panelsById[id]
      if (Utils.isTabsPanel(target)) target.reactive.selNewTab = target.selNewTab = false
    }
  }

  if (normType === SelectionType.NavItem) {
    Sidebar.reactive.selectedNavId = NOID
  }

  normal = []
  normType = SelectionType.Nothing
  normFirst = null
  normLast = null

  if (!preserveLocked) {
    unlockSelection()
    selected.clear()
  } else {
    selected = new Set(locked)
  }
}

export function includes(id: ID): boolean {
  return selected.has(id)
}

let updateHighlightedTabsTimeout: number | undefined
function updateHighlightedTabs(delay = 250): void {
  clearTimeout(updateHighlightedTabsTimeout)
  updateHighlightedTabsTimeout = setTimeout(() => {
    const conf: browser.tabs.HighlightInfo = {
      windowId: Windows.id,
      populate: false,
      tabs: [],
    }
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab) conf.tabs.push(activeTab.index)

    for (const tabId of selected) {
      const tab = Tabs.byId[tabId]
      if (!tab) continue
      if (tab.hidden) continue
      conf.tabs.push(tab.index)
    }

    browser.tabs.highlight(conf).catch(() => {
      // If tab already removed...
    })
  }, delay)
}

export function preserveSelection(): void {
  resetStop = true
}

let preserveSelectionTimeout: number | undefined
export function allowSelectionReset(timeout?: number): void {
  clearTimeout(preserveSelectionTimeout)
  preserveSelectionTimeout = setTimeout(() => {
    resetStop = false
  }, timeout)
}
