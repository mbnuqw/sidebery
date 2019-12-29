/**
 * Handle creating bookmark
 */
function onBookmarkCreated(id, bookmark) {
  if (!this.state.bookmarks.length) return

  bookmark.sel = false
  bookmark.isOpen = false
  if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []
  if (bookmark.type === 'folder') bookmark.expanded = false
  if (this.state.highlightOpenBookmarks && bookmark.url) {
    bookmark.isOpen = !!this.state.tabs.find(t => t.url === bookmark.url)
  }

  const parent = this.state.bookmarksMap[bookmark.parentId]
  if (parent && parent.children) {
    parent.children.splice(bookmark.index, 0, bookmark)
    for (let i = bookmark.index + 1; i < parent.children.length; i++) {
      parent.children[i].index++
    }
  }

  this.state.bookmarksCount++
  this.state.bookmarksMap[id] = bookmark
  if (bookmark.url) {
    if (this.state.bookmarksUrlMap[bookmark.url]) {
      this.state.bookmarksUrlMap[bookmark.url].push(bookmark)
    } else {
      this.state.bookmarksUrlMap[bookmark.url] = [bookmark]
    }
  }
}

/**
 * Handle bookmark change
 */
function onBookmarkChanged(id, info) {
  if (!this.state.bookmarks.length) return

  const oldUrl = this.state.bookmarksMap[id].url
  if (oldUrl !== info.url && this.state.bookmarksUrlMap[oldUrl]) {
    const iob = this.state.bookmarksUrlMap[oldUrl].findIndex(b => b.id === id)
    if (iob > -1) this.state.bookmarksUrlMap[oldUrl].splice(iob, 1)
  }

  const bookmark = this.state.bookmarksMap[id]
  if (bookmark) {
    if (info.title !== undefined && bookmark.title !== info.title) {
      bookmark.title = info.title
    }
    if (info.url !== undefined && bookmark.url !== info.url) {
      bookmark.url = info.url
      if (this.state.bookmarksUrlMap[info.url]) {
        this.state.bookmarksUrlMap[info.url].push(bookmark)
      } else {
        this.state.bookmarksUrlMap[info.url] = [bookmark]
      }
    }
  }
}

/**
 * Handle moving bookmark
 */
function onBookmarkMoved(id, info) {
  if (!this.state.bookmarks.length) return

  const oldParent = this.state.bookmarksMap[info.oldParentId]
  const newParent = this.state.bookmarksMap[info.parentId]

  if (oldParent && newParent) {
    const node = oldParent.children.splice(info.oldIndex, 1)[0]
    for (let i = info.oldIndex; i < oldParent.children.length; i++) {
      oldParent.children[i].index--
    }

    node.index = info.index
    node.parentId = info.parentId

    newParent.children.splice(node.index, 0, node)
    for (let i = info.index + 1; i < newParent.children.length; i++) {
      newParent.children[i].index++
    }
  }

  this.actions.saveBookmarksTree()
}

/**
 * Handle removing bookmark node
 */
function onBookmarkRemoved(id, info) {
  if (!this.state.bookmarks.length) return

  const parent = this.state.bookmarksMap[info.parentId]
  const node = this.state.bookmarksMap[id]
  const url = node ? node.url : undefined
  if (parent) {
    parent.children.splice(info.index, 1)
    for (let i = info.index; i < parent.children.length; i++) {
      parent.children[i].index--
    }
  }

  this.actions.updateBookmarksCounter()
  this.state.bookmarksMap[id] = undefined
  if (url && this.state.bookmarksUrlMap[url]) {
    const ib = this.state.bookmarksUrlMap[url].findIndex(b => b.id === id)
    if (ib > -1) this.state.bookmarksUrlMap[url].splice(ib, 1)
  }
}

/**
 * Setup listeners
 */
function setupBookmarksListeners() {
  browser.bookmarks.onCreated.addListener(this.handlers.onBookmarkCreated)
  browser.bookmarks.onChanged.addListener(this.handlers.onBookmarkChanged)
  browser.bookmarks.onMoved.addListener(this.handlers.onBookmarkMoved)
  browser.bookmarks.onRemoved.addListener(this.handlers.onBookmarkRemoved)
}

/**
 * Reset listeners
 */
function resetBookmarksListeners() {
  browser.bookmarks.onCreated.removeListener(this.handlers.onBookmarkCreated)
  browser.bookmarks.onChanged.removeListener(this.handlers.onBookmarkChanged)
  browser.bookmarks.onMoved.removeListener(this.handlers.onBookmarkMoved)
  browser.bookmarks.onRemoved.removeListener(this.handlers.onBookmarkRemoved)
}

export default {
  onBookmarkCreated,
  onBookmarkChanged,
  onBookmarkMoved,
  onBookmarkRemoved,
  setupBookmarksListeners,
  resetBookmarksListeners,
}
