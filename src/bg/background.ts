import { InstanceType } from 'src/types'
import { NOID } from 'src/defaults'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import * as Favicons from 'src/services/favicons.bg'
import { Containers } from 'src/services/containers'
import { Tabs } from 'src/services/tabs.bg'
import { Store } from 'src/services/storage'
import { Permissions } from 'src/services/permissions'
import { Snapshots } from 'src/services/snapshots'
import { Sidebar } from 'src/services/sidebar'
import { Info } from 'src/services/info'
import { versionToInt } from 'src/services/info.actions'
import { Menu } from 'src/services/menu'
import { WebReq } from 'src/services/web-req'
import { Sync } from 'src/services/_services'
import { Styles } from 'src/services/styles'

void (async function main() {
  Info.setInstanceType(InstanceType.bg)
  IPC.setInstanceType(InstanceType.bg)
  Logs.setInstanceType(InstanceType.bg)

  const ts = performance.now()
  Logs.info('Init start')

  // Register globaly available actions
  IPC.registerActions({
    cacheTabsData: Tabs.cacheTabsData,
    getGroupPageInitData: Tabs.getGroupPageInitData,
    tabsApiProxy: Tabs.tabsApiProxy,
    getSidebarTabs: Tabs.getSidebarTabs,
    detachSidebarTabs: Tabs.detachSidebarTabs,
    openTabs: Tabs.openTabs,
    createSnapshot: Snapshots.createSnapshot,
    addSnapshot: Snapshots.addSnapshot,
    removeSnapshot: Snapshots.removeSnapshot,
    openSnapshotWindows: Snapshots.openWindows,
    createWindowWithTabs: Windows.createWithTabs,
    isWindowTabsLocked: Windows.isWindowTabsLocked,
    saveFavicon: Favicons.saveFavicon,
    reloadFavicons: Favicons.loadFavicons,
    saveInLocalStorage: Store.setFromRemoteFg,
    checkIpInfo: WebReq.checkIpInfo,
    disableAutoReopening: WebReq.disableAutoReopening,
    enableAutoReopening: WebReq.enableAutoReopening,

    saveToSync: Sync.save,
    saveTabsToSync: Sync.saveTabs,
    removeFromSync: Sync.remove,
    getDataFromSync: Sync.getData,
    loadSync: Sync.load,
  })

  // Init first-need stuff
  IPC.setupGlobalMessageListener()
  IPC.setupConnectionListener()
  await Promise.all([
    Windows.loadWindows(),
    Containers.load(),
    Settings.loadSettings(),
    Info.loadVersionInfo(),
  ])

  Info.saveVersion()
  Windows.setupWindowsListeners()
  Containers.setupContainersListeners()
  Settings.setupSettingsChangeListener()

  await Sidebar.loadNav()
  Sidebar.setupListeners()

  WebReq.updateReqHandlers()

  Tabs.setupTabsListeners()
  await Tabs.loadTabs()

  Permissions.loadPermissions()
  Permissions.setupListeners()
  Favicons.loadFavicons()
  Menu.setupListeners()
  Snapshots.scheduleSnapshots()

  // Update title preface on sidebar connection/disconnection
  IPC.onConnected(InstanceType.sidebar, winId => {
    Logs.info('IPC.onConnected sidebar', winId)

    const tabs = Windows.byId[winId]?.tabs
    if (tabs) Tabs.initInternalPageScripts(tabs)

    if (Settings.state.markWindow && winId !== NOID) {
      IPC.sendToSidebar(winId, 'updWindowPreface')
    }
  })
  IPC.onDisconnected(InstanceType.sidebar, winId => {
    Logs.info('IPC.onDisconnected sidebar', winId)

    if (Settings.state.markWindow && Windows.byId[winId]) {
      browser.windows.update(winId, { titlePreface: '' })
    }
  })

  window.getSideberyState = () => {
    // prettier-ignore
    return {
      IPC, Info, Settings, Windows, Tabs, Containers,
      Sidebar, Favicons, Snapshots, Menu, Permissions,
    }
  }

  initToolbarButton()
  Styles.initColorScheme()

  browser.runtime.onUpdateAvailable.addListener(details => {
    const currentVersion = versionToInt(browser.runtime.getManifest().version)
    const newVersion = versionToInt(details.version)
    if (newVersion <= currentVersion) browser.runtime.reload()
  })

  Logs.info(`Init end: ${performance.now() - ts}ms`)
})()

function initToolbarButton(): void {
  Menu.createBrowserActionMenu()

  browser.browserAction.onClicked.addListener((_, info): void => {
    if (info && info.button === 1) browser.runtime.openOptionsPage()
    else browser.sidebarAction.toggle()
  })
}
