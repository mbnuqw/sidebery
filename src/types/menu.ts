// Config types
export type MenuConfOptionId = string
export type MenuConfSubOptions = { name?: string; opts: MenuConfOptionId[] }
export type MenuConf = (MenuConfOptionId | MenuConfSubOptions)[]
export interface MenuConfs {
  tabs?: MenuConf
  bookmarks?: MenuConf
  tabsPanel?: MenuConf
  bookmarksPanel?: MenuConf
}

// Internal types
export const enum MenuType {
  Tabs = 1,
  Bookmarks = 2,
  History = 3,
  NewTab = 6,
  TabsPanel = 7,
  BookmarksPanel = 8,
  Panel = 9,
}
export type MenuOptionType = 'option' | 'separator'
export interface MenuOptionFlag {
  active?: boolean
  icon?: string
  onClick?: (opt: MenuOption) => void
}
export interface MenuOption {
  type?: MenuOptionType
  label?: string
  tooltip?: string
  icon?: string
  img?: string
  badge?: string
  color?: browser.ColorName
  inactive?: boolean
  sub?: MenuOption[]
  flag?: MenuOptionFlag
  keepSearching?: boolean
  onClick?: () => void
  onAltClick?: () => void
}
export type MenuBlockType = 'list' | 'inline' | 'sub'
export interface MenuBlock {
  type: MenuBlockType
  opts: MenuOption[]
  name?: string
}
export interface MenuInvokeDetails {
  x: number
  y: number
  blocks: MenuBlock[]
  off?: () => void
}

// v4 config
export type SubOptionID_v4 = string | { name: string }
export type OptionsGroup_v4 = SubOptionID_v4[]
export type ContextMenuConfig_v4 = (string | OptionsGroup_v4)[]
