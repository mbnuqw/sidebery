import { Bookmark } from 'src/types'
import { NOID } from 'src/defaults'
import { Bookmarks } from 'src/services/bookmarks'
import { Trash } from 'src/services/trash'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Info } from 'src/services/info'
import { Logs } from './logs'

type BookmarkCreatedListener = browser.bookmarks.CreateListener
export function setupBookmarksListeners(): void {
  if (!browser.bookmarks) return
  if (Info.isBg) {
    browser.bookmarks.onCreated.addListener(onBookmarkCreatedBg as BookmarkCreatedListener)
    browser.bookmarks.onChanged.addListener(onBookmarkChangedBg)
    browser.bookmarks.onMoved.addListener(onBookmarkMovedBg)
    browser.bookmarks.onRemoved.addListener(onBookmarkRemovedBg)
  } else {
    browser.bookmarks.onCreated.addListener(onBookmarkCreatedFg as BookmarkCreatedListener)
    browser.bookmarks.onChanged.addListener(onBookmarkChangedFg)
    browser.bookmarks.onMoved.addListener(onBookmarkMovedFg)
    browser.bookmarks.onRemoved.addListener(onBookmarkRemovedFg)
  }
}

export function resetBookmarksListeners(): void {
  if (!browser.bookmarks) return
  if (Info.isBg) {
    browser.bookmarks.onCreated.removeListener(onBookmarkCreatedBg as BookmarkCreatedListener)
    browser.bookmarks.onChanged.removeListener(onBookmarkChangedBg)
    browser.bookmarks.onMoved.removeListener(onBookmarkMovedBg)
    browser.bookmarks.onRemoved.removeListener(onBookmarkRemovedBg)
  } else {
    browser.bookmarks.onCreated.removeListener(onBookmarkCreatedFg as BookmarkCreatedListener)
    browser.bookmarks.onChanged.removeListener(onBookmarkChangedFg)
    browser.bookmarks.onMoved.removeListener(onBookmarkMovedFg)
    browser.bookmarks.onRemoved.removeListener(onBookmarkRemovedFg)
  }
}

function onBookmarkCreatedBg(id: ID, bookmark: Bookmark): void {
  if (!Bookmarks.reactive.tree.length) return

  if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []

  const parent = Bookmarks.reactive.byId[bookmark.parentId ?? NOID]
  if (parent && parent.children) {
    const index = bookmark.index ?? parent.children.length
    parent.children.splice(index, 0, bookmark)
    for (let i = index + 1; i < parent.children.length; i++) {
      parent.children[i].index = i
    }
  }

  Bookmarks.reactive.byId[id] = bookmark
}

function onBookmarkCreatedFg(id: ID, bookmark: Bookmark): void {
  if (!Bookmarks.reactive.tree.length) return

  bookmark.sel = false
  bookmark.isOpen = false
  if (bookmark.type === 'separator') bookmark.url = undefined
  if (bookmark.type === 'folder') {
    if (!bookmark.children) bookmark.children = []
    bookmark.expanded = false
  }

  if (Settings.reactive.highlightOpenBookmarks && bookmark.url) {
    bookmark.isOpen = !!Tabs.list.find(t => t.url === bookmark.url)
    if (bookmark.isOpen) {
      let parent = Bookmarks.reactive.byId[bookmark.parentId]
      while (parent && !parent.isOpen) {
        parent.isOpen = true
        parent = Bookmarks.reactive.byId[parent.parentId]
      }
    }
  }

  if (!bookmark.parentId) return
  const parent = Bookmarks.reactive.byId[bookmark.parentId]
  if (parent && parent.children && bookmark.index !== undefined) {
    parent.children.splice(bookmark.index, 0, bookmark)
    for (let i = bookmark.index + 1; i < parent.children.length; i++) {
      parent.children[i].index = i
    }
  }

  Bookmarks.reactive.byId[id] = bookmark
  if (bookmark.url) {
    if (Bookmarks.reactive.byUrl[bookmark.url]) {
      Bookmarks.reactive.byUrl[bookmark.url].push(bookmark)
    } else {
      Bookmarks.reactive.byUrl[bookmark.url] = [bookmark]
    }
  }

  Sidebar.recalcBookmarksPanels()
}

function onBookmarkChangedBg(id: ID, info: browser.bookmarks.UpdateChanges): void {
  if (!Bookmarks.reactive.tree.length) return

  const bookmark = Bookmarks.reactive.byId[id]
  if (bookmark) {
    if (info.title !== undefined && bookmark.title !== info.title) bookmark.title = info.title
    if (info.url !== undefined && bookmark.url !== info.url) bookmark.url = info.url
  }
}

function onBookmarkChangedFg(id: ID, info: browser.bookmarks.UpdateChanges): void {
  if (!Bookmarks.reactive.tree.length) return

  const oldUrl = Bookmarks.reactive.byId[id]?.url
  if (oldUrl && oldUrl !== info.url && Bookmarks.reactive.byUrl[oldUrl]) {
    const iob = Bookmarks.reactive.byUrl[oldUrl].findIndex(b => b.id === id)
    if (iob > -1) Bookmarks.reactive.byUrl[oldUrl].splice(iob, 1)
  }

  const bookmark = Bookmarks.reactive.byId[id]
  if (bookmark) {
    if (info.title !== undefined && bookmark.title !== info.title) {
      bookmark.title = info.title
    }
    if (info.url !== undefined && bookmark.url !== info.url) {
      bookmark.url = info.url
      if (Bookmarks.reactive.byUrl[info.url]) {
        Bookmarks.reactive.byUrl[info.url].push(bookmark)
      } else {
        Bookmarks.reactive.byUrl[info.url] = [bookmark]
      }

      if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()
    }
  }
}

function onBookmarkMovedBg(id: ID, info: browser.bookmarks.MoveInfo): void {
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

  Bookmarks.saveBookmarksTree()
  Sidebar.recalcBookmarksPanels()

  if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()
}

function onBookmarkRemovedBg(id: ID, info: browser.bookmarks.RemoveInfo): void {
  Logs.info('Bookmarks.onBookmarkRemovedBg')

  const bookmark = Bookmarks.reactive.byId[id]
  if (!bookmark) return

  if (Sidebar.hasTrash && bookmark.type !== 'separator') {
    Trash.putBookmark(bookmark)
  }
}

function onBookmarkRemovedFg(id: ID, info: browser.bookmarks.RemoveInfo): void {
  if (!Bookmarks.reactive.tree.length) return

  const parent = Bookmarks.reactive.byId[info.parentId]
  const node = Bookmarks.reactive.byId[id]
  if (!node) return

  const url = node?.url
  if (parent?.children) {
    parent.children.splice(info.index, 1)
    for (let i = info.index; i < parent.children.length; i++) {
      parent.children[i].index = i
    }
  }

  delete Bookmarks.reactive.byId[id]
  if (url && Bookmarks.reactive.byUrl[url]) {
    const ib = Bookmarks.reactive.byUrl[url].findIndex(b => b.id === id)
    if (ib > -1) Bookmarks.reactive.byUrl[url].splice(ib, 1)
  }
  Sidebar.recalcBookmarksPanels()

  if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()
}
