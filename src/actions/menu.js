/**
 * Load custom context menu
 */
async function loadCtxMenu() {
  let props = ['tabsMenu', 'tabsPanelMenu', 'bookmarksMenu', 'bookmarksPanelMenu']
  let storage = await browser.storage.local.get(props)

  if (storage.tabsMenu && storage.tabsMenu.length) {
    let resave = false
    let toCheck = [storage.tabsMenu]
    for (let opt of storage.tabsMenu) {
      if (opt instanceof Array) toCheck.push(opt)
    }

    for (let checkList of toCheck) {
      for (let i = 0; i < checkList.length; i++) {
        if (checkList[i] === 'moveToCtr') {
          resave = true
          checkList.splice(i, 1, 'reopenInNewWin', 'reopenInWin', 'reopenInCtr')
        }
        if (checkList[i] === 'moveToNewPrivWin') {
          resave = true
          checkList.splice(i, 1)
        }
        if (checkList[i] === 'moveToAnotherWin') {
          resave = true
          checkList.splice(i, 1)
        }
      }
    }

    this.state.tabsMenu = storage.tabsMenu
    if (resave) this.actions.saveCtxMenu()
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
  loadCtxMenu,
  saveCtxMenu,
}
