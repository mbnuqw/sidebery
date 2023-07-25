import { InstanceType, SavedGroup, Stored, TabSessionData, UpgradeMsg } from 'src/types'
import { UpgradingState } from 'src/types'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import * as Favicons from 'src/services/favicons.bg'
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
import * as Utils from 'src/utils'
import { DEFAULT_SETTINGS, NOID } from 'src/defaults'
import { translate } from 'src/dict'
import { getSidebarConfigFromV4 } from 'src/services/sidebar-config'

void (async function main() {
  Info.setInstanceType(InstanceType.bg)
  IPC.setInstanceType(InstanceType.bg)
  Logs.setInstanceType(InstanceType.bg)

  // Register globaly available actions
  IPC.registerActions({
    cacheTabsData: Tabs.cacheTabsData,
    createSnapshot: Snapshots.createSnapshot,
    addSnapshot: Snapshots.addSnapshot,
    removeSnapshot: Snapshots.removeSnapshot,
    openSnapshotWindows: Snapshots.openWindows,
    checkIpInfo: WebReq.checkIpInfo,
    saveFavicon: Favicons.saveFavicon,
    createWindowWithTabs: Windows.createWithTabs,
    isWindowTabsLocked: Windows.isWindowTabsLocked,
    getGroupPageInitData: Tabs.getGroupPageInitData,
    tabsApiProxy: Tabs.tabsApiProxy,
    checkUpgrade: checkUpgrade,
    continueUpgrade: continueUpgrade,
    saveInLocalStorage: Store.setFromRemoteFg,
    getSidebarTabs: Tabs.getSidebarTabs,
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
    const tabs = Windows.byId[winId]?.tabs
    if (tabs) Tabs.initInternalPageScripts(tabs)

    if (Settings.state.markWindow && winId !== NOID) {
      browser.windows.update(winId, { titlePreface: Settings.state.markWindowPreface })
    }
  })
  IPC.onDisconnected(InstanceType.sidebar, winId => {
    if (Windows.byId[winId]) {
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
})()

function initToolbarButton(): void {
  Menu.createSettingsMenu()

  browser.browserAction.onClicked.addListener((_, info): void => {
    if (info && info.button === 1) browser.runtime.openOptionsPage()
    else browser.sidebarAction.toggle()
  })
}

let upgrading: UpgradingState | undefined
async function upgrade(): Promise<void> {
  const sNoteDone = translate('upgrade.status.done')
  const sNoteInProgress = translate('upgrade.status.in_progress')
  const sNoteNo = translate('upgrade.status.no')
  const sNoteErr = translate('upgrade.status.err')

  let msg: UpgradeMsg = {
    title: translate('upgrade.initializing'),
    note: sNoteInProgress,
    status: 'in-progress',
  }
  upgrading = { messages: [msg], status: 'loading' }

  await waitForUpgradeCheck()

  // Initializing
  // ---
  const newStorage: Stored = { ver: Info.reactive.addonVer }
  let stored: Stored | undefined
  try {
    stored = await browser.storage.local.get<Stored>()
  } catch (err) {
    Logs.err('Upgrading: Cannot get stored data', err)
    const errStr = err ? err.toString() : ''
    msg = upgradeMsg(translate('upgrade.err.get_stored'), errStr, 'err')
    upgrading.status = 'err'
  }

  if (stored) {
    // Moving data
    // ---
    if (stored.containers_v4) {
      newStorage.containers = Containers.upgradeV4Containers(stored.containers_v4)
    }
    upgradeTabsDataCache(stored, newStorage)
    msg.status = 'done'
    msg.note = sNoteDone

    // Upgrading settings
    // ---
    msg = upgradeMsg(translate('upgrade.settings'), sNoteInProgress, 'in-progress')
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
      if ((stored.settings.moveNewTabPin as string) === 'none') {
        newStorage.settings.moveNewTabPin = 'start'
      }
      msg.status = 'done'
      msg.note = sNoteDone
    } else {
      msg.status = 'no'
      msg.note = sNoteNo
    }

    // Upgrading sidebar config (panels and navigation)
    // ---
    msg = upgradeMsg(translate('upgrade.panels_nav'), sNoteInProgress, 'in-progress')
    await Utils.sleep(250)
    if (stored.expandedBookmarks) {
      newStorage.expandedBookmarkFolders = Bookmarks.convertOldTreeStruct(stored.expandedBookmarks)
    }
    if (stored.panels_v4?.length) {
      try {
        newStorage.sidebar = getSidebarConfigFromV4(stored.panels_v4)
        msg.status = 'done'
        msg.note = sNoteDone
      } catch (err) {
        Logs.err('Upgrading: Cannot upgrade panels', err)
        msg.status = 'err'
        msg.note = sNoteErr
      }
    } else {
      msg.status = 'no'
      msg.note = sNoteNo
    }

    // Upgrading snapshots
    // ---
    msg = upgradeMsg(translate('upgrade.snapshots'), sNoteInProgress, 'in-progress')
    await Utils.sleep(250)
    if (stored.snapshots_v4?.length) {
      try {
        newStorage.snapshots = Snapshots.convertFromV4(stored.snapshots_v4)
        msg.status = 'done'
        msg.note = sNoteDone
      } catch (err) {
        Logs.err('Upgrading: Cannot upgrade snapshots', err)
        msg.status = 'err'
        msg.note = sNoteErr
      }
    } else {
      msg.status = 'no'
      msg.note = sNoteNo
    }

    // Upgrading favicons
    // ---
    msg = upgradeMsg(translate('upgrade.fav_cache'), sNoteInProgress, 'in-progress')
    await Utils.sleep(250)
    if (stored.favicons?.length && stored.favUrls) {
      try {
        await Favicons.upgradeFaviCache(stored, newStorage)
        msg.status = 'done'
        msg.note = sNoteDone
      } catch (err) {
        Logs.err('Upgrading: Cannot upgrade favicons', err)
        msg.status = 'err'
        msg.note = sNoteErr
      }
    } else {
      msg.status = 'no'
      msg.note = sNoteNo
    }

    // Upgrading styles
    // ---
    msg = upgradeMsg(translate('upgrade.styles'), sNoteInProgress, 'in-progress')
    await Utils.sleep(250)
    if (stored.cssVars || stored.sidebarCSS || stored.groupCSS) {
      try {
        Styles.upgradeCustomStyles(stored, newStorage)
        msg.status = 'done'
        msg.note = sNoteDone
      } catch (err) {
        Logs.err('Upgrading: Cannot upgrade styles', err)
        msg.status = 'err'
        msg.note = sNoteErr
      }
    } else {
      msg.status = 'no'
      msg.note = sNoteNo
    }

    msg = upgradeMsg(translate('upgrade.data_ready'), translate('upgrade.data_ready_note'), 'done')
    upgrading.status = 'done'
  }

  await waitForApprovingUpgrade()

  upgrading.status = 'loading'

  // Upgrading Sidebery pages
  // ---
  msg = upgradeMsg(translate('upgrade.links'), translate('upgrade.data_ready_note'), 'in-progress')
  await recreateGroupTabs()
  msg.status = 'done'
  msg.note = sNoteDone

  // Removing old data
  // ---
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
      const errStr = err ? err.toString() : ''
      Logs.err('Upgrade: Cannot clear storage', err)
      msg = upgradeMsg(translate('upgrade.err.clear_stored'), errStr, 'err')
      await Utils.sleep(250)
      msg = upgradeMsg(translate('upgrade.err.finish'), '', 'finish')
      upgrading.status = 'finish'
      return
    }
  }

  // Saving the new data
  // ---
  try {
    await browser.storage.local.set<Stored>(newStorage)
  } catch (err) {
    const errStr = err ? err.toString() : ''
    Logs.err('Upgrade: Cannot set new values', err)
    msg = upgradeMsg(translate('upgrade.err.set_stored'), errStr, 'err')
    await Utils.sleep(250)
    msg = upgradeMsg(translate('upgrade.err.finish'), '', 'finish')
    upgrading.status = 'finish'
    return
  }

  msg = upgradeMsg(translate('upgrade.done'), translate('upgrade.done_note'), 'done')

  await Utils.sleep(1000)

  browser.runtime.reload()
}

function upgradeMsg(title: string, note: string, status: UpgradeMsg['status']): UpgradeMsg {
  const msg: UpgradeMsg = { title, note, status }
  if (upgrading) upgrading.messages.push(msg)
  return msg
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
  const groupUrlBase = browser.runtime.getURL('sidebery/group.html')
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
          tab.url = tab.url.replace('/group/group.html', '/sidebery/group.html')
          browser.tabs.update(tab.id, { url: tab.url })
        }
        if (tab.url.includes('/url/url.html', 52)) {
          tab.url = tab.url.replace('/url/url.html', '/sidebery/url.html')
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

  const sideberyUrlBase = browser.runtime.getURL('')

  // Update internal urls
  if (newStorage.tabsDataCache) {
    for (const winTabs of newStorage.tabsDataCache) {
      for (const tab of winTabs) {
        if (tab.url.startsWith(sideberyUrlBase)) {
          tab.url = tab.url.replace('/group/group.html', '/sidebery/group.html')
          tab.url = tab.url.replace('/url/url.html', '/sidebery/url.html')
        }
      }
    }
  }
}
