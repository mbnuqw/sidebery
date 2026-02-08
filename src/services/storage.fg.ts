import { Stored } from 'src/types'
import * as Info from 'src/services/info'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import * as Windows from 'src/services/windows.fg'

export * from 'src/services/storage'

let storageBuf: Stored = {}
let storageBufTimeout: number | undefined
async function _set(newValues: Stored): Promise<void> {
  // Logs.info('Storage.fg._set:', Object.keys(newValues))
  const srcInfo = { type: Info.instanceType, winId: Windows.id, tabId: Info.currentTabId }
  return IPC.bg('saveInLocalStorage', newValues, srcInfo)
}
export async function set(newValues: Stored, delay?: number): Promise<void> {
  // Logs.info('Storage.fg.set:', Object.keys(newValues))
  if (!delay) return _set(newValues)

  storageBuf = { ...storageBuf, ...newValues }

  clearTimeout(storageBufTimeout)
  storageBufTimeout = setTimeout(() => {
    _set(storageBuf)
    storageBuf = {}
  }, delay)
}
