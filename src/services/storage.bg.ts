import { Stored, IPCNodeInfo } from 'src/types'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'

import { changeHandlers } from 'src/services/storage'
export * from 'src/services/storage'

type StorageKey = keyof Stored
type StorageValue<K extends keyof Stored> = Stored[K]
type StorageEntries = (Iterator<Stored> &
  { [key in StorageKey]: [StorageKey, StorageValue<key>] }[StorageKey])[]

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
const PANEL_CONFIG_LISTENED_KEYS = ['settings', 'sidebar', 'containers']

let storageBuf: Stored = {}
let storageBufTimeout: number | undefined
async function _set(newValues: Stored, srcInfo?: IPCNodeInfo): Promise<void> {
  let changesForSidebar: Record<string, any> | undefined
  let changesForSetup: Record<string, any> | undefined
  let changesForPanelConfig: Record<string, any> | undefined

  for (const [key, newValue] of Object.entries(newValues) as StorageEntries) {
    if (SIDEBAR_LISTENED_KEYS.includes(key)) {
      if (!changesForSidebar) changesForSidebar = { [key]: newValue }
      else changesForSidebar[key] = newValue
    }

    if (SETUP_LISTENED_KEYS.includes(key)) {
      if (!changesForSetup) changesForSetup = { [key]: newValue }
      else changesForSetup[key] = newValue
    }

    if (PANEL_CONFIG_LISTENED_KEYS.includes(key)) {
      if (!changesForPanelConfig) changesForPanelConfig = { [key]: newValue }
      else changesForPanelConfig[key] = newValue
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

  // Send changes to all connected panel config popups
  if (changesForPanelConfig) {
    for (const [id, con] of IPC.state.panelConfigConnections) {
      if (srcInfo && srcInfo.type === con.type && srcInfo.winId === con.id) continue
      IPC.panelConfigPopup(con.id, 'storageChanged', changesForPanelConfig)
    }
  }

  // Set new values
  return browser.storage.local.set<Stored>(newValues)
}
export async function set(newValues: Stored, delay?: number): Promise<void> {
  if (!delay) return _set(newValues)

  storageBuf = { ...storageBuf, ...newValues }

  clearTimeout(storageBufTimeout)
  storageBufTimeout = setTimeout(() => {
    _set(storageBuf)
    storageBuf = {}
  }, delay)
}
export function setFromRemoteFg(newValues: Stored, srcInfo: IPCNodeInfo): void {
  _set(newValues, srcInfo)
}
