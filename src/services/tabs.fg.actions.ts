import * as Utils from 'src/utils'
import { CONTAINER_ID, GROUP_URL, NOID, Err, SAMEID, URL_URL } from 'src/defaults'
import { BKM_OTHER_ID, ADDON_HOST, BKM_ROOT_ID } from 'src/defaults'
import { translate } from 'src/dict'
import { Stored, Tab, Panel, TabCache, ActiveTabsHistory, ReactiveTabProps } from 'src/types'
import { Notification, TabSessionData, TabsTreeData, NativeTab, DstPlaceInfo } from 'src/types'
import { ItemInfo, TabTreeData, TabStatus, CopyTemplate, LoadSrc } from 'src/types'
import { Tabs } from 'src/services/tabs.fg'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Permissions } from 'src/services/permissions'
import { Notifications } from 'src/services/notifications'
import * as Selection from './selection'
import { Favicons } from './_services.fg'

const URL_WITHOUT_PROTOCOL_RE = /^(.+\.)\/?(.+\/)?\w+/

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initTabs(react: (rObj: object) => object) {
  reactFn = react as <T extends object>(rObj: T) => T
  Tabs.reactive = reactFn(Tabs.reactive)
}

export function mutateNativeTabToSideberyTab(nativeTab: NativeTab): Tab {
  const tab = nativeTab as Tab

  if (tab.isParent === undefined) tab.isParent = false
  if (tab.folded === undefined) tab.folded = false
  if (tab.invisible === undefined) tab.invisible = false
  if (tab.parentId === undefined) tab.parentId = NOID
  if (tab.panelId === undefined) tab.panelId = NOID
  if (tab.prevPanelId === undefined) tab.prevPanelId = NOID
  if (tab.dstPanelId === undefined) tab.dstPanelId = NOID
  if (tab.relGroupId === undefined) tab.relGroupId = NOID
  if (tab.lvl === undefined) tab.lvl = 0
  if (tab.sel === undefined) tab.sel = false
  if (tab.updated === undefined) tab.updated = false
  if (tab.loading === undefined) tab.loading = false
  if (tab.status === undefined) tab.status = 'complete'
  if (tab.warn === undefined) tab.warn = false
  if (tab.internal === undefined) tab.internal = tab.url.startsWith(ADDON_HOST)
  if (tab.internal) tab.favIconUrl = undefined
  else {
    if (tab.favIconUrl === 'chrome://global/skin/icons/warning.svg') tab.warn = true
    if (tab.favIconUrl?.startsWith('chrome:')) tab.favIconUrl = undefined
  }
  if (tab.mediaPaused === undefined) tab.mediaPaused = false
  if (tab.isGroup === undefined) tab.isGroup = tab.internal && Utils.isGroupUrl(tab.url)

  if (tab.reactive === undefined) {
    tab.reactive = {
      active: tab.active,
      mediaAudible: tab.audible ?? false,
      mediaMuted: tab.mutedInfo?.muted ?? false,
      mediaPaused: tab.mediaPaused,
      containerColor: Containers.reactive.byId[tab.cookieStoreId]?.color ?? null,
      discarded: tab.discarded ?? false,
      pinned: tab.pinned,
      status: Tabs.getStatus(tab),
      isParent: tab.isParent,
      folded: tab.folded,
      tooltip: Settings.state.forceUpdTooltip ? getTooltip(tab) : '',
      customTitleEdit: false,
      customColor: tab.customColor ?? null,
      url: tab.url,
      lvl: tab.lvl,
      branchLen: 0,
      sel: tab.sel,
      selLock: tab.selLock,
      warn: tab.warn,
      updated: tab.updated,
      unread: !!tab.unread,
      flash: false,
      branchColor: null,
      color: null,
      isGroup: tab.isGroup,
      preview: false,
    }
  }

  return tab
}

export function reactivateTab(tab: Tab) {
  if (!tab.reactive || !reactFn) return
  tab.reactive = reactFn(tab.reactive)
}

export function createReactiveProps(tab: Tab): ReactiveTabProps {
  const rProps: ReactiveTabProps = {
    active: tab.active,
    mediaAudible: tab.audible ?? false,
    mediaMuted: tab.mutedInfo?.muted ?? false,
    mediaPaused: tab.mediaPaused,
    containerColor: Containers.reactive.byId[tab.cookieStoreId]?.color ?? null,
    discarded: tab.discarded ?? false,
    pinned: tab.pinned,
    status: Tabs.getStatus(tab),
    isParent: tab.isParent,
    folded: tab.folded,
    tooltip: Settings.state.forceUpdTooltip ? getTooltip(tab) : '',
    customTitleEdit: false,
    customColor: tab.customColor ?? null,
    url: tab.url,
    lvl: tab.lvl,
    branchLen: 0,
    sel: tab.sel,
    selLock: tab.selLock,
    warn: tab.warn,
    updated: tab.updated,
    unread: !!tab.unread,
    flash: false,
    branchColor: null,
    color: null,
    isGroup: tab.isGroup,
    preview: false,
  }

  if (reactFn) return reactFn(rProps)
  else {
    Logs.warn('Tabs.createReactiveProps: No reactFn')
    return rProps
  }
}

export function getStatus(tab: Tab): TabStatus {
  if (tab.status === 'loading') return TabStatus.Loading
  if (tab.status === 'pending') return TabStatus.Pending
  return TabStatus.Complete
}

let waitingForTabsReadiness: (() => void)[] = []
export async function waitForTabsReady(): Promise<void> {
  if (Tabs.ready) return

  return new Promise(ok => {
    waitingForTabsReadiness.push(ok)
  })
}

export async function load(src?: LoadSrc): Promise<void> {
  const ts = performance.now()
  Logs.info('Tabs.load')

  if (Tabs.shadowMode) Tabs.unloadShadowed()

  Tabs.setupTabsListeners()

  await Utils.retry({
    action: async (again, isLastTry) => {
      try {
        await restoreTabsState(src, isLastTry)
      } catch (err) {
        if (err === Err.TabsLocked) {
          Logs.warn('Tabs.load: Err.TabsLocked, trying again...')
          again()
        } else {
          Logs.err('Tabs.load: Cannot restore tabs state', err)
        }
      }
    },
    interval: 500,
    increment: 250,
    count: 10,
  })

  Tabs.updateActiveGroupPage()

  // Scroll to active tab
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab && !activeTab.pinned) Tabs.scrollToTab(activeTab.id)

  const sessionRestoreTabOnly =
    Tabs.list.length === 1 && Tabs.list[0]?.url === 'about:sessionrestore'

  Tabs.updateNativeTabsVisibility()
  if (!sessionRestoreTabOnly) Tabs.cacheTabsData(1000)
  Tabs.list.forEach(t => {
    Tabs.updateUrlCounter(t.url, 1)

    if (t.isGroup) Tabs.linkGroupWithPinnedTab(t, Tabs.list)

    Tabs.saveTabData(t.id)

    // Recalc branch length for folded (invisible) parent tabs
    if (t.folded && t.invisible) Tabs.recalcBranchLen(t.id)
  })

  for (const panel of Sidebar.panels) {
    if (Utils.isTabsPanel(panel)) {
      panel.ready = true
      if (panel.tabs.length) {
        Sidebar.updateMediaStateOfPanel(panel.id)
      }
    }
  }

  if (Settings.state.colorizeTabs) Tabs.colorizeTabs()
  if (Settings.state.colorizeTabsBranches) Tabs.colorizeBranches()

  Tabs.ready = true

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []

  waitingForTabsReadiness.forEach(cb => cb())
  waitingForTabsReadiness = []

  Logs.info(`Tabs.load: Done: ${performance.now() - ts}ms`)
}

export function unload(): void {
  Tabs.ready = false
  Tabs.resetTabsListeners()
  Tabs.cancelSavingTabData()
  Tabs.cancelCachingTabsData()

  Tabs.reactive.pinnedIds = []
  Tabs.reactive.recentlyRemovedLen = 0
  Tabs.reactive.inlinePreviewTabId = NOID
  Tabs.reactive.inlinePreviewPinnedImg = ''
  Tabs.list = []
  Tabs.byId = {}
  Tabs.pinned = []
  Tabs.recentlyRemoved = []

  Tabs.urlsInUse = {}
  Tabs.shadowMode = false
  Tabs.shadowReady = false

  Tabs.tabsReinitializing = false
  Tabs.removedTabs = []
  Tabs.newTabsPosition = {}
  Tabs.movingTabs = []
  Tabs.attachingTabs = []
  Tabs.detachingTabIds = new Set<ID>()
  Tabs.normTabsMoving = false
  Tabs.editableTabId = NOID

  Tabs.activeTabsGlobal.actTabOffset = -1
  Tabs.activeTabsGlobal.actTabs = []
  Tabs.activeTabsPerPanel = {}

  Tabs.removingTabs = []
  Tabs.ignoreTabsEvents = false
  Tabs.activeId = -1

  Sidebar.recalcTabsPanels()
  Sidebar.recalcVisibleTabs()
}

export function reloadInShadowMode() {
  unload()
  Tabs.loadInShadowMode()
}

// function dbgTabs(msg: string, tabs: Tab[]) {
//   const dbg = tabs.map(t => `id:${t.id}, i:${t.index}, pr:${t.parentId}, pn:${t.panelId}`)
//   Logs.info(msg, '\n' + dbg.join('\n'))
// }

async function restoreTabsState(src?: LoadSrc, ignoreLockedTabs?: boolean): Promise<void> {
  if (!Sidebar.hasTabs) return

  const ts = performance.now()
  Logs.info('Tabs.restoreTabsState')

  let isWindowTabsLocked
  if (!ignoreLockedTabs) {
    try {
      isWindowTabsLocked = await IPC.bg('isWindowTabsLocked', Windows.id)
    } catch {
      isWindowTabsLocked = true
    }
  }

  // Check if tabs are locked (sidebery is opening this window)
  if (isWindowTabsLocked === true) {
    Logs.info('Tabs.restoreTabsState: window tabs are locked (still opening?)')
    throw Err.TabsLocked
  }

  // Clear deferredEventHandling
  Tabs.deferredEventHandling = []

  const sessionOnly = src === LoadSrc.SessionOnly
  const results = await Promise.allSettled([
    browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT }),
    sessionOnly ? ({} as Stored) : browser.storage.local.get<Stored>('tabsDataCache'),
  ])
  const nativeTabs = Utils.settledOr(results[0], [])
  const storage = Utils.settledOr(results[1], {})
  let tabsWasMoved = false

  Logs.info('Tabs.restoreTabsState: nativeTabs.length:', nativeTabs.length)

  // Check if tabs were locked (sidebery opened this window)
  if (isWindowTabsLocked) {
    Logs.info('Tabs.restoreTabsState: window tabs were locked')
    storage.tabsDataCache = [isWindowTabsLocked.cache]
    tabsWasMoved = isWindowTabsLocked.move
  }

  let tabs: Tab[] | undefined
  let tabsCache: Record<ID, TabCache> | undefined
  let tabsSessionData: (TabSessionData | undefined)[] | undefined

  const lastPanel = Sidebar.panels.find(p => Utils.isTabsPanel(p))
  if (!lastPanel) return Logs.err('Cannot load tabs: No tabs panels')

  // Find the most appropriate cache data
  if (storage.tabsDataCache && !sessionOnly) {
    tabsCache = findCachedData(nativeTabs, storage.tabsDataCache)
  }

  // Restore tabs data from cache
  if (tabsCache) {
    tabs = restoreTabsFromCache([...nativeTabs], tabsCache, lastPanel)
  }

  // From session data
  else {
    const querying = nativeTabs.map(t =>
      browser.sessions.getTabValue<TabSessionData | undefined>(t.id, 'data').catch(() => undefined)
    )
    try {
      tabsSessionData = (await Promise.all(querying)) ?? []
    } catch (err) {
      Logs.err('Tabs.restoreTabsState: Cannot get tabs data from session:', err)
      tabsSessionData = []
    }

    tabs = restoreTabsFromSessionData([...nativeTabs], tabsSessionData, lastPanel)
  }

  // dbgTabs('Tabs.restoreTabsState: Restored:', tabs)

  tabs = await restoreTabPanelsContent(tabs)

  Tabs.list = tabs
  Sidebar.recalcTabsPanels()
  if (Settings.state.tabsTree) updateTabsTree()
  Sidebar.recalcVisibleTabs()

  const activeTab = tabs.find(t => t.active)
  if (activeTab) {
    const actTabIsGloballyPinned = activeTab.pinned && Settings.state.pinnedTabsPosition !== 'panel'
    const currentActivePanel = Sidebar.panelsById[Sidebar.activePanelId]

    if (Utils.isTabsPanel(currentActivePanel)) {
      const currentActivePanelHidden =
        currentActivePanel.hidden ||
        (Settings.state.hideEmptyPanels && !currentActivePanel.reactive.len) ||
        (Settings.state.hideDiscardedTabPanels && currentActivePanel.allDiscarded)

      let targetPanel
      // Switch to panel with active tab
      if (!actTabIsGloballyPinned) {
        targetPanel = Sidebar.panelsById[activeTab.panelId]
      }
      // or switch to panel of the first not pinned tab if active panel is hidden or not set
      else if (currentActivePanelHidden || Sidebar.activePanelId === NOID) {
        const panelId = tabs.find(t => !t.pinned)?.panelId
        if (panelId) targetPanel = Sidebar.panelsById[panelId]
      }

      if (targetPanel && targetPanel.id !== Sidebar.activePanelId) {
        Sidebar.activatePanel(targetPanel.id, false)
      }
    }

    // Set active tab id
    Tabs.activeId = activeTab.id

    // Update succession
    Tabs.updateSuccessionDebounced(0)
  }

  // Update group pages if tabs was moved to the new (this) window
  if (tabsWasMoved) {
    Tabs.list.forEach(t => t.isGroup && Tabs.updateGroupTab(t))
  }

  Logs.info(`Tabs.restoreTabsState: Done: ${performance.now() - ts}ms`)
}

