import { translate } from 'src/dict'
import { Err } from 'src/enums'
import * as SnapshotsBg from 'src/services/snapshots.bg'
import * as TabsBg from 'src/services/tabs.bg'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'

export function createBrowserActionMenu() {
  createSettingsMenu()
  TabsBg.createOpenFromCacheMenu()
}

export function createSettingsMenu(): void {
  browser.menus.create({
    id: 'open_settings',
    title: translate('menu.browserAction.open_settings'),
    icons: { '16': 'assets/logo-native.svg' },
    onclick: () => browser.runtime.openOptionsPage(),
    contexts: ['browser_action'],
  })
  browser.menus.create({
    id: 'create_snapshot',
    title: translate('menu.browserAction.create_snapshot'),
    icons: { '16': 'assets/snapshot-native.svg' },
    onclick: async () => {
      try {
        await SnapshotsBg.createSnapshot()
      } catch (err: any) {
        const title = 'Cannot create snapshot'
        let details
        if (err === Err.NoWritableStream) details = 'Unable to get writable stream'
        else if (err?.name && err?.message) details = `${err.name}: ${err.message}`
        else details = String(err)
        IPC.broadcast({ action: 'notify', arg: { lvl: 'err', title, details } })
        Logs.err(`${title}: ${details}`, err)
      }
    },
    contexts: ['browser_action'],
  })
}

function onMenuHiddenBg(): void {
  browser.menus.removeAll()
  createBrowserActionMenu()
}

export function setupListeners(): void {
  browser.menus.onHidden.addListener(onMenuHiddenBg)
}

export function resetListeners(): void {
  browser.menus.onHidden.removeListener(onMenuHiddenBg)
}
