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
    contexts: ['action'],
  })
  browser.menus.create({
    id: 'create_snapshot',
    title: translate('menu.browserAction.create_snapshot'),
    icons: { '16': 'assets/snapshot-native.svg' },
    contexts: ['action'],
  })
}

function onMenuClicked(info: browser.menus.OnClickData): void {
  if (info.menuItemId === 'open_settings') browser.runtime.openOptionsPage()
  else if (info.menuItemId === 'create_snapshot') SnapshotsBg.createSnapshot()
  else TabsBg.openCachedWindowFromMenu(info.menuItemId)
}

function onMenuHiddenBg(): void {
  browser.menus.removeAll()
  createBrowserActionMenu()
}

export function setupListeners(): void {
  browser.menus.onHidden.addListener(onMenuHiddenBg)
  browser.menus.onClicked.addListener(onMenuClicked)
}

export function resetListeners(): void {
  browser.menus.onHidden.removeListener(onMenuHiddenBg)
  browser.menus.onClicked.removeListener(onMenuClicked)
}
