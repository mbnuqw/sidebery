import { Tab, GroupInfo, TabsTreeData } from './tabs'
import { ItemInfo, DstPlaceInfo, Notification, PanelConfig } from '../types'
import { UpgradingState } from '../types'
import { Stored } from './storage'
import { Tabs } from 'src/services/tabs.bg'
import { Snapshots } from 'src/services/snapshots'
import * as Favicons from 'src/services/favicons.bg'
import { WebReq } from 'src/services/web-req'
import { Windows } from 'src/services/windows'
import { Store } from 'src/services/storage'

export const enum InstanceType {
  unknown = -1,
  bg = 0,
  group = 1,
  sidebar = 2,
  setup = 3,
  search = 4,
  url = 5,
  proxy = 6,
  preview = 7,
}

export interface Message<T extends InstanceType, A extends ActionsKeys<T>> {
  id?: number
  dstWinId?: ID
  dstTabId?: ID
  dstType?: InstanceType
  action?: A
  name?: string
  arg?: FirstParameter<ActionsType<T>[A]>
  args?: Parameters<ActionsType<T>[A]>
  result?: ReturnType<ActionsType<T>[A]>
  error?: any
}

export interface IPCNodeInfo {
  type: InstanceType
  winId: ID
  tabId: ID
}

export type BgActions = {
  cacheTabsData: typeof Tabs.cacheTabsData
  getGroupPageInitData: typeof Tabs.getGroupPageInitData
  tabsApiProxy: typeof Tabs.tabsApiProxy
  getSidebarTabs: typeof Tabs.getSidebarTabs
  openTabs: typeof Tabs.openTabs
  createSnapshot: typeof Snapshots.createSnapshot
  addSnapshot: typeof Snapshots.addSnapshot
  removeSnapshot: typeof Snapshots.removeSnapshot
  openSnapshotWindows: typeof Snapshots.openWindows
  saveFavicon: typeof Favicons.saveFavicon
  createWindowWithTabs: typeof Windows.createWithTabs
  isWindowTabsLocked: typeof Windows.isWindowTabsLocked
  saveInLocalStorage: typeof Store.setFromRemoteFg
  checkIpInfo: typeof WebReq.checkIpInfo
  disableAutoReopening: typeof WebReq.disableAutoReopening
  enableAutoReopening: typeof WebReq.enableAutoReopening
  checkUpgrade: () => UpgradingState | null
  continueUpgrade: () => void
}

export type SettingsActions = {
  storageChanged: typeof Store.storageChangeListener
  connectTo: (dstType: InstanceType, dstWinId?: ID, dstTabId?: ID) => void
}

export type SidebarActions = {
  reloadTab: (tab: Tab) => void
  queryTab: (props: Partial<Tab>) => Tab | null
  getTabs: (tabIds?: ID[]) => Tab[] | undefined
  getTabsTreeData: () => TabsTreeData
  getActivePanelConfig: () => PanelConfig | undefined
  stopDrag: () => void
  isDropEventConsumed: () => boolean
  getGroupInfo: (groupTabId: ID) => Promise<GroupInfo | null>
  handleReopening: (tabId: ID, dstContainerId?: string) => number | undefined

  loadFavicons: () => void
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

  moveTabsToThisWin: (tabs: Tab[], dst?: DstPlaceInfo) => Promise<boolean>
  openTabs: (items: ItemInfo[], dst: DstPlaceInfo) => Promise<boolean>

  notify: (config: Notification, timeout?: number) => void
  notifyAboutNewSnapshot: () => void
  notifyAboutWrongProxyAuthData: (containerId: string) => void

  storageChanged: (newValues: Stored) => void
  connectTo: (dstType: InstanceType, dstWinId?: ID, dstTabId?: ID) => void

  getSearchQuery: () => string
}

export type SearchPopupActions = {
  closePopup: () => void
}

export type PreviewAction = {
  updatePreview: (tabId: ID, title: string, url: string, unloaded: boolean) => void
  setY: (y: number) => void
  close: () => void
}

export type Actions =
  | BgActions
  | SettingsActions
  | SidebarActions
  | SearchPopupActions
  | PreviewAction

export type ActionsKeys<T> = T extends InstanceType.bg
  ? keyof BgActions
  : T extends InstanceType.setup
    ? keyof SettingsActions
    : T extends InstanceType.sidebar
      ? keyof SidebarActions
      : T extends InstanceType.search
        ? keyof SearchPopupActions
        : T extends InstanceType.preview
          ? keyof PreviewAction
          : never

export type ActionsType<T> = T extends InstanceType.bg
  ? BgActions
  : T extends InstanceType.setup
    ? SettingsActions
    : T extends InstanceType.sidebar
      ? SidebarActions
      : T extends InstanceType.search
        ? SearchPopupActions
        : T extends InstanceType.preview
          ? PreviewAction
          : any
