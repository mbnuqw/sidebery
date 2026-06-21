import { BookmarksPanelComponent, ScrollBoxComponent } from '../types'
import { Tab } from './tabs'
import type * as Bookmarks from 'src/services/bookmarks.fg'
import * as E from 'src/enums'

export interface NavBtn {
  id: ID
  class: E.NavItemClass
  type: E.ButtonType
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
  class: E.NavItemClass
  type: E.SpaceType
}

export type NavItem = Panel | NavBtn | NavSpace

export interface SidebarConfig {
  panels: Record<ID, PanelConfig>
  nav: ID[]
}

export type NavItemType = E.PanelType | E.ButtonType | E.SpaceType

export interface ItemBounds {
  type: E.ItemBoundsType
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
  bottomOffset: number
  items: ItemBounds[]
}

export interface SrcBookmarksPanelConfig {
  id: ID
  viewMode: string
  tempMode: boolean
  autoConvert: boolean
}

export interface SrcTabsPanelConfig {
  id: ID
  noEmpty: boolean
  newTabCtx: string
  dropTabCtx: string
  moveRules: TabToPanelMoveRuleConfig[]
  newTabBtns: string[]
}

interface PanelConfigCommonProps {
  id: ID
  name: string
  iconSVG: string
  iconIMG?: string
  iconIMGSrc?: string
  color: browser.ColorName
  skipOnSwitching: boolean
  lockedPanel: boolean
}

interface PanelCommonProps {
  class: E.NavItemClass.panel
  index: number
  topOffset: number
  leftOffset: number
  rightOffset: number
  bottomOffset: number
  scrollEl: HTMLElement | null
  scrollComponent: ScrollBoxComponent | null
  bounds: ItemBounds[]
  hidden: boolean
  ready: boolean
}

interface PanelCommonReactiveProps {
  name: string
  color: browser.ColorName
  iconSVG: string
  iconIMG?: string
  hidden: boolean
  tooltip: string
  sel: boolean
  len: number
  filteredLen?: number
  ready: boolean
  pos: 'l' | 'r' | 'c' | 'lc' | 'rc' | 'h'
}

///
/// Tabs panel
///
export interface TabsPanelConfig extends PanelConfigCommonProps {
  type: E.PanelType.tabs
  noEmpty: boolean
  newTabCtx: string
  dropTabCtx: string
  moveRules: TabToPanelMoveRuleConfig[]
  moveExcludedTo: ID
  bookmarksFolderId: ID
  newTabBtns: string[]
  srcPanelConfig: SrcBookmarksPanelConfig | null
}

export interface TabsPanel extends PanelCommonProps, TabsPanelConfig {
  type: E.PanelType.tabs
  tabs: Tab[]
  pinnedTabs: Tab[]
  filteredTabs?: Tab[]
  updatedTabs: ID[]
  selNewTab: boolean
  startTabIndex: number
  endTabIndex: number
  nextTabIndex: number
  scrollRetainer: number
  allDiscarded: boolean

  reactive: TabsPanelReactiveProps

  updateNewTabBtns?: (btns: string[]) => void
}

export interface TabsPanelReactiveProps extends PanelCommonReactiveProps {
  visibleTabIds: ID[]
  pinnedTabIds: ID[]

  updated: boolean
  selNewTab: boolean
  scrollRetainerHeight: number
  empty: boolean
  allDiscarded: boolean
  newTabCtx: string
  newTabBtns: string[]
  mediaState: E.MediaState
}

///
/// Bookmarks panel
///
export interface BookmarksPanelConfig extends PanelConfigCommonProps {
  type: E.PanelType.bookmarks
  rootId: ID
  viewMode: string
  tempMode: boolean
  autoConvert: boolean
  srcPanelConfig: SrcTabsPanelConfig | null
}

export interface BookmarksPanel extends PanelCommonProps, BookmarksPanelConfig {
  type: E.PanelType.bookmarks
  component?: BookmarksPanelComponent
  bookmarks: Bookmarks.BkmNode[]
  filteredBookmarks?: Bookmarks.BkmNode[]

  reactive: BookmarksPanelReactiveProps

  pathUp?: () => boolean
  pathDown?: () => boolean
}

export interface BookmarksPanelReactiveProps extends PanelCommonReactiveProps {
  bookmarkIds: ID[]
  filteredBookmarkIds?: ID[]
  viewMode: string
  rootOffset: number
}

///
/// History panel
///
export interface HistoryPanelConfig extends PanelConfigCommonProps {
  type: E.PanelType.history
  viewMode: string
  tempMode: boolean
}

export interface HistoryPanel extends PanelCommonProps, HistoryPanelConfig {
  type: E.PanelType.history

  reactive: PanelCommonReactiveProps
}

///
/// Sync panel
///
export interface SyncPanelConfig extends PanelConfigCommonProps {
  type: E.PanelType.sync
  viewMode: string
  tempMode: boolean
}

export interface SyncPanel extends PanelCommonProps, SyncPanelConfig {
  type: E.PanelType.sync

  reactive: PanelCommonReactiveProps
}

///
///
///

export interface ViewModeBtn {
  id: string
  icon: string
}

export type PanelConfig =
  | BookmarksPanelConfig
  | TabsPanelConfig
  | HistoryPanelConfig
  | SyncPanelConfig
export type Panel = BookmarksPanel | TabsPanel | HistoryPanel | SyncPanel

export interface TabToPanelMoveRuleConfig {
  id: ID
  active: boolean
  name?: string
  url?: string
  containerId?: string
  topLvlOnly?: boolean
}

export interface TabToPanelMoveRule {
  panelId: ID
  urlRE?: RegExp
  urlStr?: string
  containerId?: string
  topLvlOnly?: boolean
}

export interface TabReopenRuleConfig {
  id: ID
  type: E.TabReopenRuleType
  active: boolean
  url: string
  name?: string
}

export interface TabReopenRule {
  containerId: string
  urlRE?: RegExp
  urlStr?: string
}
