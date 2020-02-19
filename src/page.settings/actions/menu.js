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

  if (this.state.syncSaveCtxMenu) {
    let profileId = await this.actions.getProfileId()
    let value = {}

    if (this.state.tabsMenu) value.tabsMenu = this.state.tabsMenu
    if (this.state.tabsPanelMenu) value.tabsPanelMenu = this.state.tabsPanelMenu
    if (this.state.bookmarksMenu) value.bookmarksMenu = this.state.bookmarksMenu
    if (this.state.bookmarksPanelMenu) value.bookmarksPanelMenu = this.state.bookmarksPanelMenu
    value = Utils.cloneObject(value)

    browser.storage.sync.set({
      [profileId + '::ctxMenu']: { value, time: Date.now(), name: this.state.syncName },
    })
  }
}

export default {
  ...CommonActions,

  saveCtxMenu,
}
