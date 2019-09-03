import Manifest from '../../../addon/manifest.json'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../defaults'
import { DEFAULT_TABS_MENU } from '../../defaults'
import { DEFAULT_BOOKMARKS_MENU } from '../../defaults'

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
  snapshots: [],
  keybindings: [],

  permAllUrls: false,
  permTabHide: false,
}