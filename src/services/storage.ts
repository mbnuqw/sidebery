import { StorageChanges, Stored, StoredSync, InstanceType, Entries } from 'src/types'
import { Info } from './info'
import { IPC } from './ipc'
import { Logs } from './logs'
import { Settings } from './settings'
import { Windows } from './windows'

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
  ipcKeyChanged,
  registerRemote,
  unregisterRemote,
  unregisterAllRemote,
}

function ipcKeyChanged<K extends StorageKey>(
  key: K,
  newValue: StorageValue<K>,
  oldValue: StorageValue<K>
): void {
  if (blockedKeys[key]) {
    unblockKey(key)
    return
  }
  const handler = changeHandlers[key]
  if (handler) {
    handler(newValue, oldValue)
  } else {
    Logs.warn(`Store: Received store key change event for ${key} without a handler`)
  }
}

function onStorageChange(changes: StorageChanges, type: browser.storage.AreaName): void {
  if (type !== 'local') return

  for (const [key, change] of Object.entries(changes) as Entries<StorageChanges>) {
    const remotes = remoteHandlers[key]
    if (remotes && change) {
      for (const remoteKey of remotes) {
        const { type, winId } = JSON.parse(remoteKey) as { type: InstanceType; winId: ID }
        if (type == InstanceType.sidebar) {
          IPC.sidebar(winId, 'storeKeyChanged', key, change.newValue, change.oldValue)
        }
      }
    }
    if (blockedKeys[key]) {
      unblockKey(key)
      continue
    }

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
    Logs.warn(`Store: Did not receive blocked change for ${key} before timing out`)
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
  if (changeHandlers[key]) throw Logs.err(`Storage: onKeyChange: "${key}" handler existed`)
  changeHandlers[key] = cb as ChangeHandler
  // FIXME: Should test !Info.isBg, but currently only sidebars are wired together for IPC to work
  if (Info.isSidebar) {
    IPC.bg('registerStoreKeyChange', key, Info.instanceType, Windows.id)
  }
}
function offKeyChange<K extends keyof Stored>(key: K, cb: ChangeHandlerG<K>): void {
  if (changeHandlers[key] === cb) delete changeHandlers[key]
  if (Info.isSidebar) {
    IPC.bg('unregisterStoreKeyChange', key, Info.instanceType, Windows.id)
  }
}

const remoteHandlers: { [key in keyof Stored]?: Set<string> } = {}
function registerRemote(key: StorageKey, type: InstanceType, winId: ID): void {
  const remoteKey = JSON.stringify({ type, winId })
  const handlers = remoteHandlers[key] ?? new Set()
  if (handlers.has(remoteKey))
    Logs.warn(`Storage: registerRemote: "${key}" handler already exists for ${remoteKey}`)
  handlers.add(remoteKey)
  remoteHandlers[key] = handlers
}
function unregisterRemote(key: StorageKey, type: InstanceType, winId: ID): void {
  const remoteKey = JSON.stringify({ type, winId })
  const handlers = remoteHandlers[key]
  if (!handlers) return
  handlers.delete(remoteKey)
  remoteHandlers[key] = handlers
}
function unregisterAllRemote(type: InstanceType, winId: ID): void {
  const remoteKey = JSON.stringify({ type, winId })
  for (const key of Object.keys(remoteHandlers)) {
    const handlers = remoteHandlers[key as keyof Stored]
    if (handlers) handlers.delete(remoteKey)
  }
}

export async function sync(name: string, value: Stored): Promise<void> {
  const keys = Object.keys(value)
  const profileId = await Info.getProfileId()
  const syncPropName = profileId + '::' + name

  if (keys.length) {
    const time = Date.now()
    const ver = Info.reactive.addonVer
    await browser.storage.sync.set<StoredSync>({
      [syncPropName]: { value, time, name: Settings.state.syncName, ver },
    })
  } else {
    await browser.storage.sync.remove(syncPropName)
  }
}
