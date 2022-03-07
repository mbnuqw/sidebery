import { InstanceType, Stored, UpgradingState } from 'src/types'
import { Msg } from 'src/services/msg'
import { Logs } from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Favicons } from 'src/services/favicons'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Tabs } from 'src/services/tabs.bg'
import { Store } from 'src/services/storage'
import { Permissions } from 'src/services/permissions'
import { Snapshots } from 'src/services/snapshots'
import { Sidebar } from 'src/services/sidebar'
import { Info } from 'src/services/info'
import { Menu } from 'src/services/menu'
import { Styles } from 'src/services/styles'
import { WebReq } from 'src/services/web-req'
import Utils from 'src/utils'
import { DEFAULT_SETTINGS } from 'src/defaults'
import { translate } from 'src/dict'

void (async function main() {
  Info.setInstanceType(InstanceType.bg)
  Logs.info('Initialization start')

  // Register globaly available actions
  Msg.registerActions({
    cacheTabsData: Tabs.cacheTabsData,
    createSnapshot: Snapshots.createSnapshot,
    removeSnapshot: Snapshots.removeSnapshot,
    openSnapshotWindows: Snapshots.openWindows,
    checkIpInfo: WebReq.checkIpInfo,
    saveFavicon: Favicons.saveFavicon,
    createWindowWithTabs: Windows.createWithTabs,
    isWindowTabsLocked: Windows.isWindowTabsLocked,
    getUrlPageInitData: Tabs.getUrlPageInitData,
    getGroupPageInitData: Tabs.getGroupPageInitData,
    tabsApiProxy: Tabs.tabsApiProxy,
    checkUpgrade: checkUpgrade,
    continueUpgrade: continueUpgrade,
  })

  // Init first-need stuff
  initToolbarButton()
  Msg.setupListeners()
  Msg.setupConnections()
  await Promise.all([
    Windows.loadWindows(),
    Containers.load(),
    Settings.loadSettings(),
    Info.loadVersionInfo(),
  ])

  if (Info.isMajorUpgrade()) {
    Logs.info('Upgrade needed')
    await upgrade()
    return
  }

  Info.saveVersion()
  Windows.setupWindowsListeners()
  Containers.setupContainersListeners()
  Settings.setupSettingsChangeListener()

  await Sidebar.loadNav()
  Sidebar.setupListeners()
  Tabs.setupTabsListeners()
  await Tabs.loadTabs()
  await Tabs.backupTabsDataCache()

  Store.setupStorageListeners()

  Permissions.loadPermissions()
  Permissions.setupListeners()
  Favicons.loadFavicons()
  Menu.setupListeners()
  Snapshots.scheduleSnapshots()

  if (Sidebar.hasBookmarks) {
    Bookmarks.setupBookmarksListeners()
    Bookmarks.load()
  }
})()

function initToolbarButton(): void {
  Menu.createSettingsMenu()

  browser.browserAction.onClicked.addListener((_, info): void => {
    if (info && info.button === 1) browser.runtime.openOptionsPage()
    else browser.sidebarAction.open()
  })

  Logs.info('Toolbar button initialized')
}

