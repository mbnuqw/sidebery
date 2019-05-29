import State from '../store/state'
import { Translate } from '../../mixins/dict'

export default {
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
        args: [ State, State.selected, State.defaultCtxId ],
      })
    }

    if (!State.private) {
      for (let c of State.containers) {
        opts.push({
          label: Translate('menu.bookmark.open_in_') + `||${c.colorCode}>>${c.name}`,
          icon: c.icon,
          color: c.colorCode,
          action: 'openBookmarksInPanel',
          args: [ State, State.selected, c.cookieStoreId ],
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
