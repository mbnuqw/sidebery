import { translate } from './locales/dict.js'

// prettier-ignore
export const SETTINGS_OPTIONS = {
  autoHideCtxMenuOpts: [250, 500, 1000, 'none'],
  navMidClickActionOpts: ['rm_act_tab', 'rm_all', 'none'],
  groupLayoutOpts: ['grid', 'list'],
  scrollThroughTabsOpts: ['panel', 'global', 'none'],
  discardFoldedDelayUnitOpts: ['sec', 'min'],
  tabDoubleClickOpts: [
    'reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'exp', 'new_after', 'new_child',
    'close', 'none',
  ],
  tabLongLeftClickOpts: [
    'reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after', 'new_child', 'none',
  ],
  tabLongRightClickOpts: [
    'reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after', 'new_child', 'none',
  ],
  tabsPanelLeftClickActionOpts: ['prev', 'expand', 'parent', 'none'],
  tabsPanelDoubleClickActionOpts: ['collapse', 'tab', 'undo', 'none'],
  tabsPanelRightClickActionOpts: ['next', 'expand', 'parent', 'menu', 'none'],
  tabsPanelMiddleClickActionOpts: ['rm_act_tab', 'tab', 'undo', 'none'],
  activateAfterClosingOpts: ['prev_act', 'next', 'prev', 'none'],
  activateAfterClosingPrevRuleOpts: ['tree', 'visible', 'any'],
  activateAfterClosingNextRuleOpts: ['tree', 'any'],
  pinnedTabsPositionOpts: ['panel', 'top', 'left', 'right'],
  tabsTreeLimitOpts: [1, 2, 3, 4, 5, 'none'],
  rmChildTabsOpts: ['all', 'folded', 'none'],
  fontSizeOpts: ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'],
  styleOpts: ['dark', 'light'],
  themeOpts: ['default', 'tactile', 'none'],
  snapIntervalUnitOpts: ['min', 'hr', 'day'],
  snapLimitUnitOpts: ['snap', 'kb', 'day'],
  moveNewTabPinOpts: ['start', 'end', 'none'],
  moveNewTabParentOpts: ['before', 'sibling', 'first_child', 'last_child', 'start', 'end', 'none'],
  moveNewTabOpts: ['start', 'end', 'before', 'after', 'first_child', 'last_child', 'none'],
  midClickBookmarkOpts: ['open_new_tab', 'edit', 'delete'],
  warnOnMultiTabCloseOpts: ['any', 'collapsed', 'none'],
  warnOnMultiBookmarkDeleteOpts: ['any', 'collapsed', 'none'],
  navBarLayoutOpts: ['horizontal', 'vertical', 'hidden'],
  stateStorageOpts: ['global', 'session'],
  autoFoldTabsExceptOpts: [1, 2, 3, 4, 5, 'none'],
  dndTabActModOpts: ['alt', 'shift', 'ctrl', 'none'],
  dndExpOpts: ['pointer', 'hover', 'none'],
  dndExpModOpts: ['alt', 'shift', 'ctrl', 'none'],
  animationSpeedOpts: ['fast', 'norm', 'slow'],
  tabsFixOpts: ['reinit', 'notify'],
}

