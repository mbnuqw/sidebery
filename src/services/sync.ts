import { MenuConfs, SettingsState, SubPanelType, CustomStyles } from 'src/types'
import { Google, IPC, Logs, Sync, Utils } from './_services'
import { Settings } from './settings'
import { Sidebar } from './sidebar'
import { Windows } from './windows'
import { translate } from 'src/dict'
import { Info } from './info'
import { Notifications } from './notifications'

export * as Firefox from './sync.firefox'
export * as Google from './sync.google'

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

export let ready = false
export const state = {
  subPanelScrollEl: null as HTMLElement | null,
  panelScrollEl: null as HTMLElement | null,
}
export let reactive: SyncReactiveState = {
  loading: false,
  syncing: false,
  entries: [],
}

const QUEUE = new Utils.AsyncQueue()
const AUTO_UNLOAD_TIMEOUT_BG = 35_000

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initSync(react: (rObj: object) => object) {
  reactFn = react as <T extends object>(rObj: T) => T
  reactive = reactFn(reactive)
}

export function getProfileId() {
  return browser.runtime.getURL('').slice(16, 52)
}

export function getSyncedType(syncedTypeString: string): Sync.SyncedEntryType | null {
  switch (syncedTypeString) {
    case 'settings':
      return Sync.SyncedEntryType.Settings
    case 'ctxMenu':
    case 'ctx-menu':
      return Sync.SyncedEntryType.CtxMenu
    case 'styles':
      return Sync.SyncedEntryType.Styles
    case 'kb':
    case 'keybindings':
      return Sync.SyncedEntryType.Keybindings
    case 'tabs':
      return Sync.SyncedEntryType.Tabs
    default:
      return null
  }
}

export async function save<T extends SyncedEntryType>(type: T, data: SyncedDataType<T>) {
  Logs.info('Sync.save()')

  reactive.syncing = true

  return QUEUE.add(_save, type, data)
}
async function _save<T extends SyncedEntryType>(type: T, data: SyncedDataType<T>) {
  Logs.info('Sync._save()')

  if (type === SyncedEntryType.Tabs) {
    reactive.syncing = false
    throw 'Use saveTabs()'
  }

  reactive.syncing = true

  if (Info.isBg) {
    const entryId = Utils.uid()
    let ffKey, file, gdFileId

    resetUnloadTimeout()

    try {
      if (type === Sync.SyncedEntryType.Settings) {
        if (Settings.state.syncUseFirefox) {
          ffKey = await Sync.Firefox.save('settings', { settings: data }, entryId)
        }
        if (Settings.state.syncUseGoogleDrive) {
          file = await Sync.Google.save(Sync.Google.FileType.Settings, data, { entryId })
        }
      } else if (type === Sync.SyncedEntryType.CtxMenu) {
        if (Settings.state.syncUseFirefox) {
          ffKey = await Sync.Firefox.save('ctxMenu', { contextMenu: data }, entryId)
        }
        if (Settings.state.syncUseGoogleDrive) {
          file = await Sync.Google.save(Sync.Google.FileType.CtxMenu, data, { entryId })
        }
      } else if (type === Sync.SyncedEntryType.Styles) {
        if (Settings.state.syncUseFirefox) {
          ffKey = await Sync.Firefox.save('styles', data, entryId)
        }
        if (Settings.state.syncUseGoogleDrive) {
          file = await Sync.Google.save(Sync.Google.FileType.Styles, data, { entryId })
        }
      } else if (type === Sync.SyncedEntryType.Keybindings) {
        if (Settings.state.syncUseFirefox) {
          ffKey = await Sync.Firefox.save('kb', data, entryId)
        }
        if (Settings.state.syncUseGoogleDrive) {
          file = await Sync.Google.save(Sync.Google.FileType.Keybindings, data, { entryId })
        }
      }
      gdFileId = file?.id
    } catch (err) {
      reactive.syncing = false
      unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
      throw err
    }

    // Prepend new entry
    const profileId = getProfileId()
    const entryTime = new Date()
    const dayStartTime = Utils.getDayStartMS()
    const entry: SyncedEntry = {
      id: entryId,
      type,
      profileId,
      profileName: Settings.state.syncName.trim() || profileId,
      time: entryTime.getTime(),
      dateYYYYMMDD: entryTime ? Utils.dDate(entryTime, '.', dayStartTime) : '???',
      timeHHMM: entryTime ? Utils.dTime(entryTime, ':', false) : '???',
      size: Utils.strSize(JSON.stringify(data)),
      sameProfile: true,

      ffKey,
      gdFileId,
    }
    Logs.info('Sync._save: new entry:', entry.id, ffKey, gdFileId)
    const index = reactive.entries.findIndex(e => e.type === type && e.sameProfile)
    if (index !== -1) reactive.entries.splice(index, 1, entry)
    else reactive.entries.splice(0, 0, entry)

    unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
  } else {
    try {
      await IPC.bg('saveToSync', type, data)
    } catch (err) {
      Logs.err('Sync._save()', err)
      Notifications.notify({
        icon: '#icon_sync',
        lvl: 'err',
        title: translate('sync.err.save'),
        details: err?.toString(),
      })
    }
  }

  reactive.syncing = false
}

