export * from './defaults/containers'
export * from './defaults/menu'
export * from './defaults/panels'
export * from './defaults/settings'

export const PRE_SCROLL = 64
export const ADDON_HOST = browser.runtime.getURL('')
export const SIDEBAR_URL = browser.runtime.getURL('/sidebar/sidebar.html')
export const GROUP_URL = browser.runtime.getURL('/sidebery/group.html')
export const URL_URL = browser.runtime.getURL('/sidebery/url.html')
export const SETUP_URL = browser.runtime.getURL('/page.setup/setup.html')
export const SEARCH_URL = browser.runtime.getURL('/popup.search/search.html')
export const RGB_COLORS: Record<browser.ColorName, string> = {
  blue: '#37adff',
  turquoise: '#00c79a',
  green: '#51cd00',
  yellow: '#ffcb00',
  orange: '#ff9f00',
  red: '#ff613d',
  pink: '#ff4bda',
  purple: '#af51f5',
  toolbar: '#686868',
}
export const COLOR_NAMES: browser.ColorName[] = [
  'blue',
  'turquoise',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'toolbar',
]
export const IMG_RE = /(\.png|\.jpe?g|\.gif|\.webp|\.svg)([?#].*)?$/i
export const VID_RE = /(\.mp4|\.webm)([?#].*)?$/i
export const MUS_RE = /(\.mp3|\.flac)([?#].*)?$/i
export const FILE_RE = /(^file:.*|\.pdf)([?#].*)?$/i
export const GROUP_RE = /\/page\.group\/group\.html/
export const URL_PAGE_RE = /\/page\.url\/url\.html/
export const SETTINGS_RE = /\/page\.setup\/setup\.html/
export const FOLDER_NAME_DATA_RE = /^(.*) \[(.*)\]$/
export const BOOKMARKED_PANEL_CONF_RE =
  /(.*) \[data:application\/x-sidebery-panel;charset=UTF-8,(.*)\]$/
export const GROUP_INITIAL_TITLE = '...'
export const BTN_ICONS: Record<string, string> = {
  tabs_panel: 'icon_tabs',
  bookmarks_panel: 'icon_bookmarks',
  settings: 'icon_settings',
  history: 'icon_clock',
  sp: 'icon_ellipsis',
  sd: 'icon_ellipsis',
  add_tp: 'icon_add_tabs_panel',
  search: 'icon_search',
  collapse: 'icon_collapse_all',
  create_snapshot: 'icon_snapshot',
  remute_audio_tabs: 'icon_mute',
}

export const LOCALHOST_RE = /^localhost(:\d+)?/
export const DOMAIN_RE = /^https?:\/\/(www.)?(.*?)(\/|$)/
export const LINUX_HOME_RE = /^\/home\/(.+?)\//
export const PATH_SEP_RE = /\/|\\/

export const NOID: ID = -1
export const SAMEID: ID = -5
export const NEWID: ID = -10
export const ASKID: ID = -11
export const MOVEID: ID = -12

export const enum Err {
  TabsLocked = 1,
  Canceled = 2,
}

export const CONTAINER_ICON_OPTS = [
  { value: 'fingerprint', icon: 'fingerprint' },
  { value: 'briefcase', icon: 'briefcase' },
  { value: 'dollar', icon: 'dollar' },
  { value: 'cart', icon: 'cart' },
  { value: 'circle', icon: 'circle' },
  { value: 'gift', icon: 'gift' },
  { value: 'vacation', icon: 'vacation' },
  { value: 'food', icon: 'food' },
  { value: 'fruit', icon: 'fruit' },
  { value: 'pet', icon: 'pet' },
  { value: 'tree', icon: 'tree' },
  { value: 'chill', icon: 'chill' },
  { value: 'fence', icon: 'fence' },
]
export const PANEL_ICON_OPTS = [
  { value: 'icon_books', icon: 'icon_books' },
  { value: 'icon_code', icon: 'icon_code' },
  { value: 'icon_circle', icon: 'icon_circle' },
  { value: 'icon_play', icon: 'icon_play' },
  { value: 'icon_mail', icon: 'icon_mail' },
  { value: 'icon_man', icon: 'icon_man' },
  { value: 'icon_archive', icon: 'icon_archive' },
  { value: 'icon_clipboard', icon: 'icon_clipboard' },
  { value: 'icon_book', icon: 'icon_book' },
  { value: 'icon_coffee', icon: 'icon_coffee' },
  { value: 'icon_search', icon: 'icon_search' },
  { value: 'icon_lock', icon: 'icon_lock' },
  { value: 'icon_edu', icon: 'icon_edu' },
  { value: 'icon_flask', icon: 'icon_flask' },
  { value: 'icon_gamepad', icon: 'icon_gamepad' },
  { value: 'fingerprint', icon: 'fingerprint' },
  { value: 'briefcase', icon: 'briefcase' },
  { value: 'dollar', icon: 'dollar' },
  { value: 'cart', icon: 'cart' },
  { value: 'circle', icon: 'circle' },
  { value: 'gift', icon: 'gift' },
  { value: 'vacation', icon: 'vacation' },
  { value: 'food', icon: 'food' },
  { value: 'fruit', icon: 'fruit' },
  { value: 'pet', icon: 'pet' },
  { value: 'tree', icon: 'tree' },
  { value: 'chill', icon: 'chill' },
  { value: 'fence', icon: 'fence' },
]
export const COLOR_OPTS = [
  { value: 'toolbar', color: 'toolbar' },
  { value: 'blue', color: 'blue' },
  { value: 'turquoise', color: 'turquoise' },
  { value: 'green', color: 'green' },
  { value: 'yellow', color: 'yellow' },
  { value: 'orange', color: 'orange' },
  { value: 'red', color: 'red' },
  { value: 'pink', color: 'pink' },
  { value: 'purple', color: 'purple' },
]
export const PROXY_OPTS = ['http', 'https', 'socks4', 'socks', 'direct']

export const BKM_ROOT_ID = 'root________'
export const BKM_OTHER_ID = 'unfiled_____'
export const BKM_MENU_ID = 'menu________'
export const BKM_MOBILE_ID = 'mobile______'
export const BKM_TLBR_ID = 'toolbar_____'

export const MIN_SEARCH_QUERY_LEN = 2

export const FF_THEME_COLORS: (keyof browser.theme.ThemeColors)[] = [
  'accentcolor',
  'bookmark_text',
  'button_background_active',
  'button_background_hover',
  'border',
  'border_width',
  'icons',
  'icons_attention',
  'frame',
  'frame_inactive',
  'ntp_background',
  'ntp_text',
  'panel_item_active',
  'panel_item_hover',
  'panel_separator',
  'popup',
  'popup_border',
  'popup_highlight',
  'popup_highlight_text',
  'popup_text',
  'sidebar',
  'sidebar_base',
  'sidebar_border',
  'sidebar_highlight',
  'sidebar_highlight_text',
  'sidebar_text',
  'sidebar_darker_border_width',
  'sidebar_top_padding',
  'sidebar_active_bg',
  'sidebar_active_border',
  'tab_background_separator',
  'tab_background_text',
  'tab_line',
  'tab_loading',
  'tab_selected',
  'tab_text',
  'textcolor',
  'toolbar',
  'toolbar_bottom_separator',
  'toolbar_field',
  'toolbar_field_border',
  'toolbar_field_border_focus',
  'toolbar_field_focus',
  'toolbar_field_highlight',
  'toolbar_field_highlight_text',
  'toolbar_field_separator',
  'toolbar_field_text',
  'toolbar_field_text_focus',
  'toolbar_text',
  'toolbar_top_separator',
  'toolbar_vertical_separator',
]
