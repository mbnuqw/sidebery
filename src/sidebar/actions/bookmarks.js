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
}