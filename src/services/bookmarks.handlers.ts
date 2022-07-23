import { Bookmark } from 'src/types'
import { Bookmarks } from 'src/services/bookmarks'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Info } from 'src/services/info'

type BookmarkCreatedListener = browser.bookmarks.CreateListener
export function setupBookmarksListeners(): void {
  if (!browser.bookmarks) return
  if (!Info.isBg) {
    browser.bookmarks.onCreated.addListener(onBookmarkCreatedFg as BookmarkCreatedListener)
    browser.bookmarks.onChanged.addListener(onBookmarkChangedFg)
    browser.bookmarks.onMoved.addListener(onBookmarkMovedFg)
    browser.bookmarks.onRemoved.addListener(onBookmarkRemovedFg)
  }
}

export function resetBookmarksListeners(): void {
  if (!browser.bookmarks) return
  if (!Info.isBg) {
    browser.bookmarks.onCreated.removeListener(onBookmarkCreatedFg as BookmarkCreatedListener)
    browser.bookmarks.onChanged.removeListener(onBookmarkChangedFg)
    browser.bookmarks.onMoved.removeListener(onBookmarkMovedFg)
    browser.bookmarks.onRemoved.removeListener(onBookmarkRemovedFg)
  }
}

function onBookmarkCreatedFg(id: ID, bookmark: Bookmark): void {
  if (!Bookmarks.reactive.tree.length) return

  bookmark.sel = false
  bookmark.isOpen = false
  if (bookmark.type === 'separator') bookmark.url = undefined
  if (bookmark.type === 'folder') {
    bookmark.len = 0
    if (!bookmark.children) bookmark.children = []
  }

  if (Settings.state.highlightOpenBookmarks && bookmark.url) {
    bookmark.isOpen = !!Tabs.urlsInUse[bookmark.url]
    if (bookmark.isOpen) Bookmarks.markParents(bookmark)
  }

  const parent = Bookmarks.reactive.byId[bookmark.parentId]
  if (parent && parent.children && bookmark.index !== undefined) {
    parent.children.splice(bookmark.index, 0, bookmark)
    for (let i = bookmark.index + 1; i < parent.children.length; i++) {
      parent.children[i].index = i
    }
  }

  Bookmarks.reactive.byId[id] = bookmark
  const rBookmark = Bookmarks.reactive.byId[id]
  if (bookmark.url) {
    if (Bookmarks.byUrl[bookmark.url]) {
      Bookmarks.byUrl[bookmark.url].push(rBookmark)
    } else {
      Bookmarks.byUrl[bookmark.url] = [rBookmark]
    }
  }

  // Update length of parent folders
  const addedLen = bookmark.len || 1
  Bookmarks.updateTreeLen(parent, addedLen)

  Sidebar.recalcBookmarksPanels()
}

function onBookmarkChangedFg(id: ID, info: browser.bookmarks.UpdateChanges): void {
  if (!Bookmarks.reactive.tree.length) return

  const bookmark = Bookmarks.reactive.byId[id]
  if (!bookmark) return

  const oldUrl = bookmark.url
  if (oldUrl && oldUrl !== info.url && Bookmarks.byUrl[oldUrl]) {
    const iob = Bookmarks.byUrl[oldUrl].findIndex(b => b.id === id)
    if (iob > -1) Bookmarks.byUrl[oldUrl].splice(iob, 1)
  }

  if (info.title !== undefined && bookmark.title !== info.title) {
    bookmark.title = info.title
  }

  if (info.url !== undefined && oldUrl !== info.url) {
    bookmark.url = info.url
    if (Bookmarks.byUrl[info.url]) {
      Bookmarks.byUrl[info.url].push(bookmark)
    } else {
      Bookmarks.byUrl[info.url] = [bookmark]
    }

    if (Settings.state.highlightOpenBookmarks) {
      Bookmarks.reMarkOpenBookmark(bookmark)
    }
  }
}

