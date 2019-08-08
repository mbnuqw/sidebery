import Utils from '../../utils'
import Logs from '../../logs'
import Actions from '../actions'

/**
 * Load bookmarks and restore tree state
 */
async function loadBookmarks() {
  let panelIndex = this.state.panels.findIndex(p => p.bookmarks)
  this.state.panels[panelIndex].loading = true
  let bookmarks = await browser.bookmarks.getTree()
  if (!bookmarks || !bookmarks.length) {
    Logs.push('[ERROR] Cannot load bookmarks')
    this.state.panels[panelIndex].loading = 'err'
    setTimeout(() => {this.state.panels[panelIndex].loading = false}, 2000)
  }

  // Normalize objects before vue
  this.state.bookmarksMap = {}
  this.state.bookmarksUrlMap = {}
  let count = 0
  let walker = nodes => {
    for (let n of nodes) {
      count++
      this.state.bookmarksMap[n.id] = n
      n.sel = false
      if (n.type === 'bookmark') {
        n.host = n.url.split('/')[2]
        if (this.state.highlightOpenBookmarks) {
          n.isOpen = !!this.state.tabs.find(t => t.url === n.url)
        } else {
          n.isOpen = false
        }
        if (this.state.bookmarksUrlMap[n.url]) {
          this.state.bookmarksUrlMap[n.url].push(n)
        } else {
          this.state.bookmarksUrlMap[n.url] = [n]
        }
      }
      if (n.type === 'folder') {
        n.expanded = false
        n.isOpen = false
      }
      if (n.children) walker(n.children)
    }
  }
  walker(bookmarks[0].children)

  // If not private, restore bookmarks tree
  if (!this.state.private) {
    let ans = await browser.storage.local.get('expandedBookmarks')
    let expandedBookmarks = ans.expandedBookmarks
    if (expandedBookmarks) {
      expandedBookmarks.map(path => {
        let node = bookmarks[0]
        for (let i = 0; i < path.length; i++) {
          let id = path[i]
          let target = node.children.find(n => n.id === id)
          if (!target || !target.children) break
          target.expanded = true
          node = target
        }
      })
    }
    Logs.push('[INFO] Bookmarks tree state restored')
  }

  this.state.bookmarks = bookmarks[0].children
  this.state.bookmarksCount = count
  this.state.panels[panelIndex].loading = 'ok'
  setTimeout(() => {this.state.panels[panelIndex].loading = false}, 2000)

  Logs.push('[INFO] Bookmarks loaded')
}

/**
 * Save tree state
 */
async function saveBookmarksTree() {
  if (!this.state.windowFocused) return

  let expandedBookmarks = []
  let path = []
  const walker = nodes => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      if (n.children && n.expanded) {
        path.push(n.id)
        expandedBookmarks.push([...path])
        walker(n.children)
        path.pop()
      }
    }
  }

  // Wait a moment...
  await Utils.sleep(128)

  walker(this.state.bookmarks)
  await browser.storage.local.set({ expandedBookmarks })
}

/**
 * Reload bookmarks without restoring
 * prev state.
 */
async function reloadBookmarks() {
  let panel = this.state.panels.find(p => p.bookmarks)
  panel.loading = true

  try {
    let tree = await browser.bookmarks.getTree()

    // Normalize objects before vue
    const walker = nodes => {
      for (let n of nodes) {
        if (n.type === 'bookmark') n.host = n.url.split('/')[2]
        if (n.type === 'folder') n.expanded = false
        if (n.children) walker(n.children)
      }
    }
    walker(tree[0].children)

    this.state.bookmarks = tree[0].children
    panel.loading = 'ok'
    setTimeout(() => { panel.loading = false }, 2000)
  } catch (err) {
    this.state.bookmarks = []
    panel.loading = 'err'
    setTimeout(() => { panel.loading = false }, 2000)
  }
}

/**
 * Expand bookmark folder
 */
function expandBookmark(nodeId) {
  let done = false
  let isEmpty = false
  const expandPath = []
  const toFold = []
  const walker = nodes => {
    if (this.state.autoCloseBookmarks && nodes.find(c => c.id === nodeId)) {
      for (let n of nodes) {
        if (n.expanded) toFold.push(n)
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].type !== 'folder') continue
      const n = nodes[i]

      if (!done && n.children) {
        expandPath.push(i)
        if (n.id === nodeId) {
          isEmpty = !n.children.length
          done = true
          return
        }
        walker(n.children)
      }
    }
    if (!done) expandPath.pop()
  }
  walker(this.state.bookmarks)

  let parent = { children: this.state.bookmarks }
  for (let i of expandPath) {
    parent = parent.children[i]
    parent.expanded = true
  }

  if (this.state.autoCloseBookmarks && !isEmpty) {
    for (let n of toFold) {
      n.expanded = false
    }
  }

  /* eslint-disable-next-line */
  this.state.bookmarks = this.state.bookmarks
  Actions.recalcPanelScroll()
  Actions.saveBookmarksTree()
}

/**
 * Fold bookmark folder
 */
