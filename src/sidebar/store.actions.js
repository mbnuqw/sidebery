import EventBus from './event-bus'
import CtxMenu from './context-menu'
import Utils from '../libs/utils'
import { Translate } from  '../mixins/dict'
import SavedStateActions from './actions/saved-state'
import SettingsActions from './actions/settings'
import KeybindingsActions from './actions/keybindings'
import FaviconsActions from './actions/favicons'
import SyncActions from './actions/sync'
import PanelsActions from './actions/panels'
import TabsActions from './actions/tabs'
import Bookmarks from './actions/bookmarks'
import Snapshots from './actions/snapshots'
import Styles from './actions/styles'

export default {
  ...SavedStateActions,
  ...SettingsActions,
  ...KeybindingsActions,
  ...FaviconsActions,
  ...SyncActions,
  ...PanelsActions,
  ...TabsActions,
  ...Bookmarks,
  ...Snapshots,
  ...Styles,

  // --- --- --- Misc --- --- ---

  /**
   * Show windows choosing panel
   */
  async chooseWin({ state }) {
    state.winChoosing = []
    state.panelIndex = -5
    let wins = await browser.windows.getAll({ populate: true })
    wins = wins.filter(w => !w.focused)

    return new Promise(res => {
      wins = wins.map(async w => {
        let tab = w.tabs.find(t => t.active)
        if (!tab) return
        if (w.focused) return
        let screen = await browser.tabs.captureTab(tab.id)
        return {
          id: w.id,
          title: w.title,
          screen,
          choose: () => {
            state.winChoosing = null
            state.panelIndex = state.lastPanelIndex
            res(w.id)
          },
        }
      })

      Promise.all(wins).then(wins => {
        state.winChoosing = wins
      })
    })
  },

  /**
   * Breadcast recalc panel's scroll event.
   */
  recalcPanelScroll() {
    setTimeout(() => EventBus.$emit('recalcPanelScroll'), 33)
  },

  /**
   * Broadcast message to other parts of extension.
   */
  async broadcast(_, msg = {}) {
    browser.runtime.sendMessage(msg)
  },

  /**
   * Retrieve current permissions
   */
  async loadPermissions({ state, dispatch }) {
    const permsObj = await browser.permissions.getAll()
    state.permissions = [...permsObj.permissions, ...permsObj.origins]

    // Get optianal permissions state
    state.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
    state.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })
    if (state.hideInact) dispatch('hideInactPanelsTabs')
  },

  /**
   * Open context menu
   */
  async openCtxMenu({ state, commit, getters }, { el, node } = {}) {
    let nodesLen = state.selected.length
    let nodeType = typeof node.id === 'number' ? 'tab' : 'bookmark'
    const menu = new CtxMenu(el, () => commit('resetSelection'))
    const otherWindows = (await Utils.GetAllWindows()).filter(w => !w.current)

    // --- Tab
    // ------
    if (nodeType === 'tab' && nodesLen === 1) {
      // Move to new window
      let args = { tabIds: [node.id] }
      menu.add('tab.move_to_new_window', 'moveTabsToNewWin', args)

      // Move to new private window
      args = { tabIds: [node.id], incognito: true }
      menu.add('tab.move_to_new_priv_window', 'moveTabsToNewWin', args)

      // Move to another window
      if (otherWindows.length === 1) {
        const args = { tabIds: [node.id], window: otherWindows[0] }
        menu.add('tab.move_to_another_window', 'moveTabsToWin', args)
      }

      // Move to window...
      if (otherWindows.length > 1) {
        menu.add('tab.move_to_window_', 'moveTabsToWin', { tabIds: [node.id] })
      }

      // Default window
      if (!state.private) {
        // Reopen in containers
        if (node.cookieStoreId !== 'firefox-default') {
          const args = { tabIds: [node.id], ctxId: 'firefox-default'}
          menu.add('tab.reopen_in_default_panel', 'moveTabsToCtx', args)
        }
        state.ctxs.map(c => {
          if (node.cookieStoreId === c.cookieStoreId) return
          const args = { tabIds: [node.id], ctxId: c.cookieStoreId}
          const label = Translate('menu.tab.reopen_in_') + `||${c.colorCode}>>${c.name}`
          menu.addTranslated(label, 'moveTabsToCtx', args)
        })
      }

      if (!node.pinned) menu.add('tab.pin', 'pinTabs', [node.id])
      else menu.add('tab.unpin', 'unpinTabs', [node.id])
      if (!node.mutedInfo.muted) menu.add('tab.mute', 'muteTabs', [node.id])
      else menu.add('tab.unmute', 'unmuteTabs', [node.id])
      menu.add('tab.discard', 'discardTabs', [node.id])
      menu.add('tab.reload', 'reloadTabs', [node.id])
      menu.add('tab.duplicate', 'duplicateTabs', [node.id])
      menu.add('tab.clear_cookies', 'clearTabsCookies', [node.id])
    }

    // --- Tabs
    // ------
    if (nodeType === 'tab' && nodesLen > 1) {
      // Move to new window
      menu.add('tab.move_to_new_window', 'moveTabsToNewWin', { tabIds: state.selected })

      // Move to new private window
      let args = { tabIds: state.selected, incognito: true }
      menu.add('tab.move_to_new_priv_window', 'moveTabsToNewWin', args)

      // Move to another window
      if (otherWindows.length === 1) {
        const args = { tabIds: state.selected, window: otherWindows[0] }
        menu.add('tab.move_to_another_window', 'moveTabsToWin', args)
      }

      // Move to window...
      if (otherWindows.length > 1) {
        menu.add('tab.move_to_window_', 'moveTabsToWin', { tabIds: state.selected })
      }

      // Default window
      if (!state.private) {
        // Reopen in containers
        if (node.cookieStoreId !== 'firefox-default') {
          const args = { tabIds: state.selected, ctxId: 'firefox-default'}
          menu.add('tab.reopen_in_default_panel', 'moveTabsToCtx', args)
        }
        state.ctxs.map(c => {
          if (node.cookieStoreId === c.cookieStoreId) return
          const args = { tabIds: state.selected, ctxId: c.cookieStoreId}
          const label = Translate('menu.tab.reopen_in_') + `||${c.colorCode}>>${c.name}`
          menu.addTranslated(label, 'moveTabsToCtx', args)
        })
      }

      if (state.tabsTree) {
        menu.add('tab.group', 'groupTabs', state.selected)
        menu.add('tab.flatten', 'flattenTabs', state.selected)
      }

      if (state.panelIndex === 1) {
        menu.add('tab.unpin', 'unpinTabs', state.selected)
      } else {
        menu.add('tab.pin', 'pinTabs', state.selected)
      }
      menu.add('tab.discard', 'discardTabs', state.selected)
      menu.add('tab.bookmarks', 'bookmarkTabs', state.selected)
      menu.add('tab.reload', 'reloadTabs', state.selected)
      menu.add('tab.close', 'removeTabs', state.selected)
    }

    // --- Bookmark
    // ------
    if (nodeType === 'bookmark' && nodesLen === 1) {
      const isSeparator = node.type === 'separator'
      const isFolder = node.type === 'folder'
      const openPanLabel = Translate('menu.bookmark.open_in_')

      if (!isSeparator) {
        // Open in new window
        let args = { ids: state.selected }
        menu.add('bookmark.open_in_new_window', 'openBookmarksInNewWin', args)

        // Open in new private window
        args = { ids: state.selected, incognito: true }
        menu.add('bookmark.open_in_new_priv_window', 'openBookmarksInNewWin', args)

        //  Open
        if (isFolder) {
          args = { ids: state.selected, panelId: getters.defaultCtxId }
          menu.add('bookmark.open_in_default_panel', 'openBookmarksInPanel', args)
        }
        // Open in containers
        state.ctxs.map(c => {
          const label = openPanLabel + `||${c.colorCode}>>${c.name}`
          args = { ids: state.selected, panelId: c.cookieStoreId }
          menu.addTranslated(label, 'openBookmarksInPanel', args)
        })

        // Create bookmark
        if (isFolder) {
          args = { type: 'bookmark', target: node }
          menu.add('bookmark.create_bookmark', 'startBookmarkCreation', args)
          args = { type: 'folder', target: node }
          menu.add('bookmark.create_folder', 'startBookmarkCreation', args)
          args = { type: 'separator', target: node }
          menu.add('bookmark.create_separator', 'startBookmarkCreation', args)
        }

        // Edit
        menu.add('bookmark.edit_bookmark', 'startBookmarkEditing', node)
      }

      // Delete
      menu.add('bookmark.delete_bookmark', 'removeBookmarks', [node.id])
    }

    // --- Bookmarks
    // ------
    if (nodeType === 'bookmark' && nodesLen > 1) {
      const openPanLabel = Translate('menu.bookmark.open_in_')

      // Open in new window
      let args = { ids: state.selected }
      menu.add('bookmark.open_in_new_window', 'openBookmarksInNewWin', args)
      // Open in new private window
      args = { ids: state.selected, incognito: true }
      menu.add('bookmark.open_in_new_priv_window', 'openBookmarksInNewWin', args)
      // Open
      args = { ids: state.selected, panelId: getters.defaultCtxId }
      menu.add('bookmark.open_in_default_panel', 'openBookmarksInPanel', args)
      // Open in containers ...
      state.ctxs.map(c => {
        const label = openPanLabel + `||${c.colorCode}>>${c.name}`
        args = { ids: state.selected, panelId: c.cookieStoreId }
        menu.addTranslated(label, 'openBookmarksInPanel', args)
      })

      // Delete
      menu.add('bookmark.delete_bookmark', 'removeBookmarks', state.selected)
    }

    state.ctxMenu = menu
  },
}
