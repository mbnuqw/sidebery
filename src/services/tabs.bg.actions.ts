import { Stored, Tab, Window, TabCache, TabsTreeData, GroupInfo, AnyFunc } from 'src/types'
import Utils from 'src/utils'
import { ADDON_HOST, NOID } from 'src/defaults'
import { Tabs } from 'src/services/tabs.bg'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Store } from 'src/services/storage'
import { WebReq } from 'src/services/web-req'
import { Favicons } from 'src/services/favicons'
import { IPC } from './ipc'
import { Settings } from './settings'
import { Logs } from './logs'

const detachedTabs: Record<ID, Tab> = {}

/**
 * Load tabs
 */
export async function loadTabs(): Promise<void> {
  const tabs = await browser.tabs.query({})
  for (const tab of tabs as Tab[]) {
    if (!Windows.byId[tab.windowId]) continue

    const tabWindow = Windows.byId[tab.windowId]
    if (tabWindow.tabs) tabWindow.tabs.push(tab)
    else tabWindow.tabs = [tab]

    Tabs.byId[tab.id] = tab

    if (WebReq.containersProxies[tab.cookieStoreId]) {
      tab.proxified = true
      showProxyBadge(tab.id)
    }

    if (Utils.isGroupUrl(tab.url)) injectGroupPageScript(tab.windowId, tab.id)
    if (Utils.isUrlUrl(tab.url)) injectUrlPageScript(tab.id)
  }

  Tabs.ready = true

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []
}

/**
 * Handle new tab
 */
function onTabCreated(tab: browser.tabs.Tab): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabCreated(tab))
    return
  }

  Tabs.byId[tab.id] = tab as Tab

  if (!Windows.byId[tab.windowId]) {
    const win: Window = { id: tab.windowId, alwaysOnTop: false, focused: false, incognito: false }
    win.tabs = [tab as Tab]
    Windows.byId[tab.windowId] = win
    return
  }

  const tabWindow = Windows.byId[tab.windowId]
  if (tabWindow.tabs) tabWindow.tabs.splice(tab.index, 0, tab as Tab)
  else tabWindow.tabs = [tab as Tab]

  const len = tabWindow.tabs.length
  for (let i = tab.index; i < len; i++) {
    tabWindow.tabs[i].index = i
  }

  // If sidebar is closed and tabs of inactive panels hidden move new tab (if needed)
  if (!IPC.sidebarConnections[tab.windowId] && Settings.state.hideInact) {
    const prevTab = tabWindow.tabs[tab.index - 1]
    if (prevTab && prevTab.hidden) {
      for (let i = prevTab.index - 1; i >= 0; i--) {
        const prevTabN = tabWindow.tabs[i]
        if (!prevTabN.hidden) {
          browser.tabs.move(tab.id, { index: i + 1, windowId: tabWindow.id })
          break
        }
      }
    } else {
      const nextTab = tabWindow.tabs[tab.index + 1]
      if (nextTab && nextTab.hidden) {
        for (let i = nextTab.index + 1; i < tabWindow.tabs.length; i++) {
          const nextTabN = tabWindow.tabs[i]
          if (!nextTabN.hidden) {
            browser.tabs.move(tab.id, { index: i, windowId: tabWindow.id })
            break
          }
        }
      }
    }
  }
}

/**
 * Handle tab removing
 */
function onTabRemoved(tabId: ID, info: browser.tabs.RemoveInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabRemoved(tabId, info))
    return
  }

  if (!Windows.byId[info.windowId] || info.isWindowClosing) return
  const tabWindow = Windows.byId[info.windowId]
  if (!tabWindow || !tabWindow.tabs) return
  const index = tabWindow.tabs.findIndex(t => t.id === tabId)
  if (index === -1) return

  tabWindow.tabs.splice(index, 1)
  delete Tabs.byId[tabId]

  const len = tabWindow.tabs.length
  for (let i = index; i < len; i++) {
    tabWindow.tabs[i].index = i
  }
}

/**
 * Handle tab update
 */
function onTabUpdated(tabId: ID, change: browser.tabs.ChangeInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabUpdated(tabId, change))
    return
  }

  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  if (change.status !== undefined) {
    if (
      change.status === 'complete' &&
      targetTab.url[0] !== 'a' &&
      !targetTab.url.startsWith(ADDON_HOST)
    ) {
      reloadTabFaviconDebounced(targetTab)
    }
  }

  if (change.url) {
    if (Utils.isGroupUrl(change.url)) injectGroupPageScript(targetTab.windowId, tabId)
    if (Utils.isUrlUrl(change.url)) injectUrlPageScript(tabId)
  }

  if (
    change.favIconUrl &&
    change.favIconUrl.startsWith('data:') &&
    reloadTabFaviconTimeout[targetTab.id] === undefined &&
    !targetTab.url.startsWith(ADDON_HOST)
  ) {
    Favicons.saveFavicon(targetTab.url, change.favIconUrl)
  }

  Object.assign(targetTab, change)

  if (WebReq.containersProxies[targetTab.cookieStoreId]) {
    targetTab.proxified = true
    showProxyBadgeDebounced(tabId)
  }
  if (!WebReq.containersProxies[targetTab.cookieStoreId] && targetTab.proxified) {
    targetTab.proxified = false
    hideProxyBadge(tabId)
  }
}

