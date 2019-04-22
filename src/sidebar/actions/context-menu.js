import State from '../store.state'
import { Translate } from '../../mixins/dict'

const OPTIONS = {
  // ---
  // -- General
  // -
  undoRmTab: () => ({ label: Translate('menu.tab.undo'), icon: 'icon_undo', action: 'undoRmTab' }),

  // ---
  // -- Tabs
  // -
  moveToNewWin: () => ({
    label: Translate('menu.tab.move_to_new_window'),
    icon: 'icon_new_win',
    action: 'moveTabsToNewWin',
    args: { tabIds: [...State.selected] },
  }),
  moveToNewPrivWin: () => ({
    label: Translate('menu.tab.move_to_new_priv_window'),
    icon: 'icon_private',
    action: 'moveTabsToNewWin',
    args: { tabIds: [...State.selected], incognito: true },
  }),
  moveToAnotherWin: () => {
    if (State.otherWindows.length !== 1) return
    return {
      label: Translate('menu.tab.move_to_another_window'),
      icon: 'icon_window',
      action: 'moveTabsToWin',
      args: { tabIds: [...State.selected], window: State.otherWindows[0] },
    }
  },
  moveToWin: () => {
    if (State.otherWindows.length <= 1) return
    return {
      label: Translate('menu.tab.move_to_window_'),
      icon: 'icon_windows',
      action: 'moveTabsToWin',
      args: { tabIds: [...State.selected] },
    }
  },
  moveToCtr: node => {
    if (State.private) return
    const opts = []

    if (node.cookieStoreId !== 'firefox-default') {
      opts.push({
        label: Translate('menu.tab.reopen_in_default_panel'),
        icon: 'icon_tabs',
        action: 'moveTabsToCtx',
        args: { tabIds: [...State.selected], ctxId: 'firefox-default' },
      })
    }

    for (let c of State.ctxs) {
      if (node.cookieStoreId === c.cookieStoreId) continue
      opts.push({
        label: Translate('menu.tab.reopen_in_') + `||${c.colorCode}>>${c.name}`,
        icon: c.icon,
        color: c.colorCode,
        action: 'moveTabsToCtx',
        args: { tabIds: [...State.selected], ctxId: c.cookieStoreId },
      })
    }

    return opts
  },
  pin: node => {
    const wut = node.pinned ? 'unpin' : 'pin'
    return {
      label: Translate('menu.tab.' + wut),
      icon: 'icon_pin',
      action: wut + 'Tabs',
      args: [...State.selected],
    }
  },
  reload: () => {
    return {
      label: Translate('menu.tab.reload'),
      icon: 'icon_reload',
      action: 'reloadTabs',
      args: [...State.selected],
    }
  },
  bookmark: () => {
    return {
      label: Translate('menu.tab.bookmark'),
      icon: 'icon_star',
      action: 'bookmarkTabs',
      args: [...State.selected],
    }
  },
  mute: node => {
    const wut = node.mutedInfo.muted ? 'unmute' : 'mute'
    return {
      label: Translate('menu.tab.' + wut),
      icon: node.mutedInfo.muted ? 'icon_loud_16' : 'icon_mute_16',
      action: wut + 'Tabs',
      args: [...State.selected],
    }
  },
  discard: node => {
    if (State.selected.length === 1) {
      if (node.active || node.discarded) return
    }
    return {
      label: Translate('menu.tab.discard'),
      icon: 'icon_discard',
      action: 'discardTabs',
      args: [...State.selected],
    }
  },
  group: node => {
    if (!State.tabsTree || node.pinned) return
    return {
      label: Translate('menu.tab.group'),
      icon: 'icon_group_tabs',
      action: 'groupTabs',
      args: [...State.selected],
    }
  },
  flatten: node => {
    if (State.selected.length <= 1) return
    if (State.selected.every(t => node.lvl === State.tabsMap[t].lvl)) return
    if (!State.tabsTree || node.pinned) return
    return {
      label: Translate('menu.tab.flatten'),
      icon: 'icon_flatten',
      action: 'flattenTabs',
      args: [...State.selected],
    }
  },
  clearCookies: () => {
    return {
      label: Translate('menu.tab.clear_cookies'),
      icon: 'icon_cookie',
      action: 'clearTabsCookies',
      args: [...State.selected],
    }
  },
  close: () => {
    if (State.selected.length <= 1) return
    return {
      label: Translate('menu.tab.close'),
      icon: 'icon_close',
      action: 'removeTabs',
      args: [...State.selected],
    }
  },

  // ---
  // -- Bookmarks
  // -
  openInNewWin: node => {
    if (node.type === 'separator') return
    return {
      label: Translate('menu.bookmark.open_in_new_window'),
      icon: 'icon_new_win',
      action: 'openBookmarksInNewWin',
      args: { ids: [...State.selected] },
    }
  },
  openInNewPrivWin: node => {
    if (node.type === 'separator') return
    return {
      label: Translate('menu.bookmark.open_in_new_priv_window'),
      icon: 'icon_private',
      action: 'openBookmarksInNewWin',
      args: { ids: [...State.selected], incognito: true },
    }
  },
  openInCtr: node => {
    if (node.type === 'separator') return
    const opts = []

    if (node.type === 'folder' || State.selected.length > 1) {
      opts.push({
        label: Translate('menu.bookmark.open_in_default_panel'),
        icon: 'icon_tabs',
        action: 'openBookmarksInPanel',
        args: { ids: [...State.selected] },
      })
    }

    if (!State.private) {
      for (let c of State.ctxs) {
        opts.push({
          label: Translate('menu.bookmark.open_in_') + `||${c.colorCode}>>${c.name}`,
          icon: c.icon,
          color: c.colorCode,
          action: 'openBookmarksInPanel',
          args: { ids: [...State.selected], panelId: c.cookieStoreId },
        })
      }
    }

    return opts
  },
  createBookmark: node => {
    if (node.type !== 'folder') return
    return {
      label: Translate('menu.bookmark.create_bookmark'),
      icon: 'icon_plus_b',
      action: 'startBookmarkCreation',
      args: { type: 'bookmark', target: node },
    }
  },
  createFolder: node => {
    if (node.type !== 'folder') return
    return {
      label: Translate('menu.bookmark.create_folder'),
      icon: 'icon_plus_f',
      action: 'startBookmarkCreation',
      args: { type: 'folder', target: node },
    }
  },
  createSeparator: node => {
    if (node.type !== 'folder') return
    return {
      label: Translate('menu.bookmark.create_separator'),
      icon: 'icon_plus_s',
      action: 'startBookmarkCreation',
      args: { type: 'separator', target: node },
    }
  },
  edit: node => {
    if (State.selected.length > 1) return
    if (node.type === 'separator') return
    if (node.parentId === 'root________') return
    return {
      label: Translate('menu.bookmark.edit_bookmark'),
      icon: 'icon_edit',
      action: 'startBookmarkEditing',
      args: node,
    }
  },
  delete: node => {
    if (node.parentId === 'root________') return
    return {
      label: Translate('menu.bookmark.delete_bookmark'),
      icon: 'icon_close',
      action: 'removeBookmarks',
      args: [...State.selected],
    }
  },
}

