import * as T from 'src/types'
import { InstanceType } from 'src/enums'
import * as D from 'src/defaults'
import * as Utils from 'src/utils'
import * as Windows from 'src/services/windows.bg'
import * as Containers from 'src/services/containers'
import * as Store from 'src/services/storage.bg'
import * as WebReq from 'src/services/web-req.bg'
import * as Favicons from 'src/services/favicons.bg'
import * as IPC from 'src/services/ipc.bg'
import * as IPPC from 'src/services/ippc.addon'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'
import * as Styles from 'src/services/styles.bg'
import * as Omnibox from 'src/services/omnibox.bg'
import { DetachedTabsInfo } from 'src/services/tabs.fg.move'
import { translate } from 'src/dict'

import * as Tabs from 'src/services/tabs.bg'

export let ready = false
export let byId: Record<ID, T.BgTab> = {}
export let cacheByWin: Record<ID, T.TabCache[]> = {}
export let deferredEventHandling: (() => void)[] = []

let _tabsDataCache: T.TabCache[][] | undefined

/**
 * Load tabs
 */
export async function load(): Promise<void> {
  Logs.info('Tabs.loadTabs')
  const [nativeTabs, storage] = await Promise.all([
    browser.tabs.query({}).catch(() => []),
    _tabsDataCache
      ? undefined
      : browser.storage.local.get<T.Stored>('tabsDataCache').catch(() => ({}) as T.Stored),
  ])
  if (!_tabsDataCache) _tabsDataCache = storage?.tabsDataCache

  for (const nativeTab of nativeTabs) {
    const tabWindow = Windows.byId.get(nativeTab.windowId)
    if (!tabWindow) continue

    const tab = mutateNativeTabToSideberyTab(nativeTab)

    if (tabWindow.tabs) tabWindow.tabs.push(tab)
    else tabWindow.tabs = [tab]

    if (tab.active) tabWindow.activeTabId = tab.id

    Tabs.byId[tab.id] = tab

    if (WebReq.containersProxies[tab.cookieStoreId]) {
      tab.proxified = true
      showProxyBadge(tab.id)
    }

    tab.internal = tab.url.startsWith(D.ADDON_HOST)
    if (tab.internal) tab.isGroup = Utils.isGroupUrl(tab.url)

    // Forcefully discard pinned tab for the case of
    // browser.sessionstore.restore_pinned_tabs_on_demand = true
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1703072
    if (tab.pinned && !tab.discarded && Settings.state.pinnedForcedDiscard) {
      browser.tabs.discard(tab.id).catch(() => {
        Logs.warn('Tabs.loadTabs: Cannot discard pinned tab for 1703072')
      })
    }
  }

  ready = true

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  deferredEventHandling.forEach(cb => cb())
  deferredEventHandling = []
}

export async function reinitTabs(msg: string) {
  if (!Tabs.ready) {
    Logs.warn('Tabs.reinitTabs: Tabs are not ready:', msg)
    return
  }
  Logs.warn('Tabs.reinitTabs:', msg)

  ready = false
  byId = {}
  cacheByWin = {}
  IPPC.resetAll()
  for (const win of Windows.byId.values()) {
    win.tabs = []
  }
  await load()
}

export function createOpenFromCacheMenu() {
  // No cache
  if (!_tabsDataCache) return

  // One window
  if (_tabsDataCache.length === 1) {
    const winCache = _tabsDataCache[0]
    if (!winCache) return

    browser.menus.create({
      id: 'reopen_cached_win',
      title: translate('menu.browserAction.reopen_cached_win_first', winCache.length),
      icons: { '16': 'assets/window-native.svg' },
      onclick: () => openCachedWindow(winCache),
      contexts: ['browser_action'],
    })
  }

  // Multiple windows
  else {
    const parentId = browser.menus.create({
      id: 'reopen_cached_wins',
      title: translate('menu.browserAction.reopen_cached_wins'),
      icons: { '16': 'assets/window-native.svg' },
      contexts: ['browser_action'],
    })

    for (let i = 0; i < _tabsDataCache.length; i++) {
      const winCache = _tabsDataCache[i]
      if (!winCache) continue

      const panelIds = new Set()
      for (const tab of winCache) {
        panelIds.add(tab.panelId)
      }

      browser.menus.create({
        id: `reopen_cached_win_${i}`,
        parentId,
        title: translate('menu.browserAction.reopen_cached_win', winCache.length, panelIds.size),
        icons: { '16': 'assets/window-native.svg' },
        onclick: () => openCachedWindow(winCache),
        contexts: ['browser_action'],
      })
    }
  }
}

