import type { Container } from './types/containers'
import type { SettingsState } from './types/settings'
import type { SidebarConfig, TabsPanel } from './types/sidebar'
import type { MenuConfs } from './types/menu'
import type { Snapshot } from './types/snapshots'
import type { ItemInfo } from './types/tabs'
import type { WindowChoosingDetails } from './types/windows'
import type { ItemBounds } from './types/sidebar'
import type * as E from 'src/enums'

export type * from './types/containers'
export type * from './types/menu'
export type * from './types/ipc'
export type * from './types/sidebar'
export type * from './types/settings'
export type * from './types/snapshots'
export type * from './types/storage'
export type * from './types/tabs'
export type * from './types/windows'
export type * from './types/styles'
export type * from './types/bookmarks'
export type * from './types/history'

export interface ConfirmDialog {
  type: E.ConfirmationType
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
  unconcealed?: boolean
  id?: ID
  lvl?: 'info' | 'warn' | 'err' | 'progress'
  timeout?: number
  timer?: number
  progress?: NotificationProgress
  icon?: string
  iconColor?: string
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
  open: (type: E.SubPanelType, panel: TabsPanel) => void
  close: () => void
}

export interface ToggleInputComponent {
  getFocusEl: () => HTMLElement | undefined
}

export interface SelectInputComponent {
  open: () => void
  close: () => void
  getFocusEl: () => HTMLElement | undefined
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
  getTextInput: () => HTMLInputElement | undefined
}

export interface BookmarksPanelComponent {
  getBounds: () => ItemBounds[]
  toggleGroupById: (id: ID) => void
}

export interface IPCheckResult {
  ip?: string
  country?: string
}

export interface DragItem {
  id: ID
  url?: string
  title?: string
  pinned?: boolean
  parentId?: ID
  container?: string
  customColor?: string
  customTitle?: string
  folded?: boolean
}

export interface DragInfo {
  x: number
  y: number
  type: E.DragType
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
  pos?: E.DstTreePos
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
  // Favicon/FavHash index
  index: number
  // Length of source url
  len: number
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
  sidebarCSSLen?: string
  groupCSSLen?: string
  windows?: DbgWindow[] | string
  contextMenu?: MenuConfs | string
  bookmarks?: DbgBookmarks | string
}

interface DbgPermissions {
  allUrls: boolean
  webRequest: boolean
  webRequestBlocking: boolean
  proxy: boolean
  tabHide: boolean
  clipboardWrite: boolean
  history: boolean
  bookmarks: boolean
  downloads: boolean
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
  buttonsInline?: boolean
  buttonsDefaultFocus?: string
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
  buttonsInline?: boolean
  buttonsDefaultFocus?: string
}

export interface TabsPanelRemoving {
  id: ID
  withMode: (mode: E.TabsPanelRemovingMode | null) => void
}

export interface TabsPanelSaving {
  id: ID
  withMode: (mode: E.TabsPanelSavingMode | null) => void
}

export type Entries<T> = (Iterator<T> & { [K in keyof T]: [K, T[K]] }[keyof T])[]

export type RGBA = [number, number, number, number]
export type RGB = [number, number, number]

export interface CopyTemplate {
  name?: string
  str: string
  hasCT?: boolean
  hasT?: boolean
  hasU?: boolean
  hasB?: boolean
}

export type DataUriImage = string & {}

export type Reactivator<T extends object> = (target: T) => T

export interface OmniboxHistory {
  types: E.OmniCmdType[]
  cmds: string[]
}
