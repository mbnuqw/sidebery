import { translate } from 'src/dict'
import { PanelType, BookmarksPanelConfig, BookmarksPanel } from 'src/types'
import { TabsPanelConfig, TabsPanel } from 'src/types'
import { HistoryPanelConfig, HistoryPanel } from 'src/types'
import { NavItemClass } from 'src/types/sidebar'

export const BOOKMARKS_PANEL: BookmarksPanelConfig = {
  type: PanelType.bookmarks,
  id: '',
  name: translate('panel.bookmarks.title'),
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
}
export const BOOKMARKS_PANEL_STATE: BookmarksPanel = {
  ...BOOKMARKS_PANEL,
  class: NavItemClass.panel,
  bookmarks: [],
  len: 0,
  index: -1,
  sel: false,
  loading: false,
  topOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  scrollEl: null,
  scrollComponent: null,
  bounds: [],
  ready: false,
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
  moveTabCtx: 'none',
  moveTabCtxNoChild: true,
  urlRulesActive: false,
  urlRules: '',
  bookmarksFolderId: -1,
  newTabBtns: [],
}
export const TABS_PANEL_STATE: TabsPanel = {
  ...TABS_PANEL_CONFIG,
  class: NavItemClass.panel,
  len: 0,
  index: -1,
  sel: false,
  loading: false,
  topOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  scrollEl: null,
  scrollComponent: null,
  bounds: [],
  ready: true,

  updatedTabs: [],
  actTabs: [],
  startTabIndex: -1,
  endTabIndex: -1,
  nextTabIndex: -1,
  tabs: [],
  pinnedTabs: [],
  selNewTab: false,
}

export const HISTORY_PANEL: HistoryPanelConfig = {
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
  ...HISTORY_PANEL,
  class: NavItemClass.panel,
  len: 0,
  index: -1,
  sel: false,
  loading: false,
  topOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  scrollEl: null,
  scrollComponent: null,
  bounds: [],
  ready: false,
}

export const NAV_BTNS_IDS: ID[] = [
  'settings',
  'add_tp',
  'search',
  'create_snapshot',
  'remute_audio_tabs',
]
