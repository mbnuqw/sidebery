import { SETTINGS_OPTIONS } from '../defaults'

export interface SettingsState {
  // General
  version?: string // DEPR
  nativeScrollbars: boolean
  nativeScrollbarsThin: boolean
  selWinScreenshots: boolean
  updateSidebarTitle: boolean
  markWindow: boolean
  markWindowPreface: string
  logLvl: typeof SETTINGS_OPTIONS.logLvl[number]

  // Context menu
  ctxMenuNative: boolean
  ctxMenuRenderInact: boolean
  ctxMenuRenderIcons: boolean
  ctxMenuIgnoreContainers: string

  // Nav bar
  navBarLayout: typeof SETTINGS_OPTIONS.navBarLayout[number]
  navBarInline: boolean
  navBarSide: typeof SETTINGS_OPTIONS.navBarSide[number]
  hideAddBtn: boolean // DEPR
  hideSettingsBtn: boolean // DEPR
  navBtnCount: boolean
  skipEmptyPanels: boolean
  hideEmptyPanels: boolean
  navSwitchPanelsWheel: boolean
  navActTabsPanelLeftClickAction: typeof SETTINGS_OPTIONS.navActTabsPanelLeftClickAction[number]
  navActBookmarksPanelLeftClickAction: typeof SETTINGS_OPTIONS.navActBookmarksPanelLeftClickAction[number]
  navTabsPanelMidClickAction: typeof SETTINGS_OPTIONS.navTabsPanelMidClickAction[number]
  navBookmarksPanelMidClickAction: typeof SETTINGS_OPTIONS.navBookmarksPanelMidClickAction[number]

  // Group page
  groupLayout: typeof SETTINGS_OPTIONS.groupLayout[number]

  // Drag and drop
  dndTabAct: boolean
  dndTabActDelay: number
  dndTabActMod: typeof SETTINGS_OPTIONS.dndTabActMod[number]
  dndExp: typeof SETTINGS_OPTIONS.dndExp[number]
  dndExpDelay: number
  dndExpMod: typeof SETTINGS_OPTIONS.dndExpMod[number]

  // Search
  searchBarMode: typeof SETTINGS_OPTIONS.searchBarMode[number]

  // Tabs
  warnOnMultiTabClose: typeof SETTINGS_OPTIONS.warnOnMultiTabClose[number]
  activateOnMouseUp: boolean
  activateLastTabOnPanelSwitching: boolean
  showTabRmBtn: boolean
  showTabCtx: boolean
  hideInact: boolean
  activateAfterClosing: typeof SETTINGS_OPTIONS.activateAfterClosing[number]
  activateAfterClosingGlobal: boolean
  activateAfterClosingNoFolded: boolean
  activateAfterClosingNoDiscarded: boolean
  shiftSelAct: boolean
  askNewBookmarkPlace: boolean
  tabsRmUndoNote: boolean
  nativeHighlight: boolean
  tabsUnreadMark: boolean
  tabsReloadLimit: number
  tabsReloadLimitNotif: boolean
  showNewTabBtns: boolean
  newTabBarPosition: typeof SETTINGS_OPTIONS.newTabBarPosition[number]
  tabsPanelSwitchActMove: boolean

  // New tab position
  moveNewTabPin: typeof SETTINGS_OPTIONS.moveNewTabPin[number]
  moveNewTabParent: typeof SETTINGS_OPTIONS.moveNewTabParent[number]
  moveNewTabParentActPanel: boolean
  moveNewTab: typeof SETTINGS_OPTIONS.moveNewTab[number]

  // Pinned tabs
  pinnedTabsPosition: typeof SETTINGS_OPTIONS.pinnedTabsPosition[number]
  pinnedTabsList: boolean
  pinnedAutoGroup: boolean

