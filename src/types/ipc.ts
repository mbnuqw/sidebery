import * as T from 'src/types'
import type * as E from 'src/enums'
import type { DetachedTabsInfo } from 'src/services/tabs.fg.move'
import type * as Tabs from 'src/services/tabs.bg'
import type * as Snapshots from 'src/services/snapshots.bg'
import type * as Favicons from 'src/services/favicons.bg'
import type * as WebReq from 'src/services/web-req.bg'
import type * as WindowsBg from 'src/services/windows.bg'
import type * as WindowsFg from 'src/services/windows.fg'
import type * as Store from 'src/services/storage.bg'
import type * as SyncBg from 'src/services/sync.bg'
import type * as TabsFg from 'src/services/tabs.fg'
import type * as SidebarBg from 'src/services/sidebar.bg'
import type * as SidebarFg from 'src/services/sidebar.fg'
import type * as ContainersBg from 'src/services/containers.bg'
import type * as GroupPage from 'src/page.group/group'

export interface Message<T extends E.InstanceType, A extends ActionsKeys<T>> {
  id?: ID
  dstWinId?: ID
  dstTabId?: ID
  dstType?: E.InstanceType
  action?: A
  name?: string
  arg?: FirstParameter<ActionsType<T>[A]>
  args?: Parameters<ActionsType<T>[A]>
  result?: ReturnType<ActionsType<T>[A]>
  error?: any
}

export interface IPCNodeInfo {
  type: E.InstanceType
  winId: ID
  tabId: ID
}

export type BgActions = {
  init?: any
  cacheTabsData: typeof Tabs.cacheTabsData
  getGroupPageInitData: typeof Tabs.getGroupPageInitData
  getPlaceholderPageInitData: typeof Tabs.getPlaceholderPageInitData
  tabsApiProxy: typeof Tabs.tabsApiProxy
  getSidebarTabs: typeof Tabs.getSidebarTabs
  detachSidebarTabs: typeof Tabs.detachSidebarTabs
  openTabs: typeof Tabs.openTabs
  setActivePanelId: typeof SidebarBg.setActivePanelId
  createSnapshot: typeof Snapshots.createSnapshot
  addSnapshot: typeof Snapshots.addSnapshot
  removeSnapshot: typeof Snapshots.removeSnapshot
  openSnapshotWindows: typeof Snapshots.openWindows
  saveFavicon: typeof Favicons.saveFavicon
  reloadFavicons: () => any
  createWindowWithTabs: typeof WindowsBg.createWithTabs
  isWindowTabsLocked: typeof WindowsBg.isWindowTabsLocked
  saveInLocalStorage: typeof Store.setFromRemoteFg
  checkIpInfo: typeof WebReq.checkIpInfo
  disableAutoReopening: typeof WebReq.disableAutoReopening
  enableAutoReopening: typeof WebReq.enableAutoReopening

  saveToSync: typeof SyncBg.save
  saveTabsToSync: typeof SyncBg.saveTabs
  saveProfileInfoToGoogleSync: typeof SyncBg.Google.saveProfileInfo
  removeFromSync: typeof SyncBg.remove
  removeFromFirefoxSync: typeof SyncBg.Firefox.remove
  removeByTypeFromSync: typeof SyncBg.removeByType
  removeCachedIdFromGoogleSync: typeof SyncBg.Google.removeCachedId
  getDataFromSync: typeof SyncBg.getData
  loadSync: typeof SyncBg.load

  getContainers: typeof ContainersBg.getContainers
  setContainers: typeof ContainersBg.setContainers
  createContainer: typeof ContainersBg.createAndSave
  removeContainer: typeof ContainersBg.removeAndSave
  importContainers: typeof ContainersBg.importContainers
}

export type SettingsActions = {
  storageChanged: typeof Store.storageChangeListener
  connectTo: (dstType: E.InstanceType, dstWinId?: ID, dstTabId?: ID) => void
  reloadFavicons: () => any
}

export type PanelConfigPopupActions = {
  storageChanged: typeof Store.storageChangeListener
  connectTo: (dstType: E.InstanceType, dstWinId?: ID, dstTabId?: ID) => void
}

