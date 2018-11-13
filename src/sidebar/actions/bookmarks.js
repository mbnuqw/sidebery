export default {
  /**
   * Load bookmarks and restore tree state
   */
  async loadBookmarks({ state }) {
    const bookmarks = await browser.bookmarks.getTree()

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
  },
}