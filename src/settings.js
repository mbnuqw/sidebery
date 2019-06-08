export const SETTINGS_OPTIONS = {
  autoHideCtxMenuOpts: [250, 500, 1000, 'none'],
  scrollThroughTabsOpts: ['panel', 'global', 'none'],
  tabDoubleClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'exp', 'new_after', 'none'],
  tabLongLeftClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after', 'none'],
  tabLongRightClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after', 'none'],
  tabsPanelLeftClickActionOpts: ['prev', 'expand', 'none'],
  tabsPanelDoubleClickActionOpts: ['tab', 'none'],
  tabsPanelRightClickActionOpts: ['next', 'dash', 'expand', 'none'],
  activateAfterClosingOpts: ['prev_act', 'next', 'prev', 'none'],
  activateAfterClosingPrevRuleOpts: ['tree', 'visible', 'any'],
  activateAfterClosingNextRuleOpts: ['tree', 'any'],
  pinnedTabsPositionOpts: ['panel', 'top', 'left', 'right'],
  tabsTreeLimitOpts: [1, 2, 3, 4, 5, 'none'],
  fontSizeOpts: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
  themeOpts: ['dark', 'light'],
  lookOpts: ['default', 'tactile', 'none'],
}

export const DEFAULT_SETTINGS = {
  // General
  nativeScrollbars: false,
  autoHideCtxMenu: 'none',
  ctxMenuTopActions: false,
  ctxMenuInlineCtr: false,

  // Nav bar
  navBarInline: true,
  hideSettingsBtn: false,
  hideAddBtn: false,

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

  // Bookmarks
  bookmarksPanel: true,
  openBookmarkNewTab: false,
  autoCloseBookmarks: false,
  autoRemoveOther: false,
  selOpenedBookmarks: false,
  actOpenedTab: false,

  // Appearance
  fontSize: 'm',
  bgNoise: true,
  animations: true,
  theme: 'dark',
  look: 'default', //.....? skin
  customCSS: false,

  // Snapshots
  snapshotsTargets: { pinned: true },

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
  bookmarks_opened_fg: null,
}
