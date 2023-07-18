import { Stored, StoredSync, Entries, IPCNodeInfo } from 'src/types'
import { Info } from './info'
import * as IPC from './ipc'
import * as Logs from './logs'
import { Settings } from './settings'
import { Windows } from './windows'

type ChangeHandler = <K extends keyof Stored>(newVal: Stored[K]) => void
type ChangeHandlerG<K extends StorageKey> = (newVal: StorageValue<K>) => void
type StorageKey = keyof Stored
type StorageValue<K extends keyof Stored> = Stored[K]
type StorageEntries = (Iterator<Stored> &
  { [key in StorageKey]: [StorageKey, StorageValue<key>] }[StorageKey])[]

export const Store = {
  set,
  setFromRemoteFg,
  sync,
  storageChangeListener,
  onKeyChange,
}

const SIDEBAR_LISTENED_KEYS = ['settings', 'sidebarCSS', 'sidebar', 'contextMenu', 'containers']
const SETUP_LISTENED_KEYS = [
  'settings',
  'sidebarCSS',
  'groupCSS',
  'sidebar',
  'contextMenu',
  'containers',
  'snapshots',
  'keybindings',
]

function storageChangeListener(newValues: Stored): void {
  for (const [key, newValue] of Object.entries(newValues) as Entries<Stored>) {
    const handler = changeHandlers[key]
    if (handler) handler(newValue)
  }
}

let storageBuf: Stored = {}
let storageBufTimeout: number | undefined
async function _set(newValues: Stored, srcInfo?: IPCNodeInfo): Promise<void> {
  if (Info.isBg) {
    let changesForSidebar: Record<string, any> | undefined
    let changesForSetup: Record<string, any> | undefined

    for (const [key, newValue] of Object.entries(newValues) as StorageEntries) {
      if (SIDEBAR_LISTENED_KEYS.includes(key)) {
        if (!changesForSidebar) changesForSidebar = { [key]: newValue }
        else changesForSidebar[key] = newValue
      }

      if (SETUP_LISTENED_KEYS.includes(key)) {
        if (!changesForSetup) changesForSetup = { [key]: newValue }
        else changesForSetup[key] = newValue
      }

      // Call local handler
      const handler = changeHandlers[key]
      if (handler && newValue) handler(newValue)
    }

    // Send changes to all connected sidebars
    if (changesForSidebar) {
      for (const [id, con] of IPC.state.sidebarConnections) {
        if (srcInfo && srcInfo.type === con.type && srcInfo.winId === con.id) continue
        IPC.sidebar(con.id, 'storageChanged', changesForSidebar)
      }
    }

    // Send changes to all connected setup pages
    if (changesForSetup) {
      for (const [id, con] of IPC.state.setupPageConnections) {
        if (srcInfo && srcInfo.type === con.type && srcInfo.tabId === con.id) continue
        IPC.setupPage(con.id, 'storageChanged', changesForSetup)
      }
    }

    // Set new values
    return browser.storage.local.set<Stored>(newValues)
  }

  // Or send them to background
  else {
    const srcInfo = { type: Info.instanceType, winId: Windows.id, tabId: Info.currentTabId }
    return IPC.bg('saveInLocalStorage', newValues, srcInfo)
  }
}
async function set(newValues: Stored, delay?: number): Promise<void> {
  if (!delay) return _set(newValues)

  storageBuf = { ...storageBuf, ...newValues }

  clearTimeout(storageBufTimeout)
  storageBufTimeout = setTimeout(() => {
    _set(storageBuf)
    storageBuf = {}
  }, delay)
}
function setFromRemoteFg(newValues: Stored, srcInfo: IPCNodeInfo): void {
  _set(newValues, srcInfo)
}

const changeHandlers: { [key in keyof Stored]?: ChangeHandler } = {}
function onKeyChange<K extends keyof Stored, H extends ChangeHandlerG<K>>(key: K, cb: H): void {
  if (changeHandlers[key]) throw Logs.err(`Storage: onKeyChange: "${key}" handler already exists`)
  changeHandlers[key] = cb as ChangeHandler
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
