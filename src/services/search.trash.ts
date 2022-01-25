import { RemovedBookmark, RemovedItem, RemovedTab, RemovedWindow } from 'src/types'
import { StoredRemovedBookmarkChild, TrashPanel } from 'src/types'
import { Search } from 'src/services/search'
import { Trash } from 'src/services/trash'
import { Selection } from './selection'
import { Sidebar } from './sidebar'

function searchBookmarksTree(tree: StoredRemovedBookmarkChild[]): boolean {
  for (const n of tree) {
    if (n.url && Search.check(n.url)) return true
    if (n.title && Search.check(n.title)) return true
    if (n.subItems) {
      if (searchBookmarksTree(n.subItems)) return true
    }
  }
  return false
}

export function onTrashSearch(): void {
  if (Search.reactive.value) {
    const panel = Sidebar.reactive.panelsById.trash as TrashPanel | undefined
    if (!panel) return

    const inTabs = panel.viewMode === 'tabs'
    const inBookmarks = panel.viewMode === 'bookmarks'
    const inWindows = panel.viewMode === 'windows'
    const inAll = !inTabs && !inBookmarks && !inWindows

    const filteredTabs: RemovedTab[] = []
    const filteredBookmarks: RemovedBookmark[] = []
    const filteredWindows: RemovedWindow[] = []
    let filtered: RemovedItem[] | undefined

    if (inTabs || inAll) {
      for (const tab of Trash.reactive.tabs) {
        const titleOk = tab.title && Search.check(tab.title)
        const urlOk = tab.url && Search.check(tab.url)
        if (titleOk || urlOk) filteredTabs.push(tab)
      }
    }

    if (inBookmarks || inAll) {
      for (const bookmark of Trash.reactive.bookmarks) {
        const titleOk = bookmark.title && Search.check(bookmark.title)
        const urlOk = bookmark.url && Search.check(bookmark.url)
        if (titleOk || urlOk) filteredBookmarks.push(bookmark)
        else if (bookmark.subItems && searchBookmarksTree(bookmark.subItems)) {
          filteredBookmarks.push(bookmark)
        }
      }
    }

    if (inWindows || inAll) {
      for (const win of Trash.reactive.prevCache) {
        const titleOk = win.title && Search.check(win.title)
        if (titleOk) filteredWindows.push(win)
        else if (win.tabsCache && win.tabsCache.some(c => Search.check(c.url))) {
          filteredWindows.push(win)
        }
      }
      for (const win of Trash.reactive.windows) {
        const titleOk = win.title && Search.check(win.title)
        if (titleOk) filteredWindows.push(win)
        else if (win.tabsCache && win.tabsCache.some(c => Search.check(c.url))) {
          filteredWindows.push(win)
        }
      }
    }

    if (inTabs) filtered = filteredTabs
    else if (inBookmarks) filtered = filteredBookmarks
    else if (inWindows) filtered = filteredWindows
    else {
      filtered = (filteredTabs as RemovedItem[]).concat(filteredBookmarks, filteredWindows)
      filtered.sort((a, b) => b.time - a.time)
    }

    Trash.reactive.filtered = filtered

    if (Trash.reactive.filtered.length) {
      const first = Trash.reactive.filtered[0]
      Selection.resetSelection()
      Selection.selectTrash(first.id)
    }
  } else {
    Trash.reactive.filtered = undefined
    if (Search.prevValue) Selection.resetSelection()
  }
}

export function onTrashSearchNext(): void {
  if (!Trash.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = Trash.reactive.filtered.findIndex(t => t.id === selId)

  index += 1
  if (index < 0 || index >= Trash.reactive.filtered.length) {
    index = Trash.reactive.filtered.length - 1
  }

  Selection.resetSelection()
  const item = Trash.reactive.filtered[index]
  if (item) {
    Selection.selectTrash(item.id)
    Trash.scrollToTrashItem(item.id)
  }
}

export function onTrashSearchPrev(): void {
  if (!Trash.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = Trash.reactive.filtered.findIndex(t => t.id === selId)

  index -= 1
  if (index < 0 || index >= Trash.reactive.filtered.length) index = 0

  Selection.resetSelection()
  const item = Trash.reactive.filtered[index]
  if (item) {
    Selection.selectTrash(item.id)
    Trash.scrollToTrashItem(item.id)
  }
}

export function onTrashSearchEnter(): void {
  if (!Trash.reactive.filtered) return

  const selId = Selection.getFirst()
  const item = Trash.reactive.filtered.find(t => t.id === selId)

  if (Trash.isRemovedTab(item)) Trash.openTab(item)
  else if (Trash.isRemovedBookmark(item)) Trash.createBookmark(item)
  else if (Trash.isRemovedWindow(item)) Trash.openWindow(item)

  Search.stop()
}