function onBookmarkMovedFg(id: ID, info: browser.bookmarks.MoveInfo): void {
  if (!Bookmarks.reactive.tree.length) return

  const oldParent = Bookmarks.reactive.byId[info.oldParentId]
  const newParent = Bookmarks.reactive.byId[info.parentId]

  if (oldParent?.children && newParent?.children) {
    const node = oldParent.children.splice(info.oldIndex, 1)[0]
    for (let i = info.oldIndex; i < oldParent.children.length; i++) {
      oldParent.children[i].index = i
    }

    node.index = info.index
    node.parentId = info.parentId

    newParent.children.splice(node.index, 0, node)
    for (let i = info.index + 1; i < newParent.children.length; i++) {
      newParent.children[i].index = i
    }
  }

  // Update length of parent folders
  const node = Bookmarks.reactive.byId[id]
  if (node && oldParent && newParent && newParent.id !== oldParent.id) {
    const movedLen = node?.len || 1
    Bookmarks.updateTreeLen(oldParent, -movedLen)
    Bookmarks.updateTreeLen(newParent, movedLen)

    if (node.isOpen) {
      // Unmark old parent
      let parent = oldParent
      while (parent) {
        Bookmarks.markedFolders[parent.id] = (Bookmarks.markedFolders[parent.id] ?? 1) - 1
        if (!Bookmarks.markedFolders[parent.id] && parent.isOpen) parent.isOpen = false
        else break
        parent = Bookmarks.reactive.byId[parent.parentId]
      }

      // Mark new parent
      parent = newParent
      while (parent) {
        Bookmarks.markedFolders[parent.id] = (Bookmarks.markedFolders[parent.id] ?? 0) + 1
        if (!parent.isOpen) parent.isOpen = true
        else break
        parent = Bookmarks.reactive.byId[parent.parentId]
      }
    }
  }

  Bookmarks.saveBookmarksTree()
  Sidebar.recalcBookmarksPanels()
}

function onBookmarkRemovedFg(id: ID, info: browser.bookmarks.RemoveInfo): void {
  if (!Bookmarks.reactive.tree.length) return

  const parent = Bookmarks.reactive.byId[info.parentId]
  const node = Bookmarks.reactive.byId[id]
  if (!node) return

  // Update length of parent folders
  const removedLen = node.len || 1
  Bookmarks.updateTreeLen(parent, -removedLen)

  // Remove from tree
  if (parent?.children) {
    parent.children.splice(info.index, 1)
    for (let i = info.index; i < parent.children.length; i++) {
      parent.children[i].index = i
    }
  }

  // Remove from byId object
  if (node.type === 'folder' && node.children?.length) {
    for (const child of Bookmarks.listBookmarks(node.children)) {
      delete Bookmarks.reactive.byId[child.id]
    }

    // Unmark old parent
    let p = parent
    while (p) {
      Bookmarks.markedFolders[p.id] = (Bookmarks.markedFolders[p.id] ?? 1) - 1
      if (!Bookmarks.markedFolders[p.id] && p.isOpen) p.isOpen = false
      else break
      p = Bookmarks.reactive.byId[p.parentId]
    }
    delete Bookmarks.markedFolders[node.id]
  }
  delete Bookmarks.reactive.byId[id]

  // Remove from byUrl object
  const url = node?.url
  if (url && Bookmarks.byUrl[url]) {
    const ib = Bookmarks.byUrl[url].findIndex(b => b.id === id)
    if (ib > -1) Bookmarks.byUrl[url].splice(ib, 1)
  }

  Sidebar.recalcBookmarksPanels()
}

export function updateTreeLen(parent: Bookmark, delta: number): void {
  let p = parent
  while (p) {
    if (p.len) p.len += delta
    p = Bookmarks.reactive.byId[p.parentId]
  }
  Bookmarks.overallCount += delta
}
