export type NativeBkmNode = browser.bookmarks.TreeNode

export interface ReactiveBkmProps {
  title: string
  url?: string
  sel: boolean
  selLock: boolean
  hasOpenTabs: boolean
  len: number
  customColor?: string
  containerColor?: string
  children?: ID[]
}

export type BookmarksSortType = 'name' | 'link' | 'time'

export type ExpandedBookmarks = Record<ID, Record<ID, boolean>>
