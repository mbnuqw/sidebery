import EventBus from '../event-bus'
import utils from '../../libs/utils'

export default {
  /**
   * Load bookmarks and restore tree state
   */
  async loadBookmarks({ state }) {
    EventBus.$emit('panelLoadingStart', 0)
    let bookmarks = []
    try {
      bookmarks = await browser.bookmarks.getTree()
    } catch (err) {
      EventBus.$emit('panelLoadingErr', 0)
    }

    // Normalize objects before vue
    const walker = nodes => {
      for (let n of nodes) {
        if (n.type === 'folder') n.expanded = false
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
    }

    state.bookmarks = bookmarks[0].children
    EventBus.$emit('panelLoadingOk', 0)
    EventBus.$emit('bookmarks.render')
  },

  /**
   * Save tree state
   */
  async saveTreeState({ state }) {
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
    await utils.Sleep(128)

    walker(state.bookmarks)
    await browser.storage.local.set({
      expandedBookmarks,
    })
  },

  /**
   * Reload bookmarks without restoring
   * prev state.
   */
  async reloadBookmarks({ state }) {
    EventBus.$emit('panelLoadingStart', 0)
    try {
      let tree = await browser.bookmarks.getTree()

      // Normalize objects before vue
      const walker = nodes => {
        for (let n of nodes) {
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
  },

  /**
   * Expand bookmark folder
   */
  expandBookmark({ state }, nodeId) {
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
  },

  /**
   * Fold bookmark folder
   */
  foldBookmark({ state }, nodeId) {
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
  },

  /**
   * Drop to bookmarks panel
   */
  async dropToBookmarks(_, { event, dropIndex, dropParent, nodes } = {}) {
    // console.log('[DEBUG] BOOKMARKS ACTION dropToBookmarks', dropIndex, dropParent);
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
      if (!event.dataTransfer) return

      let url, title
      for (let item of event.dataTransfer.items) {
        if (item.kind !== 'string') return

        if (item.type === 'text/x-moz-url-desc') item.getAsString(s => {
          title = s
          if (url) {
            browser.bookmarks.create({
              url: url,
              title: title,
              index: dropIndex,
              parentId: dropParent,
            })
          }
        })

        if (item.type === 'text/uri-list') item.getAsString(s => {
          url = s
          if (title) {
            browser.bookmarks.create({
              url: url,
              title: title,
              index: dropIndex,
              parentId: dropParent,
            })
          }
        })
      }
    }
  },

  /**
   * Open bookmarks in new window
   */
  openBookmarksInNewWin({ state }, { ids, incognito }) {
    const urls = []
    const walker = (nodes, ids) => {
      nodes.map(n => {
        if (
          n.type === 'bookmark' &&
          !n.url.indexOf('http') &&
          ids.includes(n.id)
        ) urls.push(n.url)
        if (n.type === 'folder') walker(n.children, ids)
      })
    }
    walker(state.bookmarks, ids)

    return browser.windows.create({ url: urls, incognito })
  },

  /**
   * Open bookmarks
   */
  openBookmarksInPanel({ state, getters }, { ids, panelId }) {
    const p = getters.panels.find(p => p.cookieStoreId === panelId)
    if (!p) return

    let index = p.endIndex + 1

    const urls = []
    const walker = nodes => {
      nodes.map(n => {
        if (
          n.type === 'bookmark' &&
          !n.url.indexOf('http') &&
          ids.includes(n.id)
        ) urls.push(n.url)
        if (n.type === 'folder') walker(n.children)
      })
    }
    walker(state.bookmarks)

    urls.map(url => {
      browser.tabs.create({
        index: index++,
        url: url,
        cookieStoreId: panelId,
      })
    })
  },

  /**
   * Start bookmark creation
   */
  startBookmarkCreation({ state }, { type, target }) {
    let parentId
    if (target.type === 'bookmark') parentId = target.parentId
    if (target.type === 'folder') parentId = target.id

    if (type === 'separator') {
      browser.bookmarks.create({ parentId, type: 'separator', index: 0 })
      return
    }

    state.bookmarkEditorTarget = { type, parentId }
    state.bookmarkEditor = true
  },

  /**
   * Start bookmark editing
   */
  startBookmarkEditing({ state }, node) {
    state.bookmarkEditorTarget = node
    state.bookmarkEditor = true
  },

  /**
   * Remove bookmarks
   */
  async removeBookmarks(_, ids) {
    for (let id of ids) {
      await browser.bookmarks.removeTree(id)
    }
  },
}
