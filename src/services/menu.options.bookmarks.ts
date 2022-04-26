import { isBookmarksPanel, isTabsPanel } from 'src/utils'
import { BKM_ROOT_ID, CONTAINER_ID } from 'src/defaults'
import { MenuOption } from 'src/types'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Search } from './search'

export const bookmarksMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  openInNewWin: () => {
    const allSeparators = Selection.get().every(id => {
      return Bookmarks.reactive.byId[id]?.type === 'separator'
    })
    const option: MenuOption = {
      label: translate('menu.bookmark.open_in_new_window'),
      icon: 'icon_new_win',
      onClick: () => Bookmarks.openInNewWindow(Selection.get()),
    }
    if (allSeparators) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInNewPrivWin: () => {
    const allSeparators = Selection.get().every(id => {
      return Bookmarks.reactive.byId[id]?.type === 'separator'
    })
    const option: MenuOption = {
      label: translate('menu.bookmark.open_in_new_priv_window'),
      icon: 'icon_new_priv_win',
      onClick: () => Bookmarks.openInNewWindow(Selection.get(), true),
    }
    if (allSeparators) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInNewPanel: () => {
    const allSeparators = Selection.get().every(id => {
      return Bookmarks.reactive.byId[id]?.type === 'separator'
    })
    const option: MenuOption = {
      label: translate('menu.bookmark.open_in_new_panel'),
      icon: 'icon_add_tabs_panel',
      onClick: () => Bookmarks.openInNewPanel(Selection.get()),
      onAltClick: () => Bookmarks.convertIntoTabsPanel(Selection.getFirst()),
    }
    if (allSeparators) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInPanel: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const allSeparators = Selection.get().every(id => {
      return Bookmarks.reactive.byId[id]?.type === 'separator'
    })
    if (allSeparators && !Settings.reactive.ctxMenuRenderInact) return
    const opts: MenuOption[] = []

    for (const p of Sidebar.reactive.panels) {
      if (!isTabsPanel(p)) continue
      opts.push({
        label: translate('menu.bookmark.open_in_') + p.name,
        icon: p.iconSVG,
        img: p.iconIMG,
        color: p.color,
        inactive: allSeparators,
        onClick: () => Bookmarks.open(Selection.get(), { panelId: p.id }),
      })
    }

    return opts
  },

  openInCtr: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const allSeparators = Selection.get().every(id => {
      return Bookmarks.reactive.byId[id]?.type === 'separator'
    })
    if (allSeparators && !Settings.reactive.ctxMenuRenderInact) return
    const opts: MenuOption[] = []

    if (node.type === 'folder' || Selection.getLength() > 1) {
      opts.push({
        label: translate('menu.bookmark.open_in_default_ctr'),
        icon: 'icon_ffm',
        inactive: allSeparators,
        onClick: () => Bookmarks.open(Selection.get(), { containerId: CONTAINER_ID }),
      })
    }

    if (!Windows.incognito) {
      const ignoreRules = Menu.ctxMenuIgnoreContainersRules
      for (const c of Object.values(Containers.reactive.byId)) {
        if (ignoreRules?.[c.id]) continue
        opts.push({
          label: translate('menu.bookmark.open_in_') + c.name,
          icon: c.icon,
          color: c.color,
          inactive: allSeparators,
          onClick: () => Bookmarks.open(Selection.get(), { containerId: c.id }),
        })
      }
    }

    return opts
  },

  createBookmark: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.create_bookmark'),
      icon: 'icon_create_bookmark',
      onClick: () => Bookmarks.createBookmarkNode('bookmark', node),
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  createFolder: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.create_folder'),
      icon: 'icon_create_folder',
      onClick: () => Bookmarks.createBookmarkNode('folder', node),
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  createSeparator: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.create_separator'),
      icon: 'icon_create_separator',
      onClick: () => Bookmarks.createBookmarkNode('separator', node),
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByNameAscending: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_name_asc'),
      icon: 'icon_sort_name_asc',
      onClick: () => Bookmarks.sortBookmarks('name', Selection.get(), 1),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') option.inactive = true
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByNameDescending: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_name_des'),
      icon: 'icon_sort_name_des',
      onClick: () => Bookmarks.sortBookmarks('name', Selection.get(), -1),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') option.inactive = true
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByLinkAscending: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_link_asc'),
      icon: 'icon_sort_url_asc',
      onClick: () => Bookmarks.sortBookmarks('link', Selection.get(), 1),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByLinkDescending: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_link_des'),
      icon: 'icon_sort_url_des',
      onClick: () => Bookmarks.sortBookmarks('link', Selection.get(), -1),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByTime: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_time'),
      icon: 'icon_sort_time',
      onClick: () => Bookmarks.sortBookmarks('time', Selection.get()),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByTimeAscending: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_time_asc'),
      icon: 'icon_sort_time_asc',
      onClick: () => Bookmarks.sortBookmarks('time', Selection.get(), 1),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByTimeDescending: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_time_des'),
      icon: 'icon_sort_time_des',
      onClick: () => Bookmarks.sortBookmarks('time', Selection.get(), -1),
    }
    if (Selection.getLength() === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (Search.reactive.value) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  edit: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.edit_bookmark'),
      icon: 'icon_edit',
      onClick: () => Bookmarks.editBookmarkNode(node),
    }
    if (Selection.getLength() > 1) option.inactive = true
    if (node.type === 'separator') option.inactive = true
    if (node.parentId === 'root________') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  delete: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.delete_bookmark'),
      icon: 'icon_close',
      onClick: () => Bookmarks.removeBookmarks(Selection.get()),
    }
    if (node.parentId === 'root________') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openAsBookmarksPanel: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.open_as_bookmarks_panel'),
      icon: 'icon_bookmarks',
      onClick: () => Bookmarks.openAsBookmarksPanel(node),
    }

    if (node.type !== 'folder') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openAsTabsPanel: () => {
    const node = Bookmarks.reactive.byId[Selection.getFirst()]
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.open_as_tabs_panel'),
      icon: 'icon_tabs',
      onClick: () => Bookmarks.openAsTabsPanel(node),
    }

    if (node.type !== 'folder') option.inactive = true
    // if (node.parentId === 'root________') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyBookmarksUrls: () => {
    const selected = Selection.get()
    const firstNode = Bookmarks.reactive.byId[selected[0]]
    const option: MenuOption = {
      label: translate('menu.copy_urls', selected.length),
      icon: 'icon_link',
      badge: 'icon_copy_badge',
      onClick: () => Bookmarks.copyUrls(selected),
    }

    if (selected.length === 1 && firstNode?.type === 'separator') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyBookmarksTitles: () => {
    const selected = Selection.get()
    const firstNode = Bookmarks.reactive.byId[selected[0]]
    const option: MenuOption = {
      label: translate('menu.copy_titles', selected.length),
      icon: 'icon_title',
      badge: 'icon_copy_badge',
      onClick: () => Bookmarks.copyTitles(selected),
    }

    if (selected.length === 1 && firstNode?.type === 'separator') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  moveBookmarksTo: () => {
    const ids = Selection.get()
    const option: MenuOption = {
      label: translate('menu.bookmark.move_to'),
      icon: 'icon_move',
      onClick: () => Bookmarks.move(ids, {}),
    }

    if (ids.some(id => Bookmarks.reactive.byId[id]?.parentId === BKM_ROOT_ID)) {
      option.inactive = true
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  // ---
  // -- Panel options
  // -

  collapseAllFolders: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!panel || !Bookmarks.reactive.tree.length) return

    const option: MenuOption = {
      label: translate('menu.bookmark.collapse_all'),
      icon: 'icon_collapse_all',
      onClick: () => Bookmarks.collapseAllBookmarks(panel.id),
    }
    if (isBookmarksPanel(panel) && panel.viewMode !== 'tree') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  switchViewMode: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!isBookmarksPanel(panel) || !Bookmarks.reactive.tree.length) return

    const isTree = panel.viewMode === 'tree'
    let label: string
    if (panel.viewMode === 'tree') label = translate('menu.bookmark.switch_view_history')
    else label = translate('menu.bookmark.switch_view_tree')

    translate('menu.bookmark.switch_view_tree')
    const option: MenuOption = {
      label,
      icon: isTree ? 'icon_clock' : 'icon_tree_struct',
      onClick: () => Sidebar.setViewMode(panel, isTree ? 'history' : 'tree'),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  convertToTabsPanel: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!isBookmarksPanel(panel) || !Bookmarks.reactive.tree.length) return

    const option: MenuOption = {
      label: translate('menu.bookmark.convert_to_tabs_panel'),
      icon: 'icon_tabs',
      badge: 'icon_reopen',
      onClick: () => Sidebar.convertToTabsPanel(panel),
    }

    if (panel.rootId === BKM_ROOT_ID) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },
}
