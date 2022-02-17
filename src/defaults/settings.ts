import { SettingsState } from '../types/settings'

export const DEFAULT_SETTINGS: SettingsState = {
  // General
  nativeScrollbars: false,
  nativeScrollbarsThin: true,
  selWinScreenshots: true,
  updateSidebarTitle: true,
  markWindow: false,
  markWindowPreface: '[Sidebery] ',
  logLvl: 3,

  // Context menu
  ctxMenuNative: false,
  ctxMenuRenderInact: true,
  ctxMenuRenderIcons: true,
  ctxMenuIgnoreContainers: '',

  // Nav bar
  navBarLayout: 'horizontal',
  navBarInline: true,
  navBarSide: 'left',
  hideAddBtn: false,
  hideSettingsBtn: false,
  navBtnCount: true,
  hideEmptyPanels: true,
  navActTabsPanelLeftClickAction: 'none',
  navActBookmarksPanelLeftClickAction: 'none',
  navTabsPanelMidClickAction: 'none',
  navSwitchPanelsWheel: true,

  // Group page
  groupLayout: 'grid',
  groupScreenshotsCache: false,

  // Panels
  skipEmptyPanels: false,

  // Drag and drop
  dndTabAct: true,
  dndTabActDelay: 750,
  dndTabActMod: 'none',
  dndExp: 'pointer',
  dndExpDelay: 0,
  dndExpMod: 'none',

  // Search
  searchBarMode: 'dynamic',

  // Tabs
  warnOnMultiTabClose: 'collapsed',
  activateOnMouseUp: true,
  activateLastTabOnPanelSwitching: true,
  showTabRmBtn: true,
  showTabCtx: true,
  hideInact: false,
  activateAfterClosing: 'next',
  activateAfterClosingGlobal: false,
  activateAfterClosingNoFolded: true,
  activateAfterClosingNoDiscarded: true,
  shiftSelAct: true,
  askNewBookmarkPlace: false,
  tabsRmUndoNote: true,
  nativeHighlight: false,
  tabsUnreadMark: false,
  tabsReloadLimit: 5,
  tabsReloadLimitNotif: true,
  showNewTabBtns: true,
  newTabBarPosition: 'after_tabs',
  tabsPanelSwitchActMove: false,

  // New tab position
  moveNewTabPin: 'start',
  moveNewTabParent: 'last_child',
  moveNewTabParentActPanel: false,
  moveNewTab: 'end',

  // Pinned tabs
  pinnedTabsPosition: 'panel',
  pinnedTabsList: false,
  pinnedAutoGroup: false,

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
  treeRmOutdent: 'branch',

  // Bookmarks
  warnOnMultiBookmarkDelete: 'collapsed',
  openBookmarkNewTab: false,
  midClickBookmark: 'open_new_tab',
  actMidClickTab: false,
  midClickBookmarkDel: false,
  autoCloseBookmarks: false,
  autoRemoveOther: false,
  highlightOpenBookmarks: false,
  activateOpenBookmarkTab: false,
  showBookmarkLen: false,
  bookmarksRmUndoNote: true,
  loadBookmarksOnDemand: true,
  pinOpenedBookmarksFolder: true,

  // History
  loadHistoryOnDemand: true,

  // Downloads
  loadDownloadsOnDemand: true,
  showNotifOnDownloadOk: false,
  showNotifOnDownloadErr: false,

  // Appearance
  fontSize: 'm',
  animations: true,
  animationSpeed: 'fast',
  theme: 'proton',
  colorScheme: 'ff',
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
  hScrollThroughPanels: true,
  scrollThroughTabs: 'none',
  scrollThroughVisibleTabs: false,
  scrollThroughTabsSkipDiscarded: false,
  scrollThroughTabsExceptOverflow: true,
  scrollThroughTabsCyclic: false,
  longClickDelay: 500,
  tabDoubleClick: 'none',
  tabsSecondClickActPrev: true,
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

// prettier-ignore
export const SETTINGS_OPTIONS = {
  navActTabsPanelLeftClickAction: ['new_tab', 'none'],
  navActBookmarksPanelLeftClickAction: ['scroll', 'none'],
  navTabsPanelMidClickAction: ['rm_act_tab', 'rm_all', 'none'],

  groupLayout: ['grid', 'list'],
  scrollThroughTabs: ['panel', 'global', 'none'],
  discardFoldedDelayUnit: ['sec', 'min'],
  tabDoubleClick: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'exp', 'new_after',
    'new_child', 'close', 'none'],
  tabLongLeftClick: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after',
    'new_child', 'none'],
  tabLongRightClick: ['reload', 'duplicate', 'pin', 'mute', 'clear_cookies', 'new_after',
    'new_child', 'none'],
  tabsPanelLeftClickAction: ['prev', 'expand', 'parent', 'none'],
  tabsPanelDoubleClickAction: ['collapse', 'tab', 'undo', 'none'],
  tabsPanelRightClickAction: ['next', 'expand', 'parent', 'menu', 'none'],
  tabsPanelMiddleClickAction: ['rm_act_tab', 'tab', 'undo', 'none'],
  activateAfterClosing: ['prev_act', 'next', 'prev', 'none'],
  pinnedTabsPosition: ['panel', 'top', 'left', 'right'],
  tabsTreeLimit: [1, 2, 3, 4, 5, 'none'],
  rmChildTabs: ['all', 'folded', 'none'],
  fontSize: ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'],
  theme: ['proton', 'compact', 'plain', 'none'],
  colorScheme: ['dark', 'light', 'sys', 'ff'],
  snapIntervalUnit: ['min', 'hr', 'day'],
  snapLimitUnit: ['snap', 'kb', 'day'],
  moveNewTabPin: ['start', 'end', 'none'],
  moveNewTabParent: [
    'before', 'sibling', 'first_child', 'last_child', 'start', 'end', 'default', 'none'
  ],
  moveNewTab: ['start', 'end', 'before', 'after', 'first_child', 'last_child', 'none'],
  midClickBookmark: ['open_new_tab', 'edit', 'delete'],
  warnOnMultiTabClose: ['any', 'collapsed', 'none'],
  warnOnMultiBookmarkDelete: ['any', 'collapsed', 'none'],
  navBarLayout: ['horizontal', 'vertical', 'hidden'],
  navBarSide: ['left', 'right'],
  navBarHorLayout: ['inline', 'wrap'],
  navBarVertLayout: ['left', 'right'],
  autoFoldTabsExcept: [1, 2, 3, 4, 5, 'none'],
  dndTabActMod: ['alt', 'shift', 'ctrl', 'none'],
  dndExp: ['pointer', 'hover', 'none'],
  dndExpMod: ['alt', 'shift', 'ctrl', 'none'],
  animationSpeed: ['fast', 'norm', 'slow'],
  treeRmOutdent: ['branch', 'first_child'],
  searchBarMode: ['static', 'dynamic', 'none'],
  newTabBarPosition: ['after_tabs', 'bottom'],
  logLvl: [3, 2, 1, 0],
} as const
