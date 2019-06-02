import { translate } from '../../mixins/dict'

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
    tabs: [],
    startIndex: -1,
    endIndex: -1,
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
    tabs: [],
    startIndex: -1,
    endIndex: -1,
  },
]