/**
 * Moves tabs to their panels if needed
 */
async function restoreTabPanelsContent(tabs: Tab[]) {
  // Get sorted tabs
  let sortedTabs: Tab[] = []
  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const panel of Sidebar.panels) {
      sortedTabs = sortedTabs.concat(tabs.filter(t => t.pinned && t.panelId === panel.id))
    }
  } else {
    for (const tab of tabs) {
      if (tab.pinned) sortedTabs.push(tab)
      else break
    }
  }
  for (const panel of Sidebar.panels) {
    sortedTabs = sortedTabs.concat(tabs.filter(t => !t.pinned && t.panelId === panel.id))
  }

  // Check if sorted and native tabs have different orders
  let tabsAreUnsorted = false
  let unmatchIndex = -1
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i] !== sortedTabs[i]) {
      tabsAreUnsorted = true
      unmatchIndex = i
      break
    }
  }

  if (tabsAreUnsorted) {
    Logs.warn('Tabs.restoreTabPanelsContent: Tabs are unsorted; unmatchIndex:', unmatchIndex)

    // Sort tabs
    Tabs.ignoreMoveEvents(true, 'initsort')
    const idsToMove = sortedTabs.map(t => t.id).slice(unmatchIndex)
    Logs.info('Tabs.restoreTabPanelsContent: idsToMove:', idsToMove)
    try {
      await browser.tabs.move(idsToMove, { index: unmatchIndex })
    } catch (err) {
      Tabs.ignoreMoveEvents(false, 'initsort')
      throw err
    }
    tabs = sortedTabs

    // Update indexes
    for (let i = unmatchIndex; i < tabs.length; i++) {
      tabs[i].index = i
    }
    Tabs.ignoreMoveEvents(false, 'initsort')

    // dbgTabs('Tabs.restoreTabsState: Sorted:', tabs)
  }

  return tabs
}

function restoreTab(
  nativeTab: NativeTab,
  idsMap: Partial<Record<ID, ID>>,
  fallbackPanelId: ID,
  props?: TabCache | TabSessionData
): Tab {
  // Convert native tab to sidebery tab
  const tab = mutateNativeTabToSideberyTab(nativeTab)

  // Restore props
  if (props) {
    // Parent tab
    const actualParentId = idsMap[props.parentId ?? NOID]
    if (actualParentId !== undefined) tab.parentId = actualParentId

    tab.reactive.folded = tab.folded = !!props.folded
    if (props.customTitle) tab.customTitle = props.customTitle
    if (props.customColor) tab.reactive.customColor = tab.customColor = props.customColor
  } else {
    Logs.warn(`Tabs.restoreTab: no props for: "${tab.id} i${tab.index} url${tab.url}"`)
  }

  // Use openerTabId as fallback for parentId
  if (tab.parentId === -1 && tab.openerTabId !== undefined && Tabs.byId[tab.openerTabId]) {
    tab.parentId = tab.openerTabId
  }

  // Set panel
  const panel = Sidebar.panelsById[props?.panelId ?? NOID]
  if (panel) {
    // Panel is found
    if (tab.pinned && Settings.state.pinnedTabsPosition !== 'panel') {
      // Set the first tabs panel (fallbackPanelId) as the panel for global pinned tabs
      tab.panelId = fallbackPanelId
    } else {
      tab.panelId = panel.id
    }
  } else {
    // Panel is not found
    Logs.warn(`Tabs.restoreTab: cannot find panel: "${props?.panelId}"; tab index: ${tab.index}`)
    const parentTab = Tabs.byId[tab.parentId]
    if (!props && parentTab && parentTab.index < tab.index) {
      // Append unknown (new) tabs to the panel of parent tab
      tab.panelId = parentTab.panelId
    } else if (!props && Utils.isTabsPanel(Sidebar.panelsById[Sidebar.prevActivePanelId])) {
      // Append unknown (new) tabs to the last active tabs panel
      tab.panelId = Sidebar.prevActivePanelId
    } else {
      // Or just set the fallback
      tab.panelId = fallbackPanelId
    }
  }

  return tab
}

/**
 * Restores sidebery tabs props from cache
 */
function restoreTabsFromCache(
  nativeTabs: NativeTab[],
  cache: Record<ID, TabCache>,
  fallbackPanel: Panel
): Tab[] {
  Logs.info('Tabs.restoreTabsFromCache')

  const tabs: Tab[] = []

  // Get ids map
  const idsMap: Partial<Record<ID, ID>> = {}
  for (const nativeTab of [...nativeTabs]) {
    const data = cache[nativeTab.id]
    if (data) idsMap[data.id] = nativeTab.id
  }

  // Go through tabs and restore sidebery props
  Tabs.byId = {}
  for (const nativeTab of [...nativeTabs]) {
    const data = cache[nativeTab.id]
    const tab = restoreTab(nativeTab, idsMap, fallbackPanel.id, data)

    // Update fallback panel so the next tab without panelId will be appended to it
    if (!tab.pinned) fallbackPanel = Sidebar.panelsById[tab.panelId] ?? fallbackPanel

    Tabs.reactivateTab(tab)
    Tabs.byId[tab.id] = tab
    tabs.push(tab)
  }

  return tabs
}

/**
 * Restores sidebery tabs props from session data
 */
function restoreTabsFromSessionData(
  nativeTabs: NativeTab[],
  tabsData: (TabSessionData | undefined)[],
  fallbackPanel: Panel
): Tab[] {
  Logs.info('Tabs.restoreTabsFromSessionData')

  const tabs: Tab[] = []

  // Get ids map
  const idsMap: Partial<Record<ID, ID>> = {}
  for (let data, nativeTab, i = 0; i < nativeTabs.length; i++) {
    nativeTab = nativeTabs[i]
    data = tabsData[i]
    if (data && nativeTab) idsMap[data.id] = nativeTab.id
  }

  // Set tabs initial props and update state
  Tabs.byId = {}
  for (let data, nativeTab, i = 0; i < nativeTabs.length; i++) {
    nativeTab = nativeTabs[i]
    data = tabsData[i]
    if (!nativeTab) throw `Tabs.restoreTabsFromSessionData: ${i}'st native tab is undefined`

    const tab = restoreTab(nativeTab, idsMap, fallbackPanel.id, data)

    // Update fallback panel so the next tab without panelId will be appended to it
    if (!tab.pinned) fallbackPanel = Sidebar.panelsById[tab.panelId] ?? fallbackPanel

    Tabs.reactivateTab(tab)
    Tabs.byId[tab.id] = tab
    tabs.push(tab)
  }

  return tabs
}

/**
 * Find suitable tabs data for current window
 */
function findCachedData(
  tabs: DeepReadonly<NativeTab[]>,
  data: TabCache[][]
): Record<ID, TabCache> | undefined {
  let maxEqualityCounter = 1
  let result: Record<ID, TabCache> | undefined

  Logs.info('Tabs.findCachedData')
  Logs.info('Tabs.findCachedData: cached windows count:', data.length)

  if (tabs.length <= 1) {
    Logs.info('Tabs.findCachedData: Skipping')
    return
  }

  if (Windows.uniqWinId && Windows.uniqWinId !== NOID) {
    const winTabsCache = data.find(winTabs => winTabs[0]?.uniqWinId === Windows.uniqWinId)
    if (winTabsCache) data = [winTabsCache]
    Logs.info('Tabs.findCachedData: Window has uniqWinId, matched cache found:', !!winTabsCache)
  }

  for (const winTabs of data) {
    let equalityCounter = 0
    let blindspotCounter = 0

    Logs.info('Tabs.findCachedData:   cached tabs length:', winTabs.length)

    const existedTabs: Record<ID, TabCache> = {}

    let dataIndex = 0
    let tabIndex = 0
    perTab: for (let tab, tabData; dataIndex < winTabs.length; dataIndex++, tabIndex++) {
      tab = tabs[tabIndex]
      if (!tab) break
      tabData = winTabs[dataIndex]
      if (!tabData) break

      // Match
      const blindspot = tab.status === 'loading' && tab.url === 'about:blank'
      if (blindspot) blindspotCounter++
      if ((tabData.url === tab.url && !!tabData.pin === tab.pinned) || blindspot) {
        existedTabs[tab.id] = tabData
        equalityCounter++
      }

      // No match
      else {
        // Try to find corresponding local tab
        for (let j = tabIndex + 1; j < tabIndex + 5; j++) {
          const tabj = tabs[j]
          if (tabj && tabj.url === tabData.url) {
            tabIndex = j
            existedTabs[tabj.id] = tabData
            equalityCounter++
            continue perTab
          }
        }
        tabIndex--
      }
    }

    Logs.info('Tabs.findCachedData:     equalityCounter:', equalityCounter)
    Logs.info('Tabs.findCachedData:     blindspotCounter:', blindspotCounter)

    const mismatchedLen = tabs.length - equalityCounter

    if (
      (tabs.length <= winTabs.length && mismatchedLen > 0) ||
      (tabs.length > winTabs.length && mismatchedLen > tabs.length - winTabs.length)
    ) {
      Logs.warn('Tabs.findCachedData: mismatched:', mismatchedLen, tabs.length, winTabs.length)
      continue
    }

    if (maxEqualityCounter <= equalityCounter) {
      maxEqualityCounter = equalityCounter
      result = existedTabs
    }

    if (equalityCounter === tabs.length) break
  }

  return result
}

/**
 * Save tabs data
 */
export function cacheTabsData(delay = 300): void {
  // Logs.info('Tabs.cacheTabsData', delay)

  // Ignore private windows
  if (Windows.incognito) return

  if (cacheTabsDataTimeout) clearTimeout(cacheTabsDataTimeout)
  cacheTabsDataTimeout = setTimeout(() => {
    if (Tabs.tabsReinitializing) return
    // Logs.info('Tabs.cacheTabsData: Caching...')

    const data = []
    for (const tab of Tabs.list) {
      const info: TabCache = { id: tab.id, url: tab.url }
      if (tab.pinned) info.pin = true
      if (+tab.parentId > -1) info.parentId = tab.parentId
      if (tab.panelId !== NOID) info.panelId = tab.panelId
      if (tab.folded) info.folded = tab.folded
      if (tab.cookieStoreId !== CONTAINER_ID) info.ctx = tab.cookieStoreId
      if (tab.customTitle) info.customTitle = tab.customTitle
      if (tab.customColor) info.customColor = tab.customColor
      data.push(info)
    }

    // Set unique window id
    if (Windows.uniqWinId && data[0]) data[0].uniqWinId = Windows.uniqWinId

    IPC.bg('cacheTabsData', Windows.id, data)
  }, delay)
}
let cacheTabsDataTimeout: number | undefined

export function cancelCachingTabsData() {
  clearTimeout(cacheTabsDataTimeout)
}

const saveTabDataTimeouts = new Map<ID, number>()

/**
 * Save tab data to its session storage
 */
