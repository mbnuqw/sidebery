import { translate } from '../../mixins/dict'

export const DEFAULT_CTX = 'firefox-default'
export const PRIVATE_CTX = 'firefox-private'
export const DEFAULT_CTX_ID = browser.extension.inIncognitoContext ? PRIVATE_CTX : DEFAULT_CTX
export const DEFAULT_BOOKMARKS_PANEL = {
  type: 'bookmarks',
  id: 'bookmarks',
  cookieStoreId: 'bookmarks',
  name: translate('bookmarks_dashboard.title'),
  icon: 'icon_bookmarks',
  dashboard: 'BookmarksDashboard',
  panel: 'BookmarksPanel',
  lockedPanel: false,
  bookmarks: true,
}
export const DEFAULT_PRIVATE_TABS_PANEL = {
  type: 'private',
  id: PRIVATE_CTX,
  name: translate('private_dashboard.title'),
  icon: 'icon_tabs',
  cookieStoreId: PRIVATE_CTX,
  dashboard: 'DefaultTabsDashboard',
  panel: 'TabsPanel',
  private: true,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
}
export const DEFAULT_TABS_PANEL = {
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
  tabs: [],
  startIndex: -1,
  endIndex: -1,
}
export const DEFAULT_CTX_TABS_PANEL = {
  type: 'ctx',
  dashboard: 'TabsDashboard',
  panel: 'TabsPanel',
  lockedTabs: false,
  lockedPanel: false,
  proxy: null,
  proxified: false,
  noEmpty: false,
  includeHostsActive: false,
  includeHosts: '',
  excludeHostsActive: false,
  excludeHosts: '',
  lastActiveTab: -1,
  tabs: [],
  startIndex: -1,
  endIndex: -1,
}
export const DEFAULT_PANELS = [
  DEFAULT_BOOKMARKS_PANEL,
  DEFAULT_PRIVATE_TABS_PANEL,
  DEFAULT_TABS_PANEL,
]
