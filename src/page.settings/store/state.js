import Manifest from '../../../addon/manifest.json'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../defaults'
import { CUSTOM_CSS_VARS } from '../../defaults'

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'

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

  activeView: 'Settings',
  highlight: {
    allUrls: false,
    tabHide: false,
  },

  tabsMenu: JSON.parse(JSON.stringify(DEFAULT_TABS_MENU)),
  bookmarksMenu: JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS_MENU)),

  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  settingsLoaded: false,
  customStyles: CUSTOM_CSS_VARS,
  snapshots: [],
  keybindings: [],

  permAllUrls: false,
  permTabHide: false,
}