export function saveTabData(tabId: ID, forced?: boolean, delay?: number): void {
  // Logs.info('Tabs.saveTabData', tabId)
  const timeout = saveTabDataTimeouts.get(tabId)
  clearTimeout(timeout)

  if (delay) {
    saveTabDataTimeouts.set(
      tabId,
      setTimeout(() => {
        saveTabDataTimeouts.delete(tabId)
        _saveTabData(tabId, forced)
      }, delay)
    )
  } else {
    saveTabDataTimeouts.delete(tabId)
    _saveTabData(tabId, forced)
  }
}

export function cancelSavingTabData() {
  for (const [_, timeout] of saveTabDataTimeouts) {
    clearTimeout(timeout)
  }
}

function _saveTabData(tabId: ID, forced?: boolean): void {
  const tab = Tabs.byId[tabId]
  if (!tab) return

  let data = tab.sessionData
  if (data) {
    if (
      !forced &&
      data.parentId === tab.parentId &&
      data.folded === tab.folded &&
      data.panelId === tab.panelId &&
      data.customColor === tab.customColor &&
      data.customTitle === tab.customTitle
    ) {
      return
    }

    data.id = tabId
    data.panelId = tab.panelId
    data.parentId = tab.parentId
    data.folded = tab.folded
  } else {
    data = {
      id: tabId,
      panelId: tab.panelId,
      parentId: tab.parentId,
      folded: tab.folded,
    }
    tab.sessionData = data
  }

  if (tab.customTitle) data.customTitle = tab.customTitle
  else delete data.customTitle
  if (tab.customColor) data.customColor = tab.customColor
  else delete data.customColor

  // Logs.info('Tabs.saveTabData: Saving...', tabId, { ...data })
  browser.sessions.setTabValue(tabId, 'data', data).catch(err => {
    Logs.err('Tabs.saveTabData: Cannot set value in session:', err)
  })
}

let normTabsTimeout: number | undefined
/**
 * Load tabs and normalize order. (on unrecoverable situations)
 * TODO: Completely rewrite this piece of shit, with unit tests
 */
export function reinitTabs(delay = 500): void {
  if (!Tabs.tabsReinitializing) Tabs.tabsReinitializing = true
  clearTimeout(normTabsTimeout)
  normTabsTimeout = setTimeout(async () => {
    Logs.warn('Tabs.reinitTabs')

    const panelsList = []
    for (const panel of Sidebar.panels) {
      if (Utils.isTabsPanel(panel)) panelsList.push({ id: panel.id, index: -1 })
    }

    const normTabs: Tab[] = []
    const normTabsMap: Record<ID, Tab> = {}
    const nativeTabs = await browser.tabs.query({
      windowId: browser.windows.WINDOW_ID_CURRENT,
    })
    const moves: [ID, number][] = []
    let panelId: ID | undefined
    let index = 0
    let panelIndex = 0
    for (const nativeTab of nativeTabs) {
      const tab = Tabs.list.find(t => t.id === nativeTab.id)
      if (tab) {
        tab.index = index++
        tab.status = 'complete'
        tab.active = nativeTab.active
        if (nativeTab.active) Tabs.activeId = nativeTab.id

        if (!tab.pinned) {
          const panelInfo = panelsList[panelIndex]
          if (!panelInfo) {
            Logs.err('Tabs.reinitTabs: > > No panelInfo 1')
            break
          }
          if (panelInfo.id !== tab.panelId) {
            const pi = panelsList.findIndex(p => {
              if (p.index === -1) p.index = index - 1
              return p.id === tab.panelId
            })
            // Tab panel is after the current one: Switch the current panel
            if (pi > panelIndex) {
              panelIndex = pi
              const panelInfo = panelsList[panelIndex]
              if (panelInfo) panelInfo.index = index
            }
            // Tab panel is not found: Use the current panel
            else if (pi === -1) {
              tab.panelId = panelId ?? NOID
            }
            // Tab panel is before the current one
            else {
              const panelInfo = panelsList[pi]
              if (!panelInfo) return
              moves.push([tab.id, panelInfo.index])
              for (let i = pi; i < panelsList.length; i++) {
                const panelInfo = panelsList[i]
                if (!panelInfo) break
                panelInfo.index++
              }
            }
          } else {
            panelInfo.index = index
          }
        }

        normTabs.push(tab)
        normTabsMap[tab.id] = tab
        tab.reactive = Tabs.createReactiveProps(tab)
        panelId = tab.panelId
      } else {
        const tab = mutateNativeTabToSideberyTab(nativeTab)
        Tabs.reactivateTab(tab)
        normTabs.push(tab)
        if (nativeTab.active) Tabs.activeId = nativeTab.id
        normTabsMap[nativeTab.id] = tab
        index++
      }
    }

    if (moves.length && !Tabs.normTabsMoving) {
      Tabs.normTabsMoving = true
      const moving = moves.map(m => browser.tabs.move(m[0], { index: m[1] }))
      await Promise.all(moving)
      reinitTabs(0)
      return
    }

    Tabs.list = normTabs
    Tabs.byId = normTabsMap
    Sidebar.recalcTabsPanels(true)
    updateTabsTree()
    Sidebar.recalcVisibleTabs()
    if (Sidebar.reMountSidebar) Sidebar.reMountSidebar()

    Tabs.tabsReinitializing = false
    Tabs.normTabsMoving = false

    if (Settings.state.colorizeTabs) Tabs.colorizeTabs()
    if (Settings.state.colorizeTabsBranches) Tabs.colorizeBranches()

    Tabs.list.forEach(t => saveTabData(t.id))
    cacheTabsData()
  }, delay)
}

export async function sortNativeTabs() {
  const ids = Tabs.list.map(t => {
    t.moving = true
    return t.id
  })
  await Utils.GLOBAL_QUEUE.add(browser.tabs.move, ids, { index: 0 }).catch(err => {
    Logs.err('Tabs.sortNativeTabs: Cannot sort the tabs:', err)
  })
  Tabs.list.forEach(t => (t.moving = undefined))
}

export const sortNativeTabsDebounced = Utils.debounce(sortNativeTabs)

let switchTabPause: number | undefined
/**
 * Activate tab relative to current active tab.
 */
export function switchTab(globaly: boolean, cycle: boolean, step: number, pinned?: boolean): void {
  if (switchTabPause) return
  const delay = Settings.state.tabSwitchDelay ?? 0
  if (delay > 0) {
    switchTabPause = setTimeout(() => {
      clearTimeout(switchTabPause)
      switchTabPause = undefined
    }, delay)
  }

  const pinnedAndPanel = Settings.state.pinnedTabsPosition === 'panel' || (globaly && cycle)
  const visibleOnly = Settings.state.scrollThroughVisibleTabs
  const skipDiscarded = Settings.state.scrollThroughTabsSkipDiscarded

  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) return

  let targetTabId = NOID
  const index = activeTab.index
  const panelTabs = activePanel.tabs ?? []
  let t: Tab | boolean = true
  let cycled = false

  if (
    (!pinned && !globaly && activeTab.panelId !== activePanel.id) ||
    (!pinned && !pinnedAndPanel && activeTab.pinned)
  ) {
    let i = step > 0 ? 0 : panelTabs.length - 1
    let pTab: Tab | undefined = panelTabs[i]
    while (pTab) {
      pTab = panelTabs[i]
      i += step
      if (!pTab) break
      if (visibleOnly && pTab.invisible) continue
      if (skipDiscarded && pTab.discarded) continue
      targetTabId = pTab.id
      break
    }
    if (targetTabId !== NOID) {
      browser.tabs.update(targetTabId, { active: true }).catch(err => {
        Logs.err('Tabs.switchTab: Cannot activate tab (1):', err)
      })
    }
    return
  }

  for (let i = index + step; t; i += step) {
    t = Tabs.list[i]
    if (!t) {
      if (cycle && !cycled) {
        if (step > 0) i = -1
        else i = Tabs.list.length
        cycled = t = true
        continue
      } else {
        break
      }
    }

    if (visibleOnly && t.invisible) continue
    if (skipDiscarded && t.discarded) continue
    if (pinned && !t.pinned) continue
    if (!pinned && !globaly && t.panelId !== activeTab.panelId) continue
    if (!pinned && !pinnedAndPanel && t.pinned) continue
    targetTabId = t.id
    break
  }

  if (targetTabId !== NOID && targetTabId !== activeTab.id) {
    Tabs.scrollToTab(targetTabId, false)
    browser.tabs.update(targetTabId, { active: true }).catch(err => {
      Logs.err('Tabs.switchTab: Cannot activate tab (2):', err)
    })
  }
}

