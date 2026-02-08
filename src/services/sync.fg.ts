import { Reactivator } from 'src/types'
import { SubPanelType } from 'src/enums'
import * as Utils from 'src/utils'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import * as Windows from 'src/services/windows.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import { translate } from 'src/dict'
import * as Notifications from 'src/services/notifications.fg'

import * as Sync from 'src/services/sync'
import * as Self from 'src/services/sync.fg'

export * as Firefox from 'src/services/sync.fg.firefox'
export * as Google from 'src/services/sync.fg.google'
export * from 'src/services/sync'

export let ready = false
export let reactive: Sync.SyncReactiveState = {
  loading: false,
  syncing: false,
  entries: [],
}

export function reactivate(r: Reactivator<Sync.SyncReactiveState>) {
  reactive = r(reactive)
}

export async function save<T extends Self.SyncedEntryType>(type: T, data: Self.SyncedDataType<T>) {
  Logs.info('Sync.save()')

  reactive.syncing = true

  return Self.QUEUE.add(_save, type, data)
}
async function _save<T extends Self.SyncedEntryType>(type: T, data: Self.SyncedDataType<T>) {
  Logs.info('Sync._save()')

  if (type === Self.SyncedEntryType.Tabs) {
    reactive.syncing = false
    throw 'Use saveTabs()'
  }

  reactive.syncing = true

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

  reactive.syncing = false
}

export async function saveTabs(
  tabsBatch: Self.Google.SyncedTabsBatch,
  favicons: Record<string, string>
): Promise<Self.SyncedEntry | undefined | void> {
  Logs.info('Sync.saveTabs()')

  if (!tabsBatch.tabs.length) return Logs.warn('Nothing to sync')

  reactive.syncing = true
  Logs.info('Sync.saveTabs(): reactive.syncing = true')

  return Self.QUEUE.add(_saveTabs, tabsBatch, favicons)
}
export async function _saveTabs(
  tabsBatch: Self.Google.SyncedTabsBatch,
  favicons: Record<string, string>
): Promise<Self.SyncedEntry | undefined | void> {
  Logs.info('Sync._saveTabs(): tabsBatch:', tabsBatch.id)

  reactive.syncing = true
  Logs.info('Sync._saveTabs(): reactive.syncing = true')

  let tabsEntry: Self.SyncedEntry | undefined | void

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

  reactive.syncing = false
  Logs.info('Sync._saveTabs(): reactive.syncing = false')

  return tabsEntry
}

export async function remove(entry: Partial<Self.SyncedEntry>) {
  Logs.info('Sync.remove():', entry.id)

  reactive.syncing = true

  return Self.QUEUE.add(_remove, entry)
}
async function _remove(entry: Partial<Self.SyncedEntry>) {
  Logs.info('Sync._remove():', entry.id)

  reactive.syncing = true

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

  const rmIndex = reactive.entries.findIndex(e => e.id === entry.id)
  if (rmIndex !== -1) reactive.entries.splice(rmIndex, 1)

  reactive.syncing = false
}

export async function removeByType(type: Self.SyncedEntryType) {
  Logs.info('Sync.removeByType()')
  return IPC.bg('removeByTypeFromSync', type)
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

  return (await IPC.bg('getDataFromSync', Utils.clone(entry))) as T
}

let onLoadHandlers: { ok: (v: Self.SyncedEntry[]) => void; err: (e: any) => void }[] = []

export async function load(forced?: boolean): Promise<Self.SyncedEntry[]> {
  Logs.info('Sync.load()')

  if (reactive.loading) {
    Logs.info('Sync.load: In loading state, waiting...')
    return new Promise((ok, err) => {
      onLoadHandlers.push({ ok, err })
    })
  }

  resetUnloadTimeout()

  reactive.loading = true

  return Self.QUEUE.add(_load, forced)
}
export async function _load(forced?: boolean): Promise<Self.SyncedEntry[]> {
  Logs.info('Sync._load()')

  reactive.loading = true

  let entries: Self.SyncedEntry[] = []

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

  // state.ready = true
  ready = true
  reactive.loading = false
  reactive.entries = entries

  if (onLoadHandlers.length) {
    onLoadHandlers.forEach(h => h.ok(entries))
    onLoadHandlers = []
  }

  Logs.info('Sync._load: Loaded entries count:', entries.length)

  const syncPanel = Sidebar.panelsById.sync
  if (syncPanel) syncPanel.reactive.ready = syncPanel.ready = true

  return entries
}

export function unload() {
  Logs.info('Sync.fg.unload')

  reactive.entries = []
  reactive.syncing = false
  reactive.loading = false
  // state.ready = false
  ready = false

  const syncPanel = Sidebar.panelsById.sync
  if (syncPanel) syncPanel.reactive.ready = syncPanel.ready = false
}

export async function reload() {
  Logs.info('Sync.reload')
  if (reactive.loading || reactive.syncing) return

  unload()
  reactive.syncing = true
  await load(true).catch(err => Logs.err('Sync.reload', err))
  reactive.syncing = false
}

let unloadAfterTimeout: number | undefined
export function unloadAfter(delay: number) {
  Logs.info('Sync.unloadAfter(): delay:', delay)
  clearTimeout(unloadAfterTimeout)
  unloadAfterTimeout = setTimeout(() => {
    const syncPanel = Sidebar.panelsById.sync
    if (syncPanel && Sidebar.activePanelId === syncPanel.id) return
    if (syncPanel && !syncPanel.ready) return
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.Sync) return

    unload()
  }, delay)
}

function resetUnloadTimeout() {
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
