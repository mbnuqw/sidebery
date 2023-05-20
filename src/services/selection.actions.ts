import * as Utils from 'src/utils'
import { Tab, Bookmark, SelectionType, SubPanelType } from 'src/types'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Bookmarks } from 'src/services/bookmarks'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { History } from 'src/services/history'
import { NOID } from 'src/defaults'

let resetStop = false
let firstItem: ID | null = null
let selType = SelectionType.Nothing

export function getLength(): number {
  return Selection.selected.length
}

export function getFirst(): ID {
  return firstItem || Selection.selected[0]
}

export function getLast(): ID {
  const firstIsFirst = Selection.selected[0] === firstItem
  return firstIsFirst ? Selection.selected[Selection.selected.length - 1] : Selection.selected[0]
}

export const isTabs = (): boolean => selType === SelectionType.Tabs
export const isBookmarks = (): boolean => selType === SelectionType.Bookmarks
export const isHistory = (): boolean => selType === SelectionType.History
export const isNavItem = (): boolean => selType === SelectionType.NavItem
export const isNewTabBar = (): boolean => selType === SelectionType.NewTabBar
export const isHeader = (): boolean => selType === SelectionType.Header
export const isSet = (): boolean => selType !== SelectionType.Nothing

/**
 * Returns new array of ids of selected items
 */
export function get(): ID[] {
  return [...Selection.selected]
}

export function getTabs(): Tab[] {
  const tabs: Tab[] = []
  for (const id of Selection.selected) {
    const tab = Tabs.byId[id]
    if (tab) tabs.push(tab)
  }
  return tabs
}