let switchPreselectTabPause: number | undefined
export function switchTabWithPreselect(globaly: boolean, cycle: boolean, dir: 1 | -1): void {
  if (Settings.state.scrollThroughTabsPreselDelay > 0) {
    if (switchPreselectTabPause) return
    switchPreselectTabPause = setTimeout(() => {
      clearTimeout(switchPreselectTabPause)
      switchPreselectTabPause = undefined
    }, Settings.state.scrollThroughTabsPreselDelay)
  }

  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) return

  let tabs
  if (globaly) {
    tabs = [...Tabs.list]
  } else {
    if (Settings.state.pinnedTabsPosition === 'panel') {
      tabs = [...activePanel.pinnedTabs, ...activePanel.tabs]
    } else {
      tabs = [...Tabs.pinned, ...activePanel.tabs]
    }
  }
  if (!tabs.length) return

  const selIsSet = Selection.isSet()
  const skipDiscarded = Settings.state.scrollThroughTabsSkipDiscarded
  let target: Tab | undefined

  if (Settings.state.scrollThroughTabsPreselAct && !selIsSet) {
    target = Tabs.byId[Tabs.activeId]
    const wrongPanel =
      target &&
      (!target.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
      target.panelId !== activePanel.id

    if (!target || wrongPanel) {
      target = dir > 0 ? tabs[0] : tabs[tabs.length - 1]
    }
  } else {
    let afterSel = false
    const tabFinder = (tab: Tab) => {
      if (tab.invisible) return false
      if (skipDiscarded && tab.discarded) return false
      if (afterSel) return true
      if ((selIsSet && tab.sel) || (!selIsSet && tab.active)) afterSel = true
    }
    target = dir > 0 ? tabs.find(tabFinder) : tabs.findLast(tabFinder)
  }

  if (!target) {
    const tabFinder = (tab: Tab) => !tab.invisible && (!skipDiscarded || !tab.discarded)
    if (cycle) {
      if (dir > 0) target = tabs.find(tabFinder)
      else target = tabs.findLast(tabFinder)
    } else {
      if (dir > 0) target = tabs.findLast(tabFinder)
      else target = tabs.find(tabFinder)
    }
  }
  if (!target) return

  Selection.resetSelection()
  if (
    globaly &&
    (!target.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
    target.panelId !== activePanel.id
  ) {
    Sidebar.switchToPanel(target.panelId, true, true)
  }
  Selection.selectTab(target.id)

  Tabs.activateSelectedOnMouseLeave = true

  Tabs.scrollToTab(target.id, false)
}

const RELOADING_QUEUE: Tab[] = []
const CHECK_INTERVAL = 300
const MAX_CHECK_COUNT = 35
export function reloadTabs(tabIds: ID[] = []): void {
  if (!Settings.state.tabsReloadLimit || typeof Settings.state.tabsReloadLimit !== 'number') {
    for (const id of tabIds) {
      const tab = Tabs.byId[id]
      if (tab) reloadTab(tab)
    }
    return
  }

  const tabs = []
  for (const tabId of tabIds) {
    let tab = Tabs.byId[tabId]
    if (!tab) continue

    if (!RELOADING_QUEUE.includes(tab)) {
      tab.reactive.status = TabStatus.Pending
      tab.status = 'pending'
      tab.reloadingChecks = 1
      tabs.push(tab)
    }

    if (tab.folded) {
      const parentLvl = tab.lvl
      tab = Tabs.list[tab.index + 1]
      while (tab && tab.lvl > parentLvl) {
        if (tab && !tabIds.includes(tab.id)) {
          if (RELOADING_QUEUE.includes(tab)) continue
          tab.reactive.status = TabStatus.Pending
          tab.status = 'pending'
          tab.reloadingChecks = 1
          tabs.push(tab)
        }
        tab = Tabs.list[tab.index + 1]
      }
    }
  }

  if (RELOADING_QUEUE.length > 0) {
    const hm = tabs.splice(0, Settings.state.tabsReloadLimit)
    hm.forEach(tab => reloadTab(tab))
    RELOADING_QUEUE.push(...tabs)
    return
  }

  let progressNotification: Notification
  if (Settings.state.tabsReloadLimitNotif && tabs.length > Settings.state.tabsReloadLimit) {
    progressNotification = Notifications.progress({
      icon: '#icon_reload',
      title: translate('notif.tabs_reloading'),
      ctrl: translate('notif.tabs_reloading_stop'),
      callback: () => stopReloading(),
    })
  }

  const reloadingTabs = tabs.splice(0, Settings.state.tabsReloadLimit)
  reloadingTabs.forEach(tab => reloadTab(tab))

  RELOADING_QUEUE.push(...tabs)
  if (RELOADING_QUEUE.length) {
    const interval = setInterval(() => {
      if (!RELOADING_QUEUE.length) {
        if (progressNotification) Notifications.finishProgress(progressNotification)
        return clearInterval(interval)
      }

      const loading = reloadingTabs.filter(tab => {
        if (tab.reloadingChecks === undefined) return false
        return tab && tab.reloadingChecks++ <= MAX_CHECK_COUNT && tab.status === 'loading'
      })

      for (let i = Settings.state.tabsReloadLimit - loading.length; i-- > 0; ) {
        const nextTab = RELOADING_QUEUE.shift()
        if (!nextTab) break
        reloadingTabs.push(nextTab)
        reloadTab(nextTab)
      }

      if (progressNotification) {
        const all = RELOADING_QUEUE.length + reloadingTabs.length
        Notifications.updateProgress(progressNotification, all - RELOADING_QUEUE.length, all)
      }
    }, CHECK_INTERVAL)
  }
}

function stopReloading(): void {
  while (RELOADING_QUEUE.length) {
    const tab = RELOADING_QUEUE.pop()
    if (tab && tab.status === 'pending') {
      tab.reactive.status = TabStatus.Complete
      tab.status = 'complete'
    }
  }
}

/**
 * Reload tab
 */
export function reloadTab(tab: Tab): void {
  if (!tab) return
  if (tab.url === 'about:blank' && URL_WITHOUT_PROTOCOL_RE.test(tab.title)) {
    browser.tabs.update(tab.id, { url: 'https://' + tab.title }).catch(err => {
      Logs.err('Tabs.reloadTab: Cannot set url:', err)
    })
    return
  }
  if (tab.url.startsWith('about:') && tab.status === 'loading') return
  browser.tabs.reload(tab.id).catch(err => {
    Logs.err('Tabs.reloadTab: Cannot reload:', err)
  })
}

/**
 * Discard tabs
 */
export async function discardTabs(tabIds: ID[] = []): Promise<void> {
  // Skip pinned tabs
  if (Settings.state.pinnedNoUnload) {
    tabIds = tabIds.filter(id => {
      const tab = Tabs.byId[id]
      if (!tab || tab.pinned) return false
      return true
    })
  }

  // Update succession for active tab to prevent switching to discarded tabs
  let activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab) {
    const target = findSuccessorTab(activeTab, tabIds)

    if (target) {
      // If active tab will be discraded activate another
      if (tabIds.includes(Tabs.activeId)) {
        await browser.tabs.update(target.id, { active: true })
        activeTab = target
      } else if (activeTab.successorTabId !== target.id) {
        browser.tabs.moveInSuccession([activeTab.id], target.id).catch(err => {
          Logs.err('Tabs.discardTabs: Cannot update succession:', err)
        })
        activeTab.successorTabId = target.id
      }
    }
  }

  // Reset highlighing of the native tabs.
  // This is a workaround for the issue when Firefox doesn't update the highlighting
  // for the already hidden tabs. Not sure if this is a bug or norm though.
  if (Settings.state.nativeHighlight && Settings.state.hideUnloadedTabs && activeTab) {
    browser.tabs
      .highlight({ windowId: Windows.id, populate: false, tabs: [activeTab.index] })
      .catch(() => {})
  }

  // Try to discard tabs
  await browser.tabs.discard(tabIds).catch(err => {
    Logs.err('Tabs.discardTabs: Cannot discard:', err)
  })

  // Find not discarded tabs that might prevent their closing
  const secondTryIds = tabIds.filter(id => {
    const tab = Tabs.byId[id]
    return tab && !tab.discarded && tab.url.startsWith('h')
  })

  // Try to reset closing prevention and discard such tabs
  if (Settings.state.forceDiscard && Permissions.allUrls && secondTryIds.length) {
    const forceDiscardInjection =
      'window.onbeforeunload=null;window.addEventListener("beforeunload", e => {e.returnValue=""})'
    await Promise.allSettled(
      secondTryIds.map(id => {
        return browser.tabs.executeScript(id, {
          code: forceDiscardInjection,
          runAt: 'document_start',
          allFrames: true,
        })
      })
    )

    // Second try
    await browser.tabs.discard(secondTryIds).catch(err => {
      Logs.err('Tabs.discardTabs: Cannot discard (second try):', err)
    })
  }
}

/**
 * Try to activate last active tab on the panel
 */
export function activateLastActiveTabOf(panelId: ID) {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const panelTabs = panel.tabs ?? []
  if (!panelTabs.length) return

  const p = getActiveTabsHistory(panel?.id)
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab && activeTab.panelId === p.id) return

  let tab
  if (p.actTabs && p.actTabs.length) {
    let index: number
    if (p.actTabOffset >= 0 && p.actTabOffset < p.actTabs.length) index = p.actTabOffset
    else index = p.actTabs.length - 1

    const tabId = p.actTabs[index]
    tab = Tabs.byId[tabId]
  }
  if (!tab || tab.panelId !== p.id) tab = panelTabs[0]
  if (tab && tab.discarded && Settings.state.activateLastTabOnPanelSwitchingLoadedOnly) {
    tab = panelTabs.find(t => !t.discarded)
  }
  if (tab) {
    return browser.tabs.update(tab.id, { active: true }).catch(err => {
      Logs.err('Tabs.activateLastActiveTabOf: Cannot activate tab:', err)
    })
  }
}

/**
 * (un)Pin tabs
 */
export function pinTabs(tabIds: ID[]): void {
  Tabs.sortTabIds(tabIds)
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < Tabs.list.length; i++) {
      const child = Tabs.list[i]
      if (child.lvl <= tab.lvl) break
      if (child.parentId === tab.id) child.parentId = tab.parentId
    }
    browser.tabs.update(tabId, { pinned: true }).catch(err => {
      Logs.err('Tabs.pinTabs: Cannot pin tab:', err)
    })
  }
}
export function unpinTabs(tabIds: ID[]): void {
  Tabs.sortTabIds(tabIds, true)
  for (const tabId of tabIds) {
    browser.tabs.update(tabId, { pinned: false }).catch(err => {
      Logs.err('Tabs.unpinTabs: Cannot unpin tab:', err)
    })
  }
}
export function repinTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < Tabs.list.length; i++) {
      const child = Tabs.list[i]
      if (child.lvl <= tab.lvl) break
      if (child.parentId === tab.id) child.parentId = tab.parentId
    }
    browser.tabs.update(tabId, { pinned: !tab.pinned }).catch(err => {
      Logs.err('Tabs.repinTabs: Cannot repin tab:', err)
    })
  }
}

/**
 * Duplicate tabs
 */
export async function duplicateTabs(tabIds: ID[], asChild?: boolean): Promise<void> {
  let active = tabIds.length === 1

  // Sort tab ids
  Tabs.sortTabIds(tabIds)

  const processed: ID[] = []

  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue

    if (processed.includes(tab.id)) continue
    else processed.push(tab.id)

    const descendantsToDuplicate: [ID, ID][] = []
    let index = tab.index + 1
    let dstPanelId = tab.panelId
    if (tab.pinned) {
      let panel
      if (Settings.state.pinnedTabsPosition === 'panel') {
        panel = Sidebar.panelsById[tab.panelId]
        if (!Utils.isTabsPanel(panel)) return
      } else {
        panel = Sidebar.panelsById[Sidebar.activePanelId]
        if (!Utils.isTabsPanel(panel)) panel = Sidebar.panels.find(p => Utils.isTabsPanel(p))
        if (!Utils.isTabsPanel(panel)) return
      }
      dstPanelId = panel.id
      if (Settings.state.moveNewTabPin === 'start') index = panel.startTabIndex
      else if (Settings.state.moveNewTabPin === 'end') index = panel.nextTabIndex
      if (index < 0) {
        dstPanelId = NOID
        index = Tabs.list.length
      }
    } else {
      for (let t; index < Tabs.list.length; index++) {
        t = Tabs.list[index]
        if (t.lvl <= tab.lvl) break

        if (tabIds.includes(t.id)) {
          const dupAncestorId = Tabs.findAncestorId(t.id, id => tabIds.includes(id))
          if (dupAncestorId !== undefined) {
            descendantsToDuplicate.push([t.id, dupAncestorId])
            processed.push(t.id)
          }
        }
      }
    }

    const oldNewIds: Record<ID, ID> = {}
    Tabs.setNewTabPosition(index, asChild ? tab.id : tab.parentId, dstPanelId)
    if (active && tab.discarded) active = false
    const dupTab = await browser.tabs.duplicate(tabId, { active, index })
    oldNewIds[tabId] = dupTab.id

    for (const [descendantTabId, descendantParentId] of descendantsToDuplicate) {
      index++
      const dupDescendantParentId = oldNewIds[descendantParentId]
      Tabs.setNewTabPosition(index, dupDescendantParentId, dstPanelId)
      const dupOpts = { active: false, index }
      const dupDescendantTab = await browser.tabs.duplicate(descendantTabId, dupOpts)
      oldNewIds[descendantTabId] = dupDescendantTab.id
    }
  }
}

export function findAncestorId(tabId: ID, cb: (ancestorId: ID) => boolean): ID | void {
  const tab = Tabs.byId[tabId]
  if (!tab) throw 'Tabs.getAncestors: No target tab'

  let parent = Tabs.byId[tab.parentId]
  while (parent) {
    if (cb(parent.id)) return parent.id
    parent = Tabs.byId[parent.parentId]
  }
}

/**
 * Close tabs duplicates
 */
export function dedupeTabs(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

  const urls: string[] = []
  const toRemove = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) return

    if (urls.includes(tab.url)) toRemove.push(tab.id)
    else urls.push(tab.url)
  }

  Tabs.removeTabs(toRemove)
}

/**
 * Create bookmarks from tabs
 */
export async function bookmarkTabs(tabIds: ID[]): Promise<void> {
  if (!Permissions.reactive.bookmarks) {
    const result = await Permissions.request('bookmarks')
    if (!result) return
  }

  let parentId: ID | undefined = BKM_OTHER_ID

  const tabs: Tab[] = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab) tabs.push(tab)
  }
  if (!tabs.length) return

  const panelId = tabs[0].panelId
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const hasDefaultFolder =
    panel.bookmarksFolderId !== NOID && panel.bookmarksFolderId !== BKM_ROOT_ID
  if (hasDefaultFolder) parentId = panel.bookmarksFolderId

  if (tabs.length === 1 && Settings.state.askNewBookmarkPlace) {
    const tab = tabs[0]
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.save_in_bookmarks'),
      name: tab.customTitle ?? tab.title,
      nameField: true,
      url: tab.url,
      urlField: true,
      location: parentId,
      locationField: true,
      recentLocations: true,
      recentLocationAsDefault: !hasDefaultFolder,
      controls: [{ label: 'btn.save' }],
      validate: popupState => {
        popupState.nameValid = !!popupState.name
        popupState.urlValid = !!popupState.url

        const ctrl = popupState.controls?.[0]
        if (ctrl) {
          if (!popupState.nameValid || !popupState.urlValid) ctrl.inactive = true
          else ctrl.inactive = false
        }
      },
    })

    if (result) {
      parentId = result.location ?? BKM_OTHER_ID
      if (parentId === NOID) parentId = BKM_OTHER_ID

      const info = {
        id: tab.id,
        title: result.name,
        container: tab.cookieStoreId,
        customColor: tab.customColor,
        customTitle: tab.customTitle,
      }
      Bookmarks.attachTabInfoToTitle(info)

      await browser.bookmarks.create({
        parentId,
        type: 'bookmark',
        title: info.title,
        url: result.url,
      })
    }
  } else {
    if (Settings.state.askNewBookmarkPlace) {
      const result = await Bookmarks.openBookmarksPopup({
        title: translate('popup.bookmarks.save_in_bookmarks'),
        location: parentId,
        locationField: true,
        locationTree: false,
        recentLocations: true,
        recentLocationAsDefault: !hasDefaultFolder,
        controls: [{ label: 'btn.save' }],
      })
      if (!result) return
      if (result.location) parentId = result.location
    }

    tabs.sort((a, b) => a.index - b.index)
    const items: ItemInfo[] = tabs.map(t => ({
      id: t.id,
      parentId: t.parentId,
      url: t.url,
      title: t.customTitle ?? t.title,
      container: t.cookieStoreId,
      customColor: t.customColor,
      customTitle: t.customTitle,
    }))
    await Bookmarks.createFrom(items, { parentId })
  }

  // Show notification for silent bookmarks creation
  if (!Settings.state.askNewBookmarkPlace) {
    const parentName = Bookmarks.reactive.byId[parentId]?.title
    Notifications.notify({
      icon: '#icon_bookmarks',
      title: translate('notif.new_bookmark'),
      details: parentName ? `Folder: ${parentName}` : undefined,
    })
  }
}

