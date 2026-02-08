import * as Utils from 'src/utils'
import * as IPC from 'src/services/ipc'
import * as Google from 'src/services/google'
import * as Logs from 'src/services/logs'
import * as Settings from 'src/services/settings'
import * as Info from 'src/services/info'
import { translate } from 'src/dict'

import * as Sync from 'src/services/sync'
import * as Self from 'src/services/sync.bg'

export * as Firefox from 'src/services/sync.bg.firefox'
export * as Google from 'src/services/sync.bg.google'
export * from 'src/services/sync'

export let ready = false
export let entries: Sync.SyncedEntry[] = []
let loading = false
let syncing = false

export async function save<T extends Self.SyncedEntryType>(type: T, data: Self.SyncedDataType<T>) {
  Logs.info('Sync.save()')
  return Self.QUEUE.add(_save, type, data)
}
async function _save<T extends Self.SyncedEntryType>(type: T, data: Self.SyncedDataType<T>) {
  Logs.info('Sync._save()')

  if (type === Self.SyncedEntryType.Tabs) {
    throw 'Use saveTabs()'
  }

  const entryId = Utils.uid()
  let ffKey, file, gdFileId

  resetUnloadTimeout()

  try {
    if (type === Self.SyncedEntryType.Settings) {
      if (Settings.state.syncUseFirefox) {
        ffKey = await Self.Firefox.save('settings', { settings: data }, entryId)
      }
      if (Settings.state.syncUseGoogleDrive) {
        file = await Self.Google.save(Self.Google.FileType.Settings, data, { entryId })
      }
    } else if (type === Self.SyncedEntryType.CtxMenu) {
      if (Settings.state.syncUseFirefox) {
        ffKey = await Self.Firefox.save('ctxMenu', { contextMenu: data }, entryId)
      }
      if (Settings.state.syncUseGoogleDrive) {
        file = await Self.Google.save(Self.Google.FileType.CtxMenu, data, { entryId })
      }
    } else if (type === Self.SyncedEntryType.Styles) {
      if (Settings.state.syncUseFirefox) {
        ffKey = await Self.Firefox.save('styles', data, entryId)
      }
      if (Settings.state.syncUseGoogleDrive) {
        file = await Self.Google.save(Self.Google.FileType.Styles, data, { entryId })
      }
    } else if (type === Self.SyncedEntryType.Keybindings) {
      if (Settings.state.syncUseFirefox) {
        ffKey = await Self.Firefox.save('kb', data, entryId)
      }
      if (Settings.state.syncUseGoogleDrive) {
        file = await Self.Google.save(Self.Google.FileType.Keybindings, data, { entryId })
      }
    }
    gdFileId = file?.id
  } catch (err) {
    unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)
    throw err
  }

  // Prepend new entry
  const profileId = Info.getProfileId()
  const entryTime = new Date()
  const dayStartTime = Utils.getDayStartMS()
  const entry: Self.SyncedEntry = {
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
  const index = entries.findIndex(e => e.type === type && e.sameProfile)
  if (index !== -1) entries.splice(index, 1, entry)
  else entries.splice(0, 0, entry)

  unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)
}

export async function saveTabs(
  tabsBatch: Self.Google.SyncedTabsBatch,
  favicons: Record<string, string>
): Promise<Self.SyncedEntry | undefined | void> {
  Logs.info('Sync.saveTabs()')

  if (!tabsBatch.tabs.length) return Logs.warn('Nothing to sync')

  // Load sync service
  if (!ready) {
    Logs.info('Sync.saveTabs(): sync is not ready: loading...')
    await load()
  } else resetUnloadTimeout()

  return Self.QUEUE.add(_saveTabs, tabsBatch, favicons)
}
async function _saveTabs(
  tabsBatch: Self.Google.SyncedTabsBatch,
  favicons: Record<string, string>
): Promise<Self.SyncedEntry | undefined | void> {
  Logs.info('Sync._saveTabs(): tabsBatch:', tabsBatch.id)

  let tabsEntry: Self.SyncedEntry | undefined | void

  try {
    if (Settings.state.syncUseGoogleDrive) {
      tabsEntry = await Self.Google.saveTabs(tabsBatch, favicons)
      Logs.info('Sync.saveTabs(): tabsEntry:', tabsEntry)
      entries.splice(0, 0, tabsEntry)
    }
  } catch (err) {
    Logs.err('Sync.saveTabs: Cannot save tabs', err)
  }

  unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)

  return tabsEntry
}

