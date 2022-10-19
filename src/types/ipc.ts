import { Tab, TabCache, GroupInfo, TabsTreeData } from './tabs'
import { Panel } from './sidebar'
import { NormalizedSnapshot, RemovingSnapshotResult, Snapshot } from './snapshots'
import { ItemInfo, DstPlaceInfo, Notification } from '../types'
import { IPCheckResult, UpgradingState } from '../types'
import { GroupPageInitData, UrlPageInitData } from 'src/services/tabs.bg.actions'
import { Stored } from './storage'

export const enum InstanceType {
  unknown = -1,
  bg = 0,
  group = 1,
  sidebar = 2,
  setup = 3,
  search = 4,
  url = 5,
  proxy = 6,
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
  cacheTabsData: (windowId: ID, tabs: TabCache[], delay?: number) => void
  createSnapshot: () => Promise<Snapshot | undefined>
  removeSnapshot: (id: ID) => Promise<RemovingSnapshotResult>
  openSnapshotWindows: (snapshot: NormalizedSnapshot, winIndex?: number) => Promise<void>
  saveFavicon: (url: string, icon: string) => void
  checkIpInfo: (cookieStoreId: ID) => Promise<IPCheckResult | null>
  createWindowWithTabs: (
    tabsInfo: ItemInfo[],
    conf?: browser.windows.CreateData
  ) => Promise<boolean>
  isWindowTabsLocked: (id: ID) => boolean | TabCache[]
  getGroupPageInitData: (winId: ID, tabId: ID) => Promise<GroupPageInitData>
  tabsApiProxy: (method: string, ...args: any[]) => Promise<any>
  checkUpgrade: () => UpgradingState | null
  continueUpgrade: () => void
  saveInLocalStorage: (newValues: Stored, srcInfo: IPCNodeInfo) => void
  getSidebarTabs: (windowId: ID, tabIds?: ID[]) => Promise<Tab[] | undefined>
}

export type SettingsActions = {
  storageChanged: (newValues: Stored) => void
  connectTo: (dstType: InstanceType, dstWinId?: ID, dstTabId?: ID) => void
}

export type SidebarActions = {
  reloadTab: (tab: Tab) => void
  queryTab: (props: Partial<Tab>) => Tab | null
  getTabs: (tabIds?: ID[]) => Tab[] | undefined
  getTabsTreeData: () => TabsTreeData
  getActivePanelInfo: () => Panel
  stopDrag: () => void
  isDropEventConsumed: () => boolean
  getGroupInfo: (groupTabId: ID) => Promise<GroupInfo | null>
  handleReopening: (tabId: ID, newCtx: string) => number | undefined

  loadFavicons: () => void
  setFavicon: (domain: string, url: string, hash: number, icon: string) => void

  onOutsideSearchInput: (value: string) => void
  onOutsideSearchNext: () => void
  onOutsideSearchPrev: () => void
  onOutsideSearchEnter: () => void
  onOutsideSearchSelectAll: () => void
  onOutsideSearchMenu: () => void
  onOutsideSearchExit: () => void

  moveTabsToThisWin: (tabs: Tab[], dst?: DstPlaceInfo) => Promise<boolean>
  openTabs: (items: ItemInfo[], dst: DstPlaceInfo) => Promise<boolean>

  notify: (config: Notification, timeout?: number) => void
  notifyAboutNewSnapshot: () => void

  storageChanged: (newValues: Stored) => void
  connectTo: (dstType: InstanceType, dstWinId?: ID, dstTabId?: ID) => void
}

export type SearchPopupActions = {
  closePopup: () => void
}

export type Actions = BgActions | SettingsActions | SidebarActions | SearchPopupActions

export type ActionsKeys<T> = T extends InstanceType.bg
  ? keyof BgActions
  : T extends InstanceType.setup
  ? keyof SettingsActions
  : T extends InstanceType.sidebar
  ? keyof SidebarActions
  : T extends InstanceType.search
  ? keyof SearchPopupActions
  : never

export type ActionsType<T> = T extends InstanceType.bg
  ? BgActions
  : T extends InstanceType.setup
  ? SettingsActions
  : T extends InstanceType.sidebar
  ? SidebarActions
  : T extends InstanceType.search
  ? SearchPopupActions
  : any