  // Tabs tree
  tabsTree: boolean
  groupOnOpen: boolean
  tabsTreeLimit: typeof SETTINGS_OPTIONS.tabsTreeLimit[number]
  hideFoldedTabs: boolean
  autoFoldTabs: boolean
  autoFoldTabsExcept: typeof SETTINGS_OPTIONS.autoFoldTabsExcept[number]
  autoExpandTabs: boolean
  rmChildTabs: typeof SETTINGS_OPTIONS.rmChildTabs[number]
  tabsChildCount: boolean
  tabsLvlDots: boolean
  discardFolded: boolean
  discardFoldedDelay: number
  discardFoldedDelayUnit: typeof SETTINGS_OPTIONS.discardFoldedDelayUnit[number]
  tabsTreeBookmarks: boolean
  treeRmOutdent: typeof SETTINGS_OPTIONS.treeRmOutdent[number]

  // Bookmarks
  bookmarksPanel?: boolean // DEPR
  warnOnMultiBookmarkDelete: typeof SETTINGS_OPTIONS.warnOnMultiBookmarkDelete[number]
  openBookmarkNewTab: boolean
  midClickBookmark: typeof SETTINGS_OPTIONS.midClickBookmark[number]
  actMidClickTab: boolean
  autoCloseBookmarks: boolean
  autoRemoveOther: boolean
  highlightOpenBookmarks: boolean
  activateOpenBookmarkTab: boolean
  showBookmarkLen: boolean
  bookmarksRmUndoNote: boolean
  loadBookmarksOnDemand: boolean
  pinOpenedBookmarksFolder: boolean

  // History
  loadHistoryOnDemand: boolean

  // Downloads
  loadDownloadsOnDemand: boolean
  showNotifOnDownloadOk: boolean
  showNotifOnDownloadErr: boolean

  // Appearance
  fontSize: typeof SETTINGS_OPTIONS.fontSize[number]
  bgNoise?: boolean // DEPR
  animations: boolean
  animationSpeed: typeof SETTINGS_OPTIONS.animationSpeed[number]
  theme: typeof SETTINGS_OPTIONS.theme[number]
  colorScheme: typeof SETTINGS_OPTIONS.colorScheme[number]
  style?: string // DEPR
  sidebarCSS: boolean
  groupCSS: boolean

  // Snapshots
  snapNotify: boolean
  snapExcludePrivate: boolean
  snapInterval: number
  snapIntervalUnit: typeof SETTINGS_OPTIONS.snapIntervalUnit[number]
  snapLimit: number
  snapLimitUnit: typeof SETTINGS_OPTIONS.snapLimitUnit[number]

  // Mouse
  hScrollThroughPanels: boolean
  scrollThroughTabs: typeof SETTINGS_OPTIONS.scrollThroughTabs[number]
  scrollThroughVisibleTabs: boolean
  scrollThroughTabsSkipDiscarded: boolean
  scrollThroughTabsExceptOverflow: boolean
  scrollThroughTabsCyclic: boolean
  longClickDelay: number
  tabDoubleClick: typeof SETTINGS_OPTIONS.tabDoubleClick[number]
  tabsSecondClickActPrev: boolean
  tabLongLeftClick: typeof SETTINGS_OPTIONS.tabLongLeftClick[number]
  tabLongRightClick: typeof SETTINGS_OPTIONS.tabLongRightClick[number]
  tabCloseMiddleClick: typeof SETTINGS_OPTIONS.tabCloseMiddleClick[number]
  tabsPanelLeftClickAction: typeof SETTINGS_OPTIONS.tabsPanelLeftClickAction[number]
  tabsPanelDoubleClickAction: typeof SETTINGS_OPTIONS.tabsPanelDoubleClickAction[number]
  tabsPanelRightClickAction: typeof SETTINGS_OPTIONS.tabsPanelRightClickAction[number]
  tabsPanelMiddleClickAction: typeof SETTINGS_OPTIONS.tabsPanelMiddleClickAction[number]

  // Sync
  syncName: string
  syncSaveSettings: boolean
  syncSaveCtxMenu: boolean
  syncSaveStyles: boolean
  syncAutoApply: boolean
}
