import { SettingsState, Container, Snapshot } from 'src/types'
import { TabCache, FavDomain } from 'src/types'
import { SidebarConfig, MenuConfs } from 'src/types'

export type StoredProps = (keyof Stored)[]

export interface Stored {
  ver?: string
  settings?: SettingsState
  containers?: Record<ID, Container>
  profileID?: string

  tabsDataCache?: TabCache[][]

  favicons_01?: string[]
  favicons_02?: string[]
  favicons_03?: string[]
  favicons_04?: string[]
  favicons_05?: string[]
  favHashes?: number[]
  favDomains?: Record<string, FavDomain>

  sidebar?: SidebarConfig

  snapshots?: Snapshot[]
  lastSnapTime?: number

  contextMenu?: MenuConfs

  sidebarCSS?: string
  groupCSS?: string

  expandedBookmarkFolders?: Record<ID, Record<ID, boolean>>
  bookmarksRecentFolders?: ID[]

  googleDriveFileIds?: Record<string, string>
}

export type StorageChanges = {
  [key in keyof Stored]: browser.storage.StorageChange<Stored[key]>
}
