import * as Utils from 'src/utils'
import { Window, TabCache, Tab, Notification, TabSessionData } from 'src/types'
import { WindowChooseOption, WindowChoosingDetails, ItemInfo } from 'src/types'
import { NOID, MOVEID, DEFAULT_CONTAINER_ID, PRIVATE_CONTAINER_ID } from 'src/defaults'
import { Windows } from 'src/services/windows'
import * as Logs from 'src/services/logs'
import { Tabs } from 'src/services/tabs.bg'
import { Settings } from 'src/services/settings'
import * as IPC from './ipc'
import { Containers } from './containers'
import { Sidebar } from './sidebar'
import { Info } from './info'
import { translate } from 'src/dict'

export async function loadWindows(): Promise<void> {
  const windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: false })
  Windows.byId = {}
  for (const window of windows) {
    if (window.type !== 'normal' || window.id === undefined) continue
    Windows.byId[window.id] = window as Window
  }
}

export async function loadWindowInfo(): Promise<void> {
  const winData = await Promise.all([
    browser.windows.getCurrent({ populate: false }),
    browser.sessions.getWindowValue(browser.windows.WINDOW_ID_CURRENT, 'uniqWinId'),
  ])
  const currentWindow = winData[0]
  let uniqWinId = winData[1] as string | undefined

  // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1660564
  if (Info.isSidebar && currentWindow.type !== 'normal') {
    throw `This code should not be launched in a window with a type other than "normal".
See https://bugzilla.mozilla.org/show_bug.cgi?id=1660564`
  }

  // Generate unique window id
  if (!uniqWinId) {
    uniqWinId = Utils.uid()
    browser.sessions.setWindowValue(browser.windows.WINDOW_ID_CURRENT, 'uniqWinId', uniqWinId)
  }

  Windows.incognito = currentWindow.incognito
  Windows.id = currentWindow.id ?? NOID
  Windows.uniqWinId = uniqWinId
  Windows.focused = currentWindow.focused
  if (Windows.focused && currentWindow.id) Windows.lastFocusedId = currentWindow.id
  Windows.lastFocused = currentWindow.focused
  browser.windows.getAll().then(windows => {
    Windows.otherWindows = windows.filter(w => {
      return w.id !== Windows.id && w.type === 'normal'
    }) as Window[]
  })
}

export async function showWindowsPopup(config: WindowChoosingDetails = {}): Promise<ID> {
  Windows.reactive.choosingTitle = config.title ?? ''

  // Show empty popup with loading animation if windows are not ready
  setTimeout(() => {
    if (!Windows.reactive.choosing) Windows.reactive.choosing = []
  }, 120)

  let wins = (await browser.windows.getAll({
    windowTypes: ['normal'],
    populate: false,
  })) as Window[]
  if (config.otherWindows) wins = wins.filter(w => w.id !== Windows.id)
  else wins = (await browser.windows.getAll()) as Window[]
  if (config.filter) wins = wins.filter(config.filter)

  return new Promise(res => {
    const options = wins.map<Promise<WindowChooseOption>>(async w => {
      const [tab] = await browser.tabs.query({ active: true, windowId: w.id })
      let screen
      if (Settings.state.selWinScreenshots && browser.tabs.captureTab) {
        const imageConf: browser.ImageDetails = { format: 'jpeg', quality: 75, scale: 0.5 }
        if (tab) screen = await browser.tabs.captureTab(tab.id, imageConf)
      }
      return {
        id: w.id ?? NOID,
        title: w.title ?? tab?.title,
        screen,
        sel: false,
        choose: () => {
          closeWindowsPopup()
          res(w.id ?? NOID)
        },
      } as WindowChooseOption
    })

    Promise.all(options).then(wins => {
      Windows.reactive.choosing = wins
    })
  })
}

