import { translate } from './mixins/dict'

export const SETTINGS_OPTIONS = {
  autoHideCtxMenuOpts: [250, 500, 1000, 'none'],
  groupLayoutOpts: ['grid', 'list'],
  scrollThroughTabsOpts: ['panel', 'global', 'none'],
  discardFoldedDelayUnitOpts: ['sec', 'min'],
  tabDoubleClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'exp', 'new_after', 'none'],
  tabLongLeftClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after', 'none'],
  tabLongRightClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after', 'none'],
  tabsPanelLeftClickActionOpts: ['prev', 'expand', 'parent', 'none'],
  tabsPanelDoubleClickActionOpts: ['tab', 'none'],
  tabsPanelRightClickActionOpts: ['next', 'dash', 'expand', 'parent', 'none'],
  activateAfterClosingOpts: ['prev_act', 'next', 'prev', 'none'],
  activateAfterClosingPrevRuleOpts: ['tree', 'visible', 'any'],
  activateAfterClosingNextRuleOpts: ['tree', 'any'],
  pinnedTabsPositionOpts: ['panel', 'top', 'left', 'right'],
  tabsTreeLimitOpts: [1, 2, 3, 4, 5, 'none'],
  fontSizeOpts: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
  styleOpts: ['dark', 'light'],
  themeOpts: ['default', 'tactile', 'none'],
  snapIntervalUnitOpts: ['min', 'hr', 'day'],
  snapLimitUnitOpts: ['snap', 'kb', 'day'],
}

export const DEFAULT_SETTINGS = {
  // General
  nativeScrollbars: false,
  autoHideCtxMenu: 'none',
  ctxMenuNative: false,
  ctxMenuTopActions: false,
  ctxMenuInlineCtr: false,

  // Nav bar
  navBarInline: true,
  hideSettingsBtn: false,
  hideAddBtn: false,
  navBtnCount: false,
  hideEmptyPanels: false,

  // Group page
  groupLayout: 'grid',

  // Tabs
  activateLastTabOnPanelSwitching: true,
  skipEmptyPanels: false,
  showTabRmBtn: true,
  hideInact: false,
  activateAfterClosing: 'next',
  activateAfterClosingPrevRule: 'visible',
  activateAfterClosingNextRule: 'tree',

  // Pinned tabs
  pinnedTabsPosition: 'panel',
  pinnedTabsList: false,

  // Tabs tree
  tabsTree: false,
  groupOnOpen: true,
  tabsTreeLimit: 'none',
  hideFoldedTabs: false,
  autoFoldTabs: false,
  autoExpandTabs: false,
  rmFoldedTabs: false,
  tabsChildCount: true,
  tabsLvlDots: false,
  discardFolded: false,
  discardFoldedDelay: 0,
  discardFoldedDelayUnit: 'sec',

  // Bookmarks
  bookmarksPanel: true,
  openBookmarkNewTab: false,
  autoCloseBookmarks: false,
  autoRemoveOther: false,
  highlightOpenBookmarks: false,
  activateOpenBookmarkTab: false,

  // Appearance
  fontSize: 'm',
  bgNoise: true,
  animations: true,
  theme: 'default',
  style: 'dark',
  settingsCSS: false,
  sidebarCSS: false,
  groupCSS: false,

  // Snapshots
  snapInterval: 0,
  snapIntervalUnit: 'min',
  snapLimit: 0,
  snapLimitUnit: 'snap',

  // Mouse
  hScrollThroughPanels: false,
  scrollThroughTabs: 'none',
  scrollThroughVisibleTabs: false,
  tabDoubleClick: 'none',
  tabLongLeftClick: 'none',
  tabLongRightClick: 'none',
  tabsPanelLeftClickAction: 'none',
  tabsPanelDoubleClickAction: 'tab',
  tabsPanelRightClickAction: 'none',
}

