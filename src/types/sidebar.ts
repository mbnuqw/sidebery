import { BookmarksPanelComponent, ScrollBoxComponent } from '../types'
import { ReactiveTab } from './tabs'
import { Bookmark } from './bookmarks'

export interface NavBtn {
  id: ID
  class: NavItemClass
  type: ButtonType
  name?: string
  iconSVG?: string
  iconIMG?: string
  color?: string
  len?: number
  tooltip?: string
  sel?: boolean
  active?: boolean
}

export interface NavSpace {
  id: ID
  class: NavItemClass
  type: SpaceType
}

export type NavItem = Panel | NavBtn | NavSpace

export interface SidebarConfig {
  panels: Record<ID, PanelConfig>
  nav: ID[]
}

export const enum PanelType {
  bookmarks = 1,
  tabs = 2,
  history = 4,
}

export const enum ButtonType {
  settings = 100,
  add_tp = 101,
  search = 103,
  hidden = 104,
  create_snapshot = 105,
  remute_audio_tabs = 106,
  collapse = 107,
}

export const enum SpaceType {
  dynamic = 200,
  static = 201,
}

export type NavItemType = PanelType | ButtonType | SpaceType
export const NavItemTypeNames = {
  [PanelType.bookmarks]: 'bookmarks',
  [PanelType.tabs]: 'tabs',
  [PanelType.history]: 'history',
  [ButtonType.settings]: 'settings',
  [ButtonType.add_tp]: 'add_tp',
  [ButtonType.search]: 'search',
  [ButtonType.hidden]: 'hidden',
  [ButtonType.create_snapshot]: 'create_snapshot',
  [ButtonType.remute_audio_tabs]: 'remute_audio_tabs',
  [ButtonType.collapse]: 'collapse',
  [SpaceType.dynamic]: 'dynamic',
  [SpaceType.static]: 'static',
}

export const enum NavItemClass {
  panel = 1,
  btn = 2,
  space = 3,
}
export const NavItemClassNames = {
  [NavItemClass.panel]: 'panel',
  [NavItemClass.btn]: 'btn',
  [NavItemClass.space]: 'space',
}

export const ButtonTypes: Record<string, ButtonType> = {
  settings: ButtonType.settings,
  search: ButtonType.search,
  add_tp: ButtonType.add_tp,
  hidden: ButtonType.hidden,
  collapse: ButtonType.collapse,
  create_snapshot: ButtonType.create_snapshot,
  remute_audio_tabs: ButtonType.remute_audio_tabs,
}
export const ButtonTypeNames = {
  [ButtonType.settings]: 'settings',
  [ButtonType.search]: 'search',
  [ButtonType.add_tp]: 'add_tp',
  [ButtonType.hidden]: 'hidden',
  [ButtonType.create_snapshot]: 'create_snapshot',
}

export const enum ItemBoundsType {
  Tab = 1,
  Bookmarks = 2,
  Header = 3,
}

export interface ItemBounds {
  type: ItemBoundsType
  id: ID
  index: number
  in: boolean
  lvl: number
  folded: boolean
  parent: ID
  start: number
  top: number
  center: number
  bottom: number
  end: number
}

export interface PanelBounds {
  scrollEl: HTMLElement
  topOffset: number
  leftOffset: number
  rightOffset: number
  items: ItemBounds[]
}

export interface NavItemConfig {
  id: ID
  name: string
  iconSVG: string
  iconIMG?: string
  iconIMGSrc?: string
}

export interface NavItemState {
  tooltip?: string
  inactive?: boolean
}

export interface OldPanelConfig {
  type: string
  id: ID
  name: string
  icon: string
  color: string
  customIconSrc: string
  customIcon: string
  lockedTabs: boolean
  lockedPanel: boolean
  skipOnSwitching: boolean
  noEmpty: boolean
  newTabCtx: string
  dropTabCtx: string
  moveTabCtx: string
  moveTabCtxNoChild: boolean
  urlRulesActive: boolean
  urlRules: string
}

export interface PanelCommonConfig extends NavItemConfig {
  type: PanelType
  color: browser.ColorName
  skipOnSwitching: boolean
  lockedPanel: boolean
}

export interface TabsPanelConfig extends PanelCommonConfig {
  type: PanelType.tabs
  noEmpty: boolean
  newTabCtx: string
  dropTabCtx: string
  moveTabCtx: string
  moveTabCtxNoChild: boolean
  urlRulesActive: boolean
  urlRules: string
  bookmarksFolderId: ID
  newTabBtns: string[]
}

export interface BookmarksPanelConfig extends PanelCommonConfig {
  type: PanelType.bookmarks
  rootId: ID
  viewMode: string
  tempMode: boolean
  autoConvert: boolean
}

export interface HistoryPanelConfig extends PanelCommonConfig {
  type: PanelType.history
  viewMode: string
  tempMode: boolean
}

export type PanelConfig = BookmarksPanelConfig | TabsPanelConfig | HistoryPanelConfig

export interface PanelCommonState extends PanelCommonConfig, NavItemState {
  class: NavItemClass
  len: number
  filteredLen?: number
  index: number
  sel: boolean
  loading: boolean | 'ok' | 'err'
  topOffset: number
  leftOffset: number
  rightOffset: number
  scrollEl: HTMLElement | null
  scrollComponent: ScrollBoxComponent | null
  bounds: ItemBounds[]
  ready: boolean
  tooltip?: string
}

export interface TabsPanel extends PanelCommonState, TabsPanelConfig {
  type: PanelType.tabs
  tabs: ReactiveTab[]
  pinnedTabs: ReactiveTab[]
  updatedTabs: ID[]
  selNewTab: boolean
  actTabs: ID[]
  startTabIndex: number
  endTabIndex: number
  nextTabIndex: number
  filteredTabs?: ReactiveTab[]
  scrollRetainer: number
}

export interface BookmarksPanel extends PanelCommonState, BookmarksPanelConfig {
  type: PanelType.bookmarks
  bookmarks: Bookmark[]
  filteredBookmarks?: Bookmark[]
  component?: BookmarksPanelComponent
}

export interface HistoryPanel extends PanelCommonState, HistoryPanelConfig {
  type: PanelType.history
}

export interface ViewModeBtn {
  id: string
  icon: string
}

export type Panel = BookmarksPanel | TabsPanel | HistoryPanel