function foldBookmark(nodeId) {
  let done = false
  const walker = nodes => {
    for (let n of nodes) {
      if (n.id === nodeId) {
        n.expanded = false
        done = true
        return
      }

      if (!done && n.children) walker(n.children)
    }
  }
  walker(this.state.bookmarks)

  /* eslint-disable-next-line */
  this.state.bookmarks = this.state.bookmarks
  Actions.recalcPanelScroll()
  Actions.saveBookmarksTree()
}

/**
 * Drop to bookmarks panel
 */
async function dropToBookmarks(event, dropIndex, dropParent, nodes) {
  // Tabs or Bookmarks
  if (nodes && nodes.length) {
    const nodeType = nodes[0].type
    const isBookmarkNode =
      nodeType === 'bookmark' || nodeType === 'folder' || nodeType === 'separator'

    // Filter nested bookmarks
    if (isBookmarkNode) {
      let p
      const toDrop = []
      for (let n of nodes) {
        if (!p && n.type !== 'folder') toDrop.push(n)
        if (!p && n.type === 'folder') {
          toDrop.push(n)
          p = n.parentId
          continue
        }
        if (p && p === n.parentId) toDrop.push(n)
      }
      nodes = toDrop
    }

    if (isBookmarkNode && !event.ctrlKey) {
      if (nodes[0].parentId === dropParent) {
        if (nodes[0].index === dropIndex) return
        dropIndex = nodes[0].index > dropIndex ? dropIndex : dropIndex - 1
      }
      for (let b of nodes) {
        await browser.bookmarks.move(b.id, { parentId: dropParent, index: dropIndex })
      }
    } else {
      for (let n of nodes) {
        await browser.bookmarks.create({
          url: n.url,
          title: n.title,
          index: dropIndex,
          parentId: dropParent,
        })
      }
    }
  }

  // Native
  if (!nodes) {
    let [url, title] = await Promise.all([
      Utils.getUrlFromDragEvent(event),
      Utils.getDescFromDragEvent(event),
    ])

    if (url) {
      if (!title || title === url) {
        const tab = this.state.tabs.find(t => t.url === url)
        if (tab) title = tab.title
      }

      browser.bookmarks.create({
        url: url,
        title: title || url,
        index: dropIndex,
        parentId: dropParent,
      })
    }
  }
}

/**
 * Open bookmarks in new window
 */
function openBookmarksInNewWin(ids, incognito) {
  const urls = []
  const walker = nodes => {
    for (let node of nodes) {
      if (ids.includes(node.parentId)) {
        if (node.children) ids.push(node.id)
        if (node.url) urls.push(node.url)
      }
      if (node.url && ids.includes(node.id)) urls.push(node.url)
      if (node.children) walker(node.children)
    }
  }
  walker(this.state.bookmarks)

  return browser.windows.create({ url: urls, incognito })
}

/**
 * Open bookmarks
 */
async function openBookmarksInPanel(ids, panelId) {
  const p = this.state.panelsMap[panelId]
  if (!p) return

  let index = p.endIndex + 1

  const toOpen = []
  const walker = nodes => {
    for (let node of nodes) {
      if (node.type === 'separator') continue

      const isIt = ids.includes(node.id)
      const isChild = ids.includes(node.parentId)

      if (isIt || isChild) toOpen.push(node)
      if (isChild && node.type === 'folder') ids.push(node.id)

      if (node.children) walker(node.children)
    }
  }
  walker(this.state.bookmarks)

  Actions.setPanel(p.index)

  const idMap = []
  for (let node of toOpen) {
    const isDir = node.type === 'folder'
    if (isDir && !this.state.tabsTree) continue
    const createdTab = await browser.tabs.create({
      windowId: this.state.windowId,
      index: index++,
      url: node.url ? node.url : Utils.getGroupUrl(node.title),
      cookieStoreId: panelId,
      active: false,
      openerTabId: idMap[node.parentId],
    })
    if (isDir) idMap[node.id] = createdTab.id
  }
}

/**
 * Start bookmark creation
 */
function startBookmarkCreation(type, target) {
  let parentId
  if (target.type === 'bookmark') parentId = target.parentId
  if (target.type === 'folder') parentId = target.id

  if (type === 'separator') {
    browser.bookmarks.create({ parentId, type: 'separator', index: 0 })
    return
  }

  this.state.bookmarkEditorTarget = { type, parentId }
  this.state.bookmarkEditor = true
}

/**
 * Start bookmark editing
 */
function startBookmarkEditing(node) {
  this.state.bookmarkEditorTarget = node
  this.state.bookmarkEditor = true
}

/**
 * Remove bookmarks
 */
async function removeBookmarks(ids) {
  for (let id of ids) {
    await browser.bookmarks.removeTree(id)
  }
}

/**
 * Collapse all bookmarks folders
 */
function collapseAllBookmarks() {
  const walker = nodes => {
    for (let n of nodes) {
      if (n.type === 'folder') n.expanded = false
      if (n.children) walker(n.children)
    }
  }
  walker(this.state.bookmarks)
  Actions.saveBookmarksTree()
}

export default {
  loadBookmarks,
  saveBookmarksTree,
  reloadBookmarks,
  expandBookmark,
  foldBookmark,
  dropToBookmarks,
  openBookmarksInNewWin,
  openBookmarksInPanel,
  startBookmarkCreation,
  startBookmarkEditing,
  removeBookmarks,
  collapseAllBookmarks,
}