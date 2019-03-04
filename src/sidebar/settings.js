export const SETTINGS_OPTIONS = {
  scrollThroughTabsOpts: ['panel', 'global', 'none'],
  tabDoubleClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'exp', 'none'],
  tabLongLeftClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabLongRightClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabsPanelLeftClickActionOpts: ['prev', 'none'],
  tabsPanelDoubleClickActionOpts: ['tab', 'none'],
  tabsPanelRightClickActionOpts: ['next', 'dash', 'none'],
  pinnedTabsPositionOpts: ['panel', 'top', 'left', 'right'],
  tabsTreeLimitOpts: [1, 2, 3, 4, 5, 'none'],
  fontSizeOpts: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
  themeOpts: ['dark', 'light'],
}

export const DEFAULT_SETTINGS = {
  // Global
  nativeScrollbars: false,

  // Tabs
  activateLastTabOnPanelSwitching: true,
  createNewTabOnEmptyPanel: false,
  skipEmptyPanels: false,
  showTabRmBtn: true,
  hideInact: false,

  // Pinned tabs
  pinnedTabsPosition: 'panel',
  pinnedTabsSync: false,
  pinnedTabsList: false,

  // Tabs tree
  tabsTree: false,
  groupOnOpen: true,
  tabsTreeLimit: 'none',
  hideFoldedTabs: false,
  autoFoldTabs: false,
  autoExpandTabs: false,
  rmFoldedTabs: false,

  // Bookmarks
  bookmarksPanel: true,
  openBookmarkNewTab: false,
  autoCloseBookmarks: false,

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
  tabDoubleClick: 'none',
  tabLongLeftClick: 'none',
  tabLongRightClick: 'none',
  tabsPanelLeftClickAction: 'none',
  tabsPanelDoubleClickAction: 'tab',
  tabsPanelRightClickAction: 'none',
}
