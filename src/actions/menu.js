import Logs from '../libs/logs'

/**
 * Load custom context menu
 */
async function loadCtxMenu(state) {
  let ans = await browser.storage.local.get(['tabsMenu', 'bookmarksMenu']) || {}

  if (ans.tabsMenu) {
    state.tabsMenu = ans.tabsMenu
    Logs.push('[INFO] Tabs menu loaded')
  }
  if (ans.bookmarksMenu) {
    state.bookmarksMenu = ans.bookmarksMenu
    Logs.push('[INFO] Bookmarks menu loaded')
  }
}

export default {
  loadCtxMenu,
}