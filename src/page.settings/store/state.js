import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from '../../settings.js'
import Manifest from '../../addon/manifest.json'
import { Translate } from '../../mixins/dict'

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'
export const DEFAULT_PANELS = [
  {
    type: 'bookmarks',
    id: 'bookmarks',
    name: Translate('bookmarks_dashboard.title'),
    icon: 'icon_bookmarks',
    dashboard: 'BookmarksDashboard',
    panel: 'BookmarksPanel',
    lockedPanel: false,
    bookmarks: true,
  },
  {
    type: 'private',
    id: PRIVATE_CTX,
    name: Translate('private_dashboard.title'),
    icon: 'icon_tabs',
    cookieStoreId: PRIVATE_CTX,
    dashboard: 'DefaultTabsDashboard',
    panel: 'TabsPanel',
    private: true,
  },
  {
    type: 'default',
    id: DEFAULT_CTX,
    name: Translate('default_dashboard.title'),
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
export const CUSTOM_STYLES = {
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

  ctx_menu_font: null,
  ctx_menu_bg: null,
  ctx_menu_bg_hover: null,
  ctx_menu_fg: null,

  nav_btn_fg: null,
  nav_btn_width: null,
  nav_btn_height: null,

  pinned_dock_overlay_bg: null,
  pinned_dock_overlay_shadow: null,

  tabs_height: null,
  tabs_indent: null,
  tabs_font: null,
  tabs_count_font: null,
  tabs_fg: null,
  tabs_fg_hover: null,
  tabs_fg_active: null,
  tabs_bg_hover: null,
  tabs_bg_active: null,
  tabs_activated_bg: null,
  tabs_activated_fg: null,
  tabs_selected_bg: null,
  tabs_selected_fg: null,
  tabs_border: null,
  tabs_activated_border: null,
  tabs_selected_border: null,
  tabs_shadow: null,
  tabs_activated_shadow: null,
  tabs_selected_shadow: null,

  bookmarks_bookmark_height: null,
  bookmarks_folder_height: null,
  bookmarks_separator_height: null,
  bookmarks_bookmark_font: null,
  bookmarks_folder_font: null,
  bookmarks_node_title_fg: null,
  bookmarks_node_title_fg_hover: null,
  bookmarks_node_title_fg_active: null,
  bookmarks_node_bg_hover: null,
  bookmarks_node_bg_active: null,
  bookmarks_folder_closed_fg: null,
  bookmarks_folder_closed_fg_hover: null,
  bookmarks_folder_closed_fg_active: null,
  bookmarks_folder_open_fg: null,
  bookmarks_folder_open_fg_hover: null,
  bookmarks_folder_open_fg_active: null,
  bookmarks_folder_empty_fg: null,
  bookmarks_opened_fg: null,
}

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
  customStyles: CUSTOM_STYLES,
  snapshots: [],
  keybindings: [],
  permAllUrls: false,
  permTabHide: false,
  settingsLoaded: false,

  // --- Cached
  favicons: {},
}