/**
 * Clear all cookies of tab urls
 */
export async function clearTabsCookies(tabIds: ID[]): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue

    const url = new URL(tab.url)
    const domain = url.hostname.split('.').slice(-2).join('.')

    if (!domain) {
      Notifications.notify({
        lvl: 'err',
        icon: '#icon_cookie',
        title: translate('notif.cc.err'),
        details: `${translate('notif.cc.err_url')}"${decodeURI(tab.url)}"`,
      })
      continue
    }

    tab.reactive.status = TabStatus.Loading

    const cookies = await browser.cookies.getAll({
      domain: domain,
      storeId: tab.cookieStoreId,
    })
    const fpcookies = await browser.cookies.getAll({
      firstPartyDomain: domain,
      storeId: tab.cookieStoreId,
    })

    const clearing = cookies.concat(fpcookies).map(c => {
      return browser.cookies.remove({
        storeId: tab.cookieStoreId,
        url: tab.url,
        name: c.name,
      })
    })

    Promise.all(clearing)
      .then(() => {
        Notifications.notify({
          icon: '#icon_cookie',
          title: translate('notif.cc.ok'),
          details: domain,
        })
        tab.reactive.status = Tabs.getStatus(tab)
      })
      .catch(() => {
        Notifications.notify({
          lvl: 'err',
          icon: '#icon_cookie',
          title: translate('notif.cc.err'),
          details: domain,
        })
        tab.reactive.status = Tabs.getStatus(tab)
      })
  }
}

export function sortTabIds(tabIds: ID[], reverse?: boolean): void {
  tabIds.sort((a, b) => {
    const aTab = Tabs.byId[a]
    const bTab = Tabs.byId[b]
    if (!aTab || !bTab) return 0
    if (reverse) return bTab.index - aTab.index
    else return aTab.index - bTab.index
  })
}

/**
 * Update tabs visibility
 */
export function updateNativeTabsVisibility(): void {
  const hideFolded = Settings.state.hideFoldedTabs
  const hideFoldedParent = hideFolded && Settings.state.hideFoldedParent === 'any'
  const hideFoldedGroup = hideFolded && Settings.state.hideFoldedParent === 'group'
  const hideUnloaded = Settings.state.hideUnloadedTabs
  const hideInact = Settings.state.hideInact

  if (!browser.tabs.hide) return

  const actTab = Tabs.byId[Tabs.activeId]

  let actPanel
  if (actTab?.pinned) actPanel = Sidebar.panelsById[Sidebar.activePanelId]
  else if (actTab) actPanel = Sidebar.panelsById[actTab.panelId]

  const toShow = []
  const toHide = []
  for (const tab of Tabs.list) {
    if (tab.pinned) continue

    if (hideFolded && tab.invisible) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (tab.folded && !tab.active && (hideFoldedParent || (hideFoldedGroup && tab.isGroup))) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (Utils.isTabsPanel(actPanel) && hideInact && tab.panelId !== actPanel.id) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (hideUnloaded && tab.discarded) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (tab.hidden) toShow.push(tab.id)
  }

  if (toShow.length) browser.tabs.show(toShow)
  if (toHide.length) browser.tabs.hide(toHide)
}

/**
 * Returns length of tabs branch
 */
export function getBranchLen(id: ID): number | undefined {
  const tab = Tabs.byId[id]
  if (!tab) return

  let count = 0
  const tabsLen = Tabs.list.length
  for (let i = tab.index + 1; i < tabsLen; i++) {
    if (Tabs.list[i].lvl <= tab.lvl) break
    count++
  }

  return count
}

/**
 * Recalc length of branch
 */
export function recalcBranchLen(id: ID): void {
  const branchLen = Tabs.getBranchLen(id)
  if (branchLen === undefined) return

  const tab = Tabs.byId[id]
  if (!tab) return

  tab.reactive.branchLen = branchLen
}

export function autoDiscardFolded(rootTab: Tab) {
  if (!Settings.state.discardFolded) return

  if (Settings.state.discardFoldedDelay === 0) {
    const childIds = Tabs.getBranch(rootTab, false).map(t => t.id)
    if (!childIds.length) return

    browser.tabs.discard(childIds)
  } else {
    let delayMS = Settings.state.discardFoldedDelay
    if (Settings.state.discardFoldedDelayUnit === 'sec') delayMS *= 1000
    if (Settings.state.discardFoldedDelayUnit === 'min') delayMS *= 60000

    clearTimeout(rootTab.autoUnloadFoldedTimeout)
    rootTab.autoUnloadFoldedTimeout = setTimeout(() => {
      const parentTab = Tabs.byId[rootTab.id]
      if (parentTab?.isParent && parentTab.folded) {
        const childIds = Tabs.getBranch(rootTab, false).map(t => t.id)
        if (!childIds.length) return

        browser.tabs.discard(childIds)
      }
    }, delayMS)
  }
}

/**
 * Hide children of tab
 */
export function foldTabsBranch(rootTabId: ID): void {
  const toHide: ID[] = []
  const rootTab = Tabs.byId[rootTabId]
  if (!rootTab) return

  const panel = Sidebar.panelsById[rootTab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  const hideFolded = Settings.state.hideFoldedTabs
  const hideFoldedParent = hideFolded && Settings.state.hideFoldedParent === 'any'
  const hideFoldedGroup = hideFolded && Settings.state.hideFoldedParent === 'group'

  rootTab.folded = true
  rootTab.reactive.folded = true

  let len = 0
  for (let i = rootTab.index + 1; i < Tabs.list.length; i++) {
    const t = Tabs.list[i]
    if (t.lvl <= rootTab.lvl) break
    if (t.active) browser.tabs.update(rootTabId, { active: true })
    if (!t.invisible) {
      t.invisible = true
      toHide.push(t.id)
    }
    len++
  }

  Sidebar.recalcVisibleTabs(rootTab.panelId)

  rootTab.reactive.branchLen = len
  Tabs.incrementScrollRetainer(panel, len)

  if (Settings.state.discardFolded) {
    Tabs.autoDiscardFolded(rootTab)
  }

  if (hideFolded && toHide.length) {
    browser.tabs.hide?.(toHide).catch(err => {
      Logs.err('Tabs.foldTabsBranch: Cannot hide tabs:', err)
    })
  }

  // Hide parent tab if it isn't active
  if (!rootTab.active && (hideFoldedParent || (hideFoldedGroup && rootTab.isGroup))) {
    browser.tabs.hide?.(rootTabId).catch(err => {
      Logs.err('Tabs.foldTabsBranch: Cannot hide parent tab:', err)
    })
  }

  // Update succession
  if (rootTab.active) Tabs.updateSuccessionDebounced(0)

  saveTabData(rootTabId)
  cacheTabsData()
}

/**
 * Show children of tab
 */
export function expTabsBranch(rootTabId: ID, noRecursive?: boolean, noAutoFold?: boolean): void {
  const autoFoldTabs = Settings.state.autoFoldTabs && !noAutoFold
  const hideFolded = Settings.state.hideFoldedTabs
  const hideFoldedParent = hideFolded && Settings.state.hideFoldedParent === 'any'
  const hideFoldedGroup = hideFolded && Settings.state.hideFoldedParent === 'group'
  const hideUnloaded = Settings.state.hideUnloadedTabs
  const preserve: ID[] = []
  let toShow: ID[] = []
  let autoFold: Tab[] = []

  const rootTab = Tabs.byId[rootTabId]
  if (!rootTab) return

  const panel = Sidebar.panelsById[rootTab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  rootTab.lastExpanded = Date.now()
  if (rootTab.invisible && !noRecursive) expTabsBranch(rootTab.parentId)

  let count = 0
  for (const tab of Tabs.list) {
    if (tab.pinned || tab.panelId !== tab.panelId) continue
    if (
      autoFoldTabs &&
      tab.id !== rootTabId &&
      tab.isParent &&
      !tab.folded &&
      tab.lvl === rootTab.lvl
    ) {
      autoFold.push(tab)
    }
    if (tab.id === rootTabId) {
      tab.reactive.folded = tab.folded = false
    }
    if (tab.id !== rootTabId && tab.folded) preserve.push(tab.id)
    if (tab.parentId === rootTabId || toShow.includes(tab.parentId)) {
      if (tab.invisible && (tab.parentId === rootTabId || !preserve.includes(tab.parentId))) {
        tab.invisible = false
        count++

        // Don't show sub-parent tabs if they're folded
        const leaveHidden =
          tab.folded && !tab.active && (hideFoldedParent || (hideFoldedGroup && tab.isGroup))

        if (!leaveHidden) toShow.push(tab.id)
      }
    }
  }

  if (!rootTab.invisible) Sidebar.recalcVisibleTabs(rootTab.panelId)
  if (!rootTab.invisible && count) Tabs.decrementScrollRetainer(panel, count)

  // Auto fold
  if (Settings.state.autoFoldTabs) {
    autoFold.sort((a, b) => {
      let aMax = a.lastAccessed
      let bMax = b.lastAccessed
      if (a.childLastAccessed) aMax = Math.max(a.lastAccessed, a.childLastAccessed)
      if (a.lastExpanded) aMax = Math.max(aMax, a.lastExpanded)
      if (b.childLastAccessed) bMax = Math.max(b.lastAccessed, b.childLastAccessed)
      if (b.lastExpanded) bMax = Math.max(bMax, b.lastExpanded)
      return aMax - bMax
    })

    if (Settings.state.autoFoldTabsExcept !== 'none') {
      autoFold = autoFold.slice(0, -Settings.state.autoFoldTabsExcept)
    }
    for (const t of autoFold) {
      foldTabsBranch(t.id)
    }
  }

  // Show the parent tab when expanding the group
  if (hideFolded && (hideFoldedParent || (hideFoldedGroup && rootTab.isGroup))) {
    toShow.unshift(rootTabId)
  }

  if (hideFolded && toShow.length) {
    // Skip unloaded tabs if needed
    if (hideUnloaded) toShow = toShow.filter(id => !Tabs.byId[id]?.discarded)

    browser.tabs.show?.(toShow).catch(err => {
      Logs.err('Tabs.expTabsBranch: Cannot show tabs:', err)
    })
  }

  // Update succession
  if (rootTab.active) Tabs.updateSuccessionDebounced(0)

  saveTabData(rootTabId)
  cacheTabsData()
}

/**
 * Toggle tabs branch visability (fold/expand)
 */
export function toggleBranch(tabId?: ID): void {
  if (!Settings.state.tabsTree) return
  if (tabId === undefined) return

  let tab = Tabs.byId[tabId]
  if (!tab) tab = Tabs.byId[Tabs.activeId]
  if (tab && !tab.isParent && +tab.parentId > -1) tab = Tabs.byId[tab.parentId]
  if (!tab) return

  if (tab.folded) expTabsBranch(tabId)
  else foldTabsBranch(tabId)
}

/**
 * Collaplse all inactive branches.
 */
export function foldAllInactiveBranches(tabs: Tab[] = []): void {
  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) return

  const activeBranch: ID[] = [activeTab.id]
  let parent = Tabs.byId[activeTab.parentId]
  while (parent) {
    activeBranch.push(parent.id)
    parent = Tabs.byId[parent.parentId]
  }

  for (let tab, i = tabs.length; i--; ) {
    tab = tabs[i]
    if (tab.isParent && !tab.folded && !activeBranch.includes(tab.id)) {
      foldTabsBranch(tab.id)
    }
  }
}

export function activateParent(tabId?: ID): void {
  if (!Settings.state.tabsTree) return
  if (tabId === undefined) tabId = Tabs.activeId
  const tab = Tabs.byId[tabId]
  if (tab && Tabs.byId[tab.parentId]) browser.tabs.update(tab.parentId, { active: true })
}

/**
 * Flatten tabs tree
 */
export function flattenTabs(tabIds: ID[]): void {
  // Sort ids
  sortTabIds(tabIds)

  // Flatten branch if selected only one non-parent tab
  if (tabIds.length === 1) {
    const tab = Tabs.byId[tabIds[0]]
    if (tab && !tab.isParent && tab.lvl > 0) {
      const parentTab = Tabs.byId[tab.parentId]
      if (parentTab) tabIds.unshift(parentTab.id)
    }
  }

  // Gather children
  let minLvlTab = { lvl: 999 } as Tab
  const idsToFlatten: ID[] = []
  const tabsToFlatten: Tab[] = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab) {
      idsToFlatten.push(id)
      tabsToFlatten.push(tab)
    }
  }
  for (const tab of Tabs.list) {
    if (tab.hidden) continue
    if (idsToFlatten.includes(tab.id) && tab.lvl < minLvlTab.lvl) minLvlTab = tab
    if (idsToFlatten.includes(tab.parentId)) {
      if (!idsToFlatten.includes(tab.id)) {
        idsToFlatten.push(tab.id)
        tabsToFlatten.push(tab)
      }
      if (tab.lvl < minLvlTab.lvl) minLvlTab = tab
    }
  }

  if (!minLvlTab.parentId) return

  let updVisPanelId: ID | undefined = NOID
  for (const tab of tabsToFlatten) {
    tab.reactive.lvl = tab.lvl = minLvlTab.lvl
    tab.parentId = minLvlTab.parentId
    if (tab.invisible) {
      tab.invisible = false

      if (updVisPanelId === NOID) updVisPanelId = tab.panelId
      else if (updVisPanelId && updVisPanelId !== tab.panelId) updVisPanelId = undefined
    }
    if (tab.parentId === -1) browser.tabs.update(tab.id, { openerTabId: tab.id })
  }

  updateTabsTree(tabsToFlatten[0].index - 1, tabsToFlatten[tabsToFlatten.length - 1].index + 1)

  if (updVisPanelId !== NOID) {
    Sidebar.recalcVisibleTabs(updVisPanelId)
  }

  tabsToFlatten.forEach(t => saveTabData(t.id))
  cacheTabsData()
}

