import type { KeyType, Synced, SyncedValue } from 'src/services/sync.firefox'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'
import * as Info from 'src/services/info'
import * as IPC from 'src/services/ipc'

export * from 'src/services/sync.firefox'

export async function updateProfileInfo() {
  Logs.info('Sync.Firefox.updateProfileInfo()')

  const synced = await browser.storage.sync.get<Synced>().catch(() => undefined)
  const profileId = Info.getProfileId()

  if (!synced) return

  for (const syncedKey of Object.keys(synced)) {
    const syncedValue = synced[syncedKey] as SyncedValue
    const [syncedProfileId, syncedTypeStr] = syncedKey.split('::')

    // Check data integrity
    if (!syncedValue || !syncedProfileId || !syncedTypeStr) {
      continue
    }

    // Update profile name
    if (syncedProfileId === profileId) {
      const pre = 'Sync.Firefox.updateProfileInfo(): name:'
      Logs.info(pre, syncedValue.name, '>>', Settings.state.syncName, 'for', syncedTypeStr)
      syncedValue.name = Settings.state.syncName
    }
  }

  // Save updated data
  await browser.storage.sync.set<Synced>(synced)
}

export async function remove(keyType: KeyType) {
  return IPC.bg('removeFromFirefoxSync', keyType)
}
