import { BgWindow, ItemInfo, Notification, BgTab, TabCache, TabSessionData } from 'src/types'
import { DEFAULT_CONTAINER_ID, MOVEID, NOID, PRIVATE_CONTAINER_ID } from 'src/defaults'
import * as Tabs from 'src/services/tabs.bg'
import * as Info from 'src/services/info'
import * as Containers from 'src/services/containers'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as Omnibox from 'src/services/omnibox.bg'
import * as Sidebar from 'src/services/sidebar.bg'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'

export const byId = new Map<ID, BgWindow>()
export let lastFocusedId = NOID
export let focusedId = NOID

export async function load(): Promise<void> {
  Logs.info('Windows.bg.load')
  const nativeWindows = await browser.windows.getAll({ windowTypes: ['normal'], populate: false })
  byId.clear()
  for (const nativeWindow of nativeWindows) {
    if (nativeWindow.type !== 'normal' || nativeWindow.id === undefined) continue
    const window = mutateNativeWindowToSideberyWindow(nativeWindow)
    byId.set(window.id, window)
    if (window.focused) {
      lastFocusedId = window.id
      focusedId = window.id
    }
  }
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
      if (lastFocusedId !== NOID) {
        const notification: Notification = {
          title: translate('notif.open_private_windows_err'),
          details: translate('notif.open_private_windows_err_details'),
          lvl: 'err',
        }
        IPC.sendToSidebar(lastFocusedId, 'notify', notification, 10000)
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
    const tab = processedTabs[i] as BgTab | null
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
    if (tab.parentId !== undefined && tab.parentId !== NOID) cachedData.parentId = tab.parentId
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

export function setupWindowsListeners(): void {
  browser.windows.onCreated.addListener(onWindowCreated)
  browser.windows.onRemoved.addListener(onWindowRemoved)
  browser.windows.onFocusChanged.addListener(onWindowFocused)
}

export function resetWindowsListeners(): void {
  browser.windows.onCreated.removeListener(onWindowCreated)
  browser.windows.onRemoved.removeListener(onWindowRemoved)
  browser.windows.onFocusChanged.removeListener(onWindowFocused)
}

function mutateNativeWindowToSideberyWindow(nativeWin: browser.windows.Window): BgWindow {
  const win = nativeWin as BgWindow
  if (nativeWin.id === undefined) win.id = NOID
  if (!nativeWin.tabs) win.tabs = []
  win.activeTabId = win.tabs.find(t => t.active)?.id ?? NOID
  return win
}

function onWindowCreated(nativeWin: browser.windows.Window): void {
  const window = mutateNativeWindowToSideberyWindow(nativeWin)
  if (window.id === NOID) {
    Logs.warn('Windows.onWindowCreated: window.id === NOID')
    return
  }

  const existedWin = byId.get(window.id)
  if (existedWin?.tabs) window.tabs = existedWin.tabs
  if (existedWin && existedWin.activeTabId !== NOID) {
    window.activeTabId = existedWin.activeTabId
  }
  byId.set(window.id, window)

  // TODO: test this, maybe make it lazy
  // Styles.updateWindowStyles(window.id)

  Omnibox.updateCommandsDebounced(500)
}

function onWindowRemoved(windowId: ID): void {
  const window = byId.get(windowId)
  if (!window) return

  byId.delete(windowId)
  delete Tabs.cacheByWin[windowId]

  if (window.tabs) {
    for (const tab of window.tabs) {
      delete Tabs.byId[tab.id]
    }
  }

  Omnibox.updateCommandsDebounced(500)
}

function onWindowFocused(windowId: ID): void {
  // Unfocused
  if (windowId === -1) {
    for (const [id, window] of byId) {
      if (window?.focused) {
        window.focused = false
      }
    }
    focusedId = NOID
  }

  // Focused
  else {
    const window = byId.get(windowId)
    if (window) {
      lastFocusedId = windowId
      focusedId = windowId
      window.focused = true
    }

    Sidebar.saveFocusedActivePanelIdDebounced(1000)
  }
}
