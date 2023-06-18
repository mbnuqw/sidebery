import * as Utils from 'src/utils'
import { Window, TabCache, Tab, Notification, TabSessionData } from 'src/types'
import { WindowChooseOption, WindowChoosingDetails, ItemInfo } from 'src/types'
import { NOID, MOVEID, DEFAULT_CONTAINER_ID, PRIVATE_CONTAINER_ID } from 'src/defaults'
import { Windows } from 'src/services/windows'
import * as Logs from 'src/services/logs'
import { Tabs } from 'src/services/tabs.bg'
import { Settings } from 'src/services/settings'
import * as IPC from './ipc'

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

const lockedWindowsTabs: Record<ID, boolean | TabCache[]> = {}
export function isWindowTabsLocked(id: ID): boolean | TabCache[] {
  return lockedWindowsTabs[id] ?? false
}

export async function createWithTabs(
  tabsInfo: ItemInfo[],
  conf?: browser.windows.CreateData
): Promise<boolean> {
  if (!conf) conf = {}

  const moveTabs = conf.tabId === MOVEID
  if (moveTabs) delete conf.tabId

  // Normalize urls
  if (!moveTabs) {
    for (const info of tabsInfo) {
      info.url = Utils.normalizeUrl(info.url, info.title)
    }
  }

  const idsMap: Record<ID, ID> = {}
  const createdTabs: browser.tabs.Tab[] = []

  // Create window
  const defaultContainerId = conf.incognito ? PRIVATE_CONTAINER_ID : DEFAULT_CONTAINER_ID
  let window: browser.windows.Window
  try {
    window = await browser.windows.create(conf)
  } catch (err) {
    if (String(err) === 'Error: Extension does not have permission for incognito mode') {
      if (Windows.lastFocusedWinId !== undefined) {
        const notification: Notification = {
          title: 'Cannot open window',
          details: String(err),
          lvl: 'err',
        }
        IPC.sendToSidebar(Windows.lastFocusedWinId, 'notify', notification, 10000)
      }
    }
    Logs.err('Windows: Cannot create window with tabs', err)
    return false
  }
  if (!window.id || !window.tabs?.length) return true
  lockedWindowsTabs[window.id] = true

  const firstTabId = window.tabs[0]?.id

  // Process the tabs
  const processingTabs: Promise<browser.tabs.Tab | browser.tabs.Tab[]>[] = []
  let index = 1
  for (const info of tabsInfo) {
    // Move
    if (moveTabs) {
      processingTabs.push(browser.tabs.move(info.id, { index: index++, windowId: window.id }))
    }

    // Create
    else {
      type CreateProps = browser.tabs.CreateProperties
      const conf: CreateProps = { url: info.url, windowId: window.id, index: index++ }
      if (info.pinned) conf.pinned = true
      if (info.active) conf.active = true
      else conf.active = false

      if (info.url && !info.pinned && !info.active) conf.discarded = true
      if (info.title && conf.discarded) conf.title = info.title

      processingTabs.push(browser.tabs.create(conf))
    }
  }

  // Normalize processed tabs
  try {
    const processed = await Promise.all(processingTabs)
    for (const tabOrTabs of processed) {
      if (Array.isArray(tabOrTabs)) createdTabs.push(...tabOrTabs)
      else createdTabs.push(tabOrTabs)
    }
  } catch (err) {
    Logs.err('Windows.createWithTabs: Cannot process tabs:', err)
    return false
  }

  // Go through src/new tabs
  const cache: TabCache[] = []
  for (let i = 0; i < createdTabs.length; i++) {
    const tab = createdTabs[i] as Tab
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
    cache.push(cachedData)

    // Save tabs data
    const sessionData: TabSessionData = {
      id: tab.id,
      panelId: srcInfo.panelId ?? NOID,
      parentId: tab.parentId ?? NOID,
      folded: false,
    }
    if (srcInfo.customTitle) sessionData.customTitle = srcInfo.customTitle
    if (srcInfo.customColor) sessionData.customColor = srcInfo.customColor
    browser.sessions.setTabValue(tab.id, 'data', sessionData).catch(err => {
      Logs.err('Windows.createWithTabs: Cannot set session data:', err)
    })

    idsMap[srcInfo.id] = tab.id
  }

  Tabs.cacheTabsData(window.id, cache, 0)

  try {
    await browser.tabs.remove(firstTabId)
  } catch (err) {
    Logs.err('Windows.createWithTabs: Cannot remove initial tab:', err)
  }

  lockedWindowsTabs[window.id] = cache

  setTimeout(() => {
    if (window.id !== undefined) delete lockedWindowsTabs[window.id]
  }, 5000)

  return true
}
