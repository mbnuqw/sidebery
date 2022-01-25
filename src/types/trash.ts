import { TabCache } from './tabs'

export interface StoredRemovedTab {
  url: string
  title: string
  time: number
}

export interface StoredRemovedBookmark {
  url?: string
  title: string
  time: number
  parentId: ID
  subItems?: StoredRemovedBookmarkChild[]
}

export interface StoredRemovedBookmarkChild {
  url?: string
  title: string
  subItems?: StoredRemovedBookmarkChild[]
}

export interface StoredRemovedWindow {
  title: string
  time: number
  tabsCache: TabCache[]
}

export const enum RemovedItemType {
  Tab = 1,
  Bookmark = 2,
  Window = 3,
}

export interface RemovedTab extends StoredRemovedTab {
  type: RemovedItemType.Tab
  id: ID
  sel: boolean
  tooltip?: string
  rmTimeStr?: string
}

export interface RemovedBookmark extends StoredRemovedBookmark {
  type: RemovedItemType.Bookmark
  id: ID
  sel: boolean
  tooltip?: string
  len?: number
  rmTimeStr?: string
}

export interface RemovedWindow extends StoredRemovedWindow {
  type: RemovedItemType.Window
  id: ID
  sel: boolean
  tooltip?: string
  len?: number
  rmTimeStr?: string
}

export type RemovedItem = RemovedTab | RemovedBookmark | RemovedWindow