let upgrading: UpgradingState | undefined
async function upgrade(): Promise<void> {
  upgrading = { active: true, init: 'in-progress' }

  await waitForUpgradeCheck()

  // Initializing
  const newStorage: Stored = { ver: Info.reactive.addonVer }
  let stored: Stored | undefined
  try {
    stored = await browser.storage.local.get<Stored>()
  } catch (err) {
    Logs.err('Upgrading: Cannot get stored data', err)
    upgrading.error = translate('upgrade.err.get_stored')
    return
  }

  // Moving data
  if (stored.containers_v4) newStorage.containers = stored.containers_v4
  if (stored.tabsData_v4) newStorage.tabsDataCache = stored.tabsData_v4
  if (stored.prevTabsData_v4) newStorage.prevTabsDataCache = stored.prevTabsData_v4
  upgrading.init = 'done'

  // Upgrading settings
  upgrading.settings = 'in-progress'
  await Utils.sleep(250)
  if (stored.settings) {
    newStorage.settings = Utils.recreateNormalizedObject(stored.settings, DEFAULT_SETTINGS)
    newStorage.settings.theme = 'proton'
    if (newStorage.settings.tabDoubleClick !== 'none') {
      newStorage.settings.tabsSecondClickActPrev = false
    }
    upgrading.settings = 'done'
  } else {
    upgrading.settings = 'no'
  }

  // Upgrading sidebar config (panels and navigation)
  upgrading.sidebar = 'in-progress'
  await Utils.sleep(250)
  if (stored.expandedBookmarks) {
    newStorage.expandedBookmarkFolders = Bookmarks.convertOldTreeStruct(stored.expandedBookmarks)
  }
  if (stored.panels_v4?.length) {
    try {
      newStorage.sidebar = Sidebar.convertOldPanelsConfigToNew(stored.panels_v4)
      upgrading.sidebar = 'done'
    } catch (err) {
      Logs.err('Upgrading: Cannot upgrade panels', err)
      upgrading.sidebar = 'err'
    }
  } else {
    upgrading.sidebar = 'no'
  }

  // Upgrading snapshots
  upgrading.snapshots = 'in-progress'
  await Utils.sleep(250)
  if (stored.snapshots_v4?.length) {
    try {
      newStorage.snapshots = Snapshots.convertFromV4(stored.snapshots_v4)
      upgrading.snapshots = 'done'
    } catch (err) {
      Logs.err('Upgrading: Cannot upgrade snapshots', err)
      upgrading.snapshots = 'err'
    }
  } else {
    upgrading.snapshots = 'no'
  }

  // Upgrading favicons
  upgrading.favicons = 'in-progress'
  await Utils.sleep(250)
  if (stored.favicons?.length && stored.favUrls) {
    try {
      await Favicons.upgradeFaviCache(stored, newStorage)
      upgrading.favicons = 'done'
    } catch (err) {
      Logs.err('Upgrading: Cannot upgrade favicons', err)
      upgrading.favicons = 'err'
    }
  } else {
    upgrading.favicons = 'no'
  }

  // Upgrading styles
  upgrading.styles = 'in-progress'
  await Utils.sleep(250)
  if (stored.cssVars || stored.sidebarCSS || stored.groupCSS) {
    try {
      Styles.upgradeCustomStyles(stored, newStorage)
      upgrading.styles = 'done'
    } catch (err) {
      Logs.err('Upgrading: Cannot upgrade styles', err)
      upgrading.styles = 'err'
    }
  } else {
    upgrading.styles = 'no'
  }

  upgrading.done = true

  await waitForApprovingUpgrade()

  const toRemove: (keyof Partial<Stored>)[] = [
    'favAutoCleanTime',
    'favUrls',
    'containers_v4',
    'tabsData_v4',
    'prevTabsData_v4',
    'panels_v4',
    'snapshots_v4',
    'tabsMenu',
    'bookmarksMenu',
    'tabsPanelMenu',
    'bookmarksPanelMenu',
    'cssVars',
    'expandedBookmarks',
  ]
  await browser.storage.local.remove<Stored>(toRemove)
  await browser.storage.local.set<Stored>(newStorage)
  browser.runtime.reload()
}

let _firstUpgradeCheck: (() => void) | undefined
async function waitForUpgradeCheck(): Promise<void> {
  return new Promise(res => {
    _firstUpgradeCheck = () => {
      res()
      _firstUpgradeCheck = undefined
    }
  })
}

function checkUpgrade(): UpgradingState | null {
  if (!upgrading) return null
  if (_firstUpgradeCheck) _firstUpgradeCheck()
  return upgrading
}

let _continueUpgrade: (() => void) | undefined
async function waitForApprovingUpgrade(): Promise<void> {
  return new Promise(res => {
    _continueUpgrade = res
  })
}

function continueUpgrade(): void {
  if (_continueUpgrade) _continueUpgrade()
}
