export interface Tab extends browser.tabs.Tab {
  isParent: boolean
  folded: boolean
  autoUnloadFoldedTimeout?: number
  invisible: boolean
  parentId: ID
  panelId: ID
  prevPanelId: ID
  lvl: number
  sel: boolean
  updated: boolean
  loading: boolean | 'ok' | 'err'
  warn: boolean
  unread: boolean
  proxified: boolean
  relGroupId: ID
  relPinId: ID
  dstPanelId: ID
  autoGroupped: boolean
  unpinning: boolean
  moveTime: number
  childLastAccessed: number
  reloadingChecks: number
  mediaPaused: boolean
  reopened?: boolean
  internal?: boolean
  isGroup: boolean
  reopening?: { id: ID }
  reopenInContainer?: string
  customTitle?: string
  customColor?: string
  reloadOnActivation?: boolean
}

export const enum TabStatus {
  Complete = 1,
  Loading = 2,
  Pending = 3,
  Ok = 4,
  Err = 5,
}

export interface ReactiveTab {
  id: ID
  active: boolean
  mediaAudible: boolean
  mediaMuted: boolean
  mediaPaused: boolean
  containerColor: string | null
  discarded: boolean
  favIconUrl?: string
  invisible: boolean
  pinned: boolean
  status: TabStatus
  isParent: boolean
  folded: boolean
  title: string
  tooltip: string
  customTitle: string | null
  customTitleEdit: boolean
  url: string
  lvl: number
  branchLen: number
  sel: boolean
  warn: boolean
  updated: boolean
  unread: boolean
  flash: boolean
  color: string | null
  branchColor: string | null
  customColor: string | null
  isGroup: boolean
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

export interface GroupedTabInfo {
  id: ID
  index: number
  lvl: number
  title: string
  url: string
  discarded: boolean
  favIconUrl: string
  status?: string
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

export interface GroupInfo {
  id?: ID
  index?: number
  len: number
  tabs: GroupedTabInfo[]
  parentId?: ID
  pin?: GroupPin
}

export interface GroupConfig {
  title?: string
  active?: boolean
  pin?: string
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
}
export type TabsTreeData = TabTreeData[]
