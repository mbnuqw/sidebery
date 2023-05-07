import { Tab, Window, TabCache, TabsTreeData, GroupInfo, AnyFunc } from 'src/types'
import { InstanceType, TabTreeData } from 'src/types'
import * as Utils from 'src/utils'
import { ADDON_HOST, GROUP_INITIAL_TITLE, GROUP_URL, NOID, SAMEID } from 'src/defaults'
import { URL_URL, SETTINGS_OPTIONS } from 'src/defaults'
import { Tabs } from 'src/services/tabs.bg'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Store } from 'src/services/storage'
import { WebReq } from 'src/services/web-req'
import { Favicons } from 'src/services/favicons'
import * as IPC from './ipc'
import { Settings } from './settings'
import * as Logs from './logs'
import { ParsedTheme, Styles } from './styles'

/**
 * Load tabs
 */
export async function loadTabs(): Promise<void> {
  const tabs = await browser.tabs.query({})
  for (const tab of tabs as Tab[]) {
    const tabWindow = Windows.byId[tab.windowId]
    if (!tabWindow) continue

    if (tabWindow.tabs) tabWindow.tabs.push(tab)
    else tabWindow.tabs = [tab]

    Tabs.byId[tab.id] = tab

    if (WebReq.containersProxies[tab.cookieStoreId]) {
      tab.proxified = true
      showProxyBadge(tab.id)
    }

    tab.internal = tab.url.startsWith(ADDON_HOST)

    // Detect if pinned tabs is actually discarded and manually call discard()
    // for browser.sessionstore.restore_pinned_tabs_on_demand = true
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1703072
    if (tab.pinned && !tab.discarded && tab.url[0] === 'h' && tab.status === 'complete') {
      browser.tabs
        .executeScript(tab.id, {
          code: '(document.body?.childNodes?.length ?? 1)+(document.head?.childNodes?.length ?? 1)',
          runAt: 'document_start',
          matchAboutBlank: true,
        })
        .then(ans => {
          if (ans?.[0] === 0) {
            browser.tabs.discard(tab.id).catch(() => {
              Logs.warn('Tabs.loadTabs: Cannot discard pinned tab for 1703072')
            })
          }
        })
        .catch(() => {
          // Ignore this
        })
    }
  }

  Tabs.ready = true

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []
}

