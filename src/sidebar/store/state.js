import Manifest from '../../../addon/manifest.json'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../settings.js'
import { DEFAULT_TABS_MENU } from '../config/tabs-menu'
import { DEFAULT_BOOKMARKS_MENU } from '../config/bookmarks-menu'
import { PRIVATE_CTX, DEFAULT_CTX, DEFAULT_PANELS } from '../config/panels'

export default {
  version: Manifest.version,
  osInfo: null,
  os: null,
  ffInfo: null,
  ffVer: null,
  private: browser.extension.inIncognitoContext,
  defaultCtxId: browser.extension.inIncognitoContext ? PRIVATE_CTX : DEFAULT_CTX,
  defaultPanel: browser.extension.inIncognitoContext ? DEFAULT_PANELS[1] : DEFAULT_PANELS[2],
  windowId: 0,
  windowFocused: true,
  tabHeight: 30,

  tabsMenu: JSON.parse(JSON.stringify(DEFAULT_TABS_MENU)),
  bookmarksMenu: JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS_MENU)),

  // --- Global State
  ctxMenu: null,
  winChoosing: false,

  dashboardOpened: false,
  recalcScrollNeeded: false,
  selected: [],
  wheelBlockTimeout: null,

  lastPanelIndex: browser.extension.inIncognitoContext ? 1 : 2,
  panelIndex: browser.extension.inIncognitoContext ? 1 : 2,

  containers: [],
  panels: [],
  tabs: [],
  updatedTabs: {},

  bookmarks: [],
  bookmarkEditor: false,
  bookmarkEditorTarget: null,

  // --- Settings
  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  snapshots: [],
  keybindings: [],
  permAllUrls: false,
  permTabHide: false,
  settingsLoaded: false,

  // --- Cached
  favicons: {},
}