export const CUSTOM_CSS_VARS = {
  bg: null,
  title_fg: null,
  sub_title_fg: null,
  label_fg: null,
  label_fg_hover: null,
  label_fg_active: null,
  info_fg: null,
  true_fg: null,
  false_fg: null,
  active_fg: null,
  inactive_fg: null,
  favicons_placehoder_bg: null,

  btn_bg: null,
  btn_bg_hover: null,
  btn_bg_active: null,
  btn_fg: null,
  btn_fg_hover: null,
  btn_fg_active: null,

  scroll_progress_h: null,
  scroll_progress_bg: null,

  ctx_menu_font: null,
  ctx_menu_bg: null,
  ctx_menu_bg_hover: null,
  ctx_menu_fg: null,

  nav_btn_fg: null,
  nav_btn_width: null,
  nav_btn_height: null,

  pinned_dock_overlay_bg: null,
  pinned_dock_overlay_shadow: null,

  tabs_height: null,
  tabs_indent: null,
  tabs_font: null,
  tabs_count_font: null,
  tabs_fg: null,
  tabs_fg_hover: null,
  tabs_fg_active: null,
  tabs_bg_hover: null,
  tabs_bg_active: null,
  tabs_activated_bg: null,
  tabs_activated_fg: null,
  tabs_selected_bg: null,
  tabs_selected_fg: null,
  tabs_border: null,
  tabs_activated_border: null,
  tabs_selected_border: null,
  tabs_shadow: null,
  tabs_activated_shadow: null,
  tabs_selected_shadow: null,

  bookmarks_bookmark_height: null,
  bookmarks_folder_height: null,
  bookmarks_separator_height: null,
  bookmarks_bookmark_font: null,
  bookmarks_folder_font: null,
  bookmarks_node_title_fg: null,
  bookmarks_node_title_fg_hover: null,
  bookmarks_node_title_fg_active: null,
  bookmarks_node_bg_hover: null,
  bookmarks_node_bg_active: null,
  bookmarks_folder_closed_fg: null,
  bookmarks_folder_closed_fg_hover: null,
  bookmarks_folder_closed_fg_active: null,
  bookmarks_folder_open_fg: null,
  bookmarks_folder_open_fg_hover: null,
  bookmarks_folder_open_fg_active: null,
  bookmarks_folder_empty_fg: null,
  bookmarks_open_bookmark_fg: null,
}

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'
export const DEFAULT_CTX_ID = browser.extension.inIncognitoContext ? PRIVATE_CTX : DEFAULT_CTX
export const DEFAULT_BOOKMARKS_PANEL = {
  type: 'bookmarks',
  id: 'bookmarks',
  cookieStoreId: 'bookmarks',
  name: translate('bookmarks_dashboard.title'),
  icon: 'icon_bookmarks',
  dashboard: 'BookmarksDashboard',
  panel: 'BookmarksPanel',
  lockedPanel: false,
  bookmarks: true,
}

export const DEFAULT_PRIVATE_TABS_PANEL = {
  type: 'default',
  id: PRIVATE_CTX,
  name: translate('private_dashboard.title'),
  icon: 'icon_private',
  cookieStoreId: PRIVATE_CTX,
  dashboard: 'DefaultTabsDashboard',
  panel: 'TabsPanel',
  private: true,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
}

export const DEFAULT_TABS_PANEL = {
  type: 'default',
  id: DEFAULT_CTX,
  name: translate('default_dashboard.title'),
  icon: 'icon_tabs',
  cookieStoreId: DEFAULT_CTX,
  dashboard: 'DefaultTabsDashboard',
  panel: 'TabsPanel',
  lockedTabs: false,
  lockedPanel: false,
  proxyConfig: null,
  noEmpty: false,
  lastActiveTab: -1,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
}

export const DEFAULT_CTX_TABS_PANEL = {
  type: 'ctx',
  dashboard: 'TabsDashboard',
  panel: 'TabsPanel',
  lockedTabs: false,
  lockedPanel: false,
  proxy: null,
  proxified: false,
  noEmpty: false,
  includeHostsActive: false,
  includeHosts: '',
  excludeHostsActive: false,
  excludeHosts: '',
  lastActiveTab: -1,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
}

