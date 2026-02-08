import * as Utils from 'src/utils'
import { Panel, BookmarksPanel, DstPlaceInfo } from 'src/types'
import { BKM_ROOT_ID, NOID } from 'src/defaults'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Search from 'src/services/search.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Selection from './selection.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Logs from 'src/services/logs'
import { BkmType } from 'src/enums'

function ancestorIsFiltered(
  node: Bookmarks.BkmNode,
  folders: Record<ID, Bookmarks.BkmNode>
): boolean {
  let parent = Bookmarks.byId.get(node.parentId)

  while (parent) {
    const isFiltered = !!folders[parent.id]
    if (isFiltered) return true
    parent = Bookmarks.byId.get(parent.parentId)
  }

  return false
}

function searchTreeWalker(
  nodes: Bookmarks.BkmNode[],
  filtered: Bookmarks.BkmNode[],
  filteredIds: ID[],
  folders: Record<ID, Bookmarks.BkmNode> = {}
): void {
  for (const n of nodes) {
    if (ancestorIsFiltered(n, folders)) continue
    if (n.title && n.url) {
      if (Search.check(n.title) || Search.check(n.url)) {
        filtered.push(n)
        filteredIds.push(n.id)
      }
    }
    if (n.title && !n.url && n.parentId !== BKM_ROOT_ID && Search.check(n.title)) {
      folders[n.id] = n
      filtered.unshift(n)
      filteredIds.unshift(n.id)
    }
    if (n.children) searchTreeWalker(n.children, filtered, filteredIds, folders)
  }
}

function searchHistoryWalker(nodes: Bookmarks.BkmNode[], filtered: Bookmarks.BkmNode[]): void {
  for (const n of nodes) {
    if (n.title && n.url && (Search.check(n.title) || Search.check(n.url))) filtered.push(n)
    if (n.children) searchHistoryWalker(n.children, filtered)
  }
}

let prevActivePanelId: ID | undefined
let expandedBookmarks: Record<ID, boolean>
let visibleBookmarks: Bookmarks.BkmNode[] = []
export function onBookmarksSearch(activePanel: Panel, panel?: Panel): void {
  if (!Bookmarks.tree.length) return

  if (!panel) panel = activePanel
  if (!Utils.isBookmarksPanel(panel)) return

  const samePanel = prevActivePanelId === panel.id
  prevActivePanelId = panel.id
  visibleBookmarks = []

  if (Search.query) {
    // Save scroll position before search
    if (!panel.filteredBookmarks && panel.scrollEl) {
      const id = activePanel !== panel ? `${activePanel.id}${panel.id}` : panel.id
      Sidebar.scrollPositions[id] = panel.scrollEl.scrollTop
    }

    const query = Search.query
    const prevQuery = Search.prevQuery
    const rootBookmark = Bookmarks.byId.get(panel.rootId)

    let bookmarks: Bookmarks.BkmNode[] | undefined
    if (
      query.length > prevQuery.length &&
      query.startsWith(prevQuery) &&
      samePanel &&
      panel.reactive.filteredBookmarkIds
    ) {
      bookmarks = Bookmarks.get(panel.reactive.filteredBookmarkIds)
    }
    if (!bookmarks) {
      if (panel.reactive.rootOffset) {
        let folder = Bookmarks.byId.get(panel.rootId)
        for (let i = panel.reactive.rootOffset; i-- && folder; ) {
          folder = Bookmarks.byId.get(folder.parentId)
        }
        if (folder) bookmarks = folder.children
        else bookmarks = Bookmarks.tree
      } else {
        bookmarks = rootBookmark?.children
      }
    }
    if (!bookmarks) bookmarks = Bookmarks.tree

    const filtered: Bookmarks.BkmNode[] = []
    let filteredIds: ID[] | undefined
    if (panel.viewMode === 'tree') {
      filteredIds = []
      // Save expanded folders and close all folders in all panels
      if (!Search.prevExpandedBookmarks) {
        Search.setPrevExpandedBookmarks(Bookmarks.reactive.expanded)
        Bookmarks.reactive.expanded = {}
      }
      if (!Bookmarks.reactive.expanded[activePanel.id]) {
        Bookmarks.reactive.expanded[activePanel.id] = {}
      }
      expandedBookmarks = Bookmarks.reactive.expanded[activePanel.id]

      searchTreeWalker(bookmarks, filtered, filteredIds)
    } else if (panel.viewMode === 'history') {
      searchHistoryWalker(bookmarks, filtered)
      filtered.sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0))
      filteredIds = filtered.map(b => b.id)
    }
    visibleBookmarks = filtered
    panel.filteredBookmarks = filtered
    panel.reactive.filteredBookmarkIds = filteredIds
    panel.reactive.filteredLen = filteredIds?.length

    // Scroll to the first target
    if (filteredIds?.length) {
      Selection.resetSelection()
      const first = filteredIds[0]
      Bookmarks.scrollToBookmarkDebounced(first)
    }
  } else {
    expandedBookmarks = {}
    panel.filteredBookmarks = undefined
    panel.reactive.filteredBookmarkIds = undefined
    panel.reactive.filteredLen = undefined
    // Restore scroll position after search
    if (panel.scrollEl) {
      const id = activePanel !== panel ? `${activePanel.id}${panel.id}` : panel.id
      panel.scrollEl.scrollTop = Sidebar.scrollPositions[id] ?? 0
    }
    if (Search.prevQuery) Selection.resetSelection()
  }
}

