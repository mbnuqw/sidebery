/**
 * Load custom context menu
 */
async function loadCtxMenu() {
  let storage = await browser.storage.local.get([
    'tabsMenu',
    'tabsPanelMenu',
    'bookmarksMenu',
    'bookmarksPanelMenu',
  ]) || {}

  if (storage.tabsMenu && storage.tabsMenu.length) {
    this.state.tabsMenu = storage.tabsMenu
  }

  if (storage.tabsPanelMenu && storage.tabsPanelMenu.length) {
    this.state.tabsPanelMenu = storage.tabsPanelMenu
  }

  if (storage.bookmarksMenu && storage.bookmarksMenu.length) {
    this.state.bookmarksMenu = storage.bookmarksMenu
  }

  if (storage.bookmarksPanelMenu && storage.bookmarksPanelMenu.length) {
    this.state.bookmarksPanelMenu = storage.bookmarksPanelMenu
  }
}

export default {
  loadCtxMenu,
}