export function map<T>(cb: (v: ID, index: number, array: ID[]) => T): T[] {
  return Selection.selected.map(cb)
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

export function selectHeader(id: ID): void {
  Sidebar.reactive.selectedHeader = id
  Selection.selected.push(id)
  firstItem = id
  selType = SelectionType.Header
}

export function selectTab(tabId: ID): void {
  const rTarget = Tabs.reactive.byId[tabId]
  const target = Tabs.byId[tabId]
  if (!rTarget || !target) return

  if (firstItem !== null) {
    const firstTab = Tabs.reactive.byId[firstItem]
    if (firstTab && firstTab.pinned !== rTarget.pinned) return
  }

  rTarget.sel = true
  target.sel = true
  Selection.selected.push(tabId)
  firstItem = tabId
  selType = SelectionType.Tabs

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectTabs(tabIds: ID[]): void {
  for (const id of tabIds) {
    const rTarget = Tabs.reactive.byId[id]
    const target = Tabs.byId[id]
    if (!rTarget || !target) continue

    rTarget.sel = true
    target.sel = true
    Selection.selected.push(id)
  }

  firstItem = tabIds[0]
  selType = SelectionType.Tabs

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectTabsRange(aTab: Tab, bTab?: Tab): void {
  if (!bTab && firstItem !== null) bTab = Tabs.byId[firstItem]
  if (!bTab) return

  if (aTab.pinned !== bTab.pinned || aTab.panelId !== bTab.panelId) return resetSelection()

  if (Selection.selected.length) {
    for (const id of Selection.selected) {
      const tab = Tabs.reactive.byId[id]
      if (tab) tab.sel = false
    }
    Selection.selected = []
  }

  const minIndex = Math.min(aTab.index, bTab.index)
  const maxIndex = Math.max(aTab.index, bTab.index)

  for (let i = minIndex; i <= maxIndex; i++) {
    const target = Tabs.list[i]
    const rTarget = Tabs.reactive.byId[target.id]
    if (!rTarget) continue

    rTarget.sel = true
    target.sel = true
    Selection.selected.push(target.id)
  }

  selType = SelectionType.Tabs
  if (firstItem === null) firstItem = aTab.id

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectTabsBranch(parentTab: Tab): void {
  parentTab.sel = true
  Selection.selected.push(parentTab.id)
  firstItem = parentTab.id

  const rParentTab = Tabs.reactive.byId[parentTab.id]
  if (rParentTab) rParentTab.sel = true

  if (Settings.state.tabsTree) {
    for (let tab, i = parentTab.index + 1; i < Tabs.list.length; i++) {
      tab = Tabs.list[i]
      if (tab.lvl <= parentTab.lvl) break

      const rTab = Tabs.reactive.byId[tab.id]
      if (rTab) rTab.sel = true
      tab.sel = true
      Selection.selected.push(tab.id)
    }
  }

  selType = SelectionType.Tabs

  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function selectBookmark(bookmarkId: ID): void {
  const target = Bookmarks.reactive.byId[bookmarkId]
  if (!target) return

  target.sel = true
  Selection.selected.push(bookmarkId)
  firstItem = bookmarkId
  selType = SelectionType.Bookmarks
}

export function selectBookmarks(ids: ID[]): void {
  for (const id of ids) {
    const target = Bookmarks.reactive.byId[id]
    if (!target) continue

    target.sel = true
    Selection.selected.push(id)
  }

  firstItem = ids[0]
  selType = SelectionType.Bookmarks
}

export function selectBookmarksRange(aBookmark: Bookmark, bBookmark?: Bookmark): void {
  if (!bBookmark && firstItem !== null) bBookmark = Bookmarks.reactive.byId[firstItem]
  if (!bBookmark) return

  Sidebar.updateBounds()

  if (Selection.selected.length) {
    Selection.selected.forEach(id => {
      const bkm = Bookmarks.reactive.byId[id]
      if (bkm) bkm.sel = false
    })
    Selection.selected = []
  }

  let inside = false
  let activePanel
  if (Sidebar.subPanelActive) activePanel = Sidebar.subPanels.bookmarks
  else activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (activePanel) {
    for (const bound of activePanel.bounds) {
      const bkm = Bookmarks.reactive.byId[bound.id]
      if (!bkm) continue

      if (bound.id === aBookmark.id || bound.id === bBookmark.id) {
        if (!inside) inside = true
        else {
          bkm.sel = true
          Selection.selected.push(bound.id)
          break
        }
      }
      if (inside) {
        bkm.sel = true
        Selection.selected.push(bound.id)
      }
    }
  }

  selType = SelectionType.Bookmarks
  if (firstItem === null) firstItem = aBookmark.id
}

export function selectHistory(id: ID): void {
  const list = History.reactive.filtered ?? History.reactive.list
  const target = list.find(item => item.id === id)
  if (!target) return

  target.sel = true
  Selection.selected.push(id)
  firstItem = id
  selType = SelectionType.History
}

export function selectNewTabBtn(panelId: ID): void {
  const target = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(target)) return

  target.selNewTab = true
  target.reactive.selNewTab = true
  Selection.selected.push(panelId)
  firstItem = panelId
  selType = SelectionType.NewTabBar
}

export function selectNavItem(id: ID): void {
  const index = Sidebar.reactive.nav.indexOf(id)
  if (index === -1) return

  Sidebar.reactive.selectedNavId = id
  Selection.selected.push(id)
  firstItem = id
  selType = SelectionType.NavItem
}

export function deselectHeader(id: ID): void {
  const index = Selection.selected.indexOf(id)
  if (index >= 0) Selection.selected.splice(index, 1)

  if (firstItem === id) firstItem = null

  Sidebar.reactive.selectedHeader = NOID
}

export function deselectTab(tabId: ID): void {
  const index = Selection.selected.indexOf(tabId)
  if (index >= 0) Selection.selected.splice(index, 1)

  const target = Tabs.byId[tabId]
  const rTarget = Tabs.reactive.byId[tabId]
  if (rTarget) rTarget.sel = false
  if (target) target.sel = false

  if (!Selection.selected.length) selType = SelectionType.Nothing
  if (firstItem === tabId) firstItem = null
  if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
}

export function deselectTabsBranch(parentTab: Tab): void {
  Selection.deselectTab(parentTab.id)

  if (Settings.state.tabsTree) {
    for (let tab, i = parentTab.index + 1; i < Tabs.list.length; i++) {
      tab = Tabs.list[i]
      if (tab.lvl <= parentTab.lvl) break

      Selection.deselectTab(tab.id)
    }
  }
}

export function deselectBookmark(bookmarkId: ID): void {
  const index = Selection.selected.indexOf(bookmarkId)
  if (index >= 0) Selection.selected.splice(index, 1)

  const target = Bookmarks.reactive.byId[bookmarkId]
  if (target) target.sel = false
  if (!Selection.selected.length) selType = SelectionType.Nothing
  if (firstItem === bookmarkId) firstItem = null
}

export function deselectHistory(id: ID): void {
  const index = Selection.selected.indexOf(id)
  if (index >= 0) Selection.selected.splice(index, 1)

  const list = History.reactive.filtered ?? History.reactive.list
  const target = list.find(item => item.id === id)
  if (target) target.sel = false
  if (!Selection.selected.length) selType = SelectionType.Nothing
  if (firstItem === id) firstItem = null
}

export function deselectNewTabBtn(panelId: ID): void {
  const index = Selection.selected.indexOf(panelId)
  if (index >= 0) Selection.selected.splice(index, 1)

  const target = Sidebar.panelsById[panelId]
  if (Utils.isTabsPanel(target)) target.reactive.selNewTab = target.selNewTab = false
  if (!Selection.selected.length) selType = SelectionType.Nothing
  if (firstItem === panelId) firstItem = null
}

export function deselectNavItem(id: ID): void {
  const index = Selection.selected.indexOf(id)
  if (index >= 0) Selection.selected.splice(index, 1)

  Sidebar.reactive.selectedNavId = NOID
  if (firstItem === id) firstItem = null
  if (!Selection.selected.length) selType = SelectionType.Nothing
}

export function resetSelection(): void {
  if (resetStop) return
  if (!Selection.selected.length) return

  if (selType === SelectionType.Header) {
    Sidebar.reactive.selectedHeader = NOID
  }

  if (selType === SelectionType.Tabs) {
    for (const id of Selection.selected) {
      const target = Tabs.byId[id]
      const rTarget = Tabs.reactive.byId[id]
      if (rTarget) rTarget.sel = false
      if (target) target.sel = false
    }

    if (Settings.state.nativeHighlight) updateHighlightedTabs(120)
  }

  if (selType === SelectionType.Bookmarks) {
    for (const id of Selection.selected) {
      const target = Bookmarks.reactive.byId[id]
      if (target) target.sel = false
    }
  }

  if (selType === SelectionType.History) {
    for (const id of Selection.selected) {
      const list = History.reactive.filtered ?? History.reactive.list
      const target = list.find(item => item.id === id)
      if (target) target.sel = false
    }
  }

  if (selType === SelectionType.NewTabBar) {
    for (const id of Selection.selected) {
      const target = Sidebar.panelsById[id]
      if (Utils.isTabsPanel(target)) target.reactive.selNewTab = target.selNewTab = false
    }
  }

  if (selType === SelectionType.NavItem) {
    Sidebar.reactive.selectedNavId = NOID
  }

  Selection.selected = []
  selType = SelectionType.Nothing
  firstItem = null
}

export function includes(id: ID): boolean {
  return Selection.selected.includes(id)
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

    for (const tabId of Selection.selected) {
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