export const DEFAULT_PANELS = [
  DEFAULT_BOOKMARKS_PANEL,
  DEFAULT_PRIVATE_TABS_PANEL,
  DEFAULT_TABS_PANEL,
]

export const DEFAULT_TABS_MENU = [
  ['undoRmTab', 'mute', 'reload', 'bookmark'],
  'moveToNewWin',
  'moveToNewPrivWin',
  'moveToAnotherWin',
  'moveToWin',
  'moveToCtr',
  'pin',
  'discard',
  'group',
  'flatten',
  'clearCookies',
  'close',
]

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

export const MENU_OPTIONS = {
  // 
  // --- Tabs options ---
  // 
  undoRmTab: () => ({
    label: translate('menu.tab.undo'),
    icon: 'icon_undo',
    action: 'undoRmTab',
  }),

  moveToNewWin: (state) => ({
    label: translate('menu.tab.move_to_new_window'),
    icon: 'icon_new_win',
    action: 'moveTabsToNewWin',
    args: [state.selected],
  }),

  moveToNewPrivWin: (state) => ({
    label: translate('menu.tab.move_to_new_priv_window'),
    icon: 'icon_private',
    action: 'moveTabsToNewWin',
    args: [state.selected, true],
  }),

  moveToAnotherWin: (state) => {
    if (state.otherWindows.length !== 1) return
    return {
      label: translate('menu.tab.move_to_another_window'),
      icon: 'icon_window',
      action: 'moveTabsToWin',
      args: [state.selected, state.otherWindows[0]],
    }
  },

  moveToWin: (state) => {
    if (state.otherWindows.length <= 1) return
    return {
      label: translate('menu.tab.move_to_window_'),
      icon: 'icon_windows',
      action: 'moveTabsToWin',
      args: [state.selected],
    }
  },

  moveToCtr: (state, node) => {
    if (state.private) return
    const opts = []

    if (node.cookieStoreId !== 'firefox-default') {
      opts.push({
        label: translate('menu.tab.reopen_in_default_panel'),
        nativeLabel: 'Default container',
        nativeParentLabel: 'menu.tab.reopen_in_',
        icon: 'icon_tabs',
        action: 'moveTabsToCtx',
        args: [state.selected, 'firefox-default'],
      })
    }

    for (let c of state.containers) {
      if (node.cookieStoreId === c.cookieStoreId) continue
      opts.push({
        label: translate('menu.tab.reopen_in_') + `||${c.color}>>${c.name}`,
        nativeLabel: c.name,
        nativeParentLabel: translate('menu.tab.reopen_in_'),
        icon: c.icon,
        color: c.color,
        action: 'moveTabsToCtx',
        args: [state.selected, c.cookieStoreId],
      })
    }

    return opts
  },

  pin: (state, node) => {
    const wut = node.pinned ? 'unpin' : 'pin'
    return {
      label: translate('menu.tab.' + wut),
      icon: 'icon_pin',
      action: wut + 'Tabs',
      args: [state.selected],
    }
  },

  reload: (state) => {
    return {
      label: translate('menu.tab.reload'),
      icon: 'icon_reload',
      action: 'reloadTabs',
      args: [state.selected],
    }
  },

  bookmark: (state) => {
    return {
      label: translate('menu.tab.bookmark'),
      icon: 'icon_star',
      action: 'bookmarkTabs',
      args: [state.selected],
    }
  },

  mute: (state, node) => {
    const wut = node.mutedInfo.muted ? 'unmute' : 'mute'
    return {
      label: translate('menu.tab.' + wut),
      icon: node.mutedInfo.muted ? 'icon_loud' : 'icon_mute',
      action: wut + 'Tabs',
      args: [state.selected],
    }
  },

  discard: (state, node) => {
    if (state.selected.length === 1) {
      if (node.active || node.discarded) return
    }
    return {
      label: translate('menu.tab.discard'),
      icon: 'icon_discard',
      action: 'discardTabs',
      args: [state.selected],
    }
  },

  group: (state, node) => {
    if (!state.tabsTree || node.pinned) return
    return {
      label: translate('menu.tab.group'),
      icon: 'icon_group_tabs',
      action: 'groupTabs',
      args: [state.selected],
    }
  },

  flatten: (state, node) => {
    if (state.selected.length <= 1) return
    if (state.selected.every(t => node.lvl === state.tabsMap[t].lvl)) return
    if (!state.tabsTree || node.pinned) return
    return {
      label: translate('menu.tab.flatten'),
      icon: 'icon_flatten',
      action: 'flattenTabs',
      args: [state.selected],
    }
  },

  clearCookies: (state) => {
    return {
      label: translate('menu.tab.clear_cookies'),
      icon: 'icon_cookie',
      action: 'clearTabsCookies',
      args: [state.selected],
    }
  },

  close: (state) => {
    if (state.selected.length <= 1) return
    return {
      label: translate('menu.tab.close'),
      icon: 'icon_close',
      action: 'removeTabs',
      args: [state.selected],
    }
  },

  // 
  // --- Bookmarks options ---
  // 
  openInNewWin: (state, node) => {
    if (node.type === 'separator') return
    return {
      label: translate('menu.bookmark.open_in_new_window'),
      icon: 'icon_new_win',
      action: 'openBookmarksInNewWin',
      args: [state.selected],
    }
  },

  openInNewPrivWin: (state, node) => {
    if (node.type === 'separator') return
    return {
      label: translate('menu.bookmark.open_in_new_priv_window'),
      icon: 'icon_private',
      action: 'openBookmarksInNewWin',
      args: [state.selected, true],
    }
  },

  openInCtr: (state, node) => {
    if (node.type === 'separator') return
    const opts = []

    if (node.type === 'folder' || state.selected.length > 1) {
      opts.push({
        label: translate('menu.bookmark.open_in_default_panel'),
        nativeLabel: 'Default container',
        nativeParentLabel: translate('menu.bookmark.open_in_'),
        icon: 'icon_tabs',
        action: 'openBookmarksInPanel',
        args: [state.selected, DEFAULT_CTX_ID],
      })
    }

    if (!state.private) {
      for (let c of state.containers) {
        opts.push({
          label: translate('menu.bookmark.open_in_') + `||${c.color}>>${c.name}`,
          nativeLabel: c.name,
          nativeParentLabel: translate('menu.bookmark.open_in_'),
          icon: c.icon,
          color: c.color,
          action: 'openBookmarksInPanel',
          args: [state.selected, c.cookieStoreId],
        })
      }
    }

    return opts
  },

  createBookmark: (state, node) => {
    if (node.type !== 'folder') return
    return {
      label: translate('menu.bookmark.create_bookmark'),
      icon: 'icon_plus_b',
      action: 'startBookmarkCreation',
      args: ['bookmark', node],
    }
  },

  createFolder: (state, node) => {
    if (node.type !== 'folder') return
    return {
      label: translate('menu.bookmark.create_folder'),
      icon: 'icon_plus_f',
      action: 'startBookmarkCreation',
      args: ['folder', node],
    }
  },

  createSeparator: (state, node) => {
    if (node.type !== 'folder') return
    return {
      label: translate('menu.bookmark.create_separator'),
      icon: 'icon_plus_s',
      action: 'startBookmarkCreation',
      args: ['separator', node],
    }
  },

  edit: (state, node) => {
    if (state.selected.length > 1) return
    if (node.type === 'separator') return
    if (node.parentId === 'root________') return
    return {
      label: translate('menu.bookmark.edit_bookmark'),
      icon: 'icon_edit',
      action: 'startBookmarkEditing',
      args: [node],
    }
  },

  delete: (state, node) => {
    if (node.parentId === 'root________') return
    return {
      label: translate('menu.bookmark.delete_bookmark'),
      icon: 'icon_close',
      action: 'removeBookmarks',
      args: [state.selected],
    }
  },
}

export const RGB_COLORS = {
  blue: '#37adff',
  turquoise: '#00c79a',
  green: '#51cd00',
  yellow: '#ffcb00',
  orange: '#ff9f00',
  red: '#ff613d',
  pink: '#ff4bda',
  purple: '#af51f5',
}