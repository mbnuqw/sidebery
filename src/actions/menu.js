import Logs from '../logs'

/**
 * Load custom context menu
 */
async function loadCtxMenu() {
  let ans = await browser.storage.local.get(['tabsMenu', 'bookmarksMenu']) || {}

  if (ans.tabsMenu) {
    this.state.tabsMenu = ans.tabsMenu
    Logs.push('[INFO] Tabs menu loaded')
  }
  if (ans.bookmarksMenu) {
    this.state.bookmarksMenu = ans.bookmarksMenu
    Logs.push('[INFO] Bookmarks menu loaded')
  }
}

export default {
  loadCtxMenu,
}