export function selectWindow(dir: number): void {
  if (!Windows.reactive.choosing) return
  let selIndex = Windows.reactive.choosing.findIndex(w => w.sel)

  if (selIndex !== -1) Windows.reactive.choosing[selIndex].sel = false

  selIndex += dir
  if (selIndex < 0 || selIndex >= Windows.reactive.choosing.length) {
    selIndex = dir > 0 ? 0 : Windows.reactive.choosing.length - 1
  }

  Windows.reactive.choosing[selIndex].sel = true
}

export function activateSelectedWindow(): void {
  if (!Windows.reactive.choosing) return
  const winInfo = Windows.reactive.choosing.find(w => w.sel)
  if (winInfo) winInfo.choose()
}

export function closeWindowsPopup(): void {
  Windows.reactive.choosing = null
  Windows.reactive.choosingTitle = ''
}

const lockedWindowsTabs: Record<ID, boolean | { move: boolean; cache: TabCache[] }> = {}
export function isWindowTabsLocked(id: ID): boolean | { move: boolean; cache: TabCache[] } {
  const locked = lockedWindowsTabs[id]
  Logs.info('Windows.isWindowTabsLocked', id, typeof locked, globalTabsLockCounter)
  if (locked && locked !== true) {
    delete lockedWindowsTabs[id]
  }
  return locked ?? globalTabsLockCounter > 0
}

let globalTabsLockCounter = 0

