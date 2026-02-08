import { MenuConfs, SettingsState } from 'src/types'
import * as Sync from 'src/services/sync'

export type KeyType = 'settings' | 'ctxMenu' | 'kb' | 'styles'

/**
 * Key value pairs stored to browser.storage.sync.
 *
 * key is `${profileId}::${dataType}`
 * where dataType is 'settings' | 'ctxMenu' | 'styles' | 'kb'
 */
export interface Synced {
  [key: string]: SyncedValue
}

/**
 * Sync value object
 */
export interface SyncedValue {
  ver?: string // Addon version
  name: string // Profile name
  time: number // Modification time
  value: SyncableData
  entryId?: string
}

/**
 * Collection of data that can be synced via Firefox Sync
 */
export interface SyncableData {
  settings?: SettingsState
  contextMenu?: MenuConfs
  sidebarCSS?: string
  groupCSS?: string
  keybindings?: { [name: string]: string }
}

export function syncEntryTypeToKeyType(entryType: Sync.SyncedEntryType): KeyType | void {
  switch (entryType) {
    case Sync.SyncedEntryType.Settings:
      return 'settings'
    case Sync.SyncedEntryType.CtxMenu:
      return 'ctxMenu'
    case Sync.SyncedEntryType.Styles:
      return 'styles'
    case Sync.SyncedEntryType.Keybindings:
      return 'kb'
  }
}
