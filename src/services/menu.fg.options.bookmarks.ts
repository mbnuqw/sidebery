import { isBookmarksPanel, isTabsPanel } from 'src/utils'
import { BKM_OTHER_ID, BKM_ROOT_ID, CONTAINER_ID, NOID } from 'src/defaults'
import { MenuOption } from 'src/types'
import { BkmType } from 'src/enums'
import { translate } from 'src/dict'
import * as Settings from 'src/services/settings'
import * as Windows from 'src/services/windows.fg'
import * as Selection from 'src/services/selection.fg'
import * as Containers from 'src/services/containers'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Menu from 'src/services/menu.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Search from 'src/services/search.fg'
import * as Logs from 'src/services/logs'

export const bookmarksMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  openInNewWin: () => {
    const allSeparators = Selection.ids().every(id => {
      return Bookmarks.byId.get(id)?.type === BkmType.Separator
    })
    const option: MenuOption = {
      label: translate('menu.bookmark.open_in_new_window'),
      icon: 'icon_new_win',
      onClick: () => Bookmarks.openInNewWindow(Selection.ids()),
    }
    if (allSeparators) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInNewPrivWin: () => {
    const allSeparators = Selection.ids().every(id => {
      return Bookmarks.byId.get(id)?.type === BkmType.Separator
    })
    const option: MenuOption = {
      label: translate('menu.bookmark.open_in_new_priv_window'),
      icon: 'icon_new_priv_win',
      onClick: () => Bookmarks.openInNewWindow(Selection.ids(), true),
    }
    if (allSeparators) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInNewPanel: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return

    const allSeparators = Selection.ids().every(id => {
      return Bookmarks.byId.get(id)?.type === BkmType.Separator
    })
    const option: MenuOption = {
      label: translate('menu.bookmark.open_in_new_panel'),
      icon: 'icon_add_tabs_panel',
      onClick: () => Bookmarks.openInNewPanel(Selection.ids()),
      onAltClick: () => Bookmarks.openAsTabsPanel(node, false),
    }
    if (allSeparators) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInPanel: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const allSeparators = Selection.ids().every(id => {
      return Bookmarks.byId.get(id)?.type === BkmType.Separator
    })
    if (allSeparators && !Settings.state.ctxMenuRenderInact) return
    const opts: MenuOption[] = []

    for (const p of Sidebar.panels) {
      if (!isTabsPanel(p)) continue
      opts.push({
        label: translate('menu.bookmark.open_in_') + p.name,
        icon: p.iconSVG,
        img: p.iconIMG,
        color: p.color,
        inactive: allSeparators,
        onClick: () => Bookmarks.open(Selection.ids(), { panelId: p.id }),
      })
    }

    return opts
  },

  openInCtr: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const allSeparators = Selection.ids().every(id => {
      return Bookmarks.byId.get(id)?.type === BkmType.Separator
    })
    if (allSeparators && !Settings.state.ctxMenuRenderInact) return
    const opts: MenuOption[] = []

    if (node.type === BkmType.Folder || Selection.getLength() > 1) {
      opts.push({
        label: translate('menu.bookmark.open_in_default_ctr'),
        icon: 'icon_ffm',
        inactive: allSeparators,
        onClick: () => Bookmarks.open(Selection.ids(), { containerId: CONTAINER_ID }),
      })
    }

    if (!Windows.incognito) {
      const ignoreRules = Menu.ctxMenuIgnoreContainersRules
      for (const c of Containers.sortContainers(Object.values(Containers.reactive.byId))) {
        if (ignoreRules?.[c.id]) continue
        opts.push({
          label: translate('menu.bookmark.open_in_') + c.name,
          icon: c.icon,
          color: c.color,
          inactive: allSeparators,
          onClick: () => Bookmarks.open(Selection.ids(), { containerId: c.id }),
        })
      }
    }

    return opts
  },

  createBookmark: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.create_bookmark'),
      icon: 'icon_create_bookmark',
      onClick: () => Bookmarks.createBookmarkNode('bookmark', node),
    }
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  createFolder: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.create_folder'),
      icon: 'icon_create_folder',
      onClick: () => Bookmarks.createBookmarkNode('folder', node),
    }
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  createSeparator: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.create_separator'),
      icon: 'icon_create_separator',
      onClick: () => Bookmarks.createBookmarkNode('separator', node),
    }
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByNameAscending: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_name_asc'),
      icon: 'icon_sort_name_asc',
      onClick: () => Bookmarks.sortBookmarks('name', Selection.ids(), 1),
    }
    if (Selection.getLength() === 1 && node.type !== BkmType.Folder) option.inactive = true
    if (Search.active) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByNameDescending: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_name_des'),
      icon: 'icon_sort_name_des',
      onClick: () => Bookmarks.sortBookmarks('name', Selection.ids(), -1),
    }
    if (Selection.getLength() === 1 && node.type !== BkmType.Folder) option.inactive = true
    if (Search.active) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByLinkAscending: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_link_asc'),
      icon: 'icon_sort_url_asc',
      onClick: () => Bookmarks.sortBookmarks('link', Selection.ids(), 1),
    }
    if (Selection.getLength() === 1 && node.type !== BkmType.Folder) {
      option.inactive = true
    }
    if (Search.active) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByLinkDescending: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_link_des'),
      icon: 'icon_sort_url_des',
      onClick: () => Bookmarks.sortBookmarks('link', Selection.ids(), -1),
    }
    if (Selection.getLength() === 1 && node.type !== BkmType.Folder) {
      option.inactive = true
    }
    if (Search.active) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByTimeAscending: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_time_asc'),
      icon: 'icon_sort_time_asc',
      onClick: () => Bookmarks.sortBookmarks('time', Selection.ids(), 1),
    }
    if (Selection.getLength() === 1 && node.type !== BkmType.Folder) {
      option.inactive = true
    }
    if (Search.active) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByTimeDescending: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.sort_by_time_des'),
      icon: 'icon_sort_time_des',
      onClick: () => Bookmarks.sortBookmarks('time', Selection.ids(), -1),
    }
    if (Selection.getLength() === 1 && node.type !== BkmType.Folder) {
      option.inactive = true
    }
    if (Search.active) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  edit: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.edit_bookmark'),
      icon: 'icon_edit',
      onClick: () => Bookmarks.editBookmarkNode(node),
    }
    if (Selection.getLength() > 1) option.inactive = true
    if (node.type === BkmType.Separator) option.inactive = true
    if (node.parentId === 'root________') option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  delete: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return
    const option: MenuOption = {
      label: translate('menu.bookmark.delete_bookmark'),
      icon: 'icon_close',
      onClick: () => Bookmarks.removeBookmarks(Selection.ids()),
    }
    if (node.parentId === 'root________') option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openAsBookmarksPanel: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.open_as_bookmarks_panel'),
      icon: 'icon_bookmarks',
      onClick: () => Bookmarks.openAsBookmarksPanel(node),
    }

    if (node.type !== BkmType.Folder) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openAsTabsPanel: () => {
    const node = Bookmarks.byId.get(Selection.getFirst())
    if (!node) return

    const option: MenuOption = {
      label: translate('menu.bookmark.open_as_tabs_panel'),
      icon: 'icon_tabs',
      onClick: () => Bookmarks.openAsTabsPanel(node, true),
    }

    if (node.type !== BkmType.Folder) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyBookmarksUrls: () => {
    const selected = Selection.ids()
    const firstNode = Bookmarks.byId.get(selected[0])
    let len = selected.length
    if (firstNode?.children?.length) len += firstNode.children.length
    const option: MenuOption = {
      label: translate('menu.copy_urls', len),
      icon: 'icon_link',
      badge: 'icon_copy_badge',
      onClick: () => Bookmarks.copy(selected, { str: '%B%U', hasU: true, hasB: true }),
    }

    if (selected.length === 1 && firstNode?.type === BkmType.Separator) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyBookmarksTitles: () => {
    const selected = Selection.ids()
    const firstNode = Bookmarks.byId.get(selected[0])
    let len = selected.length
    if (firstNode?.children?.length) len += firstNode.children.length
    const option: MenuOption = {
      label: translate('menu.copy_titles', len),
      icon: 'icon_title',
      badge: 'icon_copy_badge',
      onClick: () => Bookmarks.copy(selected, { str: '%B%CT', hasCT: true, hasB: true }),
    }

    if (selected.length === 1 && firstNode?.type === BkmType.Separator) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyBookmarksByTemplates: () => {
    const opts: MenuOption[] = []
    const selected = Selection.ids()
    const firstNode = Bookmarks.byId.get(selected[0])
    const inactive = selected.length === 1 && firstNode?.type === BkmType.Separator
    if (!Settings.state.ctxMenuRenderInact && inactive) return

    for (const t of Settings.copyTemplates) {
      opts.push({
        label: translate('menu.copy_by_template', t.name ?? ''),
        icon: 'icon_code',
        badge: 'icon_copy_badge',
        inactive,
        onClick: () => Bookmarks.copy(selected, t),
      })
    }

    if (opts.length) return opts
  },

  pasteBookmarks: () => {
    const id = Selection.getLast()
    return {
      label: translate('menu.paste'),
      icon: 'icon_paste',
      onClick: () => Bookmarks.pasteInOrAfter(id),
    }
  },

  moveBookmarksTo: () => {
    const ids = Selection.ids()
    const option: MenuOption = {
      label: translate('menu.bookmark.move_to'),
      icon: 'icon_move',
      onClick: () => Bookmarks.move(ids, {}),
    }

    if (ids.some(id => Bookmarks.byId.get(id)?.parentId === BKM_ROOT_ID)) {
      option.inactive = true
    }
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  // ---
  // -- Panel options
  // -

  collapseAllFolders: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel || !Bookmarks.tree.length) return

    const option: MenuOption = {
      label: translate('menu.bookmark.collapse_all'),
      icon: 'icon_collapse_all',
      onClick: () => Bookmarks.collapseAllBookmarks(panel.id),
    }
    if (isBookmarksPanel(panel) && panel.viewMode !== 'tree') option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  switchViewMode: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!isBookmarksPanel(panel) || !Bookmarks.tree.length) return

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

    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  convertToTabsPanel: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!isBookmarksPanel(panel)) return

    const option: MenuOption = {
      label: translate('menu.bookmark.convert_to_tabs_panel'),
      icon: 'icon_tabs',
      badge: 'icon_reopen',
      onClick: () => Sidebar.convertToTabsPanel(panel, true),
    }

    if (panel.rootId === BKM_ROOT_ID) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },
}
