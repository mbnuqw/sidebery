import EventBus from '../../event-bus'
import Utils from '../../utils'
import Logs from '../../logs'
import Actions from '.'

/**
 * Load bookmarks and restore tree state
 */
async function loadBookmarks(state) {
  EventBus.$emit('panelLoadingStart', 0)
  let bookmarks = await browser.bookmarks.getTree()
  if (!bookmarks || !bookmarks.length) {
    Logs.push('[ERROR] Cannot load bookmarks')
    EventBus.$emit('panelLoadingErr', 0)
  }

  // Normalize objects before vue
  state.bookmarksMap = {}
  state.bookmarksUrlMap = {}
  const walker = nodes => {
    for (let n of nodes) {
      state.bookmarksMap[n.id] = n
      if (n.type === 'bookmark') {
        n.host = n.url.split('/')[2]
        if (state.selOpenedBookmarks) {
          n.opened = !!state.tabs.find(t => t.url === n.url)
        } else {
          n.opened = false
        }
        if (state.bookmarksUrlMap[n.url]) {
          state.bookmarksUrlMap[n.url].push(n)
        } else {
          state.bookmarksUrlMap[n.url] = [n]
        }
      }
      if (n.type === 'folder') {
        n.expanded = false
        n.opened = false
      }
      if (n.children) walker(n.children)
    }
  }
  walker(bookmarks[0].children)

  // If not private, restore bookmarks tree
  if (!state.private) {
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

  state.bookmarks = bookmarks[0].children
  EventBus.$emit('panelLoadingOk', 0)

  Logs.push('[INFO] Bookmarks loaded')
}

/**
 * Save tree state
 */
async function saveBookmarksTree(state) {
  if (!state.windowFocused) return

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

  walker(state.bookmarks)
  await browser.storage.local.set({ expandedBookmarks })
}

/**
 * Reload bookmarks without restoring
 * prev state.
 */
async function reloadBookmarks(state) {
  EventBus.$emit('panelLoadingStart', 0)
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

    state.bookmarks = tree[0].children
    EventBus.$emit('panelLoadingOk', 0)
  } catch (err) {
    state.bookmarks = []
    EventBus.$emit('panelLoadingErr', 0)
  }
}

/**
 * Expand bookmark folder
 */
function expandBookmark(state, nodeId) {
  let done = false
  let isEmpty = false
  const expandPath = []
  const toFold = []
  const walker = nodes => {
    if (state.autoCloseBookmarks && nodes.find(c => c.id === nodeId)) {
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
  walker(state.bookmarks)

  let parent = { children: state.bookmarks }
  for (let i of expandPath) {
    parent = parent.children[i]
    parent.expanded = true
  }

  if (state.autoCloseBookmarks && !isEmpty) {
    for (let n of toFold) {
      n.expanded = false
    }
  }

  /* eslint-disable-next-line */
  state.bookmarks = state.bookmarks
  Actions.recalcPanelScroll(state)
  saveBookmarksTree(state)
}

/**
 * Fold bookmark folder
 */
function foldBookmark(state, nodeId) {
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
  walker(state.bookmarks)

  /* eslint-disable-next-line */
  state.bookmarks = state.bookmarks
  Actions.recalcPanelScroll(state)
  saveBookmarksTree(state)
}

/**
 * Drop to bookmarks panel
 */
async function dropToBookmarks(state, event, dropIndex, dropParent, nodes) {
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
        const tab = state.tabs.find(t => t.url === url)
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
function openBookmarksInNewWin(state, ids, incognito) {
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
  walker(state.bookmarks)

  return browser.windows.create({ url: urls, incognito })
}

/**
 * Open bookmarks
 */
async function openBookmarksInPanel(state, ids, panelId) {
  const pi = state.panels.findIndex(p => p.cookieStoreId === panelId)
  const p = state.panels[pi]
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
  walker(state.bookmarks)

  Actions.setPanel(state, pi)

  const idMap = []
  for (let node of toOpen) {
    const isDir = node.type === 'folder'
    if (isDir && !state.tabsTree) continue
    const createdTab = await browser.tabs.create({
      windowId: state.windowId,
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
function startBookmarkCreation(state, type, target) {
  let parentId
  if (target.type === 'bookmark') parentId = target.parentId
  if (target.type === 'folder') parentId = target.id

  if (type === 'separator') {
    browser.bookmarks.create({ parentId, type: 'separator', index: 0 })
    return
  }

  state.bookmarkEditorTarget = { type, parentId }
  state.bookmarkEditor = true
}

/**
 * Start bookmark editing
 */
function startBookmarkEditing(state, node) {
  state.bookmarkEditorTarget = node
  state.bookmarkEditor = true
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
function collapseAllBookmarks(state) {
  const walker = nodes => {
    for (let n of nodes) {
      if (n.type === 'folder') n.expanded = false
      if (n.children) walker(n.children)
    }
  }
  walker(state.bookmarks)
  saveBookmarksTree(state)
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