export async function saveTabs(
  tabsBatch: Sync.Google.SyncedTabsBatch,
  favicons: Record<string, string>
): Promise<SyncedEntry | undefined | void> {
  Logs.info('Sync.saveTabs()')

  if (!tabsBatch.tabs.length) return Logs.warn('Nothing to sync')

  reactive.syncing = true
  Logs.info('Sync.saveTabs(): reactive.syncing = true')

  if (Info.isBg) {
    // Load sync service
    if (!Sync.ready) {
      Logs.info('Sync.saveTabs(): sync is not ready: loading...')
      await Sync.load()
    } else Sync.resetUnloadTimeout()
  }

  return QUEUE.add(_saveTabs, tabsBatch, favicons)
}
export async function _saveTabs(
  tabsBatch: Sync.Google.SyncedTabsBatch,
  favicons: Record<string, string>
): Promise<SyncedEntry | undefined | void> {
  Logs.info('Sync._saveTabs(): tabsBatch:', tabsBatch.id)

  reactive.syncing = true
  Logs.info('Sync._saveTabs(): reactive.syncing = true')

  let tabsEntry: SyncedEntry | undefined | void

  if (Info.isBg) {
    try {
      if (Settings.state.syncUseGoogleDrive) {
        tabsEntry = await Sync.Google.saveTabs(tabsBatch, favicons)
        Logs.info('Sync.saveTabs(): tabsEntry:', tabsEntry)
        reactive.entries.splice(0, 0, tabsEntry)
      }
    } catch (err) {
      Logs.err('Sync.saveTabs: Cannot save tabs', err)
    }

    Sync.unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
  } else {
    let error
    try {
      tabsEntry = await IPC.bg('saveTabsToSync', tabsBatch, favicons)
      if (!tabsEntry) error = 'No entry'
      Logs.info('Sync.saveTabs(): got entry:', tabsEntry)
    } catch (err) {
      error = err
    }

    if (error) {
      Logs.err('Sync.saveTabs: Cannot save tabs', error)
      Notifications.notify({
        icon: '#icon_sync',
        lvl: 'err',
        title: translate('sync.err.save_tabs'),
        details: error?.toString(),
      })
    }

    if (tabsEntry) reactive.entries.splice(0, 0, tabsEntry)
  }

  reactive.syncing = false
  Logs.info('Sync._saveTabs(): reactive.syncing = false')

  return tabsEntry
}

export async function removeByType(type: Sync.SyncedEntryType) {
  Logs.info('Sync.removeByType()')
  return QUEUE.add(async () => {
    if (Settings.state.syncUseFirefox) {
      let ffType: Sync.Firefox.KeyType | undefined
      if (type === Sync.SyncedEntryType.Settings) ffType = 'settings'
      if (type === Sync.SyncedEntryType.CtxMenu) ffType = 'ctxMenu'
      if (type === Sync.SyncedEntryType.Styles) ffType = 'styles'
      if (type === Sync.SyncedEntryType.Keybindings) ffType = 'kb'
      if (ffType) await Sync.Firefox.remove(ffType)
    }
    if (Settings.state.syncUseGoogleDrive) {
      let gdType: Sync.Google.FileType | undefined
      if (type === Sync.SyncedEntryType.Settings) gdType = Sync.Google.FileType.Settings
      if (type === Sync.SyncedEntryType.CtxMenu) gdType = Sync.Google.FileType.CtxMenu
      if (type === Sync.SyncedEntryType.Styles) gdType = Sync.Google.FileType.Styles
      if (type === Sync.SyncedEntryType.Keybindings) gdType = Sync.Google.FileType.Keybindings
      if (gdType) await Sync.Google.remove(gdType)
    }
  })
}

