import { ItemInfo, DstPlaceInfo, Notification, PanelConfig, DragInfo, Stored } from '../types'
import { DetachedTabsInfo } from 'src/services/tabs.fg.move'
import { Tab, GroupInfo, TabsTreeData } from './tabs'
import * as Tabs from 'src/services/tabs.bg'
import * as Snapshots from 'src/services/snapshots.bg'
import * as Favicons from 'src/services/favicons.bg'
import * as WebReq from 'src/services/web-req.bg'
import * as WindowsBg from 'src/services/windows.bg'
import * as WindowsFg from 'src/services/windows.fg'
import * as Store from 'src/services/storage.bg'
import type * as SyncBg from 'src/services/sync.bg'
import type * as TabsFg from 'src/services/tabs.fg'
import type * as SidebarBg from 'src/services/sidebar.bg'
import type * as SidebarFg from 'src/services/sidebar.fg'
import type * as E from 'src/enums'

export interface Message<T extends E.InstanceType, A extends ActionsKeys<T>> {
  id?: number
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
  cacheTabsData: typeof Tabs.cacheTabsData
  getGroupPageInitData: typeof Tabs.getGroupPageInitData
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
  reloadTab: (tab: Tab) => void
  queryTab: (props: Partial<Tab>) => Tab | null
  getTabs: (tabIds?: ID[]) => Tab[] | undefined
  detachTabs: (tabIds: ID[]) => DetachedTabsInfo | undefined
  getTabsTreeData: () => TabsTreeData
  getActivePanelConfig: () => PanelConfig | undefined
  switchToPanel: typeof SidebarFg.switchToPanel
  stopDrag: () => void
  setDragInfo: (dragInfo: DragInfo) => void
  getGroupInfo: (groupTabId: ID) => Promise<GroupInfo | null>
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

  moveTabsToThisWin: (tabs: Tab[], dst?: DstPlaceInfo) => Promise<boolean>
  openTabs: (items: ItemInfo[], dst: DstPlaceInfo) => Promise<boolean>
  moveTabToPanelViaOmnibox: typeof TabsFg.moveTabToPanelViaOmnibox
  moveTabToGroupViaOmnibox: typeof TabsFg.moveTabToGroupViaOmnibox

  notify: (config: Notification, timeout?: number) => void
  notifyAboutNewSnapshot: () => void
  notifyAboutWrongProxyAuthData: (containerId: string) => void

  storageChanged: (newValues: Stored) => void
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

export type Actions =
  | BgActions
  | SettingsActions
  | SidebarActions
  | SearchPopupActions
  | EditingPopupAction
  | PreviewActions
  | PanelConfigPopupActions

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
              : any
