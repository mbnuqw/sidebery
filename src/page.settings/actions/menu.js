import CommonActions from '../../actions/menu'

/**
 * Save context menu
 */
async function saveCtxMenu(state) {
  browser.storage.local.set({
    tabsMenu: JSON.parse(JSON.stringify(state.tabsMenu)),
    bookmarksMenu: JSON.parse(JSON.stringify(state.bookmarksMenu)),
  })
}

export default {
  ...CommonActions,

  saveCtxMenu,
}
