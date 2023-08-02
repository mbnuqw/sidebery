import { SettingsState, Container, Snapshot, ContextMenuConfig_v4, CssVars } from 'src/types'
import { TabCache, FavDomain, Container_v4 } from 'src/types'
import { OldPanelConfig, SidebarConfig, MenuConfs } from 'src/types'
import { Snapshot_v4 } from './snapshots'

export type StoredProps = (keyof Stored)[]

export interface Stored {
  ver?: string
  settings?: SettingsState
  containers?: Record<ID, Container>
  containers_v4?: Record<ID, Container_v4> // DEPR
  profileID?: string

  tabsData_v4?: TabCache[][] // DEPR
  tabsDataCache?: TabCache[][]
  prevTabsData_v4?: TabCache[][] // DEPR

  favicons?: string[]
  favicons_01?: string[]
  favicons_02?: string[]
  favicons_03?: string[]
  favicons_04?: string[]
  favicons_05?: string[]
  favHashes?: number[]
  favDomains?: Record<string, FavDomain>
  favUrls?: Record<string, number> // DEPR
  favAutoCleanTime?: number // DEPR

  sidebar?: SidebarConfig
  panels_v4?: OldPanelConfig[] // DEPR
  panelIndex?: number // DEPR

  snapshots?: Snapshot[]
  snapshots_v4?: Snapshot_v4[] // DEPR
  lastSnapTime?: number

  keybindings?: { [name: string]: string }

  contextMenu?: MenuConfs
  tabsMenu?: ContextMenuConfig_v4 // DEPR
  bookmarksMenu?: ContextMenuConfig_v4 // DEPR
  tabsPanelMenu?: ContextMenuConfig_v4 // DEPR
  bookmarksPanelMenu?: ContextMenuConfig_v4 // DEPR

  cssVars?: CssVars // DEPR
  sidebarCSS?: string
  groupCSS?: string

  expandedBookmarks?: ID[][] // DEPR
  expandedBookmarkFolders?: Record<ID, Record<ID, boolean>>
  bookmarksRecentFolders?: ID[]
}

export interface StoredSyncValue {
  ver?: string
  name: string
  time: number
  value: Stored
}

export interface StoredSync {
  [name: string]: StoredSyncValue
}

export type StorageChanges = {
  [key in keyof Stored]: browser.storage.StorageChange<Stored[key]>
}