export async function remove(entry: Partial<SyncedEntry>) {
  Logs.info('Sync.remove():', entry.id)

  reactive.syncing = true

  return QUEUE.add(_remove, entry)
}
async function _remove(entry: Partial<SyncedEntry>) {
  Logs.info('Sync._remove():', entry.id)

  reactive.syncing = true

  if (Info.isBg) {
    resetUnloadTimeout()

    let removingInFirefoxSync
    if (Settings.state.syncUseFirefox && entry.ffKey) {
      removingInFirefoxSync = browser.storage.sync.remove(entry.ffKey)
    }

    let removingInGoogleDrive
    if (Settings.state.syncUseGoogleDrive && entry.gdFileId) {
      if (entry.type === SyncedEntryType.Tabs) {
        removingInGoogleDrive = Sync.Google.removeTabsEntry(entry)
      } else {
        let fileType
        if (entry.type === SyncedEntryType.Settings) fileType = Sync.Google.FileType.Settings
        if (entry.type === SyncedEntryType.CtxMenu) fileType = Sync.Google.FileType.CtxMenu
        if (entry.type === SyncedEntryType.Styles) fileType = Sync.Google.FileType.Styles
        if (entry.type === SyncedEntryType.Keybindings) fileType = Sync.Google.FileType.Keybindings
        if (fileType) removingInGoogleDrive = Sync.Google.remove(fileType)
      }
    }

    try {
      await Promise.allSettled([removingInFirefoxSync, removingInGoogleDrive])
    } catch (err) {
      reactive.syncing = false
      Logs.err('Cannot remove entry', err)
      unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
      throw err
    }

    unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
  } else {
    try {
      await IPC.bg('removeFromSync', {
        id: entry.id,
        type: entry.type,
        ffKey: entry.ffKey,
        gdFileId: entry.gdFileId,
      })
    } catch (err) {
      reactive.syncing = false
      Logs.err('Cannot remove entry', err)
      Notifications.notify({
        icon: '#icon_sync',
        lvl: 'err',
        title: translate('sync.err.rm'),
        details: err?.toString(),
      })
      return
    }
  }

  const rmIndex = reactive.entries.findIndex(e => e.id === entry.id)
  if (rmIndex !== -1) reactive.entries.splice(rmIndex, 1)

  reactive.syncing = false
}

export async function getData<T>(entry: SyncedEntry): Promise<T | null | void> {
  Logs.info('Sync.getData()')
  return QUEUE.add(_getData<T>, entry)
}
async function _getData<T>(entry: SyncedEntry): Promise<T | null | void> {
  Logs.info('Sync._getData: entry:', entry.id)

  if (!entry.id) {
    Logs.err('Sync._getData: No entry.id', entry)
    return
  }

  let data: T | undefined | null

  if (Info.isBg) {
    resetUnloadTimeout()

    // Check in cached value from Firefox Sync
    const cachedFFValue = Sync.Firefox.cachedValues.get(entry.id)
    if (cachedFFValue?.value) {
      const val = cachedFFValue.value
      if (entry.type === SyncedEntryType.Settings) data = val.settings as T
      if (entry.type === SyncedEntryType.CtxMenu) data = val.contextMenu as T
      if (entry.type === SyncedEntryType.Keybindings) data = val.keybindings as T
      if (entry.type === SyncedEntryType.Styles) {
        data = { sidebarCSS: val.sidebarCSS, groupCSS: val.groupCSS } as T
      }
    }

    // Or try to download from Google Drive
    if (!data && entry.gdFileId) {
      try {
        data = await Google.Drive.getJsonFile(entry.gdFileId)
      } catch (err) {
        unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
        throw err
      }
    }

    unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
  } else {
    data = (await IPC.bg('getDataFromSync', Utils.clone(entry))) as T
  }

  return data
}

let onLoadHandlers: { ok: (v: SyncedEntry[]) => void; err: (e: any) => void }[] = []

