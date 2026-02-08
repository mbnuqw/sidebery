import { translate } from 'src/dict'
import * as SnapshotsBg from 'src/services/snapshots.bg'
import * as TabsBg from 'src/services/tabs.bg'

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
    onclick: () => SnapshotsBg.createSnapshot(),
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