const reloadTabFaviconTimeout: Record<ID, number> = {}
function reloadTabFaviconDebounced(targetTab: Tab, delay = 500): void {
  clearTimeout(reloadTabFaviconTimeout[targetTab.id])
  reloadTabFaviconTimeout[targetTab.id] = setTimeout(() => {
    delete reloadTabFaviconTimeout[targetTab.id]
    browser.tabs.get(targetTab.id).then(tabInfo => {
      if (tabInfo.favIconUrl && !tabInfo.favIconUrl.startsWith('chrome:')) {
        targetTab.favIconUrl = tabInfo.favIconUrl
      } else {
        targetTab.favIconUrl = ''
      }
      Favicons.saveFavicon(targetTab.url, targetTab.favIconUrl)
    })
  }, delay)
}

/**
 * Handle tab activation event
 */
function onTabActivated(info: browser.tabs.ActiveInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabActivated(info))
    return
  }

  const tab = Tabs.byId[info.tabId]
  if (tab) tab.active = true

  const prevTab = Tabs.byId[info.previousTabId]
  if (prevTab) prevTab.active = false

  // Workaround for #196, https://bugzilla.mozilla.org/show_bug.cgi?id=1581872
  // Should be removed, all matched tabs should be reopened with original url
  if (tab && tab.url.startsWith('about:blank#url')) {
    browser.tabs.update(tab.id, { url: tab.url.substring(15) })
  }
}

/**
 * Show proxy badge (pageActive) for given tab
 */
export function showProxyBadge(tabId: ID): void {
  const tab = Tabs.byId[tabId]
  if (!tab) return
  const container = Containers.reactive.byId[tab.cookieStoreId]
  if (!container) return

  const titlePre = browser.i18n.getMessage('proxy_popup_title_prefix')
  const titlePost = browser.i18n.getMessage('proxy_popup_title_postfix')
  const title = titlePre + container.name + titlePost
  browser.pageAction.setTitle({ title, tabId })
  browser.pageAction.show(tabId)
}
let showProxyBadgeTimeout: number | undefined
function showProxyBadgeDebounced(tabId: ID, delay = 500): void {
  if (showProxyBadgeTimeout) clearTimeout(showProxyBadgeTimeout)
  showProxyBadgeTimeout = setTimeout(() => {
    showProxyBadge(tabId)
  }, delay)
}

/**
 * Hide proxy badge (pageActive) for given tab
 */
export function hideProxyBadge(tabId: ID): void {
  browser.pageAction.hide(tabId)
  browser.pageAction.setTitle({ title: 'Sidebery proxy off', tabId })
}

/**
 * Handle tab moving
 */
function onTabMoved(id: ID, info: browser.tabs.MoveInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabMoved(id, info))
    return
  }

  if (!Windows.byId[info.windowId]) return
  const tabWindow = Windows.byId[info.windowId]

  if (!tabWindow.tabs) return
  const movedTab = tabWindow.tabs.splice(info.fromIndex, 1)[0]
  tabWindow.tabs.splice(info.toIndex, 0, movedTab)

  for (let i = tabWindow.tabs.length; i--; ) {
    tabWindow.tabs[i].index = i
  }
}

/**
 * Handle tab attachment
 */
function onTabAttached(id: ID, info: browser.tabs.AttachInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabAttached(id, info))
    return
  }

  if (!Windows.byId[info.newWindowId]) return

  const tab = detachedTabs[id]
  if (!tab) return

  const tabWindow = Windows.byId[info.newWindowId]
  if (!tabWindow || !tabWindow.tabs) return

  tab.windowId = info.newWindowId
  tab.index = info.newPosition

  tabWindow.tabs.splice(info.newPosition, 0, tab)
}

/**
 * Handle tab detach
 */
function onTabDetached(id: ID, info: browser.tabs.DetachInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabDetached(id, info))
    return
  }

  if (!Windows.byId[info.oldWindowId]) return
  const tabWindow = Windows.byId[info.oldWindowId]
  if (!tabWindow || !tabWindow.tabs) return
  detachedTabs[id] = tabWindow.tabs.splice(info.oldPosition, 1)[0]
}

/**
 * Backup tabs data
 */
export async function backupTabsDataCache(): Promise<void> {
  let tabsData
  try {
    const storage = await browser.storage.local.get<Stored>('tabsDataCache')
    if (!storage.tabsDataCache) {
      const depr = await browser.storage.local.get<Stored>('tabsData_v4')
      if (depr.tabsData_v4) storage.tabsDataCache = depr.tabsData_v4
    }
    tabsData = storage.tabsDataCache
  } catch (err) {
    // Logs.push('[ERROR:BG] backupTabsDataCache: ', err.toString())
    return
  }

  await Store.set({ prevTabsDataCache: tabsData }, 500)
}