function openCachedWindow(cache: T.TabCache[]) {
  const items: T.ItemInfo[] = []
  for (const cachedTab of cache) {
    items.push({
      id: cachedTab.id,
      url: Utils.restoreUrl(cachedTab.url),
      title: cachedTab.customTitle ?? cachedTab.url.replace(/^https?:\/\//, ''),
      parentId: cachedTab.parentId ?? D.NOID,
      panelId: cachedTab.panelId ?? D.NOID,
      pinned: !!cachedTab.pin,
      customColor: cachedTab.customColor,
      customTitle: cachedTab.customTitle,
      folded: !!cachedTab.folded,
    })
  }
  items[0].active = true
  Windows.createWithTabs(items)
}

function mutateNativeTabToSideberyTab(nativeTab: T.NativeTab): T.BgTab {
  const tab = nativeTab as T.BgTab
  return tab
}

export function setupListeners(): void {
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

/**
 * Handle new tab
 */
function onTabCreated(nativeTab: browser.tabs.Tab): void {
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabCreated(nativeTab))
    return
  }

  const tab = mutateNativeTabToSideberyTab(nativeTab)

  tab.internal = tab.url.startsWith(D.ADDON_HOST)
  tab.isGroup = tab.internal && Utils.isGroupUrl(tab.url)

  Tabs.byId[tab.id] = tab

  const parentTab = Tabs.byId[tab.openerTabId ?? D.NOID]
  if (parentTab && parentTab.preventAutoReopening) tab.preventAutoReopening = true

  const tabWindow = Windows.byId.get(tab.windowId)
  if (!tabWindow) {
    const win: T.BgWindow = {
      id: tab.windowId,
      alwaysOnTop: false,
      focused: false,
      incognito: tab.incognito,
      tabs: [tab],
      activeTabId: tab.active ? tab.id : D.NOID,
      activePanelId: D.NOID,
    }
    Windows.byId.set(tab.windowId, win)
    return
  }

  if (tabWindow.tabs) tabWindow.tabs.splice(tab.index, 0, tab)
  else tabWindow.tabs = [tab]

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

  if (tab.isGroup && Settings.state.omniMoveToGroup) {
    Omnibox.updateCommandsDebounced(500)
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

  const tabWindow = Windows.byId.get(info.windowId)
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

  if (tab.isGroup) {
    if (Settings.state.omniMoveToGroup) Omnibox.updateCommandsDebounced(500)
    IPPC.reset(tab)
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
  if (!tab) {
    Logs.warn('Tabs.onTabUpdated: No tab with id:', tabId, change)
    return
  }

  const wasGroup = !!tab.isGroup
  if (change.url) {
    const isInternal = change.url.startsWith(D.ADDON_HOST)
    const isGroup = isInternal && Utils.isGroupUrl(change.url)
    const isPlaceholder = isInternal && Utils.isPlaceholderUrl(change.url)
    if (isGroup || isPlaceholder) {
      // Broadcast channel init
      if (
        tab.cookieStoreId === D.DEFAULT_CONTAINER_ID &&
        change.url.endsWith('!ch!~') &&
        IPPC.bcInitNeeded(tab, change.url)
      ) {
        IPPC.initBC(tab, change.url)
      }
      // Hash messaging
      else if (change.url.endsWith('!b!~')) {
        IPPC.onHashMsg(tab, change.url)
      }
    } else if ((!isGroup && tab.isGroup) || (!isPlaceholder && tab.isPlaceholder)) {
      IPPC.reset(tab)
    }
    tab.internal = isInternal
    tab.isGroup = isGroup
    tab.isPlaceholder = isPlaceholder
  }

  if (!tab.internal && change.favIconUrl?.startsWith('data:')) {
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

  if (Settings.state.omniMoveToGroup && (wasGroup || tab.isGroup)) {
    Omnibox.updateCommandsDebounced(500)
  }
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

  const window = Windows.byId.get(info.windowId)
  if (window) window.activeTabId = info.tabId

  // Update tab's url
  if (tab?.reloadOnActivation) {
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

  const tabWindow = Windows.byId.get(info.windowId)
  if (!tabWindow || !tabWindow.tabs) return

  const tab = Tabs.byId[id]
  if (!tab) {
    Logs.warn(`onTabMoved: No tab: id:${id}, ${info.fromIndex} > ${info.toIndex}`)
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

  const tabWindow = Windows.byId.get(info.newWindowId)
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

  if (Settings.state.omniMoveToGroup && tab.isGroup) {
    Omnibox.updateCommandsDebounced(500)
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

  const tabWindow = Windows.byId.get(info.oldWindowId)
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

  if (Settings.state.omniMoveToGroup && tab.isGroup) {
    Omnibox.updateCommandsDebounced(500)
  }
}

let cacheTabsDataTimeout: number | undefined
export function cacheTabsData(windowId: ID, tabs: T.TabCache[], delay = 300): void {
  if (!tabs) return
  // Logs.info('Tabs.cacheTabsData:', windowId)

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
  const receivingSidebarTrees: Promise<T.TabsTreeData>[] = []
  const windowsList: T.BgWindow[] = []

  for (const window of Windows.byId.values()) {
    if (window.id === undefined) continue
    windowsList.push(window)

    const sidebarConnection = IPC.getConnection(InstanceType.sidebar, window.id)
    if (sidebarConnection) {
      receivingSidebarTrees.push(IPC.sidebar(window.id, 'getTabsTreeData'))
    } else {
      Logs.warn('Tabs.updateBgTabsTreeData: No connected sidebar:', window.id)
      receivingSidebarTrees.push(Promise.resolve([]))
    }
  }

  let trees: T.TabsTreeData[]
  try {
    trees = await Promise.all(receivingSidebarTrees)
  } catch (err) {
    Logs.err('Tabs.updateBgTabsTreeData: Error on receivingSidebarTrees:', err)
    trees = []
  }

  for (let tree, window, i = 0; i < windowsList.length; i++) {
    tree = trees[i]
    window = windowsList[i]
    if (!window?.tabs) {
      Logs.warn('Tabs.updateBgTabsTreeData: No window tabs, i:', i)
      continue
    }

    const treeDataById: Record<ID, T.TabTreeData> = {}
    let prevPanelId = D.NOID
    if (tree) {
      for (const data of tree) {
        if (data.pid === D.SAMEID) data.pid = prevPanelId
        prevPanelId = data.pid ?? D.NOID
        treeDataById[data.id] = data
      }
      Logs.info('Tabs.updateBgTabsTreeData: win/sdb tabs len:', window.tabs.length, tree.length)
    } else {
      Logs.warn('Tabs.updateBgTabsTreeData: No sidebar tree, i:', i)
    }

    for (const tab of window.tabs) {
      tab.lvl = 0
      tab.parentId = D.NOID
      tab.panelId = D.NOID
      tab.customTitle = undefined
      tab.customColor = undefined

      const tabInfo = treeDataById[tab.id]
      if (!tabInfo) continue

      if (tabInfo.pid !== undefined) tab.panelId = tabInfo.pid
      if (tabInfo.tid !== undefined) tab.parentId = tabInfo.tid
      if (tabInfo.ct) tab.customTitle = tabInfo.ct
      if (tabInfo.cc) tab.customColor = tabInfo.cc
      if (tabInfo.f) tab.folded = true
      const parent = Tabs.byId[tab.parentId]
      if (parent) tab.lvl = (parent.lvl ?? 0) + 1
    }
  }
}

export async function initInternalPageScripts(tabs: T.BgTab[]) {
  for (const tab of tabs) {
    if (!Windows.byId.has(tab.windowId)) continue

    if (tab.internal === undefined) tab.internal = tab.url.startsWith(D.ADDON_HOST)
    const isGroup = Utils.isGroupUrl(tab.url)
    const isPlaceholder = Utils.isPlaceholderUrl(tab.url)

    // Wrong addon ID - update url
    if (!tab.internal && isGroup) {
      const [_, groupUrlInfo] = tab.url.split('/group.html')
      if (!groupUrlInfo) continue
      const groupUrl = D.GROUP_URL + groupUrlInfo
      browser.tabs.update(tab.id, { url: groupUrl }).catch(err => {
        Logs.err('Tabs.initInternalPageScripts: Cannot update group url:', err)
      })
      continue
    }
    if (!tab.internal && isPlaceholder) {
      const [_, urlUrlInfo] = tab.url.split('/url.html')
      if (!urlUrlInfo) continue
      const urlUrl = D.PLACEHOLDER_URL + urlUrlInfo
      browser.tabs.update(tab.id, { url: urlUrl }).catch(err => {
        Logs.err('Tabs.initInternalPageScripts: Cannot update url url:', err)
      })
      continue
    }

    // Initialize group/placeholder page
    if (!tab.discarded && (isGroup || isPlaceholder)) {
      if (!tab.url.endsWith('!~')) {
        browser.tabs.reload(tab.id).catch(() => undefined)
      } else if (tab.cookieStoreId === D.DEFAULT_CONTAINER_ID && tab.url.endsWith('!ch!~')) {
        IPPC.initBC(tab)
      } else if (tab.url.endsWith('!b!~')) {
        IPPC.onHashMsg(tab, tab.url)
      }
    }
  }
}

export interface PlaceholderPageInitData {
  theme?: (typeof D.SETTINGS_OPTIONS.theme)[number]
  parsedTheme?: Styles.ParsedTheme
  frameColorScheme?: 'dark' | 'light'
  toolbarColorScheme?: 'dark' | 'light'
  winId?: ID
  tabId?: ID
  labels?: Record<string, string>
}
export async function getPlaceholderPageInitData(tabId: ID): Promise<PlaceholderPageInitData> {
  const tab = Tabs.byId[tabId]
  if (!tab) throw 'getPlaceholderPageInitData: no tab'
  const winId = tab.windowId
  const winStyles = Styles.byWinId.get(winId) ?? (await Styles.updateWindowStyles(winId))
  return {
    theme: Settings.state.theme,
    parsedTheme: winStyles?.parsedTheme,
    frameColorScheme: winStyles?.frameColorScheme,
    toolbarColorScheme: winStyles?.toolbarColorScheme,
    winId,
    tabId,
    labels: {
      unavailable_url: browser.i18n.getMessage('unavailable_url'),
      page_title: browser.i18n.getMessage('page_title'),
      original_url: browser.i18n.getMessage('original_url'),
      copy_url: browser.i18n.getMessage('copy_url'),
      api_limit_info: browser.i18n.getMessage('api_limit_info'),
    },
  }
}

export async function getGroupPageInitData(tabId: ID): Promise<T.GroupPageInitData> {
  const tab = Tabs.byId[tabId]
  if (!tab) throw 'getGroupPageInitData: no tab'
  const winId = tab.windowId

  let groupInfo = null
  if (IPC.isConnected(InstanceType.sidebar, winId)) {
    groupInfo = await IPC.sidebar(winId, 'getGroupInfo', tabId).catch(err => {
      Logs.err('Tabs: Cannot get tabs info for group page', err)
      return null
    })
  } else {
    const win = Windows.byId.get(winId)
    // Try again if the window was created less than 5s ago
    if (win?.created !== undefined && Date.now() - win.created < 5_000) {
      Logs.warn('Tabs.getGroupPageInitData: No connected sidebar, wait and try again...')
      await IPC.waitForConnection(InstanceType.sidebar, winId, 5_000).catch(() => undefined)
      if (IPC.isConnected(InstanceType.sidebar, winId)) {
        groupInfo = await IPC.sidebar(winId, 'getGroupInfo', tabId).catch(err => {
          Logs.err('Tabs: Cannot get tabs info for group page', err)
          return null
        })
      }
    }
    if (!groupInfo) {
      Logs.warn('Tabs.getGroupPageInitData: No connected sidebar, skip gathering tabs info...')
    }
  }

  const winStyles = Styles.byWinId.get(winId) ?? (await Styles.updateWindowStyles(winId))

  return {
    theme: Settings.state.theme,
    parsedTheme: winStyles?.parsedTheme,
    frameColorScheme: winStyles?.frameColorScheme,
    toolbarColorScheme: winStyles?.toolbarColorScheme,
    customCSS: await Styles.loadCustomGroupCSS(),
    groupLayout: Settings.state.groupLayout,
    animations: Settings.state.animations,
    groupInfo,
    newTabPos: Settings.state.moveNewTabParent === 'first_child' ? 'first_child' : 'last_child',
    winId,
    tabId,
    labels: {
      page_url_parse_err: browser.i18n.getMessage('page_url_parse_err'),
      group_disconnected_warn: browser.i18n.getMessage('group_disconnected_warn'),
      group_new_tab_tooltip: browser.i18n.getMessage('group_new_tab_tooltip'),
      group_tab_discard_tooltip: browser.i18n.getMessage('group_tab_discard_tooltip'),
      group_tab_reload_tooltip: browser.i18n.getMessage('group_tab_reload_tooltip'),
      group_tab_close_tooltip: browser.i18n.getMessage('group_tab_close_tooltip'),
    },
  }
}

export function tabsApiProxy<T extends Array<any>>(method: string, ...args: T): any {
  if (method === 'create') return (browser.tabs.create as T.AnyFunc)(...args)
  if (method === 'update') return (browser.tabs.update as T.AnyFunc)(...args)
  if (method === 'remove') return (browser.tabs.remove as T.AnyFunc)(...args)
  if (method === 'discard') return (browser.tabs.discard as T.AnyFunc)(...args)
  if (method === 'reload') return (browser.tabs.reload as T.AnyFunc)(...args)
  if (method === 'captureTab' && browser.tabs.captureTab) {
    return (browser.tabs.captureTab as T.AnyFunc)(...args)
  }
}

export async function getSidebarTabs(windowId: ID, tabIds?: ID[]): Promise<T.Tab[] | undefined> {
  const con = IPC.getConnection(InstanceType.sidebar, windowId)
  if (!con) return
  if ((!con.localPort || con.localPort.error) && (!con.remotePort || con.remotePort.error)) {
    return
  }

  return IPC.sidebar(windowId, 'getTabs', tabIds)
}

export async function detachSidebarTabs(
  windowId: ID,
  tabIds: ID[]
): Promise<DetachedTabsInfo | undefined> {
  const con = IPC.getConnection(InstanceType.sidebar, windowId)
  if (!con) return
  if ((!con.localPort || con.localPort.error) && (!con.remotePort || con.remotePort.error)) {
    return
  }

  return IPC.sidebar(windowId, 'detachTabs', tabIds)
}

export async function openTabs(items: T.ItemInfo[], dst: T.DstPlaceInfo) {
  if (dst.windowId === undefined || !Windows.byId.has(dst.windowId)) return false

  const con = IPC.getConnection(InstanceType.sidebar, dst.windowId)

  // Sidebar is connected
  if ((con?.localPort && !con.localPort.error) || (con?.remotePort && !con.remotePort.error)) {
    return IPC.sidebar(dst.windowId, 'openTabs', items, dst)
  }

  // No sidebar connection
  else {
    for (const item of items) {
      await browser.tabs.create({ url: item.url, windowId: dst.windowId })
    }
    return true
  }
}

export async function reopenTab(tab: T.BgTab, url: string, cookieStoreId?: string) {
  let index: number | undefined
  const checkingIfSidebarOpen = browser.sidebarAction.isOpen({ windowId: tab.windowId }).then(v => {
    if (!v) throw false
  })
  const receivingIndex = IPC.sidebar(tab.windowId, 'handleReopening', tab.id, cookieStoreId)
  try {
    const [i] = await Promise.all([receivingIndex, checkingIfSidebarOpen])
    index = i
  } catch {
    /* itsokay */
  }

  if (index === undefined) index = tab.index

  await browser.tabs.create({
    windowId: tab.windowId,
    url: Utils.sanitizeUrl(url),
    cookieStoreId,
    active: tab.active,
    index,
    pinned: tab.pinned,
  })
  await browser.tabs.remove(tab.id)
}

export function getActiveTabInLastFocusedWindow() {
  const focusedWindow = Windows.byId.get(Windows.lastFocusedId ?? D.NOID)
  if (!focusedWindow) {
    Logs.warn('Tabs.getActiveTabInLastFocusedWindow: Cannot find last focused window')
    return
  }

  return Tabs.byId[focusedWindow.activeTabId ?? D.NOID]
}