export function onBookmarksSearchNext(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isBookmarksPanel(panel) || !panel.filteredBookmarks) return

  const selId = Selection.isSet() ? Selection.getFirst() : undefined
  const selIndex = selId ? visibleBookmarks.findIndex(b => b.id === selId) : -1
  const nextBkm = visibleBookmarks[selIndex + 1]
  if (!nextBkm) return

  Selection.resetSelection()
  Selection.selectBookmark(nextBkm.id)
  Bookmarks.scrollToBookmark(nextBkm.id)
}

export function onBookmarksSearchPrev(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isBookmarksPanel(panel) || !panel.filteredBookmarks) return

  const selId = Selection.isSet() ? Selection.getFirst() : undefined
  const selIndex = selId ? visibleBookmarks.findLastIndex(b => b.id === selId) : -1
  let prevBkm
  if (selIndex >= 0) prevBkm = visibleBookmarks[selIndex - 1]
  else prevBkm = visibleBookmarks[visibleBookmarks.length - 1]
  if (!prevBkm) return

  Selection.resetSelection()
  Selection.selectBookmark(prevBkm.id)
  Bookmarks.scrollToBookmark(prevBkm.id)
}

export function onBookmarksSearchEnter(actPanel: Panel, panel?: Panel) {
  if (!panel) panel = actPanel
  if (!Utils.isBookmarksPanel(panel) || !panel.filteredBookmarks) return

  // Try to find in another panel
  if (Search.query && !panel.filteredBookmarks?.length) {
    return findInAnotherPanel()
  }

  const selId = Selection.getFirst()
  const bookmark = Bookmarks.byId.get(selId)
  if (bookmark) {
    if (bookmark.type === BkmType.Folder) {
      Bookmarks.toggleBranch(bookmark.id, actPanel.id)
      expandedBookmarks = Bookmarks.reactive.expanded[actPanel.id]
      visibleBookmarks = []
      calcVisibleBkms(panel.filteredBookmarks, visibleBookmarks)
      return
    }
    if (bookmark.type === BkmType.Bookmark) {
      const dst: DstPlaceInfo = {}
      if (Utils.isTabsPanel(actPanel)) dst.panelId = actPanel.id
      else {
        dst.panelId = Sidebar.getRecentTabsPanelId()
        const panel = Sidebar.panelsById[dst.panelId]
        if (Utils.isTabsPanel(panel)) dst.index = Tabs.getIndexForNewTab(panel)
      }
      Bookmarks.open([bookmark.id], dst, false, true)
    }
  }

  Search.stop()

  if (Sidebar.subPanelActive) Sidebar.closeSubPanel()
}

function calcVisibleBkms(nodes: Bookmarks.BkmNode[], visible: Bookmarks.BkmNode[]) {
  for (const n of nodes) {
    visible.push(n)
    if (n.children && expandedBookmarks[n.id]) calcVisibleBkms(n.children, visible)
  }
}

export function onBookmarksSearchSelectAll(panel: BookmarksPanel): void {
  if (!panel.filteredBookmarks) return

  const ids: ID[] = []
  let allSelected = true
  for (const node of visibleBookmarks) {
    if (allSelected && !node.sel) allSelected = false
    ids.push(node.id)
  }

  Selection.resetSelection()
  if (!allSelected && ids.length) Selection.selectBookmarks(ids)
}

function firstMatchWalker(
  nodes: Bookmarks.BkmNode[],
  path: string[]
): Bookmarks.BkmNode | undefined {
  for (const n of nodes) {
    if (n.title && n.url && (Search.check(n.title) || Search.check(n.url))) return n
    if (n.title && !n.url && n.parentId !== BKM_ROOT_ID && Search.check(n.title)) return n
    if (n.children) {
      path.push(n.id as string)
      const result = firstMatchWalker(n.children, path)
      if (result) return result
      path.pop()
    }
  }
}

function findPanelWithRoot(path: string[]): BookmarksPanel | undefined {
  for (const id of Sidebar.reactive.nav) {
    const panel = Sidebar.panelsById[id]
    if (!Utils.isBookmarksPanel(panel)) continue
    if (panel.rootId === NOID) return panel
    if (path.includes(panel.rootId as string)) return panel
  }
}

function findInAnotherPanel(): void {
  const path: string[] = [BKM_ROOT_ID]
  const firstMatch = firstMatchWalker(Bookmarks.tree, path)
  if (!firstMatch) return

  const panel = findPanelWithRoot(path)
  if (panel) Sidebar.activatePanel(panel.id)
}
