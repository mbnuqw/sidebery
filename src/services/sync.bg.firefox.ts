import type { SyncedEntry } from 'src/services/sync'
import type { KeyType, SyncableData, Synced, SyncedValue } from 'src/services/sync.firefox'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Sync from 'src/services/sync'
import * as Info from 'src/services/info'
import * as Settings from 'src/services/settings'

export * from 'src/services/sync.firefox'

export const cachedValues: Map<string, SyncedValue> = new Map()

export async function save(key: KeyType, value: SyncableData, entryId?: string) {
  const keys = Object.keys(value)

  if (keys.length) {
    const profileId = Info.getProfileId()
    const profileName = Settings.state.syncName.trim()
    const syncPropName = profileId + '::' + key
    const time = Date.now()
    const ver = Info.reactive.addonVer

    // Find data with the same profile name and delete it
    const syncData = await browser.storage.sync.get<Synced | undefined>()
    if (syncData) {
      const toRemove: string[] = []
      for (const propName of Object.keys(syncData)) {
        const [pId, k] = propName.split('::')
        const data = syncData[propName]
        if (!data || !k) continue
        if (k === key && data.name === profileName && profileId !== pId) {
          toRemove.push(propName)
        }
      }
      if (toRemove.length) {
        await browser.storage.sync.remove(toRemove)
      }
    }

    // Set/Update data
    await browser.storage.sync.set<Synced>({
      [syncPropName]: { value, time, name: profileName, ver, entryId },
    })

    return syncPropName
  }
}

export async function loadSyncedEntries(): Promise<SyncedEntry[]> {
  Logs.info('Sync.Firefox.loadSyncedEntries()')

  const entries: SyncedEntry[] = []
  const synced = await browser.storage.sync.get<Synced>().catch(() => undefined)
  const profileId = Info.getProfileId()

  if (!synced) return entries

  const toRemove = []
  const dayStartTime = Utils.getDayStartMS()

  for (const syncedKey of Object.keys(synced)) {
    const syncedValue = synced[syncedKey] as SyncedValue
    const [syncedProfileId, syncedTypeStr] = syncedKey.split('::')

    // Check data integrity
    if (!syncedValue || !syncedProfileId || !syncedTypeStr) {
      toRemove.push(syncedKey)
      continue
    }

    const syncType = Sync.getSyncedType(syncedTypeStr)
    // Skip non-sync file types
    if (!syncType) {
      continue
    }

    let dateYYYYMMDD = '???'
    let timeHHMM = '???'
    if (syncedValue.time) {
      const td = new Date(syncedValue.time)
      dateYYYYMMDD = Utils.dDate(td, '.', dayStartTime)
      timeHHMM = Utils.dTime(td, ':', false)
    }

    const syncedEntry: Sync.SyncedEntry = {
      id: syncedValue.entryId || syncedKey,
      type: syncType,
      profileId: syncedProfileId,
      profileName: syncedValue.name || syncedProfileId,
      time: syncedValue.time,
      dateYYYYMMDD,
      timeHHMM,
      size: Utils.strSize(JSON.stringify(syncedValue)),
      sameProfile: syncedProfileId === profileId,

      ffKey: syncedKey,
    }
    cachedValues.set(syncedValue.entryId || syncedKey, syncedValue)

    entries.push(syncedEntry)
  }

  // Remove incorrect data
  if (toRemove.length) {
    browser.storage.sync.remove(toRemove)
  }

  // Sort
  entries.sort((a, b) => (b.time ?? 0) - (a.time ?? 0))

  return entries
}

export async function remove(keyType: KeyType) {
  Logs.info('Sync.Firefox.remove():', keyType)

  const profileId = Info.getProfileId()
  const key = profileId + '::' + keyType

  await browser.storage.sync.remove(key)
}
