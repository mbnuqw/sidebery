import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from './settings.js'
import Manifest from '../../addon/manifest.json'
import { Translate } from '../mixins/dict'
import BookmarksMenu from './bookmarks.menu.vue'
import BookmarksPanel from './bookmarks.vue'
import TabsDefaultMenu from './tabs.default.menu.vue'

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'
export const DEFAULT_PANELS = [
  {
    name: Translate('bookmarks_menu.title'),
    icon: 'icon_bookmarks',
    menu: BookmarksMenu,
    panel: BookmarksPanel,
  },
  {
    name: Translate('pinned_tabs_menu.title'),
    icon: 'icon_pin',
    menu: TabsDefaultMenu,
    pinned: true,
  },
  {
    name: Translate('private_tabs_menu.title'),
    icon: 'icon_tabs',
    cookieStoreId: 'firefox-private',
    menu: TabsDefaultMenu,
    private: true,
  },
  {
    name: Translate('default_tabs_menu.title'),
    icon: 'icon_tabs',
    cookieStoreId: 'firefox-default',
    menu: TabsDefaultMenu,
  },
]

export default {
  localID: '',
  version: Manifest.version,
  osInfo: null,
  os: null,
  ffInfo: null,
  ffVer: null,
  private: browser.extension.inIncognitoContext,
  windowId: 0,
  windowFocused: true,

  // --- Global State
  ctxMenu: null,
  winChoosing: false,
  // activePanel: 3,
  syncPanels: [],
  lastSyncPanels: null,

  lastPanelIndex: 3, // last active panel's index
  panelIndex: 3, // current panel's index
  
  tabs: [], // all tabs
  activeTabs: [], // last active tab's id per panel
  ctxs: [], // all contextual identities

  // --- Settings
  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  settingsLoaded: false,
  keybindings: [],

  // --- Cached
  favicons: {},
}