export async function remove(entry: Partial<Self.SyncedEntry>) {
  Logs.info('Sync.remove():', entry.id)

  return Self.QUEUE.add(_remove, entry)
}
async function _remove(entry: Partial<Self.SyncedEntry>) {
  Logs.info('Sync._remove():', entry.id)

  resetUnloadTimeout()

  let removingInFirefoxSync
  if (Settings.state.syncUseFirefox && entry.ffKey) {
    removingInFirefoxSync = browser.storage.sync.remove(entry.ffKey)
  }

  let removingInGoogleDrive
  if (Settings.state.syncUseGoogleDrive && entry.gdFileId) {
    if (entry.type === Self.SyncedEntryType.Tabs) {
      removingInGoogleDrive = Self.Google.removeTabsEntry(entry)
    } else {
      let fileType
      if (entry.type === Self.SyncedEntryType.Settings) fileType = Self.Google.FileType.Settings
      if (entry.type === Self.SyncedEntryType.CtxMenu) fileType = Self.Google.FileType.CtxMenu
      if (entry.type === Self.SyncedEntryType.Styles) fileType = Self.Google.FileType.Styles
      if (entry.type === Self.SyncedEntryType.Keybindings) {
        fileType = Self.Google.FileType.Keybindings
      }
      if (fileType) removingInGoogleDrive = Self.Google.remove(fileType)
    }
  }

  try {
    await Promise.allSettled([removingInFirefoxSync, removingInGoogleDrive])
  } catch (err) {
    Logs.err('Cannot remove entry', err)
    unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)
    throw err
  }

  unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)

  const rmIndex = entries.findIndex(e => e.id === entry.id)
  if (rmIndex !== -1) entries.splice(rmIndex, 1)
}

export async function removeByType(type: Self.SyncedEntryType) {
  Logs.info('Sync.removeByType()')
  return Self.QUEUE.add(async () => {
    if (Settings.state.syncUseFirefox) {
      let ffType: Self.Firefox.KeyType | undefined
      if (type === Self.SyncedEntryType.Settings) ffType = 'settings'
      if (type === Self.SyncedEntryType.CtxMenu) ffType = 'ctxMenu'
      if (type === Self.SyncedEntryType.Styles) ffType = 'styles'
      if (type === Self.SyncedEntryType.Keybindings) ffType = 'kb'
      if (ffType) await Self.Firefox.remove(ffType)
    }
    if (Settings.state.syncUseGoogleDrive) {
      let gdType: Self.Google.FileType | undefined
      if (type === Self.SyncedEntryType.Settings) gdType = Self.Google.FileType.Settings
      if (type === Self.SyncedEntryType.CtxMenu) gdType = Self.Google.FileType.CtxMenu
      if (type === Self.SyncedEntryType.Styles) gdType = Self.Google.FileType.Styles
      if (type === Self.SyncedEntryType.Keybindings) gdType = Self.Google.FileType.Keybindings
      if (gdType) await Self.Google.remove(gdType)
    }
  })
}

