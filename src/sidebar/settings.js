export const SETTINGS_OPTIONS = {
  scrollThroughTabsOpts: ['panel', 'global', 'none'],
  tabDoubleClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabLongLeftClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabLongRightClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabsPanelLeftClickActionOpts: ['prev', 'none'],
  tabsPanelDoubleClickActionOpts: ['tab', 'none'],
  tabsPanelRightClickActionOpts: ['next', 'dash', 'none'],
  fontSizeOpts: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
  themeOpts: ['dark', 'light'],
}

export const DEFAULT_SETTINGS = {
  // Global
  nativeScrollbars: false,
  hScrollThroughPanels: false,
  
  // Tabs
  activateLastTabOnPanelSwitching: true,
  createNewTabOnEmptyPanel: false,
  skipEmptyPanels: false,
  showTabRmBtn: true,
  scrollThroughTabs: 'none',
  tabDoubleClick: 'none',
  tabLongLeftClick: 'none',
  tabLongRightClick: 'none',
  noEmptyDefault: false,
  hideInact: false,
  tabsPanelLeftClickAction: 'none',
  tabsPanelDoubleClickAction: 'tab',
  tabsPanelRightClickAction: 'none',
  tabsTree: false,
  
  // Bookmarks
  openBookmarkNewTab: false,
  autoCloseBookmarks: false,

  // Appearance
  fontSize: 'm',
  theme: 'dark',
  bgNoise: true,
  animations: true,

  // Snapshots
  snapshotsTargets: { 'pinned': true },
}