export async function load(forced?: boolean): Promise<SyncedEntry[]> {
  Logs.info('Sync.load()')

  if (reactive.loading) {
    Logs.info('Sync.load: In loading state, waiting...')
    return new Promise((ok, err) => {
      onLoadHandlers.push({ ok, err })
    })
  }

  resetUnloadTimeout()

  reactive.loading = true

  return QUEUE.add(_load, forced)
}
export async function _load(forced?: boolean): Promise<SyncedEntry[]> {
  Logs.info('Sync._load()')

  if (Info.isBg && ready && !forced && reactive.entries.length) {
    unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
    reactive.loading = false
    return reactive.entries
  }

  reactive.loading = true

  let entries: SyncedEntry[] = []

  if (Info.isBg) {
    // Get Firefox Sync data
    const [ffEntriesResult, gdEntriesResult] = await Promise.allSettled([
      Settings.state.syncUseFirefox ? Sync.Firefox.loadSyncedEntries() : [],
      Settings.state.syncUseGoogleDrive ? Sync.Google.loadSyncedEntries() : [],
    ])
    const ffEntries = Utils.settledOr(ffEntriesResult, [])
    let gdEntries = Utils.settledOr(gdEntriesResult, null)

    entries.push(...ffEntries)

    if (gdEntries) {
      entries.push(...gdEntries)
    } else {
      gdEntries = []
      Logs.err('Sync._load: Cannot load entries from google')
      IPC.sidebars('notify', {
        icon: '#icon_sync',
        lvl: 'err',
        title: translate('sync.err.google_entries'),
        details: translate('sync.err.google_entries_sub'),
      })
    }

    // Sort by time
    entries.sort((a, b) => (b.time ?? 0) - (a.time ?? 0))

    // Merge same entries
    const entryIds: Set<string> = new Set()
    entries = entries.filter(e => {
      if (!e.id) return true

      // Set corresponding google drive file id
      if (!e.gdFileId) {
        const gdEntry = gdEntries.find(gde => gde.id === e.id)
        if (gdEntry?.gdFileId) e.gdFileId = gdEntry.gdFileId
      }

      // Set corresponding firefox sync key
      if (!e.ffKey) {
        const ffEntry = ffEntries.find(ffe => ffe.id === e.id)
        if (ffEntry?.ffKey) e.ffKey = ffEntry.ffKey
      }

      if (!entryIds.has(e.id)) {
        entryIds.add(e.id)
        return true
      }
    })
  } else {
    try {
      entries = (await IPC.bg('loadSync', forced)) ?? []
    } catch (err) {
      Logs.err('Cannot load sync', err)

      if (onLoadHandlers.length) {
        onLoadHandlers.forEach(h => h.err(err))
        onLoadHandlers = []
      }

      Notifications.notify({
        icon: '#icon_sync',
        lvl: 'err',
        title: translate('sync.err.load'),
        details: err?.toString(),
      })
    }
  }

  ready = true
  reactive.loading = false
  reactive.entries = entries

  if (onLoadHandlers.length) {
    onLoadHandlers.forEach(h => h.ok(entries))
    onLoadHandlers = []
  }

  Logs.info('Sync._load: Loaded entries count:', entries.length)

  if (!Info.isBg) {
    const syncPanel = Sidebar.panelsById.sync
    if (syncPanel) syncPanel.reactive.ready = syncPanel.ready = true
  } else {
    unloadAfter(AUTO_UNLOAD_TIMEOUT_BG)
  }

  return entries
}

export function unload() {
  Logs.info('Sync.unload()')

  Sync.Firefox.cachedValues.clear()
  Sync.Google.cachedTabFilesData.clear()

  reactive.entries = []
  reactive.syncing = false
  reactive.loading = false

  ready = false

  if (!Info.isBg) {
    const syncPanel = Sidebar.panelsById.sync
    if (syncPanel) syncPanel.reactive.ready = syncPanel.ready = false
  }
}

export async function reload() {
  Logs.info('sync.ts:reload()')
  if (reactive.loading || reactive.syncing) return
  unload()
  reactive.syncing = true
  try {
    await load(true)
  } catch (err) {
    Logs.err('Sync.reload', err)
  }
  reactive.syncing = false
}

let unloadAfterTimeout: number | undefined
export function unloadAfter(delay: number) {
  Logs.info('Sync.unloadAfter(): delay:', delay)
  clearTimeout(unloadAfterTimeout)
  unloadAfterTimeout = setTimeout(() => {
    if (!Info.isBg) {
      const syncPanel = Sidebar.panelsById.sync
      if (syncPanel && Sidebar.activePanelId === syncPanel.id) return
      if (syncPanel && !syncPanel.ready) return
      if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.Sync) return
    }

    unload()
  }, delay)
}

export function resetUnloadTimeout() {
  Logs.info('Sync.resetUnloadTimeout()')
  clearTimeout(unloadAfterTimeout)
}

export async function openSyncPopup() {
  Logs.info('Sync.openSyncPopup()')

  const width = 320
  const height = 640

  const parentWinId = Windows.id

  await browser.windows.create({
    allowScriptsToClose: true,
    focused: true,
    width,
    height,
    incognito: false,
    state: 'normal',
    type: 'popup',
    url: `/popup.sync/sync.html?w=${parentWinId}`,
    // For userChrome modificatoins with `#main-window[titlepreface='Sync‎']`
    titlePreface: 'Sync‎',
  })
}
