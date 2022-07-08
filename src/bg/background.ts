import { InstanceType, SavedGroup, Stored, TabSessionData, UpgradingState } from 'src/types'
import { IPC } from 'src/services/ipc'
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
  IPC.registerActions({
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
  IPC.setupGlobalMessageListener()
  IPC.setupConnectionListener()
  await Promise.all([
    Windows.loadWindows(),
    Containers.load(),
    Settings.loadSettings(),
    Info.loadVersionInfo(),
  ])

  if (Info.isMajorUpgrade()) {
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
})()

function initToolbarButton(): void {
  Menu.createSettingsMenu()

  browser.browserAction.onClicked.addListener((_, info): void => {
    if (info && info.button === 1) browser.runtime.openOptionsPage()
    else browser.sidebarAction.open()
  })
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
  upgradeTabsDataCache(stored, newStorage)
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
    if (stored.settings.hScrollThroughPanels === true) {
      newStorage.settings.hScrollAction = 'switch_panels'
    } else if (stored.settings.hScrollThroughPanels === false) {
      newStorage.settings.hScrollAction = 'none'
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

  await recreateGroupTabs()

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

  try {
    await browser.storage.local.remove<Stored>(toRemove)
  } catch (err) {
    Logs.err('Upgrade: Cannot remove old storage values', err)
    try {
      await browser.storage.local.clear()
    } catch (err) {
      Logs.err('Upgrade: Cannot clear storage', err)
    }
  }

  try {
    await browser.storage.local.set<Stored>(newStorage)
  } catch (err) {
    Logs.err('Upgrade: Cannot set new values', err)
  }

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

async function recreateGroupTabs(): Promise<void> {
  const windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: true })
  const sideberyUrlBase = browser.runtime.getURL('')
  const groupUrlBase = browser.runtime.getURL('page.group/group.html')
  const tabsCreating: Promise<browser.tabs.Tab>[] = []

  for (const win of windows) {
    if (win.id === undefined) continue
    if (!win.tabs) continue

    const querying = win.tabs.map(t => browser.sessions.getTabValue<TabSessionData>(t.id, 'data'))
    const tabsData = (await Promise.all(querying)) ?? []
    const groupsData = await browser.sessions.getWindowValue<Record<ID, SavedGroup>>(
      win.id,
      'groups'
    )
    if (!groupsData) continue

    let indexOffset = 0
    const tabsMap: Record<ID, TabSessionData | SavedGroup> = {}

    for (let i = 0; i < win.tabs.length; i++) {
      const tab = win.tabs[i]
      const tabData = tabsData[i]
      if (!tab || !tabData) continue

      // Update legacy urls
      if (tab.url.startsWith(sideberyUrlBase)) {
        if (tab.url.includes('/group/group.html', 52)) {
          tab.url = tab.url.replace('/group/group.html', '/page.group/group.html')
          browser.tabs.update(tab.id, { url: tab.url })
        }
        if (tab.url.includes('/url/url.html', 52)) {
          tab.url = tab.url.replace('/url/url.html', '/page.url/url.html')
          browser.tabs.update(tab.id, { url: tab.url })
        }
      }

      tabsMap[tabData.id] = tabData

      // No parent tab
      if (tabData.parentId === undefined || tabData.parentId === -1) continue
      // Parent tab ok
      if (tabsMap[tabData.parentId]) continue
      // Missing group page
      if (groupsData[tabData.parentId] && !tabsMap[tabData.parentId]) {
        let groupTabData = groupsData[tabData.parentId]

        // Set target index at which group tab should be created
        const index = i + indexOffset
        tabsCreating.push(createUpgradedGroupTab(groupTabData, index, groupUrlBase, win.id))
        indexOffset++

        tabsMap[groupTabData.id] = groupTabData

        // Check if the parent of new group page is existed
        let existedParentTab = tabsMap[groupTabData.parentId]
        groupTabData = groupsData[groupTabData.parentId]

        while (groupTabData) {
          if (!existedParentTab) {
            tabsCreating.push(createUpgradedGroupTab(groupTabData, index, groupUrlBase, win.id))
            indexOffset++

            tabsMap[groupTabData.id] = groupTabData
          }
          existedParentTab = tabsMap[groupTabData.parentId]
          groupTabData = groupsData[groupTabData.parentId]
        }
      }
    }
  }

  await Promise.all(tabsCreating)

  // Wait
  await Utils.sleep(1000)
}

async function createUpgradedGroupTab(
  groupTabData: SavedGroup,
  index: number,
  groupUrlBase: string,
  windowId: ID
): Promise<browser.tabs.Tab> {
  const tab = await browser.tabs.create({
    active: false,
    index,
    url: upgradeGroupPageUrl(groupUrlBase, groupTabData.url),
    cookieStoreId: groupTabData.ctx,
    windowId,
  })

  try {
    await browser.sessions.setTabValue(tab.id, 'data', {
      id: groupTabData.id,
      panelId: groupTabData.panelId,
      parentId: groupTabData.parentId,
      folded: groupTabData.folded,
    })
  } catch {
    // :(
    // anyway, we still have tabsDataCache...
  }

  return tab
}

function upgradeGroupPageUrl(groupUrlBase: string, oldUrl: string): string {
  const pageConfIndex = oldUrl.indexOf('group/group.html#')
  const pageConf = oldUrl.slice(pageConfIndex + 17)
  const groupUrl = groupUrlBase + '#' + pageConf
  return groupUrl
}

function upgradeTabsDataCache(oldStorage: Stored, newStorage: Stored): void {
  if (oldStorage.tabsData_v4) newStorage.tabsDataCache = oldStorage.tabsData_v4
  if (oldStorage.prevTabsData_v4) newStorage.prevTabsDataCache = oldStorage.prevTabsData_v4

  const sideberyUrlBase = browser.runtime.getURL('')

  // Update internal urls
  if (newStorage.tabsDataCache) {
    for (const winTabs of newStorage.tabsDataCache) {
      for (const tab of winTabs) {
        if (tab.url.startsWith(sideberyUrlBase)) {
          tab.url = tab.url.replace('/group/group.html', '/page.group/group.html')
          tab.url = tab.url.replace('/url/url.html', '/page.url/url.html')
        }
      }
    }
  }
  if (newStorage.prevTabsDataCache) {
    for (const winTabs of newStorage.prevTabsDataCache) {
      for (const tab of winTabs) {
        if (tab.url.startsWith(sideberyUrlBase)) {
          tab.url = tab.url.replace('/group/group.html', '/page.group/group.html')
          tab.url = tab.url.replace('/url/url.html', '/page.url/url.html')
        }
      }
    }
  }
}
