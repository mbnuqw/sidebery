import CommonActions from '../../actions/menu'

/**
 * Save context menu
 */
async function saveCtxMenu() {
  browser.storage.local.set({
    tabsMenu: JSON.parse(JSON.stringify(this.state.tabsMenu)),
    tabsPanelMenu: JSON.parse(JSON.stringify(this.state.tabsPanelMenu)),
    bookmarksMenu: JSON.parse(JSON.stringify(this.state.bookmarksMenu)),
    bookmarksPanelMenu: JSON.parse(JSON.stringify(this.state.bookmarksPanelMenu)),
  })
}

export default {
  ...CommonActions,

  saveCtxMenu,
}
