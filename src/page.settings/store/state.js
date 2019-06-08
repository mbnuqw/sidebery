import Manifest from '../../../addon/manifest.json'
import { translate } from '../../mixins/dict'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../settings.js'
import { CUSTOM_CSS_VARS } from '../../settings.js'

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'
export const DEFAULT_PANELS = [
  {
    type: 'bookmarks',
    id: 'bookmarks',
    name: translate('bookmarks_dashboard.title'),
    icon: 'icon_bookmarks',
    dashboard: 'BookmarksDashboard',
    panel: 'BookmarksPanel',
    lockedPanel: false,
    bookmarks: true,
  },
  {
    type: 'private',
    id: PRIVATE_CTX,
    name: translate('private_dashboard.title'),
    icon: 'icon_tabs',
    cookieStoreId: PRIVATE_CTX,
    dashboard: 'DefaultTabsDashboard',
    panel: 'TabsPanel',
    private: true,
  },
  {
    type: 'default',
    id: DEFAULT_CTX,
    name: translate('default_dashboard.title'),
    icon: 'icon_tabs',
    cookieStoreId: DEFAULT_CTX,
    dashboard: 'DefaultTabsDashboard',
    panel: 'TabsPanel',
    lockedTabs: false,
    lockedPanel: false,
    proxyConfig: null,
    noEmpty: false,
    lastActiveTab: -1,
  },
]

export const DEFAULT_TABS_MENU = [
  ['undoRmTab', 'mute', 'reload', 'bookmark'],
  'moveToNewWin',
  'moveToNewPrivWin',
  'moveToAnotherWin',
  'moveToWin',
  'moveToCtr',
  'pin',
  'discard',
  'group',
  'flatten',
  'clearCookies',
  'close',
]

export const DEFAULT_BOOKMARKS_MENU = [
  'openInNewWin',
  'openInNewPrivWin',
  'openInCtr',
  'createBookmark',
  'createFolder',
  'createSeparator',
  'edit',
  'delete',
]

export default {
  version: Manifest.version,
  osInfo: null,
  os: null,
  ffInfo: null,
  ffVer: null,
  private: browser.extension.inIncognitoContext,
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

  ctxs: [],
  containers: [],
  tabs: [],
  updatedTabs: {},

  bookmarks: [],
  bookmarkEditor: false,
  bookmarkEditorTarget: null,

  // --- Settings
  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  customStyles: CUSTOM_CSS_VARS,
  snapshots: [],
  keybindings: [],
  permAllUrls: false,
  permTabHide: false,
  settingsLoaded: false,

  // --- Cached
  favicons: {},
}