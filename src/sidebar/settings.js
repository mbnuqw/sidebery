export const SETTINGS_OPTIONS = {
  scrollThroughTabsOpts: ['panel', 'global', 'none'],
  tabDoubleClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabLongLeftClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  tabLongRightClickOpts: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'none'],
  fontSizeOpts: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
  themeOpts: ['dark', 'light'],
  snapshotsLimitOpts: ['1d', '1w', '1m']
}

export const DEFAULT_SETTINGS = {
  // Global
  nativeScrollbars: false,
  activateLastTabOnPanelSwitching: true,
  createNewTabOnEmptyPanel: false,
  skipEmptyPanels: false,
  showTabRmBtn: true,
  hScrollThroughPanels: false,
  scrollThroughTabs: 'none',
  tabDoubleClick: 'none',
  tabLongLeftClick: 'none',
  tabLongRightClick: 'none',
  openBookmarkNewTab: false,
  noEmptyDefault: false,
  hideInact: false,
  
  // Appearance
  fontSize: 'm',
  theme: 'dark',
  bgNoise: true,
  animations: true,

  // Snapshots
  snapshotsTargets: [true],
  snapshotsLimit: '1w',
}