export async function createWithTabs(
  tabsInfo: ItemInfo[],
  conf?: browser.windows.CreateData
): Promise<boolean> {
  Logs.info('Windows.createWithTabs', tabsInfo.length)

  if (!Info.isBg) throw 'Windows.createWithTabs: Should be called in bg'

  globalTabsLockCounter++

  if (!conf) conf = {}

  const moveTabs = conf.tabId === MOVEID
  if (moveTabs) delete conf.tabId

  // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1882822
  if (conf.url === undefined && conf.tabId === undefined) conf.url = 'about:blank'

  // Normalize urls
  if (!moveTabs) {
    for (const info of tabsInfo) {
      info.url = Utils.normalizeUrl(info.url, info.title)
    }
  }

  const idsMap: Record<ID, ID> = {}
  const processedTabs: (browser.tabs.Tab | null)[] = []

  // Create window
  const defaultContainerId = conf.incognito ? PRIVATE_CONTAINER_ID : DEFAULT_CONTAINER_ID
  const isPrivate = conf.incognito
  let window: browser.windows.Window
  try {
    window = await browser.windows.create(conf)
  } catch (err) {
    if (String(err) === 'Error: Extension does not have permission for incognito mode') {
      if (Windows.lastFocusedWinId !== undefined) {
        const notification: Notification = {
          title: translate('notif.open_private_windows_err'),
          details: translate('notif.open_private_windows_err_details'),
          lvl: 'err',
        }
        IPC.sendToSidebar(Windows.lastFocusedWinId, 'notify', notification, 10000)
      }
    }
    Logs.err('Windows: Cannot create window with tabs', err)
    globalTabsLockCounter--
    return false
  }
  globalTabsLockCounter--
  if (!window.id || !window.tabs?.length) return true
  lockedWindowsTabs[window.id] = true

  const initialTabId = window.tabs[0]?.id
  let activeTabId = NOID

  // Process the tabs
  const processingTabs: Promise<browser.tabs.Tab | browser.tabs.Tab[]>[] = []
  if (moveTabs) {
    // Move
    activeTabId = tabsInfo.find(t => t.active)?.id ?? NOID
    const ids = tabsInfo.map(t => t.id)
    processingTabs.push(browser.tabs.move(ids, { index: 0, windowId: window.id }))
  } else {
    // Create
    let index = 0
    for (const info of tabsInfo) {
      type CreateProps = browser.tabs.CreateProperties
      const conf: CreateProps = { url: info.url, windowId: window.id, index: index++ }
      if (info.pinned) conf.pinned = true
      if (info.active) conf.active = true
      else conf.active = false

      if (info.url && !info.pinned && !info.active) conf.discarded = true
      if (info.title && conf.discarded) conf.title = info.title
      if (!isPrivate && info.container !== undefined && Containers.reactive.byId[info.container]) {
        conf.cookieStoreId = info.container
      }

      processingTabs.push(browser.tabs.create(conf))
    }
  }

  // Gather processed tabs
  try {
    const processed = await Promise.allSettled(processingTabs)
    for (const processingResult of processed) {
      const tabOrTabs = Utils.settledOr(processingResult, null)
      if (Array.isArray(tabOrTabs)) processedTabs.push(...tabOrTabs)
      else processedTabs.push(tabOrTabs)
    }
  } catch (err) {
    Logs.err('Windows.createWithTabs: Cannot process tabs:', err)
    return false
  }

  // Go through moved/new tabs and restore their state from srcInfo
  const cache: TabCache[] = []
  for (let i = 0; i < processedTabs.length; i++) {
    const tab = processedTabs[i] as Tab | null
    const srcInfo = tabsInfo[i]
    if (!srcInfo || !tab) continue

    // Update new tabs relations
    if (srcInfo.parentId !== undefined && idsMap[srcInfo.parentId] !== undefined) {
      browser.tabs.update(tab.id, { openerTabId: idsMap[srcInfo.parentId] }).catch(err => {
        Logs.err('Windows.createWithTabs: Cannot set openerTabId:', err)
      })
      tab.parentId = idsMap[srcInfo.parentId]
    }

    // Create cache data
    const cachedData: TabCache = { id: tab.id, url: srcInfo.url ?? 'about:newtab' }
    if (+tab.parentId > -1) cachedData.parentId = tab.parentId
    if (srcInfo.panelId) cachedData.panelId = srcInfo.panelId
    if (tab.cookieStoreId !== defaultContainerId) cachedData.ctx = tab.cookieStoreId
    if (srcInfo.customTitle) cachedData.customTitle = srcInfo.customTitle
    if (srcInfo.customColor) cachedData.customColor = srcInfo.customColor
    if (srcInfo.pinned) cachedData.pin = true
    if (srcInfo.folded) cachedData.folded = true
    cache.push(cachedData)

    // Save tabs data
    const sessionData: TabSessionData = {
      id: tab.id,
      panelId: srcInfo.panelId ?? NOID,
      parentId: tab.parentId ?? NOID,
      folded: !!srcInfo.folded,
    }
    if (srcInfo.customTitle) sessionData.customTitle = srcInfo.customTitle
    if (srcInfo.customColor) sessionData.customColor = srcInfo.customColor
    browser.sessions.setTabValue(tab.id, 'data', sessionData).catch(err => {
      Logs.err('Windows.createWithTabs: Cannot set session data:', err)
    })

    idsMap[srcInfo.id] = tab.id
  }

  Tabs.cacheTabsData(window.id, cache, 0)

  // Update succession for the initial tab
  const firstTab = processedTabs[0]
  if (firstTab && moveTabs) {
    if (activeTabId === NOID) activeTabId = firstTab.id
    await browser.tabs.moveInSuccession([initialTabId], activeTabId).catch(err => {
      Logs.err('Windows.createWithTabs: Cannot update succession for initial tab:', err)
    })
  }

  try {
    await browser.tabs.remove(initialTabId)
  } catch (err) {
    Logs.err('Windows.createWithTabs: Cannot remove initial tab:', err)
  }

  lockedWindowsTabs[window.id] = { move: moveTabs, cache }

  Logs.info('Windows.createWithTabs: Done')

  return true
}

export function updWindowPreface(preface?: string) {
  if (preface === undefined) preface = Settings.state.markWindowPreface

  preface = preface.replace('%PN', Sidebar.panelsById[Sidebar.activePanelId]?.name ?? '')

  browser.windows.update(Windows.id, { titlePreface: preface })
}
