import * as IPC from 'src/services/ipc'

export * from 'src/services/sync.google'

export async function saveProfileInfo() {
  return IPC.bg('saveProfileInfoToGoogleSync')
}

export async function removeCachedId(id: string) {
  return IPC.bg('removeCachedIdFromGoogleSync', id)
}
