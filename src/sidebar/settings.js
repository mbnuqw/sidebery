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
}

export const DEFAULT_SETTINGS = {
  // General
  nativeScrollbars: false,
  autoHideCtxMenu: 'none',
  ctxMenuTopActions: false,
  ctxMenuInlineCtr: false,

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
  theme: 'dark',
  bgNoise: true,
  animations: true,

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
