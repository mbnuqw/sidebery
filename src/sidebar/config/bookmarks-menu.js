import State from '../store/state'
import { translate } from '../../mixins/dict'

export const DEFAULT_BOOKMARKS_MENU = [
  'openInNewWin',
  'openInNewPrivWin',
  'openInCtr',
  'createBookmark',
  'createFolder',
  'createSeparator',
  'edit',
  'delete',
]

export default {
  openInNewWin: node => {
    if (node.type === 'separator') return
    return {
      label: translate('menu.bookmark.open_in_new_window'),
      icon: 'icon_new_win',
      action: 'openBookmarksInNewWin',
      args: [State.selected],
    }
  },

  openInNewPrivWin: node => {
    if (node.type === 'separator') return
    return {
      label: translate('menu.bookmark.open_in_new_priv_window'),
      icon: 'icon_private',
      action: 'openBookmarksInNewWin',
      args: [State.selected, true],
    }
  },

  openInCtr: node => {
    if (node.type === 'separaztor') return
    const opts = []

    if (node.type === 'folder' || State.selected.length > 1) {
      opts.push({
        label: translate('menu.bookmark.open_in_default_panel'),
        icon: 'icon_tabs',
        action: 'openBookmarksInPanel',
        args: [State.selected, State.defaultCtxId],
      })
    }

    if (!State.private) {
      for (let c of State.containers) {
        opts.push({
          label: translate('menu.bookmark.open_in_') + `||${c.colorCode}>>${c.name}`,
          icon: c.icon,
          color: c.colorCode,
          action: 'openBookmarksInPanel',
          args: [State.selected, c.cookieStoreId],
        })
      }
    }

    return opts
  },

  createBookmark: node => {
    if (node.type !== 'folder') return
    return {
      label: translate('menu.bookmark.create_bookmark'),
      icon: 'icon_plus_b',
      action: 'startBookmarkCreation',
      args: ['bookmark', node],
    }
  },

  createFolder: node => {
    if (node.type !== 'folder') return
    return {
      label: translate('menu.bookmark.create_folder'),
      icon: 'icon_plus_f',
      action: 'startBookmarkCreation',
      args: ['folder', node],
    }
  },

  createSeparator: node => {
    if (node.type !== 'folder') return
    return {
      label: translate('menu.bookmark.create_separator'),
      icon: 'icon_plus_s',
      action: 'startBookmarkCreation',
      args: ['separator', node],
    }
  },

  edit: node => {
    if (State.selected.length > 1) return
    if (node.type === 'separator') return
    if (node.parentId === 'root________') return
    return {
      label: translate('menu.bookmark.edit_bookmark'),
      icon: 'icon_edit',
      action: 'startBookmarkEditing',
      args: [node],
    }
  },

  delete: node => {
    if (node.parentId === 'root________') return
    return {
      label: translate('menu.bookmark.delete_bookmark'),
      icon: 'icon_close',
      action: 'removeBookmarks',
      args: [State.selected],
    }
  },
}
