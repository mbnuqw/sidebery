import { SETTINGS_OPTIONS } from '../defaults'

export interface SettingsState {
  // General
  version?: string // DEPR
  nativeScrollbars: boolean
  nativeScrollbarsThin: boolean
  nativeScrollbarsLeft: boolean
  selWinScreenshots: boolean
  updateSidebarTitle: boolean
  markWindow: boolean
  markWindowPreface: string

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
  navSwitchPanelsDelay: number
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
  dndOutside: typeof SETTINGS_OPTIONS.dndOutside[number]

  // Search
  searchBarMode: typeof SETTINGS_OPTIONS.searchBarMode[number]

  // Tabs
  warnOnMultiTabClose: typeof SETTINGS_OPTIONS.warnOnMultiTabClose[number]
  activateLastTabOnPanelSwitching: boolean
  showTabRmBtn: boolean
  hideInact: boolean
  activateAfterClosing: typeof SETTINGS_OPTIONS.activateAfterClosing[number]
  activateAfterClosingFallbackToHistory: boolean
  activateAfterClosingStayInPanel: boolean
  activateAfterClosingGlobal: boolean
  activateAfterClosingNoFolded: boolean
  activateAfterClosingNoDiscarded: boolean
  askNewBookmarkPlace: boolean
  tabsRmUndoNote: boolean
  nativeHighlight: boolean
  tabsUnreadMark: boolean
  tabsUpdateMark: typeof SETTINGS_OPTIONS.tabsUpdateMark[number]
  tabsReloadLimit: number
  tabsReloadLimitNotif: boolean
  showNewTabBtns: boolean
  newTabBarPosition: typeof SETTINGS_OPTIONS.newTabBarPosition[number]
  tabsPanelSwitchActMove: boolean
  tabsUrlInTooltip: typeof SETTINGS_OPTIONS.tabsUrlInTooltip[number]
  openSubPanelOnMouseHover: boolean

  // New tab position
  moveNewTabPin: typeof SETTINGS_OPTIONS.moveNewTabPin[number]
  moveNewTabParent: typeof SETTINGS_OPTIONS.moveNewTabParent[number]
  moveNewTabParentActPanel: boolean
  moveNewTab: typeof SETTINGS_OPTIONS.moveNewTab[number]
  moveNewTabActivePin: typeof SETTINGS_OPTIONS.moveNewTabActivePin[number]

  // Pinned tabs
  pinnedTabsPosition: typeof SETTINGS_OPTIONS.pinnedTabsPosition[number]
  pinnedTabsList: boolean
  pinnedAutoGroup: boolean

  // Tabs tree
  tabsTree: boolean
  groupOnOpen: boolean
  tabsTreeLimit: typeof SETTINGS_OPTIONS.tabsTreeLimit[number]
  hideFoldedTabs: boolean
  hideFoldedParent: typeof SETTINGS_OPTIONS.hideFoldedParent[number]
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

  // Tabs colorization
  colorizeTabs: boolean
  colorizeTabsSrc: typeof SETTINGS_OPTIONS.colorizeTabsSrc[number]
  colorizeTabsBranches: boolean
  colorizeTabsBranchesSrc: typeof SETTINGS_OPTIONS.colorizeTabsBranchesSrc[number]
  inheritCustomColor: boolean

  // Bookmarks
  bookmarksPanel?: boolean // DEPR
  warnOnMultiBookmarkDelete: typeof SETTINGS_OPTIONS.warnOnMultiBookmarkDelete[number]
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

  // Appearance
  fontSize: typeof SETTINGS_OPTIONS.fontSize[number]
  bgNoise?: boolean // DEPR
  animations: boolean
  animationSpeed: typeof SETTINGS_OPTIONS.animationSpeed[number]
  theme: typeof SETTINGS_OPTIONS.theme[number]
  density: typeof SETTINGS_OPTIONS.density[number]
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
  hScrollThroughPanels?: boolean // DEPR
  hScrollAction: typeof SETTINGS_OPTIONS.hScrollAction[number]
  scrollThroughTabs: typeof SETTINGS_OPTIONS.scrollThroughTabs[number]
  scrollThroughVisibleTabs: boolean
  scrollThroughTabsSkipDiscarded: boolean
  scrollThroughTabsExceptOverflow: boolean
  scrollThroughTabsCyclic: boolean
  scrollThroughTabsScrollArea: number
  autoMenuMultiSel: boolean
  multipleMiddleClose: boolean
  longClickDelay: number
  wheelThreshold: boolean
  wheelThresholdX: number
  wheelThresholdY: number
  tabDoubleClick: typeof SETTINGS_OPTIONS.tabDoubleClick[number]
  tabsSecondClickActPrev: boolean
  shiftSelAct: boolean
  activateOnMouseUp: boolean
  tabLongLeftClick: typeof SETTINGS_OPTIONS.tabLongLeftClick[number]
  tabLongRightClick: typeof SETTINGS_OPTIONS.tabLongRightClick[number]
  tabCloseMiddleClick: typeof SETTINGS_OPTIONS.tabCloseMiddleClick[number]
  tabsPanelLeftClickAction: typeof SETTINGS_OPTIONS.tabsPanelLeftClickAction[number]
  tabsPanelDoubleClickAction: typeof SETTINGS_OPTIONS.tabsPanelDoubleClickAction[number]
  tabsPanelRightClickAction: typeof SETTINGS_OPTIONS.tabsPanelRightClickAction[number]
  tabsPanelMiddleClickAction: typeof SETTINGS_OPTIONS.tabsPanelMiddleClickAction[number]
  newTabMiddleClickAction: typeof SETTINGS_OPTIONS.newTabAction[number]
  bookmarksLeftClickAction: typeof SETTINGS_OPTIONS.bookmarksLeftClickAction[number]
  bookmarksLeftClickActivate: boolean
  bookmarksLeftClickPos: typeof SETTINGS_OPTIONS.bookmarksNewTabPos[number]
  bookmarksMidClickAction: typeof SETTINGS_OPTIONS.bookmarksMidClickAction[number]
  bookmarksMidClickActivate: boolean
  bookmarksMidClickPos: typeof SETTINGS_OPTIONS.bookmarksNewTabPos[number]

  // Sync
  syncName: string
  syncSaveSettings: boolean
  syncSaveCtxMenu: boolean
  syncSaveStyles: boolean
  syncSaveKeybindings: boolean
}
