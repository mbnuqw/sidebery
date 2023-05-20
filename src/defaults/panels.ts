import { translate } from 'src/dict'
import { PanelType, BookmarksPanelConfig, BookmarksPanel } from 'src/types'
import { TabsPanelConfig, TabsPanel } from 'src/types'
import { HistoryPanelConfig, HistoryPanel } from 'src/types'
import { NavItemClass } from 'src/types/sidebar'

export const BOOKMARKS_PANEL_CONFIG: BookmarksPanelConfig = {
  type: PanelType.bookmarks,
  id: '',
  name: '',
  iconSVG: 'icon_bookmarks',
  iconIMGSrc: '',
  iconIMG: '',
  color: 'toolbar',
  lockedPanel: false,
  tempMode: false,
  skipOnSwitching: false,
  rootId: 'root________',
  viewMode: 'tree',
  autoConvert: false,
  srcPanelConfig: null,
}
export const BOOKMARKS_PANEL_STATE: BookmarksPanel = {
  ...BOOKMARKS_PANEL_CONFIG,

  class: NavItemClass.panel,
  index: -1,
  topOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  bottomOffset: 0,
  scrollEl: null,
  scrollComponent: null,
  bounds: [],
  ready: false,

  reactive: {
    name: '',
    color: 'toolbar',
    iconSVG: 'icon_bookmarks',
    iconIMG: '',
    tooltip: '',
    sel: false,
    len: 0,
    filteredLen: undefined,
    loading: false,
    ready: false,

    bookmarks: [],
    filteredBookmarks: undefined,
    viewMode: 'tree',
    rootOffset: 0,
  },
}

export const TABS_PANEL_CONFIG: TabsPanelConfig = {
  type: PanelType.tabs,
  id: '',
  name: '',
  color: 'toolbar',
  iconSVG: 'icon_tabs',
  iconIMGSrc: '',
  iconIMG: '',
  lockedPanel: false,
  skipOnSwitching: false,
  noEmpty: false,
  newTabCtx: 'none',
  dropTabCtx: 'none',
  moveRules: [],
  moveExcludedTo: -1,
  bookmarksFolderId: -1,
  newTabBtns: [],
  srcPanelConfig: null,
}
export const TABS_PANEL_STATE: TabsPanel = {
  ...TABS_PANEL_CONFIG,

  tabs: [],
  pinnedTabs: [],
  filteredTabs: undefined,
  updatedTabs: [],
  selNewTab: false,
  startTabIndex: -1,
  endTabIndex: -1,
  nextTabIndex: -1,
  scrollRetainer: 0,
  allDiscarded: false,

  class: NavItemClass.panel,
  index: -1,
  topOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  bottomOffset: 0,
  scrollEl: null,
  scrollComponent: null,
  bounds: [],
  ready: true,

  reactive: {
    name: '',
    color: 'toolbar',
    iconSVG: 'icon_tabs',
    iconIMG: undefined,
    tooltip: '',
    sel: false,
    len: 0,
    filteredLen: undefined,
    loading: false,
    ready: true,

    tabs: [],
    pinnedTabs: [],
    filteredTabs: undefined,
    updated: false,
    selNewTab: false,
    scrollRetainer: 0,
    empty: true,
    allDiscarded: false,
    newTabCtx: 'none',
    newTabBtns: [],
  },
}

export const HISTORY_PANEL_CONFIG: HistoryPanelConfig = {
  type: PanelType.history,
  id: 'history',
  name: translate('panel.history.title'),
  color: 'toolbar',
  iconSVG: 'icon_clock',
  tempMode: false,
  lockedPanel: false,
  skipOnSwitching: false,
  viewMode: 'history',
}
export const HISTORY_PANEL_STATE: HistoryPanel = {
  ...HISTORY_PANEL_CONFIG,

  class: NavItemClass.panel,
  index: -1,
  topOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  bottomOffset: 0,
  scrollEl: null,
  scrollComponent: null,
  bounds: [],
  ready: false,

  reactive: {
    name: '',
    color: 'toolbar',
    iconSVG: 'icon_tabs',
    iconIMG: undefined,
    tooltip: '',
    sel: false,
    len: 0,
    filteredLen: undefined,
    loading: false,
    ready: false,
  },
}

export const NAV_BTNS_IDS: ID[] = [
  'settings',
  'add_tp',
  'search',
  'create_snapshot',
  'remute_audio_tabs',
  'collapse',
]
