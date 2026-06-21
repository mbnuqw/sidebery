import * as Utils from 'src/utils'
import { DEFAULT_SETTINGS } from 'src/defaults'
import { SettingsState } from 'src/types'
import { InstanceType } from 'src/enums'
import * as Sync from 'src/services/sync.bg'
import * as Store from 'src/services/storage.bg'
import * as Windows from 'src/services/windows.bg'
import * as Omnibox from 'src/services/omnibox.bg'
import * as Styles from 'src/services/styles.bg'
import * as SnapshotsBg from 'src/services/snapshots.bg'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'

import * as Settings from 'src/services/settings'
export * from 'src/services/settings'

export async function load() {
  await Settings.load()
  if (Settings.initSaveNeeded) saveSettings()
}

export async function saveSettings(): Promise<void> {
  Logs.info('Settings.saveSettings')

  const clone = Utils.cloneObject(Settings.state)
  const settings = Utils.recreateNormalizedObject(clone, DEFAULT_SETTINGS)
  await Store.set({ settings })

  if (settings.syncSaveSettings) {
    Sync.save(Sync.SyncedEntryType.Settings, settings)
  }
}

let saveSettingsTimeout: number | undefined
export function saveDebounced(delay = 500): void {
  clearTimeout(saveSettingsTimeout)
  saveSettingsTimeout = setTimeout(() => {
    saveSettings()
  }, delay)
}

export function setupSettingsChangeListener(): void {
  Store.onKeyChange('settings', updateSettingsBg)
}

export async function importSettings(settings: SettingsState) {
  Logs.info('Settings.importSettings: settings:', settings)

  await Store.set({ settings: settings })

  updateSettingsBg(settings)
}

export function updateSettingsBg(settings?: SettingsState | null): void {
  if (!settings) return

  Logs.info('Settings.updateSettingsBg()')

  const prev = Settings.state
  const next = settings

  const markWindowChanged = prev.markWindow !== next.markWindow
  const markWindowPrefaceChanged = prev.markWindowPreface !== next.markWindowPreface
  const snapIntervalChanged = prev.snapInterval !== next.snapInterval
  const snapIntervalUnitChanged = prev.snapIntervalUnit !== next.snapIntervalUnit
  const colorSchemeChanged = prev.colorScheme !== next.colorScheme
  const omniReopenInCtr = prev.omniReopenInCtr !== next.omniReopenInCtr
  const omniReopenInCtrPrefix = prev.omniReopenInCtrPrefix !== next.omniReopenInCtrPrefix
  const omniSwitchToPanel = prev.omniSwitchToPanel !== next.omniSwitchToPanel
  const omniSwitchToPanelPrefix = prev.omniSwitchToPanelPrefix !== next.omniSwitchToPanelPrefix
  const omniMoveToPanel = prev.omniMoveToPanel !== next.omniMoveToPanel
  const omniMoveToPanelPrefix = prev.omniMoveToPanelPrefix !== next.omniMoveToPanelPrefix
  const omniMoveToGroup = prev.omniMoveToGroup !== next.omniMoveToGroup
  const omniMoveToGroupPrefix = prev.omniMoveToGroupPrefix !== next.omniMoveToGroupPrefix

  Utils.updateObject(Settings.state, settings, Settings.state)

  if (markWindowChanged) {
    for (const [id, win] of Windows.byId) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (!next.markWindow) {
        browser.windows.update(win.id, { titlePreface: '' })
      } else if (IPC.isConnected(InstanceType.sidebar, win.id)) {
        IPC.sendToSidebar(win.id, 'updWindowPreface', next.markWindowPreface)
      }
    }
  } else if (markWindowPrefaceChanged) {
    for (const [id, win] of Windows.byId) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (Settings.state.markWindow && IPC.isConnected(InstanceType.sidebar, win.id)) {
        IPC.sendToSidebar(win.id, 'updWindowPreface', Settings.state.markWindowPreface)
      }
    }
  }

  if (snapIntervalChanged || snapIntervalUnitChanged) SnapshotsBg.scheduleSnapshots()

  if (colorSchemeChanged) Styles.load()

  if (
    omniReopenInCtr ||
    omniReopenInCtrPrefix ||
    omniSwitchToPanel ||
    omniSwitchToPanelPrefix ||
    omniMoveToPanel ||
    omniMoveToPanelPrefix ||
    omniMoveToGroup ||
    omniMoveToGroupPrefix
  ) {
    Omnibox.updateCommandsDebounced(500)
  }

  Settings.updPrecalcSettings()
}

export function resetSettings(): void {
  Utils.updateObject(Settings.state, DEFAULT_SETTINGS, DEFAULT_SETTINGS)
  Settings.updPrecalcSettings()
}
