import Utils from 'src/utils'
import { Panel, Bookmark, BookmarksPanel } from 'src/types'
import { Bookmarks } from 'src/services/bookmarks'
import { Search } from 'src/services/search'
import { Sidebar } from 'src/services/sidebar'
import { Selection } from './selection'
import { BKM_ROOT_ID, NOID } from 'src/defaults'

function ancestorIsFiltered(node: Bookmark, folders: Record<ID, Bookmark>): boolean {
  let parent = Bookmarks.reactive.byId[node.parentId]

  while (parent) {
    const isFiltered = !!folders[parent.id]
    if (isFiltered) return true
    parent = Bookmarks.reactive.byId[parent.parentId]
  }

  return false
}

function searchTreeWalker(
  nodes: Bookmark[],
  filtered: Bookmark[],
  folders: Record<ID, Bookmark> = {}
): void {
  for (const n of nodes) {
    if (ancestorIsFiltered(n, folders)) continue
    if (n.title && n.url) {
      if (Search.check(n.title) || Search.check(n.url)) filtered.push(n)
    }
    if (n.title && !n.url && n.parentId !== BKM_ROOT_ID && Search.check(n.title)) {
      if (!n.expanded) n.expanded = true
      folders[n.id] = n
      filtered.push(n)
    }
    if (n.children) searchTreeWalker(n.children, filtered, folders)
  }
}

function searchHistoryWalker(nodes: Bookmark[], filtered: Bookmark[]): void {
  for (const n of nodes) {
    if (n.title && n.url && (Search.check(n.title) || Search.check(n.url))) filtered.push(n)
    if (n.children) searchHistoryWalker(n.children, filtered)
  }
}

let prevActivePanelId: ID | undefined
export function onBookmarksSearch(activePanel: Panel): void {
  if (!Bookmarks.reactive.tree.length) return
  if (!Utils.isBookmarksPanel(activePanel)) return

  const samePanel = prevActivePanelId === activePanel.id
  prevActivePanelId = activePanel.id

  if (Search.reactive.value) {
    const value = Search.reactive.value
    const prevValue = Search.prevValue
    const rootBookmark = Bookmarks.reactive.byId[activePanel.rootId]

    let bookmarks: Bookmark[] | undefined
    if (value.length > prevValue.length && value.startsWith(prevValue) && samePanel) {
      bookmarks = activePanel.filteredBookmarks
    }
    if (!bookmarks) bookmarks = rootBookmark?.children
    if (!bookmarks) bookmarks = Bookmarks.reactive.tree

    const filtered: Bookmark[] = []
    if (activePanel.viewMode === 'tree') {
      searchTreeWalker(bookmarks, filtered)
    } else if (activePanel.viewMode === 'history') {
      searchHistoryWalker(bookmarks, filtered)
      filtered.sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0))
    }
    activePanel.filteredBookmarks = filtered
    activePanel.filteredLen = filtered.length

    if (activePanel.filteredBookmarks.length) {
      const first = activePanel.filteredBookmarks[0]
      Selection.resetSelection()
      Selection.selectBookmark(first.id)
      Bookmarks.scrollToBookmarkDebounced(first.id)
    }
  } else {
    for (const id of Bookmarks.expandedBookmarkFolders) {
      const folder = Bookmarks.reactive.byId[id]
      if (folder) folder.expanded = true
    }
    activePanel.filteredBookmarks = undefined
    activePanel.filteredLen = undefined
    if (Search.prevValue) Selection.resetSelection()
  }
}

let nextWalkerPrevNode: Bookmark | undefined
function nextWalker(nodes: Bookmark[]): ID | undefined {
  for (const node of nodes) {
    if (nextWalkerPrevNode?.sel) return node.id

    nextWalkerPrevNode = node

    if (node.expanded && node.children) {
      const nextId = nextWalker(node.children)
      if (nextId !== undefined) return nextId
    }
  }
}

export function onBookmarksSearchNext(panel?: Panel): void {
  if (!panel) panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isBookmarksPanel(panel) || !panel.filteredBookmarks) return

  nextWalkerPrevNode = undefined
  const filtered = panel.filteredBookmarks
  const nextId = Selection.isSet() ? nextWalker(filtered) : filtered[0]?.id
  if (!nextId) return

  Selection.resetSelection()
  Selection.selectBookmark(nextId)
  Bookmarks.scrollToBookmark(nextId)
}

let prevWalkerPrevId: ID | undefined
function prevWalker(nodes: Bookmark[]): ID | undefined {
  for (const node of nodes) {
    if (node.sel && prevWalkerPrevId) return prevWalkerPrevId

    prevWalkerPrevId = node.id

    if (node.expanded && node.children) {
      const id = prevWalker(node.children)
      if (id !== undefined) return id
    }
  }
}

export function onBookmarksSearchPrev(panel?: Panel): void {
  if (!panel) panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isBookmarksPanel(panel) || !panel.filteredBookmarks) return

  prevWalkerPrevId = undefined
  const filtered = panel.filteredBookmarks
  const filteredLen = filtered.length
  const prevId = Selection.isSet() ? prevWalker(filtered) : filtered[filteredLen - 1]?.id
  if (!prevId) return

  Selection.resetSelection()
  Selection.selectBookmark(prevId)
  Bookmarks.scrollToBookmark(prevId)
}

export function onBookmarksSearchEnter(panel?: Panel): void {
  if (!panel) panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isBookmarksPanel(panel) || !panel.filteredBookmarks) return

  // Try to find in another panel
  if (Search.reactive.value && !panel.filteredBookmarks?.length) return findInAnotherPanel()

  const selId = Selection.getFirst()
  const bookmark = Bookmarks.reactive.byId[selId]
  if (bookmark) {
    if (bookmark.type === 'folder') Bookmarks.toggleBranch(bookmark.id)
    if (bookmark.type === 'bookmark') Bookmarks.open([bookmark.id], {}, false, true)
  }

  Search.stop()
}

function* visibleBookmarks(nodes: Bookmark[]): IterableIterator<Bookmark> {
  for (const n of nodes) {
    yield n
    if (n.children && n.expanded) yield* visibleBookmarks(n.children)
  }
}

export function onBookmarksSearchSelectAll(panel: BookmarksPanel): void {
  if (!panel.filteredBookmarks) return

  const ids: ID[] = []
  let allSelected = true
  for (const node of visibleBookmarks(panel.filteredBookmarks)) {
    if (allSelected && !node.sel) allSelected = false
    ids.push(node.id)
  }

  Selection.resetSelection()
  if (!allSelected && ids.length) Selection.selectBookmarks(ids)
}

function firstMatchWalker(nodes: Bookmark[], path: string[]): Bookmark | undefined {
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
    const panel = Sidebar.reactive.panelsById[id]
    if (!Utils.isBookmarksPanel(panel)) continue
    if (panel.rootId === NOID) return panel
    if (path.includes(panel.rootId as string)) return panel
  }
}

function findInAnotherPanel(): void {
  const path: string[] = [BKM_ROOT_ID]
  const firstMatch = firstMatchWalker(Bookmarks.reactive.tree, path)
  if (!firstMatch) return

  const panel = findPanelWithRoot(path)
  if (panel) Sidebar.activatePanel(panel.id)
}