let cacheTabsDataTimeout: number | undefined
export function cacheTabsData(windowId: ID, tabs: TabCache[], delay = 300): void {
  if (!tabs) return

  Tabs.cacheByWin[windowId] = tabs

  clearTimeout(cacheTabsDataTimeout)
  cacheTabsDataTimeout = setTimeout(() => {
    const tabsData = []
    for (const tabs of Object.values(Tabs.cacheByWin)) {
      if (tabs.length) tabsData.push(tabs)
    }

    Store.set({ tabsDataCache: tabsData })
  }, delay)
}

/**
 * Update trees state from sidebars
 */
export async function updateBgTabsTreeData(): Promise<void> {
  const receivingSidebarTrees: Promise<TabsTreeData>[] = []
  const windowsList: Window[] = []

  for (const window of Object.values(Windows.byId)) {
    if (window.id === undefined) continue
    windowsList.push(window)

    const sidebarConnection = IPC.sidebarConnections[window.id]
    if (sidebarConnection) {
      receivingSidebarTrees.push(IPC.sidebar(window.id, 'getTabsTreeData'))
    } else {
      receivingSidebarTrees.push(Promise.resolve({}))
    }
  }

  let trees: TabsTreeData[]
  try {
    trees = await Promise.all(receivingSidebarTrees)
  } catch (err) {
    trees = []
  }

  for (let info: TabsTreeData, window: Window, i = 0; i < windowsList.length; i++) {
    info = trees[i]
    window = windowsList[i]
    if (!window?.tabs) continue

    for (const tab of window.tabs) {
      tab.lvl = 0
      tab.parentId = NOID
      tab.panelId = NOID

      if (!info) continue

      const tabInfo = info[tab.id]
      if (!tabInfo) continue

      tab.panelId = tabInfo[0]
      tab.parentId = tabInfo[1] ?? NOID
      if (tab.parentId && Tabs.byId[tab.parentId]) {
        tab.lvl = Tabs.byId[tab.parentId].lvl + 1
      }
    }
  }
}

export async function injectUrlPageScript(tabId: ID): Promise<void> {
  try {
    await browser.tabs.executeScript(tabId, {
      file: '/page.url/url.js',
      runAt: 'document_start',
      matchAboutBlank: true,
    })
  } catch (err) {
    Logs.err('Injected url-page script', err)
  }
}

export interface UrlPageInitData {
  ffTheme?: browser.theme.Theme
}
export async function getUrlPageInitData(): Promise<UrlPageInitData> {
  const theme = await browser.theme.getCurrent()
  return { ffTheme: theme }
}

export async function injectGroupPageScript(winId: ID, tabId: ID): Promise<void> {
  try {
    browser.tabs.executeScript(tabId, {
      code: `window.groupWinId = ${winId}; window.groupTabId = ${tabId}`,
      runAt: 'document_start',
      matchAboutBlank: true,
    })
    await browser.tabs.executeScript(tabId, {
      file: '/page.group/group.js',
      runAt: 'document_start',
      matchAboutBlank: true,
    })
  } catch (err) {
    Logs.err('Injected group-page script', err)
  }
}

export interface GroupPageInitData {
  ffTheme?: browser.theme.Theme
  groupInfo?: GroupInfo | null
}
export async function getGroupPageInitData(winId: ID, tabId: ID): Promise<GroupPageInitData> {
  const data: GroupPageInitData = {}
  const result = await Promise.all([
    browser.theme.getCurrent().catch(err => {
      Logs.err('Tabs: Cannot get theme for group page', err)
    }),
    IPC.sidebar(winId, 'getGroupInfo', tabId).catch(err => {
      Logs.err('Tabs: Cannot get tabs info for group page', err)
    }),
  ])
  if (result[0]) data.ffTheme = result[0]
  if (result[1]) data.groupInfo = result[1]
  return data
}

export function tabsApiProxy<T extends Array<any>>(method: string, ...args: T): any {
  if (method === 'create') return (browser.tabs.create as AnyFunc)(...args)
  if (method === 'update') return (browser.tabs.update as AnyFunc)(...args)
  if (method === 'remove') return (browser.tabs.remove as AnyFunc)(...args)
  if (method === 'discard') return (browser.tabs.discard as AnyFunc)(...args)
  if (method === 'reload') return (browser.tabs.reload as AnyFunc)(...args)
  if (method === 'captureTab' && browser.tabs.captureTab) {
    return (browser.tabs.captureTab as AnyFunc)(...args)
  }
}

export function setupTabsListeners(): void {
  browser.tabs.onCreated.addListener(onTabCreated)
  browser.tabs.onRemoved.addListener(onTabRemoved)
  browser.tabs.onUpdated.addListener(onTabUpdated, {
    properties: ['pinned', 'title', 'status', 'favIconUrl', 'url', 'hidden'],
  })
  browser.tabs.onActivated.addListener(onTabActivated)
  browser.tabs.onMoved.addListener(onTabMoved)
  browser.tabs.onAttached.addListener(onTabAttached)
  browser.tabs.onDetached.addListener(onTabDetached)
}