/**
 * Calculates tree props
 *
 * - startIndex (inclusive)
 * - endIndex (exclusive)
 */
export function updateTabsTree(startIndex = 0, endIndex = -1): void {
  if (!Settings.state.tabsTree) return
  if (!Tabs.list || !Tabs.list.length) return
  if (startIndex < 0) startIndex = 0
  if (endIndex === -1) endIndex = Tabs.list.length
  const maxLvl =
    typeof Settings.state.tabsTreeLimit === 'number' ? Settings.state.tabsTreeLimit : 123

  // Reset parent-flags of the last tab
  if (Tabs.list[endIndex - 1]) {
    const tab = Tabs.list[endIndex - 1]
    if (tab) {
      tab.reactive.isParent = tab.isParent = false
      tab.reactive.folded = tab.folded = false
    }
  }

  let foldedBranchLenCount = 0
  let foldedBranchLvl = -1
  let foldedBranchRoot: Tab | undefined

  for (let prevTab, tab, i = startIndex; i < endIndex; i++) {
    tab = Tabs.list[i]
    if (!tab) return Logs.err('Tabs.updateTabsTree: Cannot get tab')

    if (tab.pinned) {
      tab.parentId = -1
      tab.reactive.lvl = tab.lvl = 0
      tab.invisible = false
      tab.reactive.isParent = tab.isParent = false
      tab.reactive.folded = tab.folded = false
      continue
    }
    prevTab = Tabs.list[i - 1]

    let parent = Tabs.byId[tab.parentId]
    if (parent && (parent.pinned || parent.index >= tab.index)) {
      parent = undefined
    }

    // Parent is defined
    if (parent && !parent.pinned && parent.panelId === tab.panelId) {
      if (parent.lvl === maxLvl) {
        parent.reactive.isParent = parent.isParent = false
        parent.reactive.folded = parent.folded = false
        tab.parentId = parent.parentId
        tab.reactive.lvl = tab.lvl = parent.lvl
        tab.invisible = parent.invisible
      } else {
        parent.reactive.isParent = parent.isParent = true
        tab.reactive.lvl = tab.lvl = parent.lvl + 1
        tab.invisible = parent.folded || parent.invisible
      }

      // if prev tab is not parent and with smaller lvl
      // go back and set lvl and parentId
      if (prevTab && prevTab.id !== tab.parentId && prevTab.lvl < tab.lvl) {
        for (let j = tab.index; j--; ) {
          const backTab = Tabs.list[j]
          if (backTab.id === parent.id) break
          if (backTab.panelId !== tab.panelId) break
          if (parent.lvl === maxLvl) {
            backTab.parentId = parent.parentId
            backTab.reactive.isParent = backTab.isParent = false
            backTab.reactive.folded = backTab.folded = false
          } else {
            backTab.parentId = parent.id
          }
          backTab.reactive.lvl = backTab.lvl = tab.lvl
          backTab.invisible = tab.invisible
        }
      }
    } else {
      tab.parentId = -1
      tab.reactive.lvl = tab.lvl = 0
      tab.invisible = false
    }

    // Reset parent-flags of prev tab if current tab have same lvl
    if (prevTab && prevTab.lvl >= tab.lvl) {
      prevTab.reactive.isParent = prevTab.isParent = false
      prevTab.reactive.folded = prevTab.folded = false
    }

    // Update openerTabId
    if (tab.parentId === -1 && tab.openerTabId !== undefined) {
      browser.tabs.update(tab.id, { openerTabId: tab.id }).catch(err => {
        Logs.err('Tabs.updateTabsTree: Cannot reset openerTabId:', err)
      })
      tab.openerTabId = undefined
    }
    if (tab.parentId !== -1 && tab.openerTabId !== tab.parentId) {
      browser.tabs.update(tab.id, { openerTabId: tab.parentId }).catch(err => {
        Logs.err('Tabs.updateTabsTree: Cannot set openerTabId:', err)
      })
      tab.openerTabId = tab.parentId
    }

    // Calc folded visible branch length
    if (foldedBranchLvl > -1) {
      if (tab.lvl <= foldedBranchLvl && foldedBranchRoot) {
        foldedBranchRoot.reactive.branchLen = foldedBranchLenCount
        foldedBranchLvl = -1
        foldedBranchLenCount = 0
        foldedBranchRoot = undefined
      } else {
        foldedBranchLenCount++
      }
    }
    if (tab.folded && !tab.invisible && foldedBranchLvl === -1) {
      foldedBranchLvl = tab.lvl
      foldedBranchRoot = tab
    }
  }

  // Calc last folded branch length
  if (foldedBranchLvl > -1 && foldedBranchRoot) {
    foldedBranchRoot.reactive.branchLen = foldedBranchLenCount
  }
}

/**
 * Find tab with given properties and return it
 */
export function queryTab(props: Partial<Tab>): Tab | null {
  const tab = Tabs.list.find(t => {
    return Object.keys(props).every(((p: keyof Tab) => t[p] === props[p]) as (p: string) => boolean)
  })
  if (tab) return Utils.cloneObject(tab)
  else return null
}

export function getTabs(tabIds?: ID[]): Tab[] | undefined {
  const tabs = tabIds ? Tabs.list.filter(t => tabIds.includes(t.id)) : Tabs.list
  if (tabs.length) return Utils.cloneArray(tabs)
}

export function getTabsTreeData(): TabsTreeData {
  const tree: TabsTreeData = []
  let prevPanelId = NOID
  for (const tab of Tabs.list) {
    const data: TabTreeData = { id: tab.id }

    if (tab.panelId !== NOID) {
      if (tab.panelId === prevPanelId) data.pid = SAMEID
      else data.pid = tab.panelId
    }
    if (tab.parentId !== NOID) data.tid = tab.parentId
    if (tab.isParent && tab.folded) data.f = 1
    if (tab.customTitle) data.ct = tab.customTitle
    if (tab.customColor) data.cc = tab.customColor

    prevPanelId = tab.panelId

    tree.push(data)
  }
  return tree
}

/**
 * Update indexes of tabs
 */
export function updateTabsIndexes(fromIndex = 0, toIndex = -1): void {
  const tabs = Tabs.list
  if (toIndex === -1) toIndex = tabs.length
  for (let t, i = fromIndex; i < toIndex; i++) {
    t = tabs[i]
    if (t && t.index !== i) t.index = i
  }
}

const enum SuccessorSearchMode {
  InBranchTick = 1,
  InBranchTack = 11,
  InPanelTick = 2,
  InPanelTack = 22,
  GlobalTick = 3,
  GlobalTack = 33,
}
/**
 * Find successor tab (tab that will be activated
 * after removing currenly active tab)
 */
