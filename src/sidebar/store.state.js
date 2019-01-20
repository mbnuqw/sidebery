import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from './settings.js'
import Manifest from '../../addon/manifest.json'
import { Translate } from '../mixins/dict'
import BookmarksDashboard from './components/dashboards/bookmarks.vue'
import BookmarksPanel from './components/panels/bookmarks.vue'
import DefaultTabsDashboard from './components/dashboards/default-tabs.vue'

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'
export const DEFAULT_PANELS = [
  {
    name: Translate('bookmarks_dashboard.title'),
    icon: 'icon_bookmarks',
    component: BookmarksDashboard,
    panel: BookmarksPanel,
  },
  {
    name: Translate('pinned_dashboard.title'),
    icon: 'icon_pin',
    component: DefaultTabsDashboard,
    pinned: true,
  },
  {
    name: Translate('private_dashboard.title'),
    icon: 'icon_tabs',
    cookieStoreId: PRIVATE_CTX,
    component: DefaultTabsDashboard,
    private: true,
  },
  {
    name: Translate('default_dashboard.title'),
    icon: 'icon_tabs',
    cookieStoreId: DEFAULT_CTX,
    component: DefaultTabsDashboard,
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
  permissions: [],

  // --- Global State
  ctxMenu: null,
  winChoosing: false,
  syncedPanels: [],
  synced: {},
  lastSyncPanels: null,
  lockedTabs: [],
  lockedPanels: [],
  proxiedPanels: [],
  dashboardOpened: false,
  recalcScrollNeeded: false,
  selectedTabs: [],
  updatedTabs: {},
  snapshots: [],
  permAllUrls: false,
  permTabHide: false,
  wheelBlockTimeout: null,
  customStyles: {
    bg: null,
    title_fg: null,
    sub_title_fg: null,
    label_fg: null,
    label_fg_hover: null,
    label_fg_active: null,
    info_fg: null,
    true_fg: null,
    false_fg: null,
    active_fg: null,
    inactive_fg: null,
    favicons_placehoder_bg: null,

    btn_bg: null,
    btn_bg_hover: null,
    btn_bg_active: null,
    btn_fg: null,
    btn_fg_hover: null,
    btn_fg_active: null,

    scroll_progress_h: null,
    scroll_progress_bg: null,

    ctx_menu_bg: null,
    ctx_menu_bg_hover: null,
    ctx_menu_fg: null,

    nav_btn_fg: null,

    tabs_fg: null,
    tabs_fg_hover: null,
    tabs_fg_active: null,
    tabs_activated_bg: null,
    tabs_activated_fg: null,
    tabs_selected_bg: null,
    tabs_selected_fg: null,

    bookmarks_node_title_fg: null,
    bookmarks_node_title_fg_hover: null,
    bookmarks_node_title_fg_active: null,
    bookmarks_folder_closed_fg: null,
    bookmarks_folder_closed_fg_hover: null,
    bookmarks_folder_closed_fg_active: null,
    bookmarks_folder_open_fg: null,
    bookmarks_folder_open_fg_hover: null,
    bookmarks_folder_open_fg_active: null,
    bookmarks_folder_empty_fg: null,
  },

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