export async function getData<T>(entry: Self.SyncedEntry): Promise<T | null | void> {
  Logs.info('Sync.getData()')
  return Self.QUEUE.add(_getData<T>, entry)
}
async function _getData<T>(entry: Self.SyncedEntry): Promise<T | null | void> {
  Logs.info('Sync._getData: entry:', entry.id)

  if (!entry.id) {
    Logs.err('Sync._getData: No entry.id', entry)
    return
  }

  let data: T | undefined | null

  resetUnloadTimeout()

  // Check in cached value from Firefox Sync
  const cachedFFValue = Self.Firefox.cachedValues.get(entry.id)
  if (cachedFFValue?.value) {
    const val = cachedFFValue.value
    if (entry.type === Self.SyncedEntryType.Settings) data = val.settings as T
    if (entry.type === Self.SyncedEntryType.CtxMenu) data = val.contextMenu as T
    if (entry.type === Self.SyncedEntryType.Keybindings) data = val.keybindings as T
    if (entry.type === Self.SyncedEntryType.Styles) {
      data = { sidebarCSS: val.sidebarCSS, groupCSS: val.groupCSS } as T
    }
  }

  // Or try to download from Google Drive
  if (!data && entry.gdFileId) {
    try {
      data = await Google.Drive.getJsonFile(entry.gdFileId)
    } catch (err) {
      unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)
      throw err
    }
  }

  unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)

  return data
}

let onLoadHandlers: { ok: (v: Self.SyncedEntry[]) => void; err: (e: any) => void }[] = []

export async function load(forced?: boolean): Promise<Self.SyncedEntry[]> {
  Logs.info('Sync.load()')

  if (loading) {
    Logs.info('Sync.load: In loading state, waiting...')
    return new Promise((ok, err) => {
      onLoadHandlers.push({ ok, err })
    })
  }

  resetUnloadTimeout()

  loading = true

  return Self.QUEUE.add(_load, forced)
}
export async function _load(forced?: boolean): Promise<Self.SyncedEntry[]> {
  Logs.info('Sync._load()')

  if (ready && !forced && entries.length) {
    unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)
    loading = false
    return entries
  }

  loading = true

  let loadedEntries: Self.SyncedEntry[] = []

  // Get Firefox Sync data
  const [ffEntriesResult, gdEntriesResult] = await Promise.allSettled([
    Settings.state.syncUseFirefox ? Self.Firefox.loadSyncedEntries() : [],
    Settings.state.syncUseGoogleDrive ? Self.Google.loadSyncedEntries() : [],
  ])
  const ffEntries = Utils.settledOr(ffEntriesResult, [])
  let gdEntries = Utils.settledOr(gdEntriesResult, null)

  loadedEntries.push(...ffEntries)

  if (gdEntries) {
    loadedEntries.push(...gdEntries)
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
  loadedEntries.sort((a, b) => (b.time ?? 0) - (a.time ?? 0))

  // Merge same entries
  const entryIds: Set<string> = new Set()
  loadedEntries = loadedEntries.filter(e => {
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

  ready = true
  loading = false
  entries = loadedEntries

  if (onLoadHandlers.length) {
    onLoadHandlers.forEach(h => h.ok(loadedEntries))
    onLoadHandlers = []
  }

  Logs.info('Sync._load: Loaded entries count:', loadedEntries.length)

  unloadAfter(Self.AUTO_UNLOAD_TIMEOUT_BG)

  return loadedEntries
}

export function unload() {
  Logs.info('Sync.unload()')

  entries = []
  syncing = false
  loading = false
  ready = false

  Self.Firefox.cachedValues.clear()
  Self.Google.cachedTabFilesData.clear()
}

export async function reload() {
  if (loading || syncing) return

  unload()
  syncing = true
  await load(true).catch(err => Logs.err('Sync.reload', err))
  syncing = false
}

let unloadAfterTimeout: number | undefined
function unloadAfter(delay: number) {
  Logs.info('Sync.unloadAfter(): delay:', delay)
  clearTimeout(unloadAfterTimeout)
  unloadAfterTimeout = setTimeout(() => unload(), delay)
}

function resetUnloadTimeout() {
  Logs.info('Sync.resetUnloadTimeout()')
  clearTimeout(unloadAfterTimeout)
}