export function findSuccessorTab(tab: Tab, exclude?: readonly ID[]): Tab | undefined {
  // Logs.info('Tabs.findSuccessorTab', tab.id, exclude)
  let target
  const tree = Settings.state.tabsTree
  const skipFolded = Settings.state.activateAfterClosingNoFolded
  const skipDiscarded = Settings.state.activateAfterClosingNoDiscarded
  const dirNext = Settings.activateAfterClosingNext
  const dirPrev = Settings.activateAfterClosingPrev
  const stayInPanel = Settings.state.activateAfterClosingStayInPanel

  if (tab.pinned && (dirNext || dirPrev)) {
    let discardedFallback: Tab | undefined
    const pinInPanels = Settings.state.pinnedTabsPosition === 'panel'
    const dirDir = dirNext ? 1 : -1
    const opDir = dirDir * -1
    if (Tabs.byId[tab.relGroupId]) {
      target = Tabs.byId[tab.relGroupId]
      if (exclude && target && exclude.includes(target.id)) {
        target = undefined
      }
    }
    // Search in pinned tabs after active
    if (!target) {
      for (let foundTab, i = tab.index + dirDir; (foundTab = Tabs.list[i]); i += dirDir) {
        if (!foundTab?.pinned) break
        if (foundTab.removing) continue
        if (exclude && exclude.includes(foundTab.id)) continue

        // Skip discarded tab
        if (skipDiscarded && foundTab.discarded) {
          if (!discardedFallback) discardedFallback = foundTab
          continue
        }

        if (foundTab.panelId === tab.panelId || !pinInPanels) target = foundTab
      }
    }
    // Search in pinned tabs before active
    if (!target) {
      for (let foundTab, i = tab.index + opDir; (foundTab = Tabs.list[i]); i += opDir) {
        if (!foundTab?.pinned) break
        if (foundTab.removing) continue
        if (exclude && exclude.includes(foundTab.id)) continue

        // Skip discarded tab
        if (skipDiscarded && foundTab.discarded) {
          if (!discardedFallback) discardedFallback = foundTab
          continue
        }

        if (foundTab.panelId === tab.panelId || !pinInPanels) target = foundTab
      }
    }
    // Search in current panel
    if (!target) {
      let panel
      if (pinInPanels) panel = Sidebar.panelsById[tab.panelId]
      else panel = Sidebar.panelsById[Sidebar.activePanelId]
      if (Utils.isTabsPanel(panel)) {
        for (const t of panel.tabs) {
          if (t.removing) continue
          if (exclude && exclude.includes(t.id)) continue

          // Skip discarded tab
          if (skipDiscarded && t.discarded) {
            if (!discardedFallback) discardedFallback = t
            continue
          }

          target = t
          break
        }
      }
    }
    // Check the last active tab of the previous active tabs panel
    if (!target) {
      const prevTabsPanelHistory = Tabs.getActiveTabsHistory(Sidebar.prevTabsPanelId)
      if (prevTabsPanelHistory?.actTabs.length) {
        const panelId = Sidebar.prevTabsPanelId
        const actTabs = prevTabsPanelHistory.actTabs
        const prevActTab = Tabs.byId[actTabs[actTabs.length - 1]]
        if (prevActTab && prevActTab.panelId === panelId && !prevActTab.discarded) {
          if (!exclude || !exclude.includes(prevActTab.id)) return prevActTab
        }
      }
    }
    // Search in global scope
    if (!target) {
      for (const t of Tabs.list) {
        if (t.removing) continue
        if (exclude && exclude.includes(t.id)) continue

        // Skip discarded tab
        if (skipDiscarded && t.discarded) {
          if (!discardedFallback) discardedFallback = t
          continue
        }

        target = t
        break
      }
    }

    if (exclude && target && exclude.includes(target.id)) return discardedFallback

    return target ?? discardedFallback
  }

  // If group tab linked with pinned tab switch to that pinned tab
  if (tab.isGroup) {
    const urlInfo = new URL(tab.url)
    const pin = urlInfo.searchParams.get('pin')
    if (pin) {
      const [containerId, url] = pin.split('::')
      target = Tabs.pinned.find(t => t.cookieStoreId === containerId && t.url === url)
      if (target) return target
    }
  }

  const panel = Sidebar.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  let dir: 1 | -1 = dirNext ? 1 : -1
  let mode = SuccessorSearchMode.InBranchTick
  // Downgrade search mode in case of
  // -    Plain tabs structure
  // - or Backward direction
  // - or Tab without parent
  if (!tree || !dirNext || tab.parentId === -1) {
    mode = SuccessorSearchMode.InPanelTick
  }

  let inBranch = true
  let upI = tab.index - 1
  let downI = tab.index + 1
  let foundTab: Tab | undefined
  let discardedFallback: Tab | undefined
  let foldedFallback: Tab | undefined
  mainLoop: while (upI >= 0 || downI < Tabs.list.length) {
    if (dir === 1) foundTab = Tabs.list[downI]
    else if (dir === -1) foundTab = Tabs.list[upI]

    // Out of branch scope detection
    if (mode === SuccessorSearchMode.InBranchTick || mode === SuccessorSearchMode.InBranchTack) {
      if (!foundTab || (dir === 1 && foundTab.lvl < tab.lvl) || (dir === -1 && !inBranch)) {
        if (mode === SuccessorSearchMode.InBranchTick) mode = SuccessorSearchMode.InBranchTack
        else mode = SuccessorSearchMode.InPanelTick
        dir *= -1
        continue
      }
      if (dir === -1 && foundTab.parentId === -1) inBranch = false
    }

    // Out of panel scope detection
    if (mode === SuccessorSearchMode.InPanelTick || mode === SuccessorSearchMode.InPanelTack) {
      if (!foundTab || foundTab.panelId !== panel.id || foundTab.pinned !== tab.pinned) {
        if (mode === SuccessorSearchMode.InPanelTick) mode = SuccessorSearchMode.InPanelTack
        else {
          // Search in pinned tabs in current panel
          if (panel.pinnedTabs.length) {
            for (let i = panel.pinnedTabs.length; i--; ) {
              const pTab = panel.pinnedTabs[i]
              if (!pTab) break
              if (skipDiscarded && pTab.discarded) {
                if (!discardedFallback) discardedFallback = Tabs.byId[pTab.id]
                continue
              }
              if (pTab.removing) continue
              if (exclude && exclude.includes(pTab.id)) continue
              target = Tabs.byId[pTab.id]
              break mainLoop
            }
          }
          if (stayInPanel && (discardedFallback || foldedFallback)) {
            return discardedFallback || foldedFallback
          }

          // Check the last active tab of the previous active tabs panel
          if (tab.panelId !== Sidebar.prevTabsPanelId) {
            const prevTabsPanelHistory = Tabs.getActiveTabsHistory(Sidebar.prevTabsPanelId)
            if (prevTabsPanelHistory?.actTabs.length) {
              const panelId = Sidebar.prevTabsPanelId
              const actTabs = prevTabsPanelHistory.actTabs
              const prevActTabId = actTabs.findLast(id => {
                const tab = Tabs.byId[id]
                return tab && tab.panelId === panelId && !tab.discarded
              })
              const prevActTab = Tabs.byId[prevActTabId ?? NOID]
              if (prevActTab) {
                return prevActTab
              }
            }
          }

          // Continue search in global mode
          mode = SuccessorSearchMode.GlobalTick
        }
        dir *= -1
        continue
      }
    }

    // Out of global scope detection
    if (mode === SuccessorSearchMode.GlobalTick || mode === SuccessorSearchMode.GlobalTack) {
      if (!foundTab) {
        if (mode === SuccessorSearchMode.GlobalTick) mode = SuccessorSearchMode.GlobalTack
        else break
        dir *= -1
        continue
      }
    }

    if (!foundTab) break

    // Increment/Decrement indexes
    if (dir === 1) downI++
    else upI--

    // Next tab is in removing process
    if (foundTab.removing) continue

    // Next tab excluded
    if (exclude && exclude.includes(foundTab.id)) continue

    // Invisible(folded) tab will be removed too
    if (Settings.rmChildTabsFolded && foundTab.invisible) continue

    // Child tab will be removed too
    if (Settings.rmChildTabsAll && foundTab.lvl > tab.lvl) continue

    // Prev tab is invisible
    if (dir === -1 && foundTab.invisible) {
      if (!foldedFallback) foldedFallback = foundTab
      continue
    }

    // Skip discarded tab
    if (skipDiscarded && foundTab.discarded) {
      if (!discardedFallback) discardedFallback = foundTab
      continue
    }

    target = foundTab
    break
  }

  // Previously active tab
  if (Settings.activateAfterClosingPrevAct) {
    let history: ActiveTabsHistory
    if (Settings.state.activateAfterClosingGlobal) {
      history = Tabs.activeTabsGlobal
    } else {
      history = Tabs.activeTabsPerPanel[tab.panelId] || Tabs.activeTabsGlobal
    }

    if (!history || !history.actTabs) return

    let targetId, prev
    for (let i = history.actTabs.length; i--; ) {
      targetId = history.actTabs[i]
      prev = Tabs.byId[targetId]

      // Tab excluded
      if (exclude && exclude.includes(targetId)) continue

      // Skip discarded tab
      if (skipDiscarded && prev && prev.discarded) {
        if (!discardedFallback) discardedFallback = prev
        continue
      }

      // Skip invisible tab
      if (skipFolded && prev && prev.invisible) continue

      if (targetId !== tab.id && prev) {
        target = prev
        break
      }
    }
  }

  // Use fallback
  if (!target) target = discardedFallback
  return target
}

let skipActTabsCollecting = false
export function skipActiveTabsHistoryCollecting(): void {
  skipActTabsCollecting = true
}

export function writeActiveTabsHistory(prevTab: Tab, activeTab: Tab): void {
  if (skipActTabsCollecting) {
    skipActTabsCollecting = false
    return
  }

  const samePanel = prevTab.panelId === activeTab.panelId
  const g = Tabs.activeTabsGlobal
  let p = Tabs.activeTabsPerPanel[prevTab.panelId]
  if (!p) {
    p = { id: prevTab.panelId, actTabOffset: -1, actTabs: [] }
    Tabs.activeTabsPerPanel[prevTab.panelId] = p
  }

  // Global
  if (g.actTabOffset >= 0 && g.actTabOffset < g.actTabs.length && samePanel) {
    g.actTabs = g.actTabs.slice(0, g.actTabOffset)
    g.actTabOffset = -1
  }
  if (g.actTabs.length > 128) g.actTabs = g.actTabs.slice(32)
  g.actTabs.push(prevTab.id)

  // Panel
  if (!prevTab.pinned || Settings.state.pinnedTabsPosition === 'panel') {
    if (p.actTabOffset >= 0 && p.actTabOffset < p.actTabs.length && samePanel) {
      p.actTabs = p.actTabs.slice(0, p.actTabOffset)
      p.actTabOffset = -1
    }
    if (p.actTabs.length > 128) p.actTabs = p.actTabs.slice(32)
    p.actTabs.push(prevTab.id)
  }
}

export function getActiveTabsHistory(panelId?: ID): ActiveTabsHistory {
  if (panelId !== undefined) {
    if (!Tabs.activeTabsPerPanel[panelId]) {
      Tabs.activeTabsPerPanel[panelId] = { id: panelId, actTabOffset: -1, actTabs: [] }
    }
    return Tabs.activeTabsPerPanel[panelId]
  } else {
    return Tabs.activeTabsGlobal
  }
}

export function tabFlip() {
  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab) return

  let panelId
  if (Settings.state.tabsSecondClickActPrevPanelOnly) {
    if (actTab.pinned && Settings.state.pinnedTabsPosition !== 'panel') {
      panelId = Sidebar.activePanelId
    } else {
      panelId = actTab.panelId
    }
  }

  const history = Tabs.getActiveTabsHistory(panelId)
  const prevTabId = history.actTabs.findLast(id => {
    const tab = Tabs.byId[id]
    if (Settings.state.tabsSecondClickActPrevNoUnload && tab?.discarded) return false
    return id !== Tabs.activeId
  })
  if (prevTabId !== undefined) browser.tabs.update(prevTabId, { active: true })
}

export function getTabInfo(id: ID, setPanelId?: boolean): ItemInfo | undefined {
  const tab = Tabs.byId[id]
  if (!tab) return

  const info: ItemInfo = {
    id,
    url: tab.url,
    parentId: tab.parentId,
    title: tab.title,
    active: tab.active,
    index: tab.index,
    pinned: tab.pinned,
    container: tab.cookieStoreId,
  }
  if (tab.customTitle) info.customTitle = tab.customTitle
  if (tab.customColor) info.customColor = tab.customColor
  if (setPanelId) info.panelId = tab.panelId

  return info
}

export function getTabsInfo(ids: ID[], setPanelId?: boolean): ItemInfo[] {
  const items: ItemInfo[] = []

  for (const id of ids) {
    const tab = Tabs.byId[id]
    if (tab) {
      const info: ItemInfo = {
        id,
        url: tab.url,
        parentId: tab.parentId,
        title: tab.title,
        active: tab.active,
        index: tab.index,
        pinned: tab.pinned,
        container: tab.cookieStoreId,
      }
      if (tab.folded) info.folded = true
      if (tab.customTitle) info.customTitle = tab.customTitle
      if (tab.customColor) info.customColor = tab.customColor
      if (setPanelId) info.panelId = tab.panelId
      items.push(info)

      // Include folded tabs
      if (tab.folded) {
        for (let i = tab.index + 1; i < Tabs.list.length; i++) {
          const child = Tabs.list[i]
          if (!child.invisible) break
          if (ids.includes(child.id)) continue
          const subInfo: ItemInfo = {
            id: child.id,
            url: child.url,
            parentId: child.parentId,
            title: child.title,
            active: child.active,
            index: child.index,
            pinned: child.pinned,
            container: child.cookieStoreId,
          }
          if (child.folded) subInfo.folded = true
          if (setPanelId) subInfo.panelId = child.panelId
          items.push(subInfo)
        }
      }
    }
  }

  return items
}

export function getBranch(rootTab: Tab, withRoot = true): Tab[] {
  const result: Tab[] = []
  if (withRoot) result.push(rootTab)

  // Check tab index
  const target = Tabs.list[rootTab.index]
  if (!target || target.id !== rootTab.id) return result

  const rootLvl = rootTab.lvl
  let index = rootTab.index + 1
  let child: Tab | undefined = Tabs.list[index++]
  while (child && child.lvl > rootLvl) {
    result.push(child)
    child = Tabs.list[index++]
  }

  return result
}

export function forEachDescendant(rootTab: Tab, cb: (t: Tab) => void) {
  // Check tab index
  const target = Tabs.list[rootTab.index]
  if (!target || target.id !== rootTab.id) return Logs.warn('Tabs.forEachDescendant: Wrong index')

  const rootLvl = rootTab.lvl
  let index = rootTab.index + 1
  let child: Tab | undefined = Tabs.list[index++]
  while (child && child.lvl > rootLvl) {
    cb(child)
    child = Tabs.list[index++]
  }
}

export function findAncestor(childTab: Tab, cb: (t: Tab) => any): Tab | undefined {
  let parent = Tabs.byId[childTab.parentId]
  while (parent) {
    if (cb(parent)) return parent
    parent = Tabs.byId[parent.parentId]
  }
}

