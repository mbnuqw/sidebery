import CommonActions from '../../actions/menu'

/**
 * Save context menu
 */
async function saveCtxMenu() {
  browser.storage.local.set({
    tabsMenu: JSON.parse(JSON.stringify(this.state.tabsMenu)),
    bookmarksMenu: JSON.parse(JSON.stringify(this.state.bookmarksMenu)),
  })
}

export default {
  ...CommonActions,

  saveCtxMenu,
}
