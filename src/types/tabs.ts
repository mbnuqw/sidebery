import type * as E from 'src/enums'
import type * as D from 'src/defaults'
import type { ParsedTheme } from 'src/services/styles'

export type NativeTab = browser.tabs.Tab

export interface Tab extends NativeTab {
  isParent: boolean
  folded: boolean
  autoUnloadFoldedTimeout?: number
  invisible: boolean
  parentId: ID
  panelId: ID
  prevPanelId: ID
  lvl: number
  sel: boolean
  selLock: boolean
  updated: boolean
  loading: boolean | 'ok' | 'err'
  warn: boolean
  unread?: boolean
  relGroupId: ID
  dstPanelId: ID
  autoGroupped?: boolean
  unpinning?: boolean
  moveTime?: number
  childLastAccessed?: number
  lastExpanded?: number
  reloadingChecks?: number
  mediaPaused: boolean
  reopened?: boolean
  internal?: boolean
  isGroup: boolean
  reopening?: { id: ID }
  reopenInContainer?: string
  customTitle?: string
  customColor?: string
  moving?: boolean
  removing?: boolean
  flashAnimationTimeout?: number

  reactive: ReactiveTabProps
  sessionData?: TabSessionData

  titleEl?: HTMLElement
  favImgEl?: HTMLImageElement
  favSvgUseEl?: SVGElement
  flashFxEl?: HTMLElement

  checkingSessionRestore?: Promise<boolean>
  resolveSessionRestoreDetection?: (isSessionRestore: boolean) => void
}

export interface ReactiveTabProps {
  active: boolean
  mediaAudible: boolean
  mediaMuted: boolean
  mediaPaused: boolean
  containerColor: string | null
  discarded: boolean
  pinned: boolean
  status: E.TabStatus
  isParent: boolean
  folded: boolean
  tooltip: string
  customTitleEdit: boolean
  url: string
  lvl: number
  branchLen: number
  sel: boolean
  selLock: boolean
  warn: boolean
  notificationBadgeCount: string | null
  updated: boolean
  unread: boolean
  flash: boolean
  color: string | null
  branchColor: string | null
  customColor: string | null
  isGroup: boolean
}

export interface BgTab extends NativeTab {
  lvl?: number
  parentId?: ID
  panelId?: ID
  folded?: boolean
  customTitle?: string
  customColor?: string

  internal?: boolean
  isGroup?: boolean
  isPlaceholder?: boolean
  proxified?: boolean
  preventAutoReopening?: boolean
  reloadOnActivation?: boolean
}

export interface InlineTabData {
  lvl: number
  panelId: ID
}

export interface TabCache {
  id: ID
  url: string
  pin?: boolean
  parentId?: ID /* only if tab has parent tab */
  panelId?: ID
  folded?: boolean
  ctx?: string /* only for containered tab */
  uniqWinId?: ID /* only for the first tab of window */
  customTitle?: string
  customColor?: string

  index?: number
  isMissedGroup?: boolean
}

export interface TabSessionData {
  id: ID
  panelId: ID
  parentId: ID
  folded: boolean
  customTitle?: string
  customColor?: string
}

export interface ActiveTabsHistory {
  id: ID
  actTabOffset: number
  actTabs: ID[]
}

export interface NewTabPosition {
  parent: ID
  panel: ID
  unread?: boolean
}

export interface GroupPageInitData {
  theme?: (typeof D.SETTINGS_OPTIONS.theme)[number]
  parsedTheme?: ParsedTheme
  frameColorScheme?: 'dark' | 'light'
  toolbarColorScheme?: 'dark' | 'light'
  customCSS?: string
  groupLayout?: (typeof D.SETTINGS_OPTIONS.groupLayout)[number]
  animations?: boolean
  groupInfo?: GroupInfo | null
  newTabPos?: 'first_child' | 'last_child'
  winId?: ID
  tabId?: ID
  labels?: Record<string, string>
}

export interface GroupInfo {
  id?: ID
  tabs: GroupedTabInfo[]
  favicons: Record<string, string>
  parentId?: ID
  pin?: GroupPin
}

export interface GroupedTabInfo {
  id: ID
  index: number
  lvl: number
  title: string
  url: string
  discarded: boolean
  favIconUrl?: string
  el?: HTMLElement
  bgEl?: HTMLElement
  favEl?: HTMLElement
  favPlaceholderEl?: HTMLElement
  favPlaceholderSvgEl?: SVGElement
  titleEl?: HTMLElement
  urlEl?: HTMLElement
}

export interface GroupPin {
  id: ID
  title: string
  url: string
  favIconUrl: string
  discarded?: string
  el?: HTMLElement | null
  bgEl?: HTMLElement | null
  titleEl?: HTMLElement | null
  urlEl?: HTMLElement | null
}

export interface GroupUpdMsg {
  windowId?: ID
  parentId?: ID
  title?: string
  tabs?: GroupedTabInfo[]
  pin?: GroupPin
  createdTab?: GroupedTabInfo
  updatedTab?: GroupedTabInfo
  updatedTabs?: GroupedTabInfo[]
  removedTab?: ID
}

export interface NewGroupUrlConfig {
  pinUrl?: string
  pinCtr?: string
}

export interface NewGroupConfig {
  title?: string
  active?: boolean
  // pinParam?: string
  pinnedTab?: Tab
}

export interface SavedGroup {
  id: ID
  index: number
  ctx: string
  panelId: ID
  parentId: ID
  folded: boolean
  url: string
  prevTab?: ID
  nextTab?: ID
}

export interface PlaceholderInfo {
  url: string
  title?: string
}

/**
 * Tab / Bookmark props
 */
export interface ItemInfo {
  id: ID
  url?: string
  index?: number
  title?: string
  active?: boolean
  pinned?: boolean
  folded?: boolean
  parentId?: ID
  panelId?: ID
  container?: string
  customTitle?: string
  customColor?: string
}

export interface TabTreeData {
  id: ID
  pid?: ID
  tid?: ID
  ct?: string
  cc?: string
  f?: 1
}
export type TabsTreeData = TabTreeData[]

export interface RemovedTabInfo {
  id: ID
  index: number
  title: string
  parentId: ID
  panelId: ID
  children?: ID[]
  customTitle?: string
  customColor?: string
}

export interface RecentlyClosedTabInfo {
  id: ID
  url: string
  title: string
  parentId: ID
  isParent: boolean
  lvl: number
  time: number
  containerId: string
  containerColor?: string
  favIconUrl?: string
  favPlaceholder?: string
}