export const DEFAULT_SETTINGS = {
  // General
  version: browser.runtime.getManifest().version,
  nativeScrollbars: false,
  selWinScreenshots: true,
  tabsCheck: true,
  tabsFix: 'notify',

  // Context menu
  ctxMenuNative: false,
  autoHideCtxMenu: 'none',
  ctxMenuRenderInact: true,

  // Nav bar
  navBarLayout: 'horizontal',
  navBarInline: true,
  hideAddBtn: false,
  hideSettingsBtn: false,
  navBtnCount: true,
  hideEmptyPanels: true,
  navMidClickAction: 'none',
  navSwitchPanelsWheel: true,

  // Group page
  groupLayout: 'grid',

  // Drag and drop
  dndTabAct: true,
  dndTabActDelay: 750,
  dndTabActMod: 'none',
  dndExp: 'pointer',
  dndExpDelay: 0,
  dndExpMod: 'none',

  // Tabs
  stateStorage: 'global',
  warnOnMultiTabClose: 'collapsed',
  activateOnMouseUp: false,
  activateLastTabOnPanelSwitching: true,
  skipEmptyPanels: false,
  showTabRmBtn: true,
  showTabCtx: true,
  hideInact: false,
  activateAfterClosing: 'next',
  activateAfterClosingPrevRule: 'visible',
  activateAfterClosingNextRule: 'tree',
  activateAfterClosingGlobal: false,
  activateAfterClosingNoFolded: false,
  activateAfterClosingNoDiscarded: false,
  shiftSelAct: true,
  askNewBookmarkPlace: false,
  tabsRmUndoNote: true,
  nativeHighlight: false,
  tabsUnreadMark: false,

  // New tab position
  moveNewTabPin: 'start',
  moveNewTabParent: 'last_child',
  moveNewTabParentActPanel: false,
  moveNewTab: 'end',

  // Pinned tabs
  pinnedTabsPosition: 'panel',
  pinnedTabsList: false,
  pinnedAutoGroup: true,

  // Tabs tree
  tabsTree: true,
  groupOnOpen: true,
  tabsTreeLimit: 'none',
  hideFoldedTabs: false,
  autoFoldTabs: false,
  autoFoldTabsExcept: 'none',
  autoExpandTabs: false,
  rmChildTabs: 'none',
  tabsChildCount: true,
  tabsLvlDots: false,
  discardFolded: false,
  discardFoldedDelay: 0,
  discardFoldedDelayUnit: 'sec',
  tabsTreeBookmarks: true,

  // Bookmarks
  bookmarksPanel: true,
  warnOnMultiBookmarkDelete: 'collapsed',
  openBookmarkNewTab: false,
  midClickBookmark: 'open_new_tab',
  actMidClickTab: false,
  autoCloseBookmarks: false,
  autoRemoveOther: false,
  highlightOpenBookmarks: false,
  activateOpenBookmarkTab: false,
  showBookmarkLen: false,
  bookmarksRmUndoNote: true,

  // Appearance
  fontSize: 'm',
  bgNoise: true,
  animations: true,
  animationSpeed: 'fast',
  theme: 'default',
  style: 'dark',
  sidebarCSS: false,
  groupCSS: false,

  // Snapshots
  snapNotify: true,
  snapExcludePrivate: false,
  snapInterval: 0,
  snapIntervalUnit: 'min',
  snapLimit: 0,
  snapLimitUnit: 'snap',

  // Mouse
  hScrollThroughPanels: false,
  scrollThroughTabs: 'none',
  scrollThroughVisibleTabs: false,
  scrollThroughTabsSkipDiscarded: false,
  scrollThroughTabsExceptOverflow: true,
  scrollThroughTabsCyclic: false,
  tabDoubleClick: 'none',
  tabLongLeftClick: 'none',
  tabLongRightClick: 'none',
  tabsPanelLeftClickAction: 'none',
  tabsPanelDoubleClickAction: 'tab',
  tabsPanelRightClickAction: 'menu',
  tabsPanelMiddleClickAction: 'tab',

  // Sync
  syncName: '',
  syncSaveSettings: false,
  syncSaveCtxMenu: false,
  syncSaveStyles: false,
  syncAutoApply: false,
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
  favicons_placeholder_bg: null,

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
  tabs_pinned_height: null,
  tabs_pinned_width: null,
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
  tabs_lvl_indicator_bg: null,

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

export const PRE_SCROLL = 64
export const GROUP_URL = browser.runtime.getURL('/group/group.html')

export const prefix = (() => {
  if (navigator.userAgent.includes('IceCat')) return 'icecat'
  return 'firefox'
})()
export const DEFAULT_CTX = prefix + '-default'
export const PRIVATE_CTX = prefix + '-private'
export const DEFAULT_CTX_ID = browser.extension.inIncognitoContext ? PRIVATE_CTX : DEFAULT_CTX

export const DEFAULT_CONTAINER = {
  id: '',
  name: '',
  icon: 'fingerprint',
  color: 'blue',
  proxified: false,
  proxy: null,
  includeHostsActive: false,
  includeHosts: '',
  excludeHostsActive: false,
  excludeHosts: '',
  userAgentActive: false,
  userAgent: '',
}

export const BOOKMARKS_PANEL = {
  type: 'bookmarks',
  id: 'bookmarks',
  cookieStoreId: 'bookmarks',
  name: translate('bookmarks_dashboard.title'),
  icon: 'icon_bookmarks',
  bookmarks: true,
  lockedPanel: false,
}
export const BOOKMARKS_PANEL_STATE = {
  ...BOOKMARKS_PANEL,
  loading: false,
  updated: [],
}

export const PRIVATE_TABS_PANEL = {
  type: 'default',
  id: PRIVATE_CTX,
  name: translate('private_dashboard.title'),
  icon: 'icon_private',
  cookieStoreId: PRIVATE_CTX,
  private: true,
}
export const PRIVATE_TABS_PANEL_STATE = {
  ...PRIVATE_TABS_PANEL,
  loading: false,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
  updated: [],
}

export const DEFAULT_TABS_PANEL = {
  type: 'default',
  id: DEFAULT_CTX,
  name: translate('default_dashboard.title'),
  icon: 'icon_tabs',
  cookieStoreId: DEFAULT_CTX,
  lockedTabs: false,
  lockedPanel: false,
  noEmpty: false,
  newTabCtx: 'none',
  moveTabCtx: 'none',
  moveTabCtxNoChild: true,
}
export const DEFAULT_TABS_PANEL_STATE = {
  ...DEFAULT_TABS_PANEL,
  loading: false,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
  updated: [],
}

export const TABS_PANEL = {
  type: 'tabs',
  id: '',
  name: '',
  icon: 'icon_tabs',
  color: 'toolbar',
  customIconSrc: '',
  customIcon: '',
  lockedTabs: false,
  lockedPanel: false,
  noEmpty: false,
  newTabCtx: 'none',
  moveTabCtx: 'none',
  moveTabCtxNoChild: true,
  urlRulesActive: false,
  urlRules: '',
}
export const TABS_PANEL_STATE = {
  ...TABS_PANEL,
  loading: false,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
  updated: [],
}

export const DEFAULT_PANEL = browser.extension.inIncognitoContext
  ? PRIVATE_TABS_PANEL
  : DEFAULT_TABS_PANEL
export const DEFAULT_PANEL_STATE = browser.extension.inIncognitoContext
  ? PRIVATE_TABS_PANEL_STATE
  : DEFAULT_TABS_PANEL_STATE
export const DEFAULT_PANELS = [BOOKMARKS_PANEL, DEFAULT_PANEL]
export const DEFAULT_PANELS_STATE = [BOOKMARKS_PANEL_STATE, DEFAULT_PANEL_STATE]

export const DEFAULT_TABS_MENU = [
  ['undoRmTab', 'mute', 'reload', 'bookmark'],
  'separator-1',
  [
    { name: translate('menu.tab.move_to_sub_menu_name') },
    'moveToNewWin',
    'moveToNewPrivWin',
    'moveToAnotherWin',
    'moveToWin',
  ],
  [{ name: translate('menu.tab.reopen_in_sub_menu_name') }, 'moveToCtr'],
  'separator-2',
  'pin',
  'duplicate',
  'discard',
  'copyUrls',
  'separator-3',
  'group',
  'flatten',
  'separator-4',
  'clearCookies',
  'close',
]

export const DEFAULT_BOOKMARKS_MENU = [
  [
    { name: translate('menu.bookmark.open_in_sub_menu_name') },
    'openInNewWin',
    'openInNewPrivWin',
    'openInCtr',
  ],
  'separator-5',
  'createBookmark',
  'createFolder',
  'createSeparator',
  'separator-6',
  'sortByName',
  'sortByLink',
  'sortByTime',
  'separator-7',
  'copyUrls',
  'edit',
  'delete',
]

export const DEFAULT_TABS_PANEL_MENU = [
  ['undoRmTab', 'muteAllAudibleTabs', 'reloadTabs', 'discardTabs'],
  'separator-7',
  'collapseInactiveBranches',
  'closeTabsDuplicates',
  'closeTabs',
  'separator-8',
  'openPanelConfig',
  'removePanel',
]

export const BOOKMARKS_PANEL_MENU = ['collapseAllFolders', 'separator-9', 'openPanelConfig']

export const MENU_OPTIONS = {
  //
  // --- Common ---
  //
  copyUrls: state => {
    let label = 'menu.copy_url'
    if (state.selected.length > 1) label += 's'

    let option = {
      label: translate(label),
      icon: 'icon_link',
      action: 'copyUrls',
      args: [state.selected],
    }

    return option
  },

  //
  // --- Tabs options ---
  //
  undoRmTab: () => ({
    label: translate('menu.tab.undo'),
    icon: 'icon_undo',
    action: 'undoRmTab',
  }),

  moveToNewWin: state => ({
    label: translate('menu.tab.move_to_new_window'),
    icon: 'icon_new_win',
    action: 'moveTabsToNewWin',
    args: [state.selected],
  }),

  moveToNewPrivWin: state => ({
    label: translate('menu.tab.move_to_new_priv_window'),
    icon: 'icon_private',
    action: 'moveTabsToNewWin',
    args: [state.selected, true],
  }),

  moveToAnotherWin: state => {
    let option = {
      label: translate('menu.tab.move_to_another_window'),
      icon: 'icon_window',
      action: 'moveTabsToWin',
      args: [state.selected, state.otherWindows[0]],
    }
    if (state.otherWindows.length !== 1) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  moveToWin: state => {
    let option = {
      label: translate('menu.tab.move_to_window_'),
      icon: 'icon_windows',
      action: 'moveTabsToWin',
      args: [state.selected],
    }
    if (state.otherWindows.length <= 1) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  moveToCtr: state => {
    if (state.private) return
    let opts = []
    let firstNode = state.tabsMap[state.selected[0]]

    if (firstNode.cookieStoreId !== DEFAULT_CTX_ID) {
      opts.push({
        label: translate('menu.tab.reopen_in_default_panel'),
        icon: 'icon_tabs',
        action: 'reopenTabsInCtx',
        args: [state.selected, DEFAULT_CTX_ID],
      })
    }

    for (let c of Object.values(state.containers)) {
      if (firstNode.cookieStoreId === c.id) continue
      opts.push({
        label: translate('menu.tab.reopen_in_') + `||${c.color}>>${c.name}`,
        nativeLabel: translate('menu.tab.reopen_in_') + c.name,
        icon: c.icon,
        color: c.color,
        action: 'reopenTabsInCtx',
        args: [state.selected, c.id],
      })
    }

    return opts
  },

  moveToPanel: state => {
    let opts = []
    let firstNode = state.tabsMap[state.selected[0]]

    for (let panel of state.panels) {
      if (!panel.tabs) continue
      if (firstNode.panelId === panel.id) continue

      opts.push({
        label: translate('menu.tab.move_to_panel_') + panel.name,
        icon: panel.icon,
        img: panel.customIcon,
        color: panel.color,
        action: 'moveTabsToPanel',
        args: [state.selected, panel.id],
      })
    }

    if (opts.length) return opts
  },

  pin: state => {
    let firstNode = state.tabsMap[state.selected[0]]
    let wut = firstNode.pinned ? 'unpin' : 'pin'
    return {
      label: translate('menu.tab.' + wut),
      icon: 'icon_pin',
      action: wut + 'Tabs',
      args: [state.selected],
    }
  },

  reload: state => {
    return {
      label: translate('menu.tab.reload'),
      icon: 'icon_reload',
      action: 'reloadTabs',
      args: [state.selected],
    }
  },

  duplicate: state => {
    return {
      label: translate('menu.tab.duplicate'),
      icon: 'icon_duplicate',
      action: 'duplicateTabs',
      args: [state.selected],
    }
  },

  bookmark: state => {
    return {
      label: translate('menu.tab.bookmark'),
      icon: 'icon_star',
      action: 'bookmarkTabs',
      args: [state.selected],
    }
  },

  mute: state => {
    let firstNode = state.tabsMap[state.selected[0]]
    const wut = firstNode.mutedInfo.muted ? 'unmute' : 'mute'
    return {
      label: translate('menu.tab.' + wut),
      icon: firstNode.mutedInfo.muted ? 'icon_loud' : 'icon_mute',
      action: wut + 'Tabs',
      args: [state.selected],
    }
  },

  discard: state => {
    let option = {
      label: translate('menu.tab.discard'),
      icon: 'icon_discard',
      action: 'discardTabs',
      args: [state.selected],
    }
    let firstNode = state.tabsMap[state.selected[0]]
    if (state.selected.length === 1) {
      if (firstNode.active || firstNode.discarded) option.inactive = true
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  group: state => {
    let option = {
      label: translate('menu.tab.group'),
      icon: 'icon_group_tabs',
      action: 'groupTabs',
      args: [state.selected],
    }
    let firstNode = state.tabsMap[state.selected[0]]
    if (!state.tabsTree || firstNode.pinned) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  flatten: state => {
    let option = {
      label: translate('menu.tab.flatten'),
      icon: 'icon_flatten',
      action: 'flattenTabs',
      args: [state.selected],
    }
    if (state.selected.length <= 1) option.inactive = true
    let firstNode = state.tabsMap[state.selected[0]]
    if (state.selected.every(t => firstNode.lvl === state.tabsMap[t].lvl)) {
      option.inactive = true
    }
    if (!state.tabsTree || firstNode.pinned) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  clearCookies: state => {
    return {
      label: translate('menu.tab.clear_cookies'),
      icon: 'icon_cookie',
      action: 'clearTabsCookies',
      args: [state.selected],
    }
  },

  close: state => {
    let option = {
      label: translate('menu.tab.close'),
      icon: 'icon_close',
      action: 'removeTabs',
      args: [state.selected],
    }
    let minCount = state.ctxMenuRenderInact ? 1 : 2
    if (state.selected.length < minCount && !state.tabsMap[state.selected[0]].pinned) {
      option.inactive = true
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  //
  // --- Bookmarks options ---
  //
  openInNewWin: state => {
    let allSeparators = state.selected.every(id => {
      return state.bookmarksMap[id].type === 'separator'
    })
    let option = {
      label: translate('menu.bookmark.open_in_new_window'),
      icon: 'icon_new_win',
      action: 'openBookmarksInNewWin',
      args: [state.selected],
    }
    if (allSeparators) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInNewPrivWin: state => {
    let allSeparators = state.selected.every(id => {
      return state.bookmarksMap[id].type === 'separator'
    })
    let option = {
      label: translate('menu.bookmark.open_in_new_priv_window'),
      icon: 'icon_private',
      action: 'openBookmarksInNewWin',
      args: [state.selected, true],
    }
    if (allSeparators) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openInCtr: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let allSeparators = state.selected.every(id => {
      return state.bookmarksMap[id].type === 'separator'
    })
    if (allSeparators && !state.ctxMenuRenderInact) return
    let opts = []

    if (node.type === 'folder' || state.selected.length > 1) {
      opts.push({
        label: translate('menu.bookmark.open_in_default_panel'),
        nativeLabel: 'Default container',
        icon: 'icon_tabs',
        action: 'openBookmarksInCtx',
        inactive: allSeparators,
        args: [state.selected, DEFAULT_CTX_ID],
      })
    }

    if (!state.private) {
      for (let c of Object.values(state.containers)) {
        opts.push({
          label: translate('menu.bookmark.open_in_') + `||${c.color}>>${c.name}`,
          nativeLabel: translate('menu.bookmark.open_in_') + c.name,
          icon: c.icon,
          color: c.color,
          action: 'openBookmarksInCtx',
          inactive: allSeparators,
          args: [state.selected, c.id],
        })
      }
    }

    return opts
  },

  createBookmark: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.create_bookmark'),
      icon: 'icon_plus_b',
      action: 'startBookmarkCreation',
      args: ['bookmark', node],
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  createFolder: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.create_folder'),
      icon: 'icon_plus_f',
      action: 'startBookmarkCreation',
      args: ['folder', node],
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  createSeparator: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.create_separator'),
      icon: 'icon_plus_s',
      action: 'startBookmarkCreation',
      args: ['separator', node],
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByName: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.sort_by_name'),
      icon: 'icon_sort_az',
      action: 'sortBookmarks',
      args: ['name', state.selected],
    }
    if (state.selected.length === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByLink: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.sort_by_link'),
      icon: 'icon_sort_url',
      action: 'sortBookmarks',
      args: ['link', state.selected],
    }
    if (state.selected.length === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  sortByTime: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.sort_by_time'),
      icon: 'icon_sort_time',
      action: 'sortBookmarks',
      args: ['time', state.selected],
    }
    if (state.selected.length === 1 && node.type !== 'folder') {
      option.inactive = true
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  edit: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.edit_bookmark'),
      icon: 'icon_edit',
      action: 'startBookmarkEditing',
      args: [node],
    }
    if (state.selected.length > 1) option.inactive = true
    if (node.type === 'separator') option.inactive = true
    if (node.parentId === 'root________') option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  delete: state => {
    let node = state.bookmarksMap[state.selected[0]]
    let option = {
      label: translate('menu.bookmark.delete_bookmark'),
      icon: 'icon_close',
      action: 'removeBookmarks',
      args: [state.selected],
    }
    if (node.parentId === 'root________') option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  //
  // --- Tabs panel options ---
  //
  muteAllAudibleTabs: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return

    let tabs = panel.tabs.filter(t => t.audible).map(t => t.id)

    let option = {
      label: translate('menu.tabs_panel.mute_all_audible'),
      icon: 'icon_mute',
      action: 'muteTabs',
      args: [tabs],
    }
    if (!tabs.length) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },
  closeTabsDuplicates: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return

    let tabs = panel.tabs.map(t => t.id)
    let option = {
      label: translate('menu.tabs_panel.dedup'),
      icon: 'icon_dedup_tabs',
      action: 'dedupTabs',
      args: [tabs],
    }
    if (!tabs.length) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },
  reloadTabs: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return

    let tabs = panel.tabs.map(t => t.id)
    let option = {
      label: translate('menu.tabs_panel.reload'),
      icon: 'icon_reload',
      action: 'reloadTabs',
      args: [tabs],
    }
    if (!tabs.length) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },
  discardTabs: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return

    let tabs = panel.tabs.map(t => t.id)
    let option = {
      label: translate('menu.tabs_panel.discard'),
      icon: 'icon_discard',
      action: 'discardTabs',
      args: [tabs],
    }
    if (!tabs.length) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },
  closeTabs: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return

    let tabs = panel.tabs.map(t => t.id)
    let option = {
      label: translate('menu.tabs_panel.close'),
      icon: 'icon_close',
      action: 'removeTabs',
      args: [tabs],
    }
    if (!tabs.length) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },
  collapseInactiveBranches: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return
    if (!state.tabsTree) return

    let option = {
      label: translate('menu.tabs_panel.collapse_inact_branches'),
      icon: 'icon_collapse_all',
      action: 'foldAllInactiveBranches',
      args: [panel.tabs],
    }
    if (panel.tabs.length < 3) option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },
  removePanel: state => {
    let panel = state.selected[0]
    if (!panel || !panel.tabs) return

    let option = {
      label: translate('menu.tabs_panel.remove_panel'),
      icon: 'icon_close',
      action: 'removePanel',
      args: [panel.id],
    }
    if (panel.type === 'default') option.inactive = true
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  //
  // --- Bookmarks panel options ---
  //
  collapseAllFolders: state => {
    let panel = state.selected[0]
    if (!panel || !state.bookmarks.length) return

    let option = {
      label: translate('menu.bookmark.collapse_all'),
      icon: 'icon_collapse_all',
      action: 'collapseAllBookmarks',
      args: [],
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  //
  // --- Common panels ---
  //
  openPanelConfig: state => {
    let panel = state.selected[0]
    if (!panel) return

    let option = {
      label: translate('menu.common.conf'),
      icon: 'icon_panel_config',
      action: 'openSettings',
      args: ['settings_panels.' + panel.id],
    }
    if (!state.ctxMenuRenderInact && option.inactive) return
    return option
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

export const VALID_STORED_PROPS = [
  'settings',
  'panels',
  'favicons',
  'favUrls',
  'favAutoCleanTime',
  'cssVars',
  'sidebarCSS',
  'groupCSS',
  'panelIndex',
  'snapshots',
  'lastSnapTime',
  'tabsTrees',
  'expandedBookmarks',
  'tabsMenu',
  'bookmarksMenu',
]
