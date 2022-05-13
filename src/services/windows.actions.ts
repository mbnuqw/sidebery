import Utils from 'src/utils'
import { Window, TabCache, SavedGroup, Tab, Notification } from 'src/types'
import { WindowChooseOption, WindowChoosingDetails, ItemInfo } from 'src/types'
import { NOID, MOVEID, DEFAULT_CONTAINER_ID, PRIVATE_CONTAINER_ID } from 'src/defaults'
import { Windows } from 'src/services/windows'
import { Logs } from 'src/services/logs'
import { Tabs } from 'src/services/tabs.bg'
import { Settings } from 'src/services/settings'
import { Msg } from './msg'

export async function loadWindows(): Promise<void> {
  const windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: false })
  Windows.byId = {}
  for (const window of windows) {
    if (window.type !== 'normal' || window.id === undefined) continue
    Windows.byId[window.id] = window as Window
  }
}

export async function loadWindowInfo(): Promise<void> {
  const currentWindow = await browser.windows.getCurrent({ populate: false })

  Windows.incognito = currentWindow.incognito
  Windows.id = currentWindow.id ?? NOID
  Windows.focused = currentWindow.focused
  if (Windows.focused && currentWindow.id) Windows.focusedWindowId = currentWindow.id
  Windows.lastFocused = currentWindow.focused
  browser.windows.getAll().then(windows => {
    Windows.otherWindows = windows.filter(w => {
      return w.id !== Windows.id && w.type === 'normal'
    }) as Window[]
  })

  Logs.info('Windows info loaded')
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
      if (Settings.reactive.selWinScreenshots && browser.tabs.captureTab) {
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

const lockedWindowsTabs: Record<ID, boolean> = {}
export function isWindowTabsLocked(id: ID): boolean {
  return lockedWindowsTabs[id] ?? false
}

export async function createWithTabs(
  tabsInfo: ItemInfo[],
  conf?: browser.windows.CreateData
): Promise<boolean> {
  // Normalize config of new window
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
        Msg.callSidebar(Windows.lastFocusedWinId, 'notify', notification, 10000)
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

      if (conf.url && info.container && info.container !== defaultContainerId) {
        conf.cookieStoreId = info.container
        // Workaround for #196, https://bugzilla.mozilla.org/show_bug.cgi?id=1581872
        conf.discarded = false
        delete conf.title
      }

      processingTabs.push(browser.tabs.create(conf))
    }
  }

  // Normalize processed tabs
  const processed = await Promise.all(processingTabs)
  for (const tabOrTabs of processed) {
    if (Array.isArray(tabOrTabs)) createdTabs.push(...tabOrTabs)
    else createdTabs.push(tabOrTabs)
  }

  // Go through src/new tabs
  let hasGroups = false
  const cache: TabCache[] = []
  const groups: Record<ID, SavedGroup> = {}
  for (let i = 0; i < createdTabs.length; i++) {
    const tab = createdTabs[i] as Tab
    const srcInfo = tabsInfo[i]
    if (!srcInfo || !tab) continue

    // Update new tabs relations
    if (srcInfo.parentId !== undefined && idsMap[srcInfo.parentId] !== undefined) {
      browser.tabs.update(tab.id, { openerTabId: idsMap[srcInfo.parentId] })
      tab.parentId = idsMap[srcInfo.parentId]
    }

    // Create cache data
    const cachedData: TabCache = { id: tab.id, url: srcInfo.url ?? 'about:newtab' }
    if (tab.parentId > -1) cachedData.parentId = tab.parentId
    if (srcInfo.panelId) cachedData.panelId = srcInfo.panelId
    if (tab.cookieStoreId !== defaultContainerId) cachedData.ctx = tab.cookieStoreId
    cache.push(cachedData)

    // Save tabs data
    browser.sessions.setTabValue(tab.id, 'data', {
      id: tab.id,
      panelId: srcInfo.panelId,
      parentId: tab.parentId ?? NOID,
      folded: false,
    })

    idsMap[srcInfo.id] = tab.id

    // Prepare groups info for saving
    if (Utils.isGroupUrl(tab.url)) {
      hasGroups = true
      const prevTab = createdTabs[tab.index - 1]
      const nextTab = createdTabs[tab.index + 1]
      const groupInfo: SavedGroup = {
        id: tab.id,
        index: tab.index,
        ctx: tab.cookieStoreId,
        panelId: srcInfo.panelId ?? NOID,
        parentId: tab.parentId,
        folded: false,
        url: tab.url,
      }
      if (prevTab) groupInfo.prevTab = prevTab.id
      if (nextTab) groupInfo.nextTab = nextTab.id
      groups[tab.id] = groupInfo
    }
  }

  if (hasGroups) browser.sessions.setWindowValue(window.id, 'groups', groups)
  Tabs.cacheTabsData(window.id, cache)

  await browser.tabs.remove(firstTabId)

  delete lockedWindowsTabs[window.id]

  return true
}
