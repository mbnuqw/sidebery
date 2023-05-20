import { Container, Container_v4 } from './types/containers'
import { SettingsState } from './types/settings'
import { SidebarConfig, OldPanelConfig, TabsPanel } from './types/sidebar'
import { ContextMenuConfig_v4, MenuConfs } from './types/menu'
import { CssVars } from './types/styles'
import { Snapshot, Snapshot_v4 } from './types/snapshots'
import { ItemInfo } from './types/tabs'
import { WindowChoosingDetails } from './types/windows'
import { ItemBounds } from './types/sidebar'

export * from './types/containers'
export * from './types/menu'
export * from './types/ipc'
export * from './types/sidebar'
export * from './types/settings'
export * from './types/snapshots'
export * from './types/storage'
export * from './types/tabs'
export * from './types/windows'
export * from './types/styles'
export * from './types/bookmarks'
export * from './types/history'

export interface ConfirmDialog {
  msg: string
  ok: () => void
  cancel: () => void
}

export interface BookmarksFolderSelection {
  id: ID
  ok: () => void
  cancel: () => void
}

export interface NotificationProgress {
  percent: number
}

export interface IconSRC {
  img?: string
  svg?: string
}

export interface NotificationControl {
  label: string
  icon?: string
  callback: () => void
}

export interface Notification {
  title: string
  controls?: NotificationControl[]
  ctrl?: string
  callback?: () => void
  id?: ID
  lvl?: 'info' | 'warn' | 'err' | 'progress'
  timeout?: number
  timer?: number
  progress?: NotificationProgress
  icon?: string
  iconColor?: string
  favicons?: string[]
  details?: string
  detailsList?: string[]
}

export type AnyFunc = (...args: any[]) => any
export type AnyAsyncFunc = (...args: any[]) => Promise<any>

export type InputObjOpt = {
  value: string | number
  tooltip?: string
  color?: string
  icon?: string
}
export type InputOption = string | number | InputObjOpt

export interface BackupData {
  ver?: string
  settings?: SettingsState
  sidebar?: SidebarConfig
  contextMenu?: MenuConfs
  containers?: Record<string, Container>
  snapshots?: Snapshot[]
  sidebarCSS?: string
  groupCSS?: string
  favicons?: string[]
  favHashes?: number[]
  favDomains?: Record<string, FavDomain>
  keybindings?: Record<string, string>
  // DEPRECATED //
  containers_v4?: Record<string, Container_v4>
  panels_v4?: OldPanelConfig[]
  tabsMenu?: ContextMenuConfig_v4
  bookmarksMenu?: ContextMenuConfig_v4
  cssVars?: CssVars
  snapshots_v4?: Snapshot_v4[]
}

export interface Command extends browser.commands.Command {
  focus?: boolean
  error?: string
}

export interface CommandUpdateDetails {
  shortcut?: string
  focus?: boolean
  error?: string
}

export interface ScrollBoxComponent {
  setScrollY(y: number): void
  recalcScroll(): void
  getScrollBox(): HTMLElement | null
  getScrollableBox(): HTMLElement | null
}

export interface SubPanelComponent {
  open: (type: SubPanelType, panel: TabsPanel) => void
  close: () => void
}

export const enum SubPanelType {
  Null = 0,
  RecentlyClosedTabs = 1,
  Bookmarks = 2,
  History = 3,
}

export interface SelectInputComponent {
  open: () => void
  close: () => void
}

export interface ContextMenuComponent {
  selectOption(dir: number): void
  activateOption(): boolean | undefined
}

export interface TextInputComponent {
  recalcTextHeight: () => void
  focus: () => void
  error: () => void
  selectAll: () => void
}

export interface BookmarksPanelComponent {
  getBounds: () => ItemBounds[]
  toggleGroupById: (id: ID) => void
}

export interface IPCheckResult {
  ip?: string
  country?: string
}

export const enum DragType {
  Nothing = 0,
  Tabs = 1,
  NewTab = 11,
  Bookmarks = 2,
  NavItem = 3,
  TabsPanel = 31,
  BookmarksPanel = 32,
  Native = 4,
}
export const enum DropType {
  Nowhere = 0,
  Tabs = 1,
  Bookmarks = 2,
  NavItem = 3,
  TabsPanel = 31,
  BookmarksPanel = 32,
  BookmarksSubPanelBtn = 41,
}

export interface DragItem {
  id: ID
  url?: string
  title?: string
  pinned?: boolean
  parentId?: ID
  container?: string
}