export async function reinitTabs(msg: string) {
  Logs.warn('Tabs.reinitTabs:', msg)
  Tabs.ready = false
  Tabs.byId = {}
  Tabs.cacheByWin = {}
  for (const win of Object.values(Windows.byId)) {
    win.tabs = []
  }
  await loadTabs()
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

  const tabWindow = Windows.byId[tab.windowId]
  if (!tabWindow) {
    const win: Window = {
      id: tab.windowId,
      alwaysOnTop: false,
      focused: false,
      incognito: tab.incognito,
    }
    win.tabs = [tab as Tab]
    Windows.byId[tab.windowId] = win
    return
  }

  if (tabWindow.tabs) tabWindow.tabs.splice(tab.index, 0, tab as Tab)
  else tabWindow.tabs = [tab as Tab]

  const len = tabWindow.tabs.length
  for (let i = tab.index, t; i < len; i++) {
    t = tabWindow.tabs[i]
    if (t) t.index = i
    else {
      reinitTabs('onTabCreated: Empty space in list')
      return
    }
  }

  // If sidebar is closed and tabs of inactive panels hidden move new tab (if needed)
  if (Settings.state.hideInact && !IPC.isConnected(InstanceType.sidebar, tab.windowId)) {
    const prevTab = tabWindow.tabs[tab.index - 1]
    if (prevTab && prevTab.hidden) {
      for (let i = prevTab.index - 1; i >= 0; i--) {
        const prevTabN = tabWindow.tabs[i]
        if (prevTabN && !prevTabN.hidden) {
          browser.tabs.move(tab.id, { index: i + 1, windowId: tabWindow.id }).catch(err => {
            Logs.err('Tabs.onTabCreated: Cannot move tab (backward):', err)
          })
          break
        }
      }
    } else {
      const nextTab = tabWindow.tabs[tab.index + 1]
      if (nextTab && nextTab.hidden) {
        for (let i = nextTab.index + 1; i < tabWindow.tabs.length; i++) {
          const nextTabN = tabWindow.tabs[i]
          if (nextTabN && !nextTabN.hidden) {
            browser.tabs.move(tab.id, { index: i, windowId: tabWindow.id }).catch(err => {
              Logs.err('Tabs.onTabCreated: Cannot move tab (forward):', err)
            })
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

  const tabWindow = Windows.byId[info.windowId]
  const tabs = tabWindow?.tabs
  const tab = Tabs.byId[tabId]
  if (!tab || !tabs || info.isWindowClosing) return

  const index = tabs.findIndex(t => t.id === tabId)
  if (index === -1 || tab.index !== index) return

  tabs.splice(index, 1)
  delete Tabs.byId[tabId]

  const len = tabs.length
  for (let i = index, t; i < len; i++) {
    t = tabs[i]
    if (t) t.index = i
    else {
      reinitTabs('onTabRemoved: Empty space in list')
      return
    }
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

  const tab = Tabs.byId[tabId]
  if (!tab) return

  if (change.url) {
    const isInternal = change.url.startsWith(ADDON_HOST)
    tab.internal = isInternal
    if (isInternal) {
      if (Utils.isUrlUrl(change.url)) injectUrlPageScript(tab.windowId, tabId)
    }
  }

  if (change.status !== undefined) {
    if (change.status === 'complete' && tab.url[0] !== 'a' && !tab.internal) {
      reloadTabFaviconDebounced(tab)
    }
  }

  // Inject group page script if internal page has initial title
  if (change.title && tab.internal && !tab.discarded && change.title === GROUP_INITIAL_TITLE) {
    injectGroupPageScript(tab.windowId, tabId)
  }

  if (
    change.favIconUrl?.startsWith('data:') &&
    reloadTabFaviconTimeout[tab.id] === undefined &&
    !tab.internal
  ) {
    Favicons.saveFavicon(tab.url, change.favIconUrl)
  }

  Object.assign(tab, change)

  if (WebReq.containersProxies[tab.cookieStoreId]) {
    tab.proxified = true
    showProxyBadgeDebounced(tabId)
  }
  if (!WebReq.containersProxies[tab.cookieStoreId] && tab.proxified) {
    tab.proxified = false
    hideProxyBadge(tabId)
  }
}

const reloadTabFaviconTimeout: Record<ID, number> = {}
function reloadTabFaviconDebounced(targetTab: Tab, delay = 500): void {
  clearTimeout(reloadTabFaviconTimeout[targetTab.id])
  reloadTabFaviconTimeout[targetTab.id] = setTimeout(() => {
    delete reloadTabFaviconTimeout[targetTab.id]
    if (!Tabs.byId[targetTab.id]) return
    browser.tabs
      .get(targetTab.id)
      .then(tabInfo => {
        if (tabInfo.favIconUrl && !tabInfo.favIconUrl.startsWith('chrome:')) {
          targetTab.favIconUrl = tabInfo.favIconUrl
        } else {
          targetTab.favIconUrl = ''
        }
        Favicons.saveFavicon(targetTab.url, targetTab.favIconUrl)
      })
      .catch(err => {
        Logs.err('Tabs.reloadTabFaviconDebounced: Cannot get tab:', err)
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
  // TODO: Remove after v5 release
  if (tab && tab.url.startsWith('about:blank#url')) {
    browser.tabs.update(tab.id, { url: tab.url.substring(15) }).catch(err => {
      Logs.err('Tabs.onTabActivated: Cannot reload tab in correct container:', err)
    })
  }

  // Update tab's url
  if (tab.reloadOnActivation) {
    tab.reloadOnActivation = undefined
    browser.tabs.reload(tab.id)
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
  browser.pageAction.show(tabId).catch(err => {
    Logs.err('Tabs.showProxyBadge: Cannot show proxy badge:', err)
  })
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
  browser.pageAction.hide(tabId).catch(err => {
    Logs.err('Tabs.hideProxyBadge: Cannot hide proxy badge:', err)
  })
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

  const tabWindow = Windows.byId[info.windowId]
  if (!tabWindow || !tabWindow.tabs) return

  const tab = Tabs.byId[id]
  if (!tab) {
    Logs.warn('onTabMoved: No tab')
    return
  }

  const tabAtDstIndex = tabWindow.tabs[info.toIndex]
  const tabAtSrcIndex = tabWindow.tabs[info.fromIndex]

  // Check if tab is already placed correctly
  if (tabAtDstIndex?.id === id && tabAtDstIndex.index === info.toIndex) return

  if (!tabAtSrcIndex || tabAtSrcIndex.id !== id) {
    reinitTabs('onTabMoved: Wrong tab at src index')
    return
  }

  tabWindow.tabs.splice(info.fromIndex, 1)
  tabWindow.tabs.splice(info.toIndex, 0, tabAtSrcIndex)

  for (let i = tabWindow.tabs.length, t; i--; ) {
    t = tabWindow.tabs[i]
    if (t) t.index = i
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

  const tabWindow = Windows.byId[info.newWindowId]
  const tabs = tabWindow?.tabs
  const tab = Tabs.byId[id]
  if (!tabs || !tab) {
    reinitTabs('onTabAttached: No tab[s]')
    return
  }

  tab.windowId = info.newWindowId
  tab.index = info.newPosition

  tabs.splice(info.newPosition, 0, tab)

  for (let i = info.newPosition, t; i < tabs.length; i++) {
    t = tabs[i]
    if (t) t.index = i
    else {
      reinitTabs('onTabAttached: Empty space in list')
      return
    }
  }
}

/**
 * Handle tab detach
 */
function onTabDetached(id: ID, info: browser.tabs.DetachInfo): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabDetached(id, info))
    return
  }

  const tabWindow = Windows.byId[info.oldWindowId]
  const tabs = tabWindow?.tabs
  const tab = Tabs.byId[id]
  if (!tabs || !tab) {
    reinitTabs('onTabDetached: No tab[s]')
    return
  }

  tabs.splice(info.oldPosition, 1)[0]

  for (let i = info.oldPosition, t; i < tabs.length; i++) {
    t = tabs[i]
    if (t) t.index = i
    else {
      reinitTabs('onTabDetached: Empty space in list')
      return
    }
  }
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

    const sidebarConnection = IPC.getConnection(InstanceType.sidebar, window.id)
    if (sidebarConnection) {
      receivingSidebarTrees.push(IPC.sidebar(window.id, 'getTabsTreeData'))
    } else {
      receivingSidebarTrees.push(Promise.resolve([]))
    }
  }

  let trees: TabsTreeData[]
  try {
    trees = await Promise.all(receivingSidebarTrees)
  } catch (err) {
    trees = []
  }

  for (let tree, window, i = 0; i < windowsList.length; i++) {
    tree = trees[i]
    window = windowsList[i]
    if (!window?.tabs) continue

    const treeDataById: Record<ID, TabTreeData> = {}
    let prevPanelId = NOID
    for (const data of tree) {
      if (data.pid === SAMEID) data.pid = prevPanelId
      prevPanelId = data.pid ?? NOID
      treeDataById[data.id] = data
    }

    for (const tab of window.tabs) {
      tab.lvl = 0
      tab.parentId = NOID
      tab.panelId = NOID
      tab.customTitle = undefined
      tab.customColor = undefined

      if (!tree) continue

      const tabInfo = treeDataById[tab.id]
      if (!tabInfo) continue

      if (tabInfo.pid !== undefined) tab.panelId = tabInfo.pid
      if (tabInfo.tid !== undefined) tab.parentId = tabInfo.tid
      if (tabInfo.ct) tab.customTitle = tabInfo.ct
      if (tabInfo.cc) tab.customColor = tabInfo.cc
      const parent = Tabs.byId[tab.parentId]
      if (parent) tab.lvl = parent.lvl + 1
    }
  }
}

export async function initInternalPageScripts(tabs: Tab[]) {
  if (!Styles.theme) {
    await Styles.initColorScheme()
  }

  for (const tab of tabs) {
    if (!Windows.byId[tab.windowId]) continue

    if (tab.internal === undefined) tab.internal = tab.url.startsWith(ADDON_HOST)
    const isGroup = Utils.isGroupUrl(tab.url)
    const isUrl = Utils.isUrlUrl(tab.url)

    // Wrong addon ID - update url
    if (!tab.internal && isGroup) {
      const [_, groupUrlInfo] = tab.url.split('/group.html')
      if (!groupUrlInfo) continue
      const groupUrl = GROUP_URL + groupUrlInfo
      browser.tabs.update(tab.id, { url: groupUrl }).catch(err => {
        Logs.err('Tabs.initInternalPageScripts: Cannot update group url:', err)
      })
      continue
    }
    if (!tab.internal && isUrl) {
      const [_, urlUrlInfo] = tab.url.split('/url.html')
      if (!urlUrlInfo) continue
      const urlUrl = URL_URL + urlUrlInfo
      browser.tabs.update(tab.id, { url: urlUrl }).catch(err => {
        Logs.err('Tabs.initInternalPageScripts: Cannot update url url:', err)
      })
      continue
    }

    if (isGroup && !tab.discarded) injectGroupPageScript(tab.windowId, tab.id)
    if (isUrl && !tab.discarded) injectUrlPageScript(tab.windowId, tab.id)
  }
}

export async function injectUrlPageScript(winId: ID, tabId: ID): Promise<void> {
  try {
    await browser.tabs
      .executeScript(tabId, {
        file: '/injections/url.js',
        runAt: 'document_start',
        matchAboutBlank: true,
      })
      .catch(err => {
        Logs.warn('Tabs.injectUrlPageScript: Cannot inject script, tabId:', tabId, err)
      })
    const initData = getUrlPageInitData(winId, tabId)
    const initDataJson = JSON.stringify(initData)
    browser.tabs
      .executeScript(tabId, {
        code: `window.sideberyInitData=${initDataJson};window.onSideberyInitDataReady?.()`,
        runAt: 'document_start',
        matchAboutBlank: true,
      })
      .catch(() => {
        Logs.warn('Tabs.injectUrlPageScript: Cannot inject init data, reloading tab...')
        const tab = Tabs.byId[tabId]
        if (tab.active) {
          browser.tabs.reload(tabId).catch(err => {
            Logs.err('Tabs.injectUrlPageScript: Cannot reload tab', err)
          })
        } else if (!tab.discarded) {
          tab.reloadOnActivation = true
        }
      })
  } catch (err) {
    Logs.err('Injected url-page script', err)
  }
}

export interface UrlPageInitData {
  theme?: (typeof SETTINGS_OPTIONS.theme)[number]
  parsedTheme?: ParsedTheme
  frameColorScheme?: 'dark' | 'light'
  toolbarColorScheme?: 'dark' | 'light'
  winId?: ID
  tabId?: ID
}
export function getUrlPageInitData(winId: ID, tabId: ID): UrlPageInitData {
  return {
    theme: Settings.state.theme,
    parsedTheme: Styles.parsedTheme,
    frameColorScheme: Styles.reactive.frameColorScheme,
    toolbarColorScheme: Styles.reactive.toolbarColorScheme,
    winId,
    tabId,
  }
}

export async function injectGroupPageScript(winId: ID, tabId: ID): Promise<void> {
  try {
    browser.tabs
      .executeScript(tabId, {
        file: '/injections/group.js',
        runAt: 'document_start',
        matchAboutBlank: true,
      })
      .catch(err => {
        Logs.warn('Tabs.injectGroupPageScript: Cannot inject script, tabId:', tabId, err)
      })
    const initData = await getGroupPageInitData(winId, tabId)
    const initDataJson = JSON.stringify(initData)
    browser.tabs
      .executeScript(tabId, {
        code: `window.sideberyInitData=${initDataJson};window.onSideberyInitDataReady?.()`,
        runAt: 'document_start',
        matchAboutBlank: true,
      })
      .catch(() => {
        Logs.warn('Tabs.injectGroupPageScript: Cannot inject init data, reloading tab')
        const tab = Tabs.byId[tabId]
        if (tab.active) {
          browser.tabs.reload(tabId).catch(err => {
            Logs.err('Tabs.injectGroupPageScript: Cannot reload tab:', err)
          })
        } else if (!tab.discarded) {
          tab.reloadOnActivation = true
        }
      })
  } catch (err) {
    Logs.err('Injected group-page script', err)
  }
}

export interface GroupPageInitData {
  theme?: (typeof SETTINGS_OPTIONS.theme)[number]
  parsedTheme?: ParsedTheme
  frameColorScheme?: 'dark' | 'light'
  toolbarColorScheme?: 'dark' | 'light'
  groupLayout?: (typeof SETTINGS_OPTIONS.groupLayout)[number]
  animations?: boolean
  groupInfo?: GroupInfo | null
  winId?: ID
  tabId?: ID
}
export async function getGroupPageInitData(winId: ID, tabId: ID): Promise<GroupPageInitData> {
  const groupInfo = await IPC.sidebar(winId, 'getGroupInfo', tabId).catch(err => {
    Logs.err('Tabs: Cannot get tabs info for group page', err)
    return null
  })

  return {
    theme: Settings.state.theme,
    parsedTheme: Styles.parsedTheme,
    frameColorScheme: Styles.reactive.frameColorScheme,
    toolbarColorScheme: Styles.reactive.toolbarColorScheme,
    groupLayout: Settings.state.groupLayout,
    animations: Settings.state.animations,
    groupInfo,
    winId,
    tabId,
  }
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

export async function getSidebarTabs(windowId: ID, tabIds?: ID[]): Promise<Tab[] | undefined> {
  const connection = IPC.getConnection(InstanceType.sidebar, windowId)
  if (!connection) return
  if (
    (!connection.localPort || connection.localPort.error) &&
    (!connection.remotePort || connection.remotePort.error)
  ) {
    return
  }

  return IPC.sidebar(windowId, 'getTabs', tabIds)
}

export function setupTabsListeners(): void {
  browser.tabs.onCreated.addListener(onTabCreated)
  browser.tabs.onRemoved.addListener(onTabRemoved)
  browser.tabs.onUpdated.addListener(onTabUpdated, {
    properties: ['pinned', 'title', 'status', 'favIconUrl', 'url', 'hidden', 'discarded'],
  })
  browser.tabs.onActivated.addListener(onTabActivated)
  browser.tabs.onMoved.addListener(onTabMoved)
  browser.tabs.onAttached.addListener(onTabAttached)
  browser.tabs.onDetached.addListener(onTabDetached)
}
