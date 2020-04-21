import Manifest from '../../../addon/manifest.json'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../../addon/defaults'
import { DEFAULT_TABS_MENU } from '../../../addon/defaults'
import { DEFAULT_TABS_PANEL_MENU } from '../../../addon/defaults'
import { DEFAULT_BOOKMARKS_MENU } from '../../../addon/defaults'
import { BOOKMARKS_PANEL_MENU } from '../../../addon/defaults'

export default {
  version: Manifest.version,
  osInfo: null,
  os: null,
  ffInfo: null,
  ffVer: null,
  private: browser.extension.inIncognitoContext,
  windowId: 0,
  windowFocused: true,

  activeView: 'Settings',
  activeSection: 'settings_general',
  selectedContainer: null,
  selectedPanel: null,
  exportConfig: false,
  importConfig: false,
  navLock: false,
  highlightedField: '',

  containers: {},
  panels: [],

  tabsMenu: JSON.parse(JSON.stringify(DEFAULT_TABS_MENU)),
  tabsPanelMenu: JSON.parse(JSON.stringify(DEFAULT_TABS_PANEL_MENU)),
  bookmarksMenu: JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS_MENU)),
  bookmarksPanelMenu: JSON.parse(JSON.stringify(BOOKMARKS_PANEL_MENU)),

  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  snapshots: [],
  keybindings: [],

  permAllUrls: false,
  permTabHide: false,
  permClipboardWrite: false,
  permWebRequestBlocking: false,

  dbgDetails: '',
}