export type SidebarActions = {
  reloadTab: (tab: T.Tab) => void
  queryTab: (props: Partial<T.Tab>) => T.Tab | null
  getTabs: (tabIds?: ID[]) => T.Tab[] | undefined
  detachTabs: (tabIds: ID[]) => DetachedTabsInfo | undefined
  getTabsTreeData: () => T.TabsTreeData
  getActivePanelConfig: () => T.PanelConfig | undefined
  switchToPanel: typeof SidebarFg.switchToPanel
  stopDrag: () => void
  setDragInfo: (dragInfo: T.DragInfo) => void
  getGroupInfo: (groupTabId: ID) => Promise<T.GroupInfo | null>
  handleReopening: (tabId: ID, dstContainerId?: string) => Promise<number | undefined>

  loadFavicons: () => void
  reloadFavicons: () => any
  setFavicon: (domain: string, icon: string) => void

  onOutsideSearchInput: (value: string) => void
  onOutsideSearchNext: () => void
  onOutsideSearchPrev: () => void
  onOutsideSearchEnter: () => void
  onOutsideSearchSelectAll: () => void
  onOutsideSearchMenu: () => void
  onOutsideSearchExit: () => void
  onOutsideSearchBookmarks: () => void
  onOutsideSearchHistory: () => void

  onOutsideEditingInput: (value: string) => void
  onOutsideEditingExit: () => void
  onOutsideEditingEnter: () => void

  moveTabsToThisWin: (tabs: T.Tab[], dst?: T.DstPlaceInfo) => Promise<boolean>
  openTabs: (items: T.ItemInfo[], dst: T.DstPlaceInfo) => Promise<boolean>
  moveTabToPanelViaOmnibox: typeof TabsFg.moveTabToPanelViaOmnibox
  moveTabToGroupViaOmnibox: typeof TabsFg.moveTabToGroupViaOmnibox

  notify: (config: T.Notification, timeout?: number) => void
  notifyAboutNewSnapshot: () => void
  notifyAboutWrongProxyAuthData: (containerId: string) => void

  storageChanged: (newValues: T.Stored) => void
  connectTo: (dstType: E.InstanceType, dstWinId?: ID, dstTabId?: ID) => void

  getSearchQuery: () => string
  getEditingValue: () => string
  updWindowPreface: typeof WindowsFg.updWindowPreface
}

export type SearchPopupActions = {
  closePopup: () => void
}

export type EditingPopupAction = {
  closePopup: () => void
}

export type PreviewActions = {
  updatePreview: (tabId: ID, title: string, url: string, unloaded: boolean) => void
  setY: (y: number) => void
  close: () => void
}

export type GroupPageActions = {
  ready?: any
  update: typeof GroupPage.onGroupUpdMsg
}

export type Actions =
  | BgActions
  | SettingsActions
  | SidebarActions
  | SearchPopupActions
  | EditingPopupAction
  | PreviewActions
  | PanelConfigPopupActions
  | GroupPageActions

export type ActionsKeys<T> = T extends E.InstanceType.bg
  ? keyof BgActions
  : T extends E.InstanceType.setup
    ? keyof SettingsActions
    : T extends E.InstanceType.sidebar
      ? keyof SidebarActions
      : T extends E.InstanceType.search
        ? keyof SearchPopupActions
        : T extends E.InstanceType.editing
          ? keyof EditingPopupAction
          : T extends E.InstanceType.preview
            ? keyof PreviewActions
            : T extends E.InstanceType.panelConfig
              ? keyof PanelConfigPopupActions
              : T extends E.InstanceType.group
                ? keyof GroupPageActions
                : never

export type ActionsType<T> = T extends E.InstanceType.bg
  ? BgActions
  : T extends E.InstanceType.setup
    ? SettingsActions
    : T extends E.InstanceType.sidebar
      ? SidebarActions
      : T extends E.InstanceType.search
        ? SearchPopupActions
        : T extends E.InstanceType.editing
          ? EditingPopupAction
          : T extends E.InstanceType.preview
            ? PreviewActions
            : T extends E.InstanceType.panelConfig
              ? PanelConfigPopupActions
              : T extends E.InstanceType.group
                ? GroupPageActions
                : any
