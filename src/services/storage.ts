import { StorageChanges, Stored, StoredSync } from 'src/types'
import { Info } from './info'
import { Logs } from './logs'
import { Settings } from './settings'

type ChangeHandler = <K extends keyof Stored>(newVal: Stored[K], oldVal: Stored[K]) => void
type ChangeHandlerG<K extends StorageKey> = (
  newVal: StorageValue<K>,
  oldVal: StorageValue<K>
) => void
type StorageKey = keyof Stored
type StorageValue<K extends keyof Stored> = Stored[K]

export const Store = {
  setupStorageListeners,
  resetStorageListeners,
  set,
  sync,
  onKeyChange,
  offKeyChange,
}

function onStorageChange(changes: StorageChanges, type: browser.storage.AreaName): void {
  if (type !== 'local') return

  for (const key of Object.keys(changes) as [keyof Stored]) {
    if (blockedKeys[key]) {
      unblockKey(key)
      continue
    }

    const change = changes[key]
    const handler = changeHandlers[key]
    if (handler && change) handler(change.newValue, change.oldValue)
  }
}

function setupStorageListeners(): void {
  browser.storage.onChanged.addListener(onStorageChange)
}

function resetStorageListeners(): void {
  browser.storage.onChanged.removeListener(onStorageChange)
}

const blockedKeys: { [key in keyof Stored]?: number } = {}
function blockChangeHandling(key: keyof Stored): void {
  if (blockedKeys[key]) clearTimeout(blockedKeys[key])
  blockedKeys[key] = setTimeout(() => {
    blockedKeys[key] = undefined
  }, 1200)
}
function unblockKey(key: keyof Stored): void {
  clearTimeout(blockedKeys[key])
  blockedKeys[key] = undefined
}

let writingTimeout: number | undefined
let storageBuf: Stored = {}
async function _set(newValues: Stored): Promise<void> {
  for (const key of Object.keys(newValues) as [keyof Stored]) {
    Logs.info(`Store: storing: ${key}`)
    blockChangeHandling(key)
  }
  return browser.storage.local.set<Stored>(newValues)
}
async function set(newValues: Stored, delay?: number): Promise<void> {
  if (!delay) return _set(newValues)
  storageBuf = { ...storageBuf, ...newValues }

  clearTimeout(writingTimeout)
  writingTimeout = setTimeout(() => {
    _set(storageBuf)
    storageBuf = {}
  }, delay)
}

const changeHandlers: { [key in keyof Stored]?: ChangeHandler } = {}
function onKeyChange<K extends keyof Stored, H extends ChangeHandlerG<K>>(key: K, cb: H): void {
  if (changeHandlers[key]) throw Logs.err(`Storeage: onKeyChange: "${key}" handler existed`)
  changeHandlers[key] = cb as ChangeHandler
}
function offKeyChange<K extends keyof Stored>(key: K, cb: ChangeHandlerG<K>): void {
  if (changeHandlers[key] === cb) delete changeHandlers[key]
}

export async function sync(name: string, value: Stored): Promise<void> {
  Logs.info('Store: Sync:', name, value)
  const keys = Object.keys(value)
  const profileId = await Info.getProfileId()
  const syncPropName = profileId + '::' + name

  if (keys.length) {
    const time = Date.now()
    const ver = Info.reactive.addonVer
    await browser.storage.sync.set<StoredSync>({
      [syncPropName]: { value, time, name: Settings.reactive.syncName, ver },
    })
  } else {
    await browser.storage.sync.remove(syncPropName)
  }
}
