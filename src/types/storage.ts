import * as T from 'src/types'

export type StoredProps = (keyof Stored)[]

export interface Stored {
  ver?: string
  settings?: T.SettingsState
  containers?: Record<ID, T.Container>
  profileID?: string

  tabsDataCache?: T.TabCache[][]

  favicons_01?: string[]
  favicons_02?: string[]
  favicons_03?: string[]
  favicons_04?: string[]
  favicons_05?: string[]
  favHashes?: number[]
  favDomains?: Record<string, T.FavDomain>

  sidebar?: T.SidebarConfig
  lastFocusedActivePanelId?: ID

  snapshots?: T.Snapshot[]
  lastSnapTime?: number

  contextMenu?: T.MenuConfs

  sidebarCSS?: string
  groupCSS?: string

  expandedBookmarkFolders?: T.ExpandedBookmarks
  bookmarksRecentFolders?: ID[]

  googleDriveFileIds?: Record<string, string>

  omnibox?: T.OmniboxHistory
}

export type StorageChanges = {
  [key in keyof Stored]: browser.storage.StorageChange<Stored[key]>
}
