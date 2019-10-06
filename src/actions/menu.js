import Logs from '../logs'

/**
 * Load custom context menu
 */
async function loadCtxMenu() {
  let ans = await browser.storage.local.get([
    'tabsMenu',
    'tabsPanelMenu',
    'bookmarksMenu',
    'bookmarksPanelMenu'
  ]) || {}

  if (ans.tabsMenu && ans.tabsMenu.length) {
    this.state.tabsMenu = ans.tabsMenu
    Logs.push('[INFO] Tabs menu loaded')
  }

  if (ans.tabsPanelMenu && ans.tabsPanelMenu.length) {
    this.state.tabsPanelMenu = ans.tabsPanelMenu
    Logs.push('[INFO] Tabs panel menu loaded')
  }

  if (ans.bookmarksMenu && ans.bookmarksMenu.length) {
    this.state.bookmarksMenu = ans.bookmarksMenu
    Logs.push('[INFO] Bookmarks menu loaded')
  }

  if (ans.bookmarksPanelMenu && ans.bookmarksPanelMenu.length) {
    this.state.bookmarksPanelMenu = ans.bookmarksPanelMenu
    Logs.push('[INFO] Bookmarks panel menu loaded')
  }
}

export default {
  loadCtxMenu,
}