export interface DragInfo {
  x: number
  y: number
  type: DragType
  items?: DragItem[]
  incognito?: boolean
  windowId: ID
  panelId?: ID
  pinnedTabs?: boolean
  index?: number
  copy?: boolean
}

export interface SrcPlaceInfo {
  pinned?: boolean
  panelId?: ID
  windowId?: ID
}

export interface DstPlaceInfo {
  panelId?: ID
  parentId?: ID
  index?: number
  inside?: boolean
  pinned?: boolean
  containerId?: string
  windowId?: ID
  incognito?: boolean
  windowChooseConf?: WindowChoosingDetails
  discarded?: boolean
}

export interface TabsMoveConf {
  items?: ItemInfo[]
  itemIds?: ID[]
  srcPinned?: boolean
  srcPanelId?: ID
  srcWindowId?: ID
  dstPanelId?: ID
  dstParentId?: ID
  dstIndex?: number
  dstInside?: boolean
  dstPinned?: boolean
  dstContainerId?: string
  dstWindowId?: ID
  dstIncognito?: boolean
}

export interface FavDomain {
  index: number
  src: string
}

export interface Reminder {
  id: ID
  title: string
  url: string
  date: number
}

export interface DbgInfo {
  addonVersion?: string
  firefoxVersion?: string
  settings?: SettingsState
  permissions?: DbgPermissions | string
  storage?: DbgStorage | string
  sidebar?: SidebarConfig | string
  containers?: Container[] | string
  cssVars?: Record<string, string> | string
  sidebarCSSLen?: string
  groupCSSLen?: string
  windows?: DbgWindow[] | string
  tabsMenu?: ContextMenuConfig_v4 | string
  bookmarksMenu?: ContextMenuConfig_v4 | string
  tabsPanelMenu?: ContextMenuConfig_v4 | string
  bookmarksPanelMenu?: ContextMenuConfig_v4 | string
  bookmarks?: DbgBookmarks | string
}

interface DbgPermissions {
  allUrls: boolean
  tabHide: boolean
  clipboardWrite: boolean
  webRequest: boolean
  webRequestBlocking: boolean
}

interface DbgStorage {
  size: string
  props: Record<string, string>
}

interface DbgWindow {
  state?: string
  incognito?: boolean
  tabsCount?: number
}

interface DbgBookmarks {
  bookmarksCount: number
  foldersCount: number
  separatorsCount: number
  maxDepth: number
}

export interface SubListTitleInfo {
  isSubListTitle: true
  title: string
  len: number
  id: ID
  index: number
  expanded: boolean
}

export interface Dialog {
  title: string
  note?: string
  checkbox?: DialogCheckbox
  buttons: DialogBtn[]
  buttonsCentered?: boolean
  result: (answer: string | null) => void
}

export interface DialogBtn {
  label: string
  value: string
  warn?: boolean
}

export interface DialogCheckbox {
  label: string
  value: boolean
  update: (value: boolean) => void
}

export interface DialogConfig {
  title: string
  note?: string
  checkbox?: DialogCheckbox
  buttons: DialogBtn[]
  buttonsCentered?: boolean
}

export interface TabsPanelRemoving {
  id: ID
  withMode: (mode: TabsPanelRemovingMode | null) => void
}

export const enum TabsPanelRemovingMode {
  Attach = 1,
  SaveAndClose = 2,
  Close = 3,
}

export interface TabsPanelSaving {
  id: ID
  withMode: (mode: TabsPanelSavingMode | null) => void
}

export const enum TabsPanelSavingMode {
  Additive = 1,
  Exclusive = 2,
}

export const enum SelectionType {
  Nothing = 0,
  Tabs = 1,
  Bookmarks = 2,
  History = 3,
  NewTabBar = 5,
  NavItem = 6,
  Header = 7,
}

export interface UpgradingState {
  active: boolean
  error?: string
  done?: boolean

  init?: 'done' | 'in-progress' | 'pending' | 'err' | 'no'
  settings?: 'done' | 'in-progress' | 'pending' | 'err' | 'no'
  sidebar?: 'done' | 'in-progress' | 'pending' | 'err' | 'no'
  snapshots?: 'done' | 'in-progress' | 'pending' | 'err' | 'no'
  favicons?: 'done' | 'in-progress' | 'pending' | 'err' | 'no'
  styles?: 'done' | 'in-progress' | 'pending' | 'err' | 'no'
}

export const enum WheelDirection {
  Horizontal = 1,
  Vertical = 2,
}

export type Entries<T> = (Iterator<T> & { [K in keyof T]: [K, T[K]] }[keyof T])[]

export type RGBA = [number, number, number, number]
export type RGB = [number, number, number]