export async function copy(ids: ID[], template: CopyTemplate) {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  Tabs.sortTabIds(ids)

  const isDBG = template.str === '%DBG'
  const lines: string[] = []
  const bullet = ids.length > 1 ? Settings.state.copyMultiBullet : ''
  const indent = Settings.state.copyTreeIndent
  const indentLevelsById = new Map<ID, number>()
  for (const id of ids) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    if (isDBG) {
      lines.push(JSON.stringify(tab, null, 2))
      continue
    }

    // Get indent lvl
    let indentLvl = 0
    if (tab.lvl > 0) {
      const pTabId = Tabs.findAncestorId(id, pid => ids.includes(pid))
      const pLvl = pTabId ? indentLevelsById.get(pTabId) : undefined
      indentLvl = pLvl !== undefined ? pLvl + 1 : 0
    }

    indentLevelsById.set(tab.id, indentLvl)

    let result = template.str
    if (template.hasB) result = result.replaceAll('%B', bullet)
    if (template.hasCT) result = result.replaceAll('%CT', tab.customTitle || tab.title)
    if (template.hasT) result = result.replaceAll('%T', tab.title)
    if (template.hasU) result = result.replaceAll('%U', tab.url)
    lines.push(indent.repeat(indentLvl) + result)
  }

  const resultString = lines.join('\n')
  if (resultString) navigator.clipboard.writeText(resultString)
}

export async function pasteInPanelOrAfterTabs(ids: ID[]) {
  if (ids.length === 1 && Utils.isTabsPanel(Sidebar.panelsById[ids[0]])) {
    return paste({ panelId: ids[0], discarded: true })
  } else {
    return pasteAfter(ids)
  }
}

export async function pasteAfter(dstIds: ID[]) {
  Tabs.sortTabIds(dstIds)

  const lastSelTabId = dstIds[dstIds.length - 1]
  const lastSelTab = Tabs.byId[lastSelTabId]
  if (!lastSelTab) return Logs.warn('Tabs.pasteAfter: No dst tab')

  const pinned = lastSelTab.pinned
  const panelId = lastSelTab.panelId
  const parentId = lastSelTab.parentId
  let index = lastSelTab.index + 1
  if (lastSelTab.isParent) {
    index = lastSelTab.index + (Tabs.getBranchLen(lastSelTab.id) ?? 0) + 1
  }

  const dst: DstPlaceInfo = {
    index,
    parentId,
    discarded: true,
    pinned,
    panelId,
  }

  return paste(dst)
}

export async function paste(dst: DstPlaceInfo) {
  // Check permission
  if (!Permissions.reactive.clipboardRead) {
    const result = await Permissions.request('clipboardRead')
    if (!result) return Logs.warn('Tabs.paste: No permission')
  }

  // Get and parse text from clipboard
  const rawText = await navigator.clipboard.readText()
  const items = Utils.parseTextForItems(rawText)
  if (!items.length) return Logs.warn('Tabs.paste: No parsed items')

  // Check/Normalize dst info
  // - Panel
  let dstPanel
  if (dst.panelId === undefined && (!dst.pinned || Settings.state.pinnedTabsPosition === 'panel')) {
    dst.parentId = undefined
    dst.index = undefined
    dstPanel = Sidebar.panelsById[Sidebar.activePanelId]
    if (Utils.isTabsPanel(dstPanel)) dst.panelId = Sidebar.activePanelId
    else return Logs.warn('Tabs.paste: Unable to find dst panel')
  } else if (dst.panelId) {
    dstPanel = Sidebar.panelsById[dst.panelId]
    if (!Utils.isTabsPanel(dstPanel)) return Logs.warn('Tabs.paste: Wrong dst panel')
  } else {
    dst.panelId = NOID
  }
  // - Parent tab
  let dstParent
  if (!dst.pinned) {
    if (dst.parentId === undefined) {
      dst.index = undefined
      dst.parentId = NOID
    } else if (dst.parentId !== NOID) {
      dstParent = Tabs.byId[dst.parentId]
      if (!dstParent || dstParent.panelId !== dst.panelId) {
        return Logs.warn('Tabs.paste: Wrong dst parent tab')
      }
    }
  } else {
    dst.parentId = NOID
  }
  // - Index
  if (dst.index === undefined) {
    if (dstParent) {
      const branchLen = Tabs.getBranchLen(dstParent.id) ?? 0
      dst.index = dstParent.index + branchLen + 1
    } else if (dstPanel) {
      dst.index = dstPanel.nextTabIndex
    } else if (dst.pinned) {
      dst.index = Tabs.pinned.length
    } else {
      return Logs.warn('Tabs.paste: No dst index')
    }
  } else {
    let indexIsOk = true
    if (dst.pinned) {
      indexIsOk = dst.index >= 0 && dst.index <= Tabs.pinned.length
    } else {
      indexIsOk = dst.index >= Tabs.pinned.length
      if (indexIsOk && dstPanel) {
        indexIsOk = dst.index >= dstPanel.startTabIndex && dst.index <= dstPanel.nextTabIndex
      }
      if (indexIsOk && dstParent) {
        const branchLen = Tabs.getBranchLen(dstParent.id) ?? 0
        indexIsOk = dst.index > dstParent.index && dst.index <= dstParent.index + branchLen + 1
      }
    }
    if (!indexIsOk) return Logs.warn('Tabs.paste: Incorrect dst index')
  }

  // Search
  if (items.length === 1 && items[0]?.title && !items[0]?.url) {
    const query = items[0]?.title

    if (dst.pinned) {
      browser.search.search({ query, disposition: 'NEW_TAB' })
    } else {
      const conf: browser.tabs.CreateProperties = {
        active: false,
        index: dst.index,
        windowId: Windows.id,
      }
      Tabs.setNewTabPosition(dst.index, dst.parentId, dst.panelId)
      const tabWithSearch = await browser.tabs.create(conf)
      browser.search.search({ query, tabId: tabWithSearch.id })
    }
  }

  // or Create discarded tabs
  else {
    await Tabs.open(Utils.withoutEmptyFolders(items), dst)
  }
}

export function triggerFlashAnimation(tab: Tab): void {
  if (tab.flashAnimationTimeout) return
  if (tab.flashFxEl) tab.flashFxEl.setAttribute('data-run', 'true')
  tab.flashAnimationTimeout = setTimeout(() => {
    tab.flashAnimationTimeout = undefined
    if (tab.flashFxEl) tab.flashFxEl.setAttribute('data-run', 'false')
  }, 1000)
}

export function updateUrlCounter(url: string, delta: number): number {
  let count = Tabs.urlsInUse[url]
  if (count === undefined) {
    if (delta > 0) return (Tabs.urlsInUse[url] = delta)
    else return 0
  }

  count += delta
  if (count <= 0) {
    delete Tabs.urlsInUse[url]
    return 0
  } else {
    Tabs.urlsInUse[url] = count
    return count
  }
}

export const enum SwitchingTabScope {
  global = 1,
  panel = 2,
}

let switchTabActHistoryPause: number | undefined
export function switchToRecentlyActiveTab(scope = SwitchingTabScope.global, dir: number): void {
  if (switchTabActHistoryPause) return
  switchTabActHistoryPause = setTimeout(() => {
    clearTimeout(switchTabActHistoryPause)
    switchTabActHistoryPause = undefined
  }, 120)

  let history: ActiveTabsHistory | undefined
  if (scope === SwitchingTabScope.global) history = Tabs.getActiveTabsHistory()
  if (scope === SwitchingTabScope.panel) {
    const panel = Sidebar.panelsById[Sidebar.activePanelId]
    if (!Utils.isTabsPanel(panel)) return
    history = Tabs.getActiveTabsHistory(panel.id)
  }

  if (!history?.actTabs?.length) return

  // Reset offset
  const offset = history.actTabOffset
  if (offset === undefined || offset < 0 || offset > history.actTabs.length) {
    history.actTabOffset = history.actTabs.length
  }

  let targetTabId, targetIdIndex, tabId
  for (let i = history.actTabOffset + dir; i >= 0 && i < history.actTabs.length; i += dir) {
    tabId = history.actTabs[i]
    if (Tabs.byId[tabId] && tabId !== Tabs.activeId) {
      targetIdIndex = i
      targetTabId = tabId
      break
    }
  }

  if (targetTabId !== undefined) {
    if (dir < 0 && targetIdIndex === history.actTabs.length - 1) {
      const actTab = Tabs.byId[Tabs.activeId]
      if (
        scope === SwitchingTabScope.global ||
        (scope === SwitchingTabScope.panel && actTab && actTab.panelId === history.id)
      ) {
        history.actTabs.push(Tabs.activeId)
      }
    }
    if (targetIdIndex !== undefined) history.actTabOffset = targetIdIndex
    Tabs.skipActiveTabsHistoryCollecting()
    if (tabId !== undefined) {
      const tab = Tabs.byId[tabId]
      if (
        tab &&
        (!tab.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
        tab.panelId !== Sidebar.activePanelId
      ) {
        Sidebar.activatePanel(tab.panelId)
      }

      Logs.info('Tabs.switchToRecentlyActiveTab', tabId)
      browser.tabs.update(tabId, { active: true }).catch(err => {
        Logs.err('Tabs.switchToRecentlyActiveTab: Cannot activate tab:', err)
      })
    }
  }
}

export function pringDbgInfo(reset = false): void {
  for (const tab of Tabs.list) {
    if (reset) {
      renderTitle(tab)
    } else {
      renderTitle(tab, `${tab.id} i${tab.index} p${tab.parentId} l${tab.lvl} ${tab.title}`)
    }
  }
}

export function updateTooltip(tabId: ID) {
  const tab = Tabs.byId[tabId]
  if (!tab) return

  tab.reactive.tooltip = Settings.state.previewTabs ? '' : getTooltip(tab)
}
export function getTooltip(tab: Tab): string {
  let decodedUrl
  try {
    decodedUrl = decodeURI(tab.url)
  } catch (err) {
    decodedUrl = tab.url
  }

  let str = `${tab.title}`
  if (Settings.state.tabsUrlInTooltip === 'full') {
    str += `\n---\n${decodedUrl}`
  } else if (Settings.state.tabsUrlInTooltip === 'stripped') {
    str += `\n---\n${decodedUrl.split('?')[0]}`
  }

  const containerName = Containers.reactive.byId[tab.cookieStoreId]?.name || ''
  if (containerName && Settings.state.tabsContainerInTooltip) {
    str += `\n---\n${containerName}`
  }

  return str
}

let updateSuccesionTimeout: number | undefined
export function updateSuccessionDebounced(delay: number, exclude?: readonly ID[]) {
  if (Settings.activateAfterClosingNone) return

  clearTimeout(updateSuccesionTimeout)

  if (!delay) return updateSuccession(exclude)

  updateSuccesionTimeout = setTimeout(() => updateSuccession(exclude), delay)
}

function updateSuccession(exclude?: readonly ID[]) {
  let firstSuccessor: Tab | undefined

  if (Tabs.list.length < 2) return

  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab) {
    const suc = [activeTab.id]
    firstSuccessor = Tabs.findSuccessorTab(activeTab, exclude)
    if (firstSuccessor) {
      activeTab.successorTabId = firstSuccessor.id
      if (firstSuccessor.id !== activeTab.id) suc.push(firstSuccessor.id)

      if (!exclude) {
        const secondSuccessor = Tabs.findSuccessorTab(firstSuccessor, suc)
        if (secondSuccessor && secondSuccessor.id !== activeTab.id) {
          suc.push(secondSuccessor.id)
        }
      }
    }

    if (suc.length > 1) {
      browser.tabs.moveInSuccession(suc).catch(err => {
        Logs.err('Tabs.updateSuccession: Cannot update succession:', err, suc)
      })
    }
  }

  return firstSuccessor
}

export function renderTitle(tab: Tab, forcedTitle?: string) {
  if (tab.titleEl) {
    tab.titleEl.innerText = forcedTitle ?? tab.customTitle ?? tab.title
  }
  if (Settings.state.forceUpdTooltip) {
    updateTooltip(tab.id)
  }
}

export function renderFavicon(tab: Tab) {
  const imgEl = tab.favImgEl
  const svgUseEl = tab.favSvgUseEl
  if (tab.favIconUrl && imgEl) {
    // Set img
    imgEl.src = tab.favIconUrl
    // Show img
    if (imgEl.style) imgEl.style.display = 'block'
    // Hide svg
    if (svgUseEl?.parentElement) svgUseEl.parentElement.style.display = 'none'
  } else if (svgUseEl?.parentElement) {
    // Set svg
    const icon = tab.warn ? '#icon_warn' : Favicons.getFavPlaceholder(tab.url)
    svgUseEl.setAttribute('href', icon)
    // Show svg
    svgUseEl.parentElement.style.display = 'block'
    // Hide img
    if (imgEl) imgEl.style.display = 'none'
  }
}
