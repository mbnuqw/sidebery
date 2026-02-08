import { MenuConfs, SettingsState, CustomStyles } from 'src/types'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

export const enum SyncedEntryType {
  Settings = 1,
  CtxMenu = 2,
  Styles = 3,
  Keybindings = 4,
  Tabs = 5,
}

export type SyncedDataType<T> = T extends SyncedEntryType.Settings
  ? SettingsState
  : T extends SyncedEntryType.CtxMenu
    ? MenuConfs
    : T extends SyncedEntryType.Keybindings
      ? Record<string, string>
      : T extends SyncedEntryType.Styles
        ? CustomStyles
        : any

export interface EntryTab {
  id: ID
  title: string
  url: string
  lvl: number
  favicon?: string
  pin?: boolean
  parentId?: ID
  isParent?: boolean
  folded?: boolean
  containerId?: string
  containerColor?: string
  customTitle?: string
  customColor?: string
}

export interface EntryContainer {
  id: string
  name: string
  color: string
  icon: string
}

export interface SyncedEntry {
  id?: string
  type?: SyncedEntryType
  profileId?: string
  profileName?: string
  time?: number
  dateYYYYMMDD?: string
  timeHHMM?: string
  size?: string
  sameProfile?: boolean
  loading?: boolean

  tabs?: EntryTab[]
  containers?: Record<string, EntryContainer>

  gdFileId?: string
  ffKey?: string
}

export interface SyncReactiveState {
  loading: boolean
  syncing: boolean
  entries: SyncedEntry[]
}

export const QUEUE = new Utils.AsyncQueue()
export const AUTO_UNLOAD_TIMEOUT_BG = 35_000

export function getSyncedType(syncedTypeString: string): SyncedEntryType | null {
  switch (syncedTypeString) {
    case 'settings':
      return SyncedEntryType.Settings
    case 'ctxMenu':
    case 'ctx-menu':
      return SyncedEntryType.CtxMenu
    case 'styles':
      return SyncedEntryType.Styles
    case 'kb':
    case 'keybindings':
      return SyncedEntryType.Keybindings
    case 'tabs':
      return SyncedEntryType.Tabs
    default:
      return null
  }
}