export default {
  /**
   * Load custom context menu
   */
  async loadCtxMenu({ state }) {
    let ans = await browser.storage.local.get(['tabsMenu', 'bookmarksMenu']) || {}

    if (ans.tabsMenu) state.tabsMenu = ans.tabsMenu
    if (ans.bookmarksMenu) state.bookmarksMenu = ans.bookmarksMenu
  },

  /**
   * Save context menu
   */
  async saveCtxMenu({ state }) {
    browser.storage.local.set({
      tabsMenu: JSON.parse(JSON.stringify(state.tabsMenu)),
      bookmarksMenu: JSON.parse(JSON.stringify(state.bookmarksMenu)),
    })
  },

  /**
   * Open panel with context menu builder
   */
  openCtxMenuBuilder({ state }) {
    if (state.panelIndex >= 0) state.lastPanelIndex = state.panelIndex
    state.panelIndex = -6
  },

  /**
   * Close context menu builder
   */
  closeCtxMenuBuilder({ state }) {
    state.lastPanelIndex = state.panelIndex
    state.panelIndex = state.lastPanelIndex
  },

  /**
   * Open context menu
   */
  async openCtxMenu({ state, commit }, { el, node } = {}) {
    const nodeType = typeof node.id === 'number' ? 'tab' : 'bookmark'
    const options = nodeType === 'tab' ? state.tabsMenu : state.bookmarksMenu

    state.otherWindows = (await browser.windows.getAll()).filter(w => w.id !== State.windowId)

    const inline = []
    let opts = []

    for (let optName of options) {
      if (optName instanceof Array) {
        let inlineMenu = []
        for (let iOpt of optName) {
          const option = OPTIONS[iOpt](node)
          if (option) inlineMenu = inlineMenu.concat(option)
        }
        inline.push(inlineMenu)
        continue
      }

      const option = OPTIONS[optName](node)
      if (option) opts = opts.concat(option)
    }

    state.ctxMenu = {
      el,
      inline,
      opts,
      off: () => commit('resetSelection'),
    }
  },
}
