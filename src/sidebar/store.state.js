import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from './settings.js'
import Manifest from '../../addon/manifest.json'
import { Translate } from '../mixins/dict'
import BookmarksMenu from './components/bookmarks.menu.vue'
import BookmarksPanel from './components/bookmarks.vue'
import TabsDefaultMenu from './components/tabs.default.menu.vue'

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
  syncPanels: [],
  lastSyncPanels: null,
  settingsOpened: false,
  panelMenuOpened: false,
  recalcScrollNeeded: false,

  lastPanelIndex: browser.extension.inIncognitoContext ? 2 : 3,
  panelIndex: browser.extension.inIncognitoContext ? 2 : 3,
  
  tabs: [], // all tabs
  activeTabs: [], // last active tab's id per panel
  ctxs: [], // all contextual identities

  bookmarks: [],

  // --- Settings
  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  settingsLoaded: false,
  keybindings: [],

  // --- Cached
  favicons: {},
}