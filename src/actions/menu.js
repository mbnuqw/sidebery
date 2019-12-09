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
  }

  if (ans.tabsPanelMenu && ans.tabsPanelMenu.length) {
    this.state.tabsPanelMenu = ans.tabsPanelMenu
  }

  if (ans.bookmarksMenu && ans.bookmarksMenu.length) {
    this.state.bookmarksMenu = ans.bookmarksMenu
  }

  if (ans.bookmarksPanelMenu && ans.bookmarksPanelMenu.length) {
    this.state.bookmarksPanelMenu = ans.bookmarksPanelMenu
  }
}

export default {
  loadCtxMenu,
}