import Manifest from '../../../addon/manifest.json'
import Utils from '../../utils'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../defaults'
import { DEFAULT_TABS_MENU } from '../../defaults'
import { DEFAULT_BOOKMARKS_MENU } from '../../defaults'

export default {
  version: Manifest.version,
  osInfo: null,
  os: null,
  private: browser.extension.inIncognitoContext,
  windowId: 0,
  windowFocused: true,

  width: 250,
  tabHeight: 30,
  navBtnWidth: 34,

  tabsMenu: Utils.cloneArray(DEFAULT_TABS_MENU),
  bookmarksMenu: Utils.cloneArray(DEFAULT_BOOKMARKS_MENU),

  // --- Global State
  ctxMenu: null,
  winChoosing: false,

  dashboardIsOpen: false,
  dashboard: null,
  recalcScrollNeeded: false,
  selected: [],
  wheelBlockTimeout: null,

  lastPanelIndex: 1,
  panelIndex: 1,

  containers: [],
  panels: [],
  tabs: [],

  bookmarks: [],
  bookmarksCount: 0,
  bookmarkEditor: false,
  bookmarkEditorTarget: null,

  // --- Settings
  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  snapshots: [],
  keybindings: [],
  permAllUrls: false,
  permTabHide: false,

  // --- Cached
  favicons: [],
  favUrls: {},
}
