export interface Bookmark extends browser.bookmarks.TreeNode {
  parentId: ID // Required since I'm not using Root node
  index: number
  children?: Bookmark[]
  sel?: boolean
  isOpen?: boolean
  isParent?: boolean
  expanded?: boolean
}

export type BookmarksSortType = 'name' | 'link' | 'time'
