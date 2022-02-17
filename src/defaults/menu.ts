import { translate } from '../dict'
import { MenuConf } from 'src/types'

export const TABS_MENU: MenuConf = [
  { opts: ['undoRmTab', 'mute', 'reload', 'bookmark'] },
  'separator-1',
  {
    name: translate('menu.tab.move_to_sub_menu_name'),
    opts: ['moveToNewWin', 'moveToWin', 'separator-5', 'moveToPanel', 'moveToNewPanel'],
  },
  {
    name: translate('menu.tab.reopen_in_sub_menu_name'),
    opts: ['reopenInNewWin', 'reopenInWin', 'reopenInCtr', 'reopenInNewCtr'],
  },
  'separator-2',
  'pin',
  'duplicate',
  'discard',
  'copyTabsUrls',
  'copyTabsTitles',
  'separator-3',
  'group',
  'flatten',
  'separator-4',
  'clearCookies',
  'close',
]

export const TABS_PANEL_MENU: MenuConf = [
  { opts: ['undoRmTab', 'muteAllAudibleTabs', 'reloadTabs', 'discardTabs'] },
  'separator-7',
  'collapseInactiveBranches',
  'closeTabsDuplicates',
  'closeTabs',
  'separator-8',
  'bookmarkTabsPanel',
  'restoreFromBookmarks',
  'convertToBookmarksPanel',
  'separator-9',
  'openPanelConfig',
  'removePanel',
]

export const BOOKMARKS_MENU: MenuConf = [
  {
    name: translate('menu.bookmark.open_in_sub_menu_name'),
    opts: [
      'openInNewWin',
      'openInNewPrivWin',
      'separator-9',
      'openInPanel',
      'openInNewPanel',
      'separator-10',
      'openInCtr',
    ],
  },
  {
    name: translate('menu.bookmark.sort_sub_menu_name'),
    opts: [
      'sortByNameAscending',
      'sortByNameDescending',
      'sortByLinkAscending',
      'sortByLinkDescending',
      'sortByTimeAscending',
      'sortByTimeDescending',
    ],
  },
  'separator-5',
  'createBookmark',
  'createFolder',
  'createSeparator',
  'separator-8',
  'openAsBookmarksPanel',
  'openAsTabsPanel',
  'separator-7',
  'copyBookmarksUrls',
  'copyBookmarksTitles',
  'moveBookmarksTo',
  'edit',
  'delete',
]

export const BOOKMARKS_PANEL_MENU: MenuConf = [
  'collapseAllFolders',
  'switchViewMode',
  'convertToTabsPanel',
  'separator-9',
  'unloadPanelType',
  'openPanelConfig',
  'removePanel',
]

export const HISTORY_MENU: MenuConf = [
  'open',
  'separator-1',
  'copyHistoryUrls',
  'copyHistoryTitles',
]

export const DOWNLOADS_MENU: MenuConf = [
  'openFile',
  'openRef',
  'openDir',
  'separator-1',
  'copyFullPath',
  'copyRef',
  'copyUrl',
  'separator-2',
  'deleteDownload',
]

export const DOWNLOADS_PANEL_MENU: MenuConf = [
  'pauseResumeAll',
  'separator-1',
  'openPanelConfig',
  'unloadPanelType',
  'removePanel',
]

export const NEW_TAB_MENU: MenuConf = [
  'newTabNoContainer',
  'separator-10',
  'newTabContainers',
  'newTabNewContainer',
  'separator-12',
  'manageContainers',
]

export const OTHER_PANELS_MENU: MenuConf = ['openPanelConfig', 'unloadPanelType', 'removePanel']
