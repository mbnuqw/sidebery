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
    const expandPath = []
    const walker = nodes => {
      if (state.autoCloseBookmarks && nodes.find(c => c.id === nodeId)) {
        nodes.map(c => c.expanded = false)
      }
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'folder') continue
        const n = nodes[i]

        if (!done && n.children) {
          expandPath.push(i)
          if (n.id === nodeId) {
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
    // Tabs or Bookmarks
    if (nodes && nodes.length) {
      if (nodes[0].type === 'bookmark' && !event.ctrlKey) {
        if (nodes[0].index === dropIndex) return
        if (nodes[0].parent === dropParent) {
          dropIndex = nodes[0].index > dropIndex ? dropIndex + 1 : dropIndex
        } else {
          dropIndex++
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
            parent: dropParent,
          })
        }
      }
    }

    // Native
    if (nodes === null) {
      if (!event.dataTransfer) return
    }
  },
}