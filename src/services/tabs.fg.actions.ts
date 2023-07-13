import * as Utils from 'src/utils'
import { CONTAINER_ID, GROUP_URL, NOID, NEWID, Err, ASKID, MOVEID, SAMEID } from 'src/defaults'
import { BKM_OTHER_ID, ADDON_HOST, DEFAULT_CONTAINER_ID, BKM_ROOT_ID } from 'src/defaults'
import { INITIAL_TITLE_RE } from 'src/defaults'
import { translate } from 'src/dict'
import { Stored, Tab, Panel, TabCache, ActiveTabsHistory, ReactiveTabProps } from 'src/types'
import { Notification, TabSessionData, TabsTreeData, DragInfo, NativeTab } from 'src/types'
import { WindowChoosingDetails, SrcPlaceInfo, DstPlaceInfo, ItemInfo } from 'src/types'
import { TabsPanel, PanelType, TabTreeData, TabToPanelMoveRule, TabStatus } from 'src/types'
import { TabToPanelMoveRuleConfig, RecentlyClosedTabInfo } from 'src/types'
import { Tabs } from 'src/services/tabs.fg'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import * as Popups from 'src/services/popups'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Permissions } from 'src/services/permissions'
import { Notifications } from 'src/services/notifications'
import { Favicons } from './favicons'
import { Selection } from './selection'

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
    if (tab.favIconUrl === undefined) tab.favIconUrl = undefined
    else if (tab.favIconUrl.startsWith('chrome:')) tab.favIconUrl = undefined
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
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned,
      status: Tabs.getStatus(tab),
      isParent: tab.isParent,
      folded: tab.folded,
      title: tab.title,
      tooltip: getTooltip(tab),
      customTitle: tab.customTitle ?? null,
      customTitleEdit: false,
      customColor: tab.customColor ?? null,
      url: tab.url,
      lvl: tab.lvl,
      branchLen: 0,
      sel: tab.sel,
      warn: tab.warn,
      updated: tab.updated,
      unread: !!tab.unread,
      flash: false,
      branchColor: null,
      color: null,
      isGroup: tab.isGroup,
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
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    status: Tabs.getStatus(tab),
    isParent: tab.isParent,
    folded: tab.folded,
    title: tab.title,
    tooltip: getTooltip(tab),
    customTitle: tab.customTitle ?? null,
    customTitleEdit: false,
    customColor: tab.customColor ?? null,
    url: tab.url,
    lvl: tab.lvl,
    branchLen: 0,
    sel: tab.sel,
    warn: tab.warn,
    updated: tab.updated,
    unread: !!tab.unread,
    flash: false,
    branchColor: null,
    color: null,
    isGroup: tab.isGroup,
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

let waitingForTabs: (() => void)[] = []
export async function waitForTabsReady(): Promise<void> {
  if (Tabs.ready) return

  return new Promise(ok => {
    waitingForTabs.push(ok)
  })
}

export async function load(): Promise<void> {
  if (Tabs.shadowMode) Tabs.unloadShadowed()

  Tabs.setupTabsListeners()

  await Utils.retry({
    action: async again => {
      try {
        await restoreTabsState()
      } catch (err) {
        if (err === Err.TabsLocked) again()
        else Logs.err('Tabs.load: Cannot restore tabs state', err)
      }
    },
    interval: 1000,
    increment: 500,
    count: 5,
  })

  Tabs.updateActiveGroupPage()

  // Scroll to active tab
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab && !activeTab.pinned) Tabs.scrollToTab(activeTab.id)

  Tabs.updateNativeTabsVisibility()
  Tabs.cacheTabsData(1000)
  Tabs.list.forEach(t => {
    Tabs.updateUrlCounter(t.url, 1)

    if (t.isGroup) Tabs.linkGroupWithPinnedTab(t, Tabs.list)

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
  waitingForTabs.forEach(cb => cb())
  waitingForTabs = []
}

export function unload(): void {
  Tabs.ready = false
  Tabs.resetTabsListeners()

  Tabs.reactive.pinnedIds = []
  Tabs.reactive.recentlyRemovedLen = 0
  Tabs.recentlyRemoved = []
  Tabs.list = []
  Tabs.byId = {}
  Tabs.urlsInUse = {}

  Tabs.tabsReinitializing = false
  Tabs.removedTabs = []
  Tabs.newTabsPosition = {}
  Tabs.movingTabs = []
  Tabs.attachingTabs = []
  Tabs.normTabsMoving = false

  Tabs.activeTabsGlobal.actTabOffset = -1
  Tabs.activeTabsGlobal.actTabs = []
  Tabs.activeTabsPerPanel = {}

  Tabs.removingTabs = []
  Tabs.ignoreTabsEvents = false
  Tabs.activeId = -1

  for (const panel of Sidebar.panels) {
    if (Utils.isTabsPanel(panel)) {
      panel.tabs = []
      panel.pinnedTabs = []
      panel.reactive.visibleTabIds = []
      panel.reactive.pinnedTabIds = []
      panel.reactive.len = 0
      panel.reactive.empty = true
      panel.ready = false
    }
  }

  Tabs.loadInShadowMode()
}

async function restoreTabsState(): Promise<void> {
  if (!Sidebar.hasTabs) return

  const results = await Promise.allSettled([
    browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT }),
    browser.storage.local.get<Stored>('tabsDataCache'),
    IPC.bg('isWindowTabsLocked', Windows.id),
  ])
  const nativeTabs = Utils.settledOr(results[0], [])
  const storage = Utils.settledOr(results[1], {})
  const isWindowTabsLocked = Utils.settledOr(results[2], false)

  // Check if tabs are locked right now
  if (isWindowTabsLocked) {
    if (isWindowTabsLocked === true) throw Err.TabsLocked
    storage.tabsDataCache = [isWindowTabsLocked]
  }

  let tabs: Tab[] | undefined
  let tabsCache: Record<ID, TabCache> | undefined
  let tabsSessionData: (TabSessionData | undefined)[] | undefined

  const lastPanel = Sidebar.panels.find(p => Utils.isTabsPanel(p))
  if (!lastPanel) return Logs.err('Cannot load tabs: No tabs panels')

  // Find most appropriate cache data
  if (storage.tabsDataCache) tabsCache = findCachedData(nativeTabs, storage.tabsDataCache)

  // Restore tabs data from cache
  if (tabsCache) {
    tabs = restoreTabsFromCache(nativeTabs, tabsCache, lastPanel)
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

    tabs = restoreTabsFromSessionData(nativeTabs, tabsSessionData, lastPanel)
  }

  Tabs.list = tabs
  Sidebar.recalcTabsPanels()
  if (Settings.state.tabsTree) updateTabsTree()
  Sidebar.recalcVisibleTabs()

  const activeTab = tabs.find(t => t.active)
  if (activeTab) {
    const actTabIsGloballyPinned = activeTab.pinned && Settings.state.pinnedTabsPosition !== 'panel'
    const currentActivePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]

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
      else if (currentActivePanelHidden || Sidebar.reactive.activePanelId === NOID) {
        const panelId = tabs.find(t => !t.pinned)?.panelId
        if (panelId) targetPanel = Sidebar.panelsById[panelId]
      }

      if (targetPanel && targetPanel.id !== Sidebar.reactive.activePanelId) {
        Sidebar.activatePanel(targetPanel.id, false)
      }
    }

    // Set active tab id
    Tabs.activeId = activeTab.id

    // Update succession
    Tabs.updateSuccessionDebounced(0)
  }

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []
}

function restoreTabsFromCache(
  nativeTabs: NativeTab[],
  cache: Record<ID, TabCache>,
  lastPanel: Panel
): Tab[] {
  let logWrongPanels: Record<string, null> | undefined
  const firstPanelId = lastPanel.id
  const idsMap: Record<ID, ID> = {}
  const tabs: Tab[] = []

  // Go through tabs and restore sidebery props
  Tabs.byId = {}
  for (const nativeTab of [...nativeTabs]) {
    const data = cache[nativeTab.id]

    // Normalize tab
    const tab = mutateNativeTabToSideberyTab(nativeTab)
    if (tab.pinned) tab.panelId = firstPanelId

    if (data) {
      if (data.parentId === undefined) data.parentId = NOID

      // Restore props
      tab.panelId = data.panelId ?? lastPanel.id
      const actualParentId = idsMap[data.parentId]
      if (actualParentId !== undefined) tab.parentId = actualParentId
      tab.reactive.folded = tab.folded = !!data.folded
      if (data.customTitle) tab.reactive.customTitle = tab.customTitle = data.customTitle
      if (data.customColor) tab.reactive.customColor = tab.customColor = data.customColor
      idsMap[data.id] = tab.id
    }

    // Normalize panelId
    const panel = Sidebar.panelsById[tab.panelId]
    if (!panel) {
      if (!logWrongPanels) logWrongPanels = {}
      logWrongPanels[tab.panelId] = null
      tab.panelId = lastPanel.id
    } else {
      if (!tab.pinned) {
        // Check order of panels
        if (panel.index < lastPanel.index) tab.panelId = lastPanel.id
        else lastPanel = panel
      }
    }

    // Use openerTabId as fallback for parentId
    if (tab.parentId === -1 && tab.openerTabId !== undefined && Tabs.byId[tab.openerTabId]) {
      tab.parentId = tab.openerTabId
    }

    Tabs.reactivateTab(tab)
    Tabs.byId[tab.id] = tab
    tabs.push(tab)
  }

  if (logWrongPanels) {
    Logs.warn('Tabs loading: Cannot find panels: ' + Object.keys(logWrongPanels).join(' '))
  }

  return tabs
}

function restoreTabsFromSessionData(
  nativeTabs: NativeTab[],
  tabsData: (TabSessionData | undefined)[],
  lastPanel: Panel
): Tab[] {
  let logWrongPanels: Record<string, null> | undefined
  const firstPanelId = lastPanel.id
  const idsMap: Record<ID, ID> = {}
  const tabs: Tab[] = []

  // Set tabs initial props and update state
  Tabs.byId = {}
  for (let data, nativeTab, i = 0; i < nativeTabs.length; i++) {
    nativeTab = nativeTabs[i]
    if (!nativeTab) {
      Logs.err('Tabs.restoreTabsFromSessionData: No tab')
      break
    }

    data = tabsData[i]

    const tab = mutateNativeTabToSideberyTab(nativeTab)
    if (tab.pinned) tab.panelId = firstPanelId

    if (data) {
      if (data.parentId === undefined) data.parentId = NOID

      // Restore props
      tab.panelId = data.panelId ?? lastPanel.id
      const actualParentId = idsMap[data.parentId]
      if (actualParentId !== undefined) tab.parentId = actualParentId
      tab.reactive.folded = tab.folded = !!data.folded
      if (data.customTitle) tab.reactive.customTitle = tab.customTitle = data.customTitle
      if (data.customColor) tab.reactive.customColor = tab.customColor = data.customColor
      idsMap[data.id] = tab.id
    }

    // Normalize panelId
    const panel = Sidebar.panelsById[tab.panelId]
    if (!panel) {
      if (!logWrongPanels) logWrongPanels = {}
      logWrongPanels[tab.panelId] = null
      tab.panelId = lastPanel.id
    } else {
      if (!tab.pinned) {
        // Check order of panels
        if (panel.index < lastPanel.index) tab.panelId = lastPanel.id
        else lastPanel = panel
      }
    }

    // Use openerTabId as fallback for parentId
    if (tab.parentId === -1 && tab.openerTabId !== undefined && Tabs.byId[tab.openerTabId]) {
      tab.parentId = tab.openerTabId
    }

    Tabs.reactivateTab(tab)
    Tabs.byId[tab.id] = tab
    tabs.push(tab)
  }

  if (logWrongPanels) {
    Logs.warn('Tabs loading: Cannot find panels: ' + Object.keys(logWrongPanels).join(' '))
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

  if (Windows.uniqWinId && Windows.uniqWinId !== NOID) {
    const winTabsCache = data.find(winTabs => winTabs[0]?.uniqWinId === Windows.uniqWinId)
    if (winTabsCache) data = [winTabsCache]
  }

  for (const winTabs of data) {
    let equalityCounter = 0

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
      if (tabData.url === tab.url || blindspot) {
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
  // Logs.info('Tabs.cacheTabsData')
  if (cacheTabsDataTimeout) clearTimeout(cacheTabsDataTimeout)
  cacheTabsDataTimeout = setTimeout(() => {
    if (Tabs.tabsReinitializing) return

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

/**
 * Save tab data to its session storage
 */
export function saveTabData(tabId: ID): void {
  // Logs.info('Tabs.saveTabData', tabId)
  const tab = Tabs.byId[tabId]
  if (!tab) return

  const data: TabSessionData = {
    id: tabId,
    panelId: tab.panelId,
    parentId: tab.parentId,
    folded: tab.folded,
  }

  if (tab.customTitle) data.customTitle = tab.customTitle
  if (tab.customColor) data.customColor = tab.customColor

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
            Logs.err('Tabs.reinitTabs: No panelInfo 1')
            break
          }
          if (panelInfo.id !== tab.panelId) {
            const pi = panelsList.findIndex(p => {
              if (p.index === -1) p.index = index - 1
              return p.id === tab.panelId
            })
            if (pi > panelIndex) {
              panelIndex = pi
              const panelInfo = panelsList[panelIndex]
              if (panelInfo) panelInfo.index = index
            } else if (pi === -1) {
              tab.panelId = panelId ?? NOID
            } else {
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

    Tabs.tabsReinitializing = false
    Tabs.normTabsMoving = false

    if (Settings.state.colorizeTabs) Tabs.colorizeTabs()
    if (Settings.state.colorizeTabsBranches) Tabs.colorizeBranches()

    Tabs.list.forEach(t => saveTabData(t.id))
    cacheTabsData()
  }, delay)
}

let sortNativeTabsTimeout: number | undefined
let sortingNativeTabs = false
export function sortNativeTabs(delayMS = 500): void {
  sortingNativeTabs = false

  clearTimeout(sortNativeTabsTimeout)
  sortNativeTabsTimeout = setTimeout(async () => {
    sortingNativeTabs = true

    const nativeTabs = await browser.tabs.query({ currentWindow: true })
    if (!sortingNativeTabs) return sortNativeTabs()
    const nativeTabsById: Record<ID, NativeTab> = {}

    for (const nativeTab of nativeTabs) {
      nativeTabsById[nativeTab.id] = nativeTab

      const tab = Tabs.byId[nativeTab.id]
      if (!tab) {
        Logs.warn(`Tabs.sortNativeTabs: Cannot find sidebery tab: ${nativeTab.id}`)
        return Tabs.reinitTabs()
      }
    }

    type Move = { index: number; ids: ID[]; step: number }
    const moves: Move[] = []
    let prevMove: Move | undefined
    let prevMoveStep = 0
    for (const tab of Tabs.list) {
      const nativeTabById = nativeTabsById[tab.id]
      if (!nativeTabById) {
        Logs.warn('Tabs.sortNativeTabs: Cannot find native tab')
        return Tabs.reinitTabs()
      }

      const nativeTabByIndex = nativeTabs[tab.index]
      if (!nativeTabByIndex || nativeTabByIndex.id !== tab.id) {
        const step = nativeTabById.index - tab.index

        nativeTabs.splice(nativeTabById.index, 1)
        nativeTabs.splice(tab.index, 0, nativeTabById)

        if (prevMoveStep === step && prevMove) {
          prevMove.ids.push(tab.id)
        } else {
          prevMove = { index: tab.index, ids: [tab.id], step: step }
          moves.push(prevMove)
        }

        prevMoveStep = step
      } else {
        prevMove = undefined
        prevMoveStep = 0
      }
    }

    for (const move of moves) {
      // Invert moving tabs
      if (move.step < move.ids.length) {
        const k = move.index + move.ids.length
        const targetIndex = move.index + move.ids.length
        const tabs = Tabs.list.slice(k, k + move.step)
        const ids = tabs.map(t => {
          t.moving = true
          return t.id
        })
        Tabs.movingTabs.push(...ids)
        await browser.tabs.move(ids, { index: targetIndex, windowId: Windows.id }).catch(err => {
          Logs.err('Tabs.sortNativeTabs: Cannot move tabs', err)
        })
        tabs.forEach(t => (t.moving = undefined))
      } else {
        Tabs.movingTabs.push(...move.ids)
        move.ids.forEach(id => {
          const tab = Tabs.byId[id]
          if (tab) tab.moving = true
        })
        await browser.tabs.move(move.ids, { index: move.index, windowId: Windows.id }).catch(e => {
          Logs.err('Tabs.sortNativeTabs: Cannot move tabs', e)
        })
        move.ids.forEach(id => {
          const tab = Tabs.byId[id]
          if (tab) tab.moving = undefined
        })
      }
      Tabs.movingTabs = []
    }

    sortingNativeTabs = false
  }, delayMS)
}

export function removeBranches(ids: ID[]): void {
  for (const tab of Tabs.list) {
    if (ids.includes(tab.parentId)) ids.push(tab.id)
  }
  removeTabs(ids)
}

/**
 * Remove tabs descendants
 */
export function removeTabsDescendants(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

  const toRm: ID[] = []
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab || tabIds.includes(tab.parentId)) continue
    for (let i = tab.index + 1, t; i < Tabs.list.length; i++) {
      t = Tabs.list[i]
      if (!t || t.lvl <= tab.lvl) break
      if (!toRm.includes(t.id)) toRm.push(t.id)
    }
  }

  removeTabs(toRm)
}

/**
 * Remove tabs above
 */
export function removeTabsAbove(tabIds?: ID[]): void {
  if (!tabIds) tabIds = [Tabs.activeId]
  if (!tabIds.length) return

  let minIndex = 999999
  let startTab
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab && tab.index < minIndex) {
      minIndex = tab.index
      startTab = tab
    }
  }

  if (!startTab || startTab.pinned) return

  const toRm = []
  for (let i = startTab.index; i--; ) {
    const tab = Tabs.list[i]
    if (!tab || tab.pinned || tab.panelId !== startTab.panelId) break
    toRm.push(tab.id)
  }

  removeTabs(toRm)
}

/**
 * Remove tabs below
 */
export function removeTabsBelow(tabIds?: ID[]): void {
  if (!tabIds) tabIds = [Tabs.activeId]
  if (!tabIds.length) return

  let maxIndex = -1
  let startTab
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab && tab.index > maxIndex) {
      maxIndex = tab.index
      startTab = tab
    }
  }

  if (!startTab || startTab.pinned) return

  const toRm = []
  for (let i = startTab.index + 1; i < Tabs.list.length; i++) {
    const tab = Tabs.list[i]
    if (!tab || tab.panelId !== startTab.panelId) break
    toRm.push(tab.id)
  }

  removeTabs(toRm)
}

/**
 * Remove other tabs
 */
export function removeOtherTabs(tabIds?: ID[]): void {
  if (!tabIds) tabIds = [Tabs.activeId]
  if (!tabIds.length) return

  const firstTabId = tabIds[0]
  if (firstTabId === undefined) return

  const firstTab = Tabs.byId[firstTabId]
  if (!firstTab || firstTab.pinned) return

  const panel = Sidebar.panelsById[firstTab.panelId]
  if (!Utils.isTabsPanel(panel)) return
  const panelTabs = panel.tabs
  const toRm = []
  for (const tab of panelTabs) {
    if (!tabIds.includes(tab.id)) toRm.push(tab.id)
  }

  removeTabs(toRm)
}

const RECENTLY_REMOVED_LIMIT_MS = 30 * 60 * 1000
export function rememberRemoved(tabs: Tab[]) {
  let minLvl = 0
  let parent
  let parentIndex = 0

  const timestamp = Date.now()

  for (const tab of tabs) {
    if (tab.reopening) continue

    if (tab.parentId === NOID || tab.parentId !== parent?.id) parent = undefined

    // If tab has parent
    if (tab.parentId !== NOID && tab.parentId !== parent?.id) {
      // Try to find it in recently removed
      const index = Tabs.recentlyRemoved.findIndex(t => t.id === tab.parentId)
      if (index !== -1) {
        parent = Tabs.recentlyRemoved[index] as RecentlyClosedTabInfo
        if (!parent.isParent) parent.isParent = true
        parentIndex = index
      } else {
        parent = undefined
      }
    }

    // Set lowest level of the branch to shift result level if parent is not found
    if (tab.parentId !== NOID && !parent) minLvl = tab.lvl
    else if (tab.parentId === NOID) minLvl = 0

    // Update insertion index
    if (!parent) parentIndex = 0
    else parentIndex++

    const removedTabInfo: RecentlyClosedTabInfo = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      parentId: parent?.id ?? NOID,
      isParent: false,
      lvl: parent ? tab.lvl - minLvl : 0,
      containerId: tab.cookieStoreId,
      containerColor: Containers.reactive.byId[tab.cookieStoreId]?.color,
      favIconUrl: tab.favIconUrl,
      favPlaceholder: Favicons.getFavPlaceholder(tab.url),
      time: timestamp,
    }

    Tabs.recentlyRemoved.splice(parentIndex, 0, removedTabInfo)
  }

  // Limit recentlyRemoved list
  const limitIndex = Tabs.recentlyRemoved.findIndex(t => {
    return timestamp - t.time > RECENTLY_REMOVED_LIMIT_MS
  })
  if (limitIndex !== -1) {
    Tabs.recentlyRemoved = Tabs.recentlyRemoved.slice(0, limitIndex)
  }

  Tabs.reactive.recentlyRemovedLen = Tabs.recentlyRemoved.length
}

/**
 * Remove tabs
 */
export async function removeTabs(tabIds: ID[], silent?: boolean): Promise<void> {
  if (!tabIds || !tabIds.length) return

  const firstTabId = tabIds[0]
  if (firstTabId === undefined) return

  const firstTab = Tabs.byId[firstTabId]
  if (!firstTab) return

  const panelId = firstTab.panelId
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  sortTabIds(tabIds)

  const rmChildTabsFolded = Settings.state.rmChildTabs === 'folded'
  const rmChildTabsFoldedAll = Settings.state.rmChildTabs === 'all'
  const tabsMap: Record<ID, Tab> = {}
  const tabs: Tab[] = []
  const toRemove: ID[] = []
  let hasInvisibleTab = false
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) continue
    if (tab.panelId !== panelId) continue

    if (!tabsMap[tab.id]) {
      tabsMap[id] = tab
      tabs.push(tab)
      toRemove.push(id)
      if (tab.invisible) hasInvisibleTab = true
    }

    if ((rmChildTabsFolded && tab.folded) || rmChildTabsFoldedAll) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (!t || t.lvl <= tab.lvl) break
        if (!tabsMap[t.id]) {
          tabsMap[t.id] = t
          tabs.push(t)
          toRemove.push(t.id)
          if (t.invisible) hasInvisibleTab = true
        }
      }
    }
  }

  const count = tabs.length
  const warn =
    Settings.state.warnOnMultiTabClose === 'any' ||
    (hasInvisibleTab && Settings.state.warnOnMultiTabClose === 'collapsed')
  if (!silent && warn && count > 1) {
    const pre = translate('confirm.tabs_close_pre', count)
    const post = translate('confirm.tabs_close_post', count)
    const ok = await Popups.confirm(pre + String(count) + post)
    if (!ok) {
      Tabs.updateTabsTree(panel.startTabIndex, panel.nextTabIndex)
      return
    }
  }

  // Set tabs to be removed
  const parents: Record<ID, ID> = {}
  const lastTabToo = panel.tabs[panel.tabs.length - 1]?.id === tabs[count - 1]?.id
  let visibleLen = 0
  let activeTab: Tab | undefined

  tabs.forEach(t => {
    parents[t.id] = t.parentId
    if (!t.invisible) visibleLen++
    t.invisible = true
    if (t.active) activeTab = t
  })
  if (tabs.length === 1) Sidebar.removeFromVisibleTabs(tabs[0].panelId, tabs[0].id)
  else Sidebar.recalcVisibleTabs(tabs[0]?.panelId ?? NOID)
  const tabsInfo = Tabs.getTabsInfo(toRemove, true)
  if (Tabs.removingTabs && Tabs.removingTabs.length) {
    Tabs.removingTabs = [...Tabs.removingTabs, ...toRemove]
  } else {
    Tabs.removingTabs = [...toRemove]
  }

  // Remember removed tabs
  Tabs.rememberRemoved(tabs)

  // No-empty panels
  if (count === panel.reactive.len && panel.noEmpty) {
    Tabs.createTabInPanel(panel)
  }

  // Update successorTabId if there is an active tab
  if (activeTab) Tabs.updateSuccessionDebounced(0, toRemove)

  if (!silent && count > 1 && Settings.state.tabsRmUndoNote && !warn) {
    const nTabs = count > 3 ? tabs.slice(0, 2) : tabs
    let detailsList = nTabs.map(t => {
      return '- ' + t.title
    })
    if (count > 3) detailsList = detailsList.concat('- ...')

    Notifications.notify({
      icon: '#icon_trash',
      title: String(count) + translate('notif.tabs_rm_post', count),
      detailsList,
      ctrl: translate('notif.undo_ctrl'),
      callback: async () => undoRemove(tabsInfo, parents),
    })
  }

  if (!Selection.isSet() && visibleLen > 0) {
    Tabs.incrementScrollRetainer(panel, lastTabToo ? visibleLen - 1 : visibleLen)
  }

  // Reverse removing order (needed for reopening)
  toRemove.reverse()

  browser.tabs.remove(toRemove).catch(err => {
    Logs.err('Tabs.removeTabs: Cannot remove tabs:', err)
  })
  checkRemovedTabs()
}

let isRmFinishedInterval: number | undefined
/**
 * Checks if there is no more removing tabs with polling Tabs.removingTabs.length
 * @param checkDelay - (default: 100ms) Polling interval in ms.
 * @param stopThreshold - (default: 3) Max count of the checks with the same length of removingTabs
 *                                     after which this function will return false.
 */
export function isRemovingFinished(checkDelay = 100, stopThreshold = 3): Promise<boolean> {
  clearInterval(isRmFinishedInterval)

  let prevLen = Tabs.removingTabs.length
  let sameCounter = 0

  return new Promise(res => {
    isRmFinishedInterval = setInterval(() => {
      if (Tabs.removingTabs.length === prevLen) sameCounter++
      prevLen = Tabs.removingTabs.length

      if (Tabs.removingTabs.length === 0) {
        clearInterval(isRmFinishedInterval)
        res(true)
      }
      if (sameCounter >= stopThreshold) {
        clearInterval(isRmFinishedInterval)
        res(false)
      }
    }, checkDelay)
  })
}

export async function undoRemove(tabs: ItemInfo[], parents: Record<ID, ID>): Promise<void> {
  const firstTab = tabs[0]
  if (!firstTab) return

  const panel = Sidebar.panelsById[firstTab.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) return

  const nextTabIndex = panel.nextTabIndex
  const oldNewIds: Record<ID, ID> = {}
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const index = nextTabIndex + i

    let parentId = oldNewIds[parents[tab.id]]
    const parent = Tabs.byId[parents[tab.id]]
    if (parentId === undefined && parent && parent.index < index) {
      parentId = parent.id
    }

    setNewTabPosition(index, parentId, panel.id)

    const conf: browser.tabs.CreateProperties = {
      windowId: Windows.id,
      index,
      url: Utils.normalizeUrl(tab.url, tab.title),
      cookieStoreId: tab.container,
      active: false,
    }
    if (conf.url) {
      conf.discarded = true
      conf.title = tab.title
    }
    const newTab = await browser.tabs.create(conf)
    oldNewIds[tab.id] = newTab.id
  }
}

let checkRemovedTabsTimeout: number | undefined
/**
 * Helper function for checking if some of tabs
 * wasn't removed (e.g. tabs with onbeforeunload)
 */
export function checkRemovedTabs(delay = 750): void {
  clearTimeout(checkRemovedTabsTimeout)
  checkRemovedTabsTimeout = setTimeout(() => {
    if (!Tabs.removingTabs || !Tabs.removingTabs.length) return
    const panelIds = new Set<ID>()

    for (const tabId of Tabs.removingTabs) {
      const t = Tabs.byId[tabId]
      if (t) panelIds.add(t.panelId)

      browser.tabs
        .get(tabId)
        .then(() => {
          const tab = Tabs.byId[tabId]
          if (tab) {
            const parent = Tabs.byId[tab.parentId]

            tab.reactive.lvl = tab.lvl = parent ? parent.lvl + 1 : 0
            tab.invisible = false

            const rmIndex = Tabs.removingTabs.indexOf(tab.id)
            if (rmIndex !== -1) Tabs.removingTabs.splice(rmIndex, 1)
          }
        })
        .catch(() => {
          // Tab already removed
        })
    }

    for (const panelId of panelIds) {
      Sidebar.recalcVisibleTabs(panelId)
    }
  }, delay)
}

let switchTabPause = undefined as number | undefined
/**
 * Activate tab relative to current active tab.
 */
export function switchTab(globaly: boolean, cycle: boolean, step: number, pinned?: boolean): void {
  if (switchTabPause) return
  switchTabPause = setTimeout(() => {
    clearTimeout(switchTabPause)
    switchTabPause = undefined
  }, 50)

  const pinnedAndPanel = Settings.state.pinnedTabsPosition === 'panel' || (globaly && cycle)
  const visibleOnly = Settings.state.scrollThroughVisibleTabs
  const skipDiscarded = Settings.state.scrollThroughTabsSkipDiscarded

  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
    browser.tabs.update(targetTabId, { active: true }).catch(err => {
      Logs.err('Tabs.switchTab: Cannot activate tab (2):', err)
    })
  }
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
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab) {
    const target = findSuccessorTab(activeTab, tabIds)

    if (target) {
      // If active tab will be discraded activate another
      if (tabIds.includes(Tabs.activeId)) {
        await browser.tabs.update(target.id, { active: true })
      } else if (activeTab.successorTabId !== target.id) {
        browser.tabs.moveInSuccession([activeTab.id], target.id).catch(err => {
          Logs.err('Tabs.discardTabs: Cannot update succession:', err)
        })
      }
    }
  }

  browser.tabs.discard(tabIds).catch(err => {
    Logs.err('Tabs.discardTabs: Cannot discard:', err)
  })
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
 * (un)Mute tabs
 */
export function muteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    browser.tabs.update(tabId, { muted: true }).catch(err => {
      Logs.err('Tabs.muteTabs: Cannot mute tab:', err)
    })
  }
}
export function unmuteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    browser.tabs.update(tabId, { muted: false }).catch(err => {
      Logs.err('Tabs.unmuteTabs: Cannot unmute tab:', err)
    })
  }
}
export function remuteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue
    browser.tabs.update(tabId, { muted: !tab.mutedInfo?.muted }).catch(err => {
      Logs.err('Tabs.remuteTabs: Cannot remute tab:', err)
    })
  }
}
export function remuteAudibleTabs(): void {
  const audioIds: ID[] = []
  const mutedIds: ID[] = []
  for (const tab of Tabs.list) {
    if (tab.audible && !tab.mutedInfo?.muted) audioIds.push(tab.id)
    if (tab.mutedInfo?.muted) mutedIds.push(tab.id)
  }

  if (audioIds.length) Tabs.muteTabs(audioIds)
  else if (mutedIds.length) Tabs.unmuteTabs(mutedIds)
}
export function muteAudibleTabsOfPanel(id: ID): void {
  const panel = Sidebar.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.audible && tab.panelId === panel.id) browser.tabs.update(tab.id, { muted: true })
    }
  }

  for (const tab of panel.tabs) {
    if (tab.audible) browser.tabs.update(tab.id, { muted: true })
  }
}
export function unmuteAudibleTabsOfPanel(id: ID): void {
  const panel = Sidebar.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.mutedInfo?.muted && tab.panelId === panel.id) {
        browser.tabs.update(tab.id, { muted: false }).catch(err => {
          Logs.err('Tabs.unmuteAudibleTabsOfPanel: Cannot unmute tab:', err)
        })
      }
    }
  }

  for (const tab of panel.tabs) {
    if (tab.mutedInfo?.muted) browser.tabs.update(tab.id, { muted: false })
  }
}
export function switchToFirstAudibleTab(): void {
  const tab = Tabs.list.find(t => t.audible && !t.mutedInfo?.muted)
  if (tab) browser.tabs.update(tab.id, { active: true })
}

export async function pauseTabMedia(id?: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const tab = id !== undefined ? Tabs.byId[id] : Tabs.list.find(t => t.audible)
  if (!tab) return
  if (tab.url.startsWith('ab')) return

  tab.reactive.mediaPaused = tab.mediaPaused = true
  Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)

  browser.tabs
    .executeScript(tab.id, {
      file: '../injections/pauseMedia.js',
      runAt: 'document_start',
      allFrames: true,
    })
    .then(results => {
      if (results.every(result => result === false)) {
        tab.reactive.mediaPaused = tab.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      }
    })
    .catch(err => {
      Logs.err('Tabs.pauseTabMedia: Cannot executeScript', err)
    })

  recheckPausedTabs()
}
export async function playTabMedia(id?: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  let tab: Tab | undefined
  if (id !== undefined) tab = Tabs.byId[id]
  else tab = Tabs.list.find(t => t.mediaPaused)
  if (!tab) return

  tab.reactive.mediaPaused = tab.mediaPaused = false
  Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)

  browser.tabs
    .executeScript(tab.id, {
      file: '../injections/playMedia.js',
      runAt: 'document_start',
      allFrames: true,
    })
    .catch(err => {
      Logs.err('Tabs.playTabMedia: Cannot exec script:', err)
    })
}
export function resetPausedMediaState(panelId: ID): void {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  for (const tab of panel.tabs) {
    if (tab && tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
    }
  }
}
export async function pauseTabsMediaOfPanel(panelId: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/pauseMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.url.startsWith('ab')) continue
      if ((tab.audible || tab.mutedInfo?.muted) && tab.panelId === panel.id) {
        tab.reactive.mediaPaused = tab.mediaPaused = true
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
        browser.tabs
          .executeScript(tab.id, injectionConfig)
          .then(results => {
            if (results.every(result => result === false)) {
              tab.reactive.mediaPaused = tab.mediaPaused = false
              Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
            }
          })
          .catch(err => {
            Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
          })
      }
    }
  }

  for (const tab of panel.tabs) {
    if (tab.url.startsWith('ab')) continue
    if (tab.audible || tab.mutedInfo?.muted) {
      tab.reactive.mediaPaused = tab.mediaPaused = true
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs
        .executeScript(tab.id, injectionConfig)
        .then(results => {
          if (results.every(result => result === false)) {
            tab.reactive.mediaPaused = tab.mediaPaused = false
            Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
          }
        })
        .catch(err => {
          Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
        })
    }
  }

  recheckPausedTabs()
}
export async function playTabsMediaOfPanel(panelId: ID): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/playMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  if (Settings.state.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.mediaPaused && tab.panelId === panel.id) {
        tab.reactive.mediaPaused = tab.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
        browser.tabs.executeScript(tab.id, injectionConfig).catch(err => {
          Logs.err('Tabs.playTabsMediaOfPanel: Cannot exec script (pinned):', err)
        })
      }
    }
  }

  for (const tab of panel.tabs) {
    if (tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs.executeScript(tab.id, injectionConfig).catch(err => {
        Logs.err('Tabs.playTabsMediaOfPanel: Cannot exec script:', err)
      })
    }
  }
}
let recheckPausedTabsTimeout: number | undefined
function recheckPausedTabs(delay = 3500): void {
  clearTimeout(recheckPausedTabsTimeout)
  recheckPausedTabsTimeout = setTimeout(() => {
    for (const tab of Tabs.list) {
      if (tab.mediaPaused && tab.audible) {
        tab.reactive.mediaPaused = tab.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      }
    }
  }, delay)
}
export async function pauseAllAudibleTabsMedia(): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/pauseMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  for (const tab of Tabs.list) {
    if (tab.audible) {
      tab.reactive.mediaPaused = tab.mediaPaused = true
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs
        .executeScript(tab.id, injectionConfig)
        .then(results => {
          if (results.every(result => result === false)) {
            tab.reactive.mediaPaused = tab.mediaPaused = false
            Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
          }
        })
        .catch(err => {
          Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
        })
    }
  }

  recheckPausedTabs()
}
export async function playAllPausedTabsMedia(): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/playMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  for (const tab of Tabs.list) {
    if (tab.mediaPaused) {
      tab.reactive.mediaPaused = tab.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      browser.tabs.executeScript(tab.id, injectionConfig).catch(err => {
        Logs.err('Tabs.playAllPausedTabsMedia: Cannot exec script:', err)
      })
    }
  }
}

/**
 * Duplicate tabs
 */
export async function duplicateTabs(tabIds: ID[]): Promise<void> {
  const active = tabIds.length === 1

  // Sort tab ids
  tabIds.sort((aId, bId) => {
    const aTab = Tabs.byId[aId]
    const bTab = Tabs.byId[bId]
    if (!aTab || !bTab) return 0
    return aTab.index - bTab.index
  })

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
        panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
          const dupAncestorId = Tabs.findAncestor(t.id, id => tabIds.includes(id))
          if (dupAncestorId !== undefined) {
            descendantsToDuplicate.push([t.id, dupAncestorId])
            processed.push(t.id)
          }
        }
      }
    }

    const oldNewIds: Record<ID, ID> = {}
    setNewTabPosition(index, tab.parentId, dstPanelId)
    const dupTab = await browser.tabs.duplicate(tabId, { active, index })
    oldNewIds[tabId] = dupTab.id

    for (const [descendantTabId, descendantParentId] of descendantsToDuplicate) {
      index++
      const dupDescendantParentId = oldNewIds[descendantParentId]
      setNewTabPosition(index, dupDescendantParentId, dstPanelId)
      const dupDescendantTab = await browser.tabs.duplicate(descendantTabId, { active, index })
      oldNewIds[descendantTabId] = dupDescendantTab.id
    }
  }
}

export function findAncestor(tabId: ID, cb: (ancestorId: ID) => boolean): ID | void {
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
export function dedupTabs(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

  const urls: string[] = []
  const toRemove = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) return

    if (urls.includes(tab.url)) toRemove.push(tab.id)
    else urls.push(tab.url)
  }

  removeTabs(toRemove)
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

      const info = { id: tab.id, title: result.name, container: tab.cookieStoreId }
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

export async function move(
  tabsInfo: DeepReadonly<ItemInfo[]>,
  src: SrcPlaceInfo,
  dst: DstPlaceInfo
): Promise<void> {
  if (!tabsInfo.length) return

  // Logs.info('Tabs.move', tabsInfo.length, dst.index, dst.parentId, dst.panelId)

  // Ask about target window
  if (dst.windowChooseConf) {
    dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
    if (dst.windowId === NOID) return
  }

  // Move tabs from another window to this window
  if (src.windowId !== undefined && src.windowId !== Windows.id) {
    const tabIds = tabsInfo.map(t => t.id)
    let externalTabs
    try {
      externalTabs = await IPC.bg('getSidebarTabs', src.windowId, tabIds)
    } catch {
      Logs.warn('Tabs.move: Move tabs from another window: Cannot get tabs from sidebar')
    }
    if (!externalTabs) {
      const winNativeTabs = await browser.tabs.query({ windowId: src.windowId })
      externalTabs = []
      for (const tabInfo of tabsInfo) {
        const nativeTab = winNativeTabs.find(t => t.id === tabInfo.id)
        if (!nativeTab) continue
        const tab = mutateNativeTabToSideberyTab(nativeTab)
        tab.panelId = tabInfo.panelId ?? dst.panelId ?? NOID
        externalTabs.push(tab)
      }
    }
    if (externalTabs) moveToThisWin(externalTabs, dst)
    return
  }

  // Move tabs to new window
  if (dst.windowId === NEWID) {
    Tabs.detachingTabIds = []
    const info: ItemInfo[] = tabsInfo.map(t => {
      Tabs.detachingTabIds.push(t.id)
      return {
        id: t.id,
        url: t.url,
        parentId: t.parentId,
        panelId: t.panelId ?? dst.panelId,
      }
    })
    const conf = { incognito: dst.incognito, tabId: MOVEID }
    IPC.bg('createWindowWithTabs', info, conf).finally(() => (Tabs.detachingTabIds = []))
    return
  }

  // Move tabs to another window
  if (dst.windowId !== undefined && dst.windowId !== Windows.id) {
    const tabIds = tabsInfo.map(t => t.id)
    if (dst.windowId !== undefined && dst.windowId !== NOID) {
      return moveTabsToWin(tabIds, dst.windowId)
    } else {
      if (dst.windowChooseConf) return moveTabsToWin(tabIds, dst.windowChooseConf)
      else return moveTabsToWin(tabIds)
    }
  }

  // Moving tabs inside current window
  // ---

  // Normalize dst info
  if (dst.parentId === undefined) dst.parentId = NOID
  if (dst.index === undefined) dst.index = 0
  if (dst.index === -1) {
    const panel = Sidebar.panelsById[dst.panelId ?? NOID]
    if (!Utils.isTabsPanel(panel)) return Logs.warn('Tabs.move: No panel')
    dst.index = panel.nextTabIndex
  }

  // Gather tabs by type (pinned/normal), get initial info
  const dstTab: Tab | undefined = Tabs.list[dst.index]
  const dstParent = Tabs.byId[dst.parentId]
  const pinnedTabs: Tab[] = []
  const normalTabs: Tab[] = []
  let toPin: Tab[] | undefined
  let toUnpin: Tab[] | undefined
  let tabs: Tab[] = []
  let isPinnedActive = false
  for (const info of tabsInfo) {
    const tab = Tabs.byId[info.id]
    if (!tab) continue
    // Logs.info('Tabs.move: tabId', tab.id)
    if (tab.pinned) pinnedTabs.push(tab)
    else normalTabs.push(tab)
    tabs.push(tab)
  }

  if (!tabs.length) return

  // Switch panelId of pinned tabs and exclude them from general list
  if (
    pinnedTabs.length &&
    dst.pinned === undefined &&
    Settings.state.pinnedTabsPosition === 'panel'
  ) {
    for (const tab of pinnedTabs) {
      if (!isPinnedActive && tab.active) isPinnedActive = true

      if (dst.panelId !== undefined) {
        if (tab.audible || tab.mutedInfo?.muted || tab.mediaPaused) {
          Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId)
          Sidebar.updateMediaStateOfPanelDebounced(100, dst.panelId)
        }

        tab.panelId = dst.panelId
      }
      saveTabData(tab.id)
    }

    tabs = normalTabs
  }

  // Unpin
  else if (pinnedTabs.length && !dst.pinned) {
    for (const tab of pinnedTabs) {
      tab.reactive.pinned = tab.pinned = false
    }
    toUnpin = pinnedTabs
  }

  // Pin
  else if (normalTabs.length && dst.pinned) {
    for (const tab of normalTabs) {
      tab.reactive.pinned = tab.pinned = true
    }
    toPin = normalTabs
  }

  // All tabs are pinned and was handled
  if (!tabs.length) {
    Sidebar.recalcTabsPanels()
    Tabs.cacheTabsData()

    // Switch panel
    if (
      isPinnedActive &&
      dst.pinned === undefined &&
      dst.panelId !== undefined &&
      Settings.state.tabsPanelSwitchActMove
    ) {
      Sidebar.activatePanel(dst.panelId)
    }

    return
  }

  const ids = []
  let dstIndexIncluded = -1
  let prevIndex = 0
  let panelIsChanged = false
  let isActive = false
  let isMediaActive = false
  let mediaPrevPanelId
  let srcPanelId
  for (const tab of tabs) {
    // Cut tab from old index in sidebery list
    const index = Tabs.list.indexOf(tab, prevIndex)
    if (index === -1) continue
    Tabs.list.splice(index, 1)

    if (tab.active) isActive = true

    prevIndex = index
    ids.push(tab.id)

    // Get dstIndex if target tab included in moving tabs list
    if (dstTab && dstTab.id === tab.id) dstIndexIncluded = index

    // Update panelId
    if (dst.panelId !== undefined && tab.panelId !== dst.panelId) {
      if (!panelIsChanged) panelIsChanged = true
      srcPanelId = tab.panelId
      if (!isMediaActive && (tab.audible || tab.mutedInfo?.muted || tab.mediaPaused)) {
        isMediaActive = true
        mediaPrevPanelId = tab.panelId
      }
      tab.panelId = dst.panelId
    }

    // Update parent-child relation
    const oldParent = Tabs.byId[tab.parentId]
    if (!oldParent || !tabs.includes(oldParent)) {
      tab.parentId = dst.parentId

      if (dstParent) browser.tabs.update(tab.id, { openerTabId: dst.parentId })
      else browser.tabs.update(tab.id, { openerTabId: tab.id })
    }
  }

  // Paste tabs to the new index
  if (dstTab) {
    const dstIndex = dstIndexIncluded !== -1 ? dstIndexIncluded : Tabs.list.indexOf(dstTab)
    if (dstIndex === -1) return Logs.warn('Tabs.move: Cannot find index of the dstTab')
    Tabs.list.splice(dstIndex, 0, ...tabs)
  } else {
    Tabs.list.splice(Tabs.list.length, 0, ...tabs)
  }

  Tabs.updateTabsIndexes()
  Tabs.updateTabsTree()
  Sidebar.recalcTabsPanels()
  if (srcPanelId) Sidebar.recalcVisibleTabs(srcPanelId)
  if (dst.panelId && dst.panelId !== srcPanelId) Sidebar.recalcVisibleTabs(dst.panelId)

  // Update media state of panels
  if (isMediaActive && mediaPrevPanelId && dst.panelId) {
    Sidebar.updateMediaStateOfPanelDebounced(100, mediaPrevPanelId)
    Sidebar.updateMediaStateOfPanelDebounced(100, dst.panelId)
  }

  // Switch panel
  if (
    isActive &&
    dst.pinned === undefined &&
    dst.panelId !== undefined &&
    Settings.state.tabsPanelSwitchActMove
  ) {
    Sidebar.activatePanel(dst.panelId)
  }

  // Update branch colors
  if (Settings.state.colorizeTabsBranches) {
    for (const tab of tabs) {
      Tabs.setBranchColor(tab.id)
    }
  }

  // Activate folded parent tab
  if (isActive && dstParent && dstParent.folded) {
    browser.tabs.update(dstParent.id, { active: true }).catch(err => {
      Logs.err('Tabs.move: Cannot activate tab:', err)
    })
  }

  tabs.forEach(t => saveTabData(t.id))
  cacheTabsData()

  // Mark moving tabs
  Tabs.movingTabs.push(...ids)
  tabs.forEach(t => (t.moving = true))

  // Update native tabs
  // ---
  // Unpin tab
  if (toUnpin?.length) {
    for (const tab of toUnpin) {
      tab.unpinning = true
      await browser.tabs.update(tab.id, { pinned: false }).catch(err => {
        Logs.err('Tabs.move: Cannot unpin tab', err)
      })
      tab.unpinning = false
    }
  }

  // Pin tab
  if (toPin?.length) {
    for (const tab of toPin) {
      await browser.tabs.update(tab.id, { pinned: true, openerTabId: tab.id }).catch(err => {
        Logs.err('Tabs.move: Cannot pin tab', err)
      })
    }
  }

  // Move tabs
  const nativeDstIndex = dst.index <= tabs[0].index ? dst.index : dst.index - 1
  // TODO: Do not call this fn if: all tabs go one after another and srcIndex === dstIndex
  await browser.tabs.move(ids, { windowId: Windows.id, index: nativeDstIndex }).catch(err => {
    Logs.err('Tabs.move: Cannot move native tabs', err)
  })

  // Reset moving tabs marks
  tabs.forEach(t => (t.moving = undefined))
  Tabs.movingTabs = []

  // Update visibility
  if (Settings.state.hideFoldedTabs || (Settings.state.hideInact && panelIsChanged)) {
    Tabs.updateNativeTabsVisibility()
  }
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(
  tabIds: ID[],
  windowIdOrConfig?: ID | WindowChoosingDetails
): Promise<void> {
  // Logs.info('Tabs.moveTabsToWin', tabIds)
  let windowId: ID
  if (windowIdOrConfig === undefined) windowId = await Windows.showWindowsPopup()
  else if (typeof windowIdOrConfig !== 'object') windowId = windowIdOrConfig
  else windowId = await Windows.showWindowsPopup(windowIdOrConfig)

  // Sort
  sortTabIds(tabIds)

  // Check if there is active tab and update successor id for it
  const activeTabId = tabIds.find(id => Tabs.byId[id]?.active)
  const activeTab = activeTabId !== undefined ? Tabs.byId[activeTabId] : undefined
  if (activeTab) {
    const target = findSuccessorTab(activeTab, tabIds)
    if (target) await browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  const tabs = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) continue
    tabs.push(Utils.cloneObject(tab))
    Tabs.detachingTabIds.push(tab.id)

    // TODO: Option to automatically include all/folded descendant tabs?
  }

  let sidebarIsOpen
  if (windowId !== Windows.id) {
    sidebarIsOpen = await browser.sidebarAction.isOpen({ windowId }).catch(() => false)
  }

  let moved
  if (sidebarIsOpen) {
    moved = await IPC.sidebar(windowId, 'moveTabsToThisWin', tabs).catch(() => false)
  }

  if (!moved) {
    await browser.tabs.move(
      tabs.map(t => t.id),
      { windowId, index: -1 }
    )
  }

  cacheTabsData()
}

export async function moveToThisWin(tabs: Tab[], dst?: DstPlaceInfo): Promise<boolean> {
  if (!tabs || !tabs.length) return false
  if (!Tabs.attachingTabs) Tabs.attachingTabs = [...tabs]
  else Tabs.attachingTabs.push(...tabs)

  // Find appropriate destination
  if (!dst) {
    const isPinned = tabs[0].pinned
    const panel = Sidebar.panelsById[tabs[0].panelId]
    let nextIndex
    if (Utils.isTabsPanel(panel) && panel.nextTabIndex > -1) nextIndex = panel.nextTabIndex
    else nextIndex = Tabs.list.length
    dst = { panelId: tabs[0].panelId, parentId: -1, index: isPinned ? 0 : nextIndex }
  }

  const tabIds = tabs.map(t => t.id)

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const parent = Tabs.byId[dst.parentId ?? tab.parentId ?? NOID]
    const index = (dst.index ?? 0) + i
    if (!!tab.pinned !== !!dst.pinned) {
      await browser.tabs.update(tab.id, { pinned: !!dst.pinned })
      tab.pinned = !!dst.pinned
      tab.reactive.pinned = tab.pinned
    }
    // Reset "hidden" flag b/c moving hidden tabs between windows makes them not hidden
    tab.hidden = false
    // Check parent tab
    if (tab.parentId === -1 || (tab.parentId !== -1 && !tabIds.includes(tab.parentId))) {
      tab.reactive.lvl = tab.lvl = parent ? parent.lvl + 1 : 0
      tab.parentId = parent ? parent.id : -1
    }
    // Check child tabs
    if (tab.isParent && !tabs.find(t => t.parentId === tab.id)) {
      tab.isParent = false
      tab.folded = false
    }
    setNewTabPosition(index, tab.parentId, dst.panelId ?? NOID)
    browser.tabs.move(tab.id, { windowId: Windows.id, index }).catch(err => {
      Logs.err('Tabs.moveToThisWin: Cannot move tab:', err)
    })
  }

  return true
}

export async function moveToNewPanel(tabIds: ID[]): Promise<void> {
  if (!tabIds.length) return
  Tabs.sortTabIds(tabIds)

  const probeTab = Tabs.byId[tabIds[0]]
  if (!probeTab) return Logs.warn('Tabs.moveToNewPanel: No first tab')

  const srcPanel = Sidebar.panelsById[probeTab?.panelId ?? NOID]
  if (!Utils.isTabsPanel(srcPanel)) return Logs.warn('Tabs.moveToNewPanel: No src panel')

  const index = Sidebar.reactive.nav.indexOf(srcPanel.id)
  if (index === -1) return Logs.warn('Tabs.moveToNewPanel: Cannot find target index')

  // Create new panel
  const noTabsPanels = !Sidebar.hasTabs
  const result = await Popups.openPanelPopup({ type: PanelType.tabs }, index + 1)
  if (!result) return

  const dstPanel = Sidebar.panelsById[result]
  if (!Utils.isTabsPanel(dstPanel)) return

  Sidebar.activatePanel(dstPanel.id)

  if (noTabsPanels) await Tabs.load()

  // Move
  const items = Tabs.getTabsInfo(tabIds)
  const src = { windowId: Windows.id, panelId: srcPanel.id, pinned: probeTab.pinned }
  await Tabs.move(items, src, { panelId: dstPanel.id, index: dstPanel.nextTabIndex })
}

/**
 * Update tabs visibility
 */
export function updateNativeTabsVisibility(): void {
  const hideFolded = Settings.state.hideFoldedTabs
  const hideFoldedParent = hideFolded && Settings.state.hideFoldedParent === 'any'
  const hideFoldedGroup = hideFolded && Settings.state.hideFoldedParent === 'group'
  const hideInact = Settings.state.hideInact

  if (!browser.tabs.hide) return

  const actTab = Tabs.byId[Tabs.activeId]

  let actPanel
  if (actTab?.pinned) actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
  if (!Settings.state.tabsChildCount) return

  const branchLen = Tabs.getBranchLen(id)
  if (branchLen === undefined) return

  const tab = Tabs.byId[id]
  if (!tab) return

  tab.reactive.branchLen = branchLen
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
    if (Settings.state.discardFoldedDelay === 0) {
      browser.tabs.discard(toHide)
    } else {
      let delayMS = Settings.state.discardFoldedDelay
      if (Settings.state.discardFoldedDelayUnit === 'sec') delayMS *= 1000
      if (Settings.state.discardFoldedDelayUnit === 'min') delayMS *= 60000
      clearTimeout(rootTab.autoUnloadFoldedTimeout)
      rootTab.autoUnloadFoldedTimeout = setTimeout(() => {
        const parentTab = Tabs.byId[rootTabId]
        if (parentTab?.isParent && parentTab.folded) {
          browser.tabs.discard(Tabs.getBranch(parentTab, false).map(t => t.id))
        }
      }, delayMS)
    }
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
export function expTabsBranch(rootTabId: ID): void {
  const autoFoldTabs = Settings.state.autoFoldTabs
  const hideFolded = Settings.state.hideFoldedTabs
  const hideFoldedParent = hideFolded && Settings.state.hideFoldedParent === 'any'
  const hideFoldedGroup = hideFolded && Settings.state.hideFoldedParent === 'group'
  const toShow: ID[] = []
  const preserve: ID[] = []
  let autoFold: Tab[] = []

  const rootTab = Tabs.byId[rootTabId]
  if (!rootTab) return

  const panel = Sidebar.panelsById[rootTab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  rootTab.lastAccessed = Date.now()
  if (rootTab.invisible) expTabsBranch(rootTab.parentId)

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
      if (b.childLastAccessed) bMax = Math.max(b.lastAccessed, b.childLastAccessed)
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
    browser.tabs.show?.(rootTabId).catch(err => {
      Logs.err('Tabs.expTabsBranch: Cannot show parent tab:', err)
    })
  }

  if (hideFolded && toShow.length) {
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
  const toFlat: ID[] = []
  const ttf: Tab[] = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab) {
      ttf.push(tab)
      toFlat.push(id)
    }
  }
  for (const tab of Tabs.list) {
    if (tab.hidden) continue
    if (toFlat.includes(tab.id) && tab.lvl < minLvlTab.lvl) minLvlTab = tab
    if (toFlat.includes(tab.parentId)) {
      if (!toFlat.includes(tab.id)) {
        toFlat.push(tab.id)
        ttf.push(tab)
      }
      if (tab.lvl < minLvlTab.lvl) minLvlTab = tab
    }
  }

  if (!minLvlTab.parentId) return
  for (const tab of ttf) {
    tab.reactive.lvl = tab.lvl = minLvlTab.lvl
    tab.parentId = minLvlTab.parentId
    if (tab.parentId === -1) browser.tabs.update(tab.id, { openerTabId: tab.id })
  }

  updateTabsTree(ttf[0].index - 1, ttf[ttf.length - 1].index + 1)

  ttf.forEach(t => saveTabData(t.id))
  cacheTabsData()
}

/**
 * Create tab after another tab
 */
export function createTabAfter(tabId: ID): void {
  // Get target tab
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  // Get index and parentId for new tab
  const parentId = targetTab.parentId
  let index = targetTab.index + 1
  while (Tabs.list[index] && Tabs.list[index].lvl > targetTab.lvl) {
    index++
  }

  setNewTabPosition(index, parentId, targetTab.panelId)

  browser.tabs
    .create({
      index,
      cookieStoreId: targetTab.cookieStoreId,
      windowId: Windows.id,
    })
    .catch(err => {
      Logs.err('Tabs.createTabAfter: Cannot create tab:', err)
    })
}

/**
 * Create child tab
 */
export function createChildTab(tabId: ID, url?: string, containerId?: string): void {
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  const panel = Sidebar.panelsById[targetTab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  const conf = { openerTabId: tabId, autoGroupped: false, index: targetTab.index + 1 }
  const targetIndex = Tabs.getIndexForNewTab(panel, conf)

  setNewTabPosition(targetIndex, targetTab.id, targetTab.panelId)

  const config: browser.tabs.CreateProperties = {
    index: targetIndex,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: Windows.id,
  }

  if (url) config.url = url
  if (containerId) config.cookieStoreId = containerId

  browser.tabs.create(config).catch(err => {
    Logs.err('Tabs.createChildTab: Cannot create tab:', err)
  })
}

let _creatingTabInPanel = false
const _createTabInPanelQueue: (() => Promise<void>)[] = []
/**
 * Create new tab in panel
 */
export async function createTabInPanel(panel: Panel, conf?: browser.tabs.CreateProperties) {
  if (!Utils.isTabsPanel(panel)) return
  if (_creatingTabInPanel) {
    _createTabInPanelQueue.push(() => createTabInPanel(panel, conf))
    return
  }

  if (Tabs.moveRules.length && conf?.cookieStoreId) {
    const rule = Tabs.findMoveRuleBy(conf.cookieStoreId)
    if (rule) {
      const panelByRule = Sidebar.panelsById[rule.panelId]
      if (Utils.isTabsPanel(panelByRule)) panel = panelByRule
    }
  }

  const tabShell = {} as Tab
  let index = getIndexForNewTab(panel, tabShell)
  const parentId = getParentForNewTab(panel)
  if (!Utils.isTabsPanel(panel)) return
  if (index === undefined && panel.nextTabIndex > -1) index = panel.nextTabIndex

  const config: browser.tabs.CreateProperties = {
    index,
    windowId: Windows.id,
    cookieStoreId: conf?.cookieStoreId,
  }

  if (conf?.url) config.url = conf.url
  if (conf?.active !== undefined) config.active = conf.active
  if (index !== undefined) setNewTabPosition(index, parentId ?? NOID, panel.id)
  if (panel.newTabCtx !== 'none' && !conf?.cookieStoreId) config.cookieStoreId = panel.newTabCtx

  _creatingTabInPanel = true
  await browser.tabs.create(config).catch(err => {
    Logs.err('Tabs.createTabInPanel: Cannot create tab:', err)
  })
  _creatingTabInPanel = false

  if (_createTabInPanelQueue.length) {
    const cb = _createTabInPanelQueue.shift()
    if (cb) cb()
  }
}

let updateTabsTreeTimeout: number | undefined
export function updateTabsTreeDebounced(startIndex = 0, endIndex = -1, delay = 150): void {
  clearTimeout(updateTabsTreeTimeout)
  updateTabsTreeTimeout = setTimeout(() => {
    updateTabsTree(startIndex, endIndex)
  }, delay)
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
    if (tab.customTitle) data.ct = tab.customTitle
    if (tab.customColor) data.cc = tab.customColor

    prevPanelId = tab.panelId

    tree.push(data)
  }
  return tree
}

/**
 * Find the nearest tabs panel
 */
function findTabsPanelNearToTabIndex(tabIndex: number): TabsPanel | undefined {
  let nearestPanel: TabsPanel | undefined
  const prevTab = Tabs.list[tabIndex - 1]
  const nextTab = Tabs.list[tabIndex + 1]

  if (prevTab && !prevTab.pinned) {
    nearestPanel = Sidebar.panelsById[prevTab.panelId] as TabsPanel
  }
  if (!nearestPanel && nextTab) {
    nearestPanel = Sidebar.panelsById[nextTab.panelId] as TabsPanel
  }
  if (!nearestPanel) {
    nearestPanel = Sidebar.panels.find(p => Utils.isTabsPanel(p)) as TabsPanel
  }

  return nearestPanel
}

export function getPanelForNewTab(tab: Tab): TabsPanel | undefined {
  const parentTab = Tabs.byId[tab.openerTabId ?? NOID]
  let activePanel: Panel | undefined = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) {
    activePanel = Sidebar.panelsById[Sidebar.lastTabsPanelId]
  }
  if (!Utils.isTabsPanel(activePanel)) activePanel = undefined

  // Find panel by move rule
  if (Tabs.moveRules.length) {
    const hasParent = Settings.state.tabsTree && parentTab && !parentTab.pinned
    const rule = Tabs.findMoveRuleBy(tab.cookieStoreId, hasParent ? 1 : 0)
    if (rule) {
      const panel = Sidebar.panelsById[rule.panelId]
      if (Utils.isTabsPanel(panel)) return panel
    }
  }

  // Find panel for tab opened from pinned tab
  if (parentTab && parentTab.pinned) {
    if (Settings.state.moveNewTabPin === 'start' || Settings.state.moveNewTabPin === 'end') {
      return activePanel || findTabsPanelNearToTabIndex(tab.index)
    }
  }

  // Find panel for tab opened from another tab
  if (parentTab && !parentTab.pinned) {
    const panelOfParent = Sidebar.panelsById[parentTab.panelId] as TabsPanel
    if (!Settings.state.moveNewTabParentActPanel || panelOfParent === activePanel) {
      return panelOfParent
    }
  }

  // Find panel in other cases
  if (Settings.state.moveNewTab === 'start' || Settings.state.moveNewTab === 'end') {
    return activePanel || findTabsPanelNearToTabIndex(tab.index)
  }
  if (
    Settings.state.moveNewTab === 'before' ||
    Settings.state.moveNewTab === 'after' ||
    Settings.state.moveNewTab === 'first_child' ||
    Settings.state.moveNewTab === 'last_child'
  ) {
    const activeTab = Tabs.byId[Tabs.activeId]
    const panelOfActiveTab = Sidebar.panelsById[activeTab?.panelId ?? NOID] as TabsPanel

    if (activeTab && !activeTab.pinned && panelOfActiveTab) return panelOfActiveTab
    else return activePanel || findTabsPanelNearToTabIndex(tab.index)
  }

  return findTabsPanelNearToTabIndex(tab.index)
}

interface IndexForNewTabConf {
  openerTabId?: ID
  autoGroupped: boolean
  index: number
}

/**
 * Find and return index for new tab.
 */
export function getIndexForNewTab(panel: TabsPanel, conf?: IndexForNewTabConf): number {
  const parent = Tabs.byId[conf?.openerTabId ?? NOID]
  const startIndex = panel.startTabIndex > -1 ? panel.startTabIndex : 0
  const nextIndex = panel.nextTabIndex > -1 ? panel.nextTabIndex : Tabs.list.length
  const activeTab = Tabs.byId[Tabs.activeId]
  const autoGroupped = conf ? conf.autoGroupped : false
  const fallbackIndex = conf ? conf.index : nextIndex

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) {
    if (Settings.state.moveNewTabPin === 'start') return startIndex
    if (Settings.state.moveNewTabPin === 'end') return nextIndex
  }

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (Settings.state.moveNewTabParent === 'before' && !autoGroupped) return parent.index
    if (Settings.state.moveNewTabParent === 'first_child') return parent.index + 1
    if (
      Settings.state.moveNewTabParent === 'sibling' ||
      Settings.state.moveNewTabParent === 'last_child' ||
      autoGroupped
    ) {
      if (Settings.state.tabsTree) {
        // Use levels to find the end of branch
        let t
        let index = parent.index + 1
        for (; index < Tabs.list.length; index++) {
          t = Tabs.list[index]
          if (t.lvl <= parent.lvl) break
        }
        return index
      } else {
        // Use ids map to find the end of branch
        const ids = { [parent.id]: true }
        let index = parent.index + 1
        for (let t; index < Tabs.list.length; index++) {
          t = Tabs.list[index]
          if (!ids[t.openerTabId ?? NOID]) break
          ids[t.id] = true
        }
        return index
      }
    }
    if (Settings.state.moveNewTabParent === 'start' && !autoGroupped) return startIndex
    if (Settings.state.moveNewTabParent === 'end' && !autoGroupped) return nextIndex
    if (Settings.state.moveNewTabParent === 'default' && !autoGroupped) return fallbackIndex
  }

  // Place new tab (for the other cases)
  if (Settings.state.moveNewTab === 'start') return startIndex
  if (Settings.state.moveNewTab === 'end') return nextIndex
  if (Settings.state.moveNewTab === 'before') {
    if (!activeTab || activeTab.panelId !== panel.id) return nextIndex
    else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else return activeTab.index
  }
  if (Settings.state.moveNewTab === 'after') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else {
      let index = activeTab.index + 1
      for (let t; index < Tabs.list.length; index++) {
        t = Tabs.list[index]
        if (t.lvl <= activeTab.lvl) break
      }
      return index
    }
  }
  if (Settings.state.moveNewTab === 'first_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else {
      return activeTab.index + 1
    }
  }
  if (Settings.state.moveNewTab === 'last_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      if (Settings.state.moveNewTabActivePin === 'end') return nextIndex
      return startIndex
    } else {
      let index = activeTab.index + 1
      for (let t; index < Tabs.list.length; index++) {
        t = Tabs.list[index]
        if (t.lvl <= activeTab.lvl) break
      }
      return index
    }
  }

  return fallbackIndex
}

/**
 * Find and return parent id
 */
export function getParentForNewTab(panel: Panel, openerTabId?: ID): ID | undefined {
  const activeTab = Tabs.byId[Tabs.activeId]

  let parent: Tab | undefined
  if (openerTabId) parent = Tabs.byId[openerTabId]

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) return

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (Settings.state.moveNewTabParent === 'before') return parent.parentId
    if (Settings.state.moveNewTabParent === 'sibling') return parent.parentId
    if (Settings.state.moveNewTabParent === 'first_child') return openerTabId
    if (Settings.state.moveNewTabParent === 'last_child') return openerTabId
    if (Settings.state.moveNewTabParent === 'start') return
    if (Settings.state.moveNewTabParent === 'end') return
    if (Settings.state.moveNewTabParent === 'default') return openerTabId
    if (Settings.state.moveNewTabParent === 'none') return openerTabId
  }

  // Place new tab (for the other cases)
  if (Settings.state.moveNewTab === 'start') return
  if (Settings.state.moveNewTab === 'end') return
  if (activeTab && activeTab.panelId === panel.id && !activeTab.pinned) {
    if (Settings.state.moveNewTab === 'before') return activeTab.parentId
    else if (Settings.state.moveNewTab === 'after') return activeTab.parentId
    else if (Settings.state.moveNewTab === 'first_child') return activeTab.id
    else if (Settings.state.moveNewTab === 'last_child') return activeTab.id
  }

  return openerTabId
}

export function handleReopening(tabId: ID, dstContainerId?: string): number | undefined {
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  if (!dstContainerId) dstContainerId = CONTAINER_ID

  targetTab.reopening = { id: NOID }

  let parentId: ID = -1
  let panel: TabsPanel | undefined
  let panelId
  let index

  if (Tabs.moveRules.length) {
    const rule = Tabs.findMoveRuleBy(dstContainerId, targetTab.lvl)
    if (rule) {
      panel = Sidebar.panelsById[rule.panelId] as TabsPanel | undefined
    }
  }

  if (panel) {
    index = getIndexForNewTab(panel, {} as Tab)
    if (index === undefined) index = panel.nextTabIndex
    panelId = panel.id
  } else {
    parentId = targetTab.parentId
    panelId = targetTab.panelId
  }

  if (index === undefined) index = targetTab.index

  setNewTabPosition(index, parentId, panelId)

  return index
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

/**
 * Set expected position (parent/panel) of new tab by its index
 */
export function setNewTabPosition(
  index: number,
  parentId: ID,
  panelId: ID,
  unread?: boolean
): void {
  Tabs.newTabsPosition[index] = {
    parent: parentId,
    panel: panelId,
    unread: unread,
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
export function findSuccessorTab(tab: Tab, exclude?: ID[]): Tab | undefined {
  // Logs.info('Tabs.findSuccessorTab', tab.id, exclude)
  let target
  const tree = Settings.state.tabsTree
  const rmFolded = Settings.state.rmChildTabs === 'folded'
  const rmChild = Settings.state.rmChildTabs === 'all'
  const skipFolded = Settings.state.activateAfterClosingNoFolded
  const skipDiscarded = Settings.state.activateAfterClosingNoDiscarded
  const dirNext = Settings.state.activateAfterClosing === 'next'
  const dirPrev = Settings.state.activateAfterClosing === 'prev'
  const stayInPanel = Settings.state.activateAfterClosingStayInPanel

  if (Tabs.removingTabs && !exclude) exclude = Tabs.removingTabs

  if (tab.pinned && (dirNext || dirPrev)) {
    let discardedFallback: Tab | undefined
    const pinInPanels = Settings.state.pinnedTabsPosition === 'panel'
    const dirDir = dirNext ? 1 : -1
    const opDir = dirDir * -1
    if (Tabs.byId[tab.relGroupId]) target = Tabs.byId[tab.relGroupId]
    // Search in pinned tabs after active
    if (!target) {
      for (let foundTab, i = tab.index + dirDir; (foundTab = Tabs.list[i]); i += dirDir) {
        if (!foundTab?.pinned) break

        // Skip discarded tab
        if (skipDiscarded && foundTab.discarded) {
          if (!discardedFallback) discardedFallback = foundTab
          continue
        }

        if (pinInPanels && foundTab.panelId === tab.panelId) target = foundTab
        else if (!pinInPanels) target = foundTab
      }
    }
    // Search in pinned tabs before active
    if (!target) {
      for (let foundTab, i = tab.index + opDir; (foundTab = Tabs.list[i]); i += opDir) {
        if (!foundTab?.pinned) break

        // Skip discarded tab
        if (skipDiscarded && foundTab.discarded) {
          if (!discardedFallback) discardedFallback = foundTab
          continue
        }

        if (pinInPanels && foundTab.panelId === tab.panelId) target = foundTab
        else if (!pinInPanels) target = foundTab
      }
    }
    // Search in current panel
    if (!target) {
      let panel
      if (pinInPanels) panel = Sidebar.panelsById[tab.panelId]
      else panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
      if (Utils.isTabsPanel(panel)) {
        for (const tab of panel.tabs) {
          // Skip discarded tab
          if (skipDiscarded && tab.discarded) {
            if (!discardedFallback) discardedFallback = tab
            continue
          }

          target = tab
          break
        }
      }
    }
    // Check the last active tab of the previous active tabs panel
    if (!target) {
      const prevTabsPanelHistory = Tabs.getActiveTabsHistory(Sidebar.lastTabsPanelId)
      if (prevTabsPanelHistory?.actTabs.length) {
        const panelId = Sidebar.lastTabsPanelId
        const actTabs = prevTabsPanelHistory.actTabs
        const prevActTab = Tabs.byId[actTabs[actTabs.length - 1]]
        if (prevActTab && prevActTab.panelId === panelId && !prevActTab.discarded) {
          return prevActTab
        }
      }
    }
    // Search in global scope
    if (!target) {
      for (const tab of Tabs.list) {
        // Skip discarded tab
        if (skipDiscarded && tab.discarded) {
          if (!discardedFallback) discardedFallback = tab
          continue
        }

        target = tab
        break
      }
    }

    return target ?? discardedFallback
  }

  // If group tab linked with pinned tab switch to that pinned tab
  if (tab.url.startsWith(GROUP_URL)) {
    const urlInfo = new URL(tab.url)
    const pin = urlInfo.searchParams.get('pin')
    if (pin) {
      const [containerId, url] = pin.split('::')
      target = Tabs.list.find(t => t.pinned && t.cookieStoreId === containerId && t.url === url)
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
              if (exclude && exclude.includes(pTab.id)) continue
              target = Tabs.byId[pTab.id]
              break mainLoop
            }
          }
          if (stayInPanel && (discardedFallback || foldedFallback)) {
            return discardedFallback || foldedFallback
          }

          // Check the last active tab of the previous active tabs panel
          const prevTabsPanelHistory = Tabs.getActiveTabsHistory(Sidebar.lastTabsPanelId)
          if (prevTabsPanelHistory?.actTabs.length) {
            const panelId = Sidebar.lastTabsPanelId
            const actTabs = prevTabsPanelHistory.actTabs
            const prevActTab = Tabs.byId[actTabs[actTabs.length - 1]]
            if (prevActTab && prevActTab.panelId === panelId && !prevActTab.discarded) {
              return prevActTab
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

    // Next tab excluded
    if (exclude && exclude.includes(foundTab.id)) continue

    // Invisible(folded) tab will be removed too
    if (rmFolded && foundTab.invisible) continue

    // Child tab will be removed too
    if (rmChild && foundTab.lvl > tab.lvl) continue

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
  if (Settings.state.activateAfterClosing === 'prev_act') {
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
      panelId = Sidebar.reactive.activePanelId
    } else {
      panelId = actTab.panelId
    }
  }

  const history = Tabs.getActiveTabsHistory(panelId)
  const prevTabId = Utils.findLast(history.actTabs, id => id !== Tabs.activeId)
  if (prevTabId !== undefined) browser.tabs.update(prevTabId, { active: true })
}

/**
 * Undo remove tab
 */
export async function undoRmTab(): Promise<void> {
  const closed = await browser.sessions.getRecentlyClosed()
  if (closed && closed.length) {
    const session = closed.find(c => c.tab)
    if (session && session.tab?.sessionId) await browser.sessions.restore(session.tab.sessionId)
  }
}

export async function createFromDragEvent(e: DragEvent, dst: DstPlaceInfo): Promise<void> {
  // Handle sidebery dnd info from another firefox profile
  const dndInfo = e.dataTransfer?.getData('application/x-sidebery-dnd')
  if (dndInfo) {
    let info: DragInfo
    try {
      info = JSON.parse(dndInfo) as DragInfo
    } catch (err) {
      return
    }
    if (info.items) {
      const groupUrlStartRe = /^moz-extension:\/\/.{36}\/(page.)?group\/group\.html(.+)$/
      // Update sidebery internal urls
      for (const item of info.items) {
        if (item.url && groupUrlStartRe.test(item.url)) {
          item.url = item.url.replace(groupUrlStartRe, (_, _1, $2: string) => GROUP_URL + $2)
        }
      }

      Tabs.open(info.items, dst)
    }
    return
  }

  const result = await Utils.parseDragEvent(e)
  const panel = Sidebar.panelsById[dst.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) return

  const container = Containers.reactive.byId[panel.newTabCtx]
  const inside = dst.index === -1
  if (dst.parentId === undefined) dst.parentId = NOID
  if (inside) {
    const parentTab = Tabs.byId[dst.parentId]
    if (parentTab) dst.index = parentTab.index + 1
  }

  if (result?.file) result.url = URL.createObjectURL(result.file)

  if (result?.text && !result?.url) {
    const trimmedText = result.text.trim()
    if (/^https?:\/\/[^\s]{4,}$/.test(trimmedText)) result.url = trimmedText
  }

  if (result?.url) {
    // With Shift: Open URL in target tab
    if (dst.inside && +dst.parentId > -1 && e.shiftKey) {
      browser.tabs.update(dst.parentId, { url: result.url }).catch(err => {
        Logs.err('Tabs.createFromDragEvent: Cannot update tab url:', err)
      })
    } else {
      const conf: browser.tabs.CreateProperties = {
        active: Settings.state.dndActTabFromLink,
        url: Utils.normalizeUrl(result.url),
        index: dst.index,
        cookieStoreId: container?.id,
        windowId: Windows.id,
        pinned: dst.pinned,
      }

      // With Ctrl: Open inactive (background) tab
      if (e.ctrlKey) conf.active = false

      // With Alt: Open discarded (unloaded) tab
      if (e.altKey) {
        conf.active = false
        conf.discarded = true
        conf.title = result.text || result.url
      }

      setNewTabPosition(dst.index ?? 0, dst.parentId, panel.id)
      browser.tabs.create(conf).catch(err => {
        Logs.err('Tabs.createFromDragEvent: Cannot create tab:', err)
      })
    }
    return
  }

  if (result?.text) {
    let tabId: ID
    // With Shift: Search in target tab
    if (dst.inside && +dst.parentId > -1 && e.shiftKey) tabId = dst.parentId
    else {
      const conf: browser.tabs.CreateProperties = {
        active: Settings.state.dndActSearchTab,
        index: dst.index,
        cookieStoreId: container?.id,
        windowId: Windows.id,
        pinned: dst.pinned,
      }

      // With Ctrl: Search in inactive (background) tab
      if (e.ctrlKey) conf.active = false

      setNewTabPosition(dst.index ?? 0, dst.parentId, panel.id)
      const tab = await browser.tabs.create(conf)
      tabId = tab.id
    }
    browser.search.search({ query: result.text, tabId })
  }
}

export async function reopen(tabsInfo: ItemInfo[], dst: DstPlaceInfo): Promise<void> {
  // Sort target tabs
  let minIndex = tabsInfo[0]?.index ?? 999999
  let maxIndex = tabsInfo[0]?.index ?? 0
  tabsInfo.sort((a, b) => {
    if (a.index === undefined || b.index === undefined) return 0
    if (minIndex > a.index) minIndex = a.index
    if (minIndex > b.index) minIndex = b.index
    if (maxIndex < a.index) maxIndex = a.index
    if (maxIndex < b.index) maxIndex = b.index
    return a.index - b.index
  })

  // Save tree to restore it later
  const treeUpdate: Record<ID, ID[]> = {}
  for (const info of tabsInfo) {
    const tab = Tabs.byId[info.id]
    if (!tab) continue
    treeUpdate[tab.id] = []

    for (let i = tab.index + 1; i < Tabs.list.length; i++) {
      const nextTab = Tabs.list[i]
      if (!nextTab || nextTab.lvl <= tab.lvl) break
      if (maxIndex < nextTab.index) maxIndex = nextTab.index
      if (nextTab.parentId === tab.id) treeUpdate[tab.id].push(nextTab.id)
    }
  }

  // Open new tabs
  const idsMap: Record<ID, ID> = {}
  const result = await open(tabsInfo, dst, idsMap)
  if (!result) return Logs.err('Tabs: Cannot reopen tabs')

  // Update succession on reopening in another window
  const ids = tabsInfo.map(ti => ti.id)
  if (dst.windowId !== undefined && dst.windowId !== Windows.id && ids.includes(Tabs.activeId)) {
    Tabs.updateSuccessionDebounced(0, ids)
  }

  // Remove source tabs
  const toRemove = tabsInfo.map(t => t.id)
  Tabs.removingTabs = [...toRemove]
  await browser.tabs.remove(toRemove)

  // Fix tree
  let treeUpdateNeeded = false
  for (const oldId of Object.keys(treeUpdate)) {
    const children = treeUpdate[oldId]
    const newId = idsMap[oldId]
    if (!children?.length || newId === undefined) continue

    if (!treeUpdateNeeded) treeUpdateNeeded = true
    for (const childId of children) {
      const childTab = Tabs.byId[childId]
      if (childTab) childTab.parentId = newId
    }
  }
  if (treeUpdateNeeded) Tabs.updateTabsTree(minIndex, maxIndex + 1)
}

export async function open(
  items: ItemInfo[],
  dst: DstPlaceInfo,
  idsMap?: Record<ID, ID>
): Promise<boolean> {
  if (!idsMap) idsMap = {}
  if (dst.inside && dst.parentId === undefined) return true

  // Open tabs in new window
  if (dst.windowId === NEWID) {
    return await IPC.bg('createWindowWithTabs', items, { incognito: dst.incognito })
  }

  // Open tabs in another window
  if (dst.windowId !== undefined && dst.windowId !== Windows.id) {
    if (dst.windowId === ASKID) {
      if (dst.windowChooseConf === undefined) dst.windowId = await Windows.showWindowsPopup()
      else dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
      if (dst.windowId === undefined || dst.windowId === NOID) return true

      delete dst.windowChooseConf
    }

    const ans = await IPC.sidebar(dst.windowId, 'openTabs', items, dst)
    if (!ans) {
      for (const item of items) {
        await browser.tabs.create({ url: item.url, windowId: dst.windowId })
      }
    }

    return true
  }

  // Open tabs in current window
  // ---
  // Get dst panel
  let dstPanel: Panel | undefined = Sidebar.panelsById[dst.panelId ?? NOID]
  if (dst.panelId === undefined || !dstPanel || dstPanel.type !== PanelType.tabs) {
    dstPanel = Sidebar.panels.find(p => p.type === PanelType.tabs)
  }

  // Get fallback index - panel's end
  let fallbackIndex: number | undefined
  if (Utils.isTabsPanel(dstPanel)) {
    fallbackIndex = dstPanel.nextTabIndex
  }

  let index: number | undefined
  for (let item, i = 0; i < items.length; i++) {
    item = items[i]
    const groupCreationNeeded = item.title && !item.url
    const parent = Tabs.byId[dst.parentId ?? item.parentId ?? NOID]

    // Use dst index
    if (dst.index !== undefined) {
      index = dst.index + i
    }

    // Or use index value from item info
    else if (item.index !== undefined) {
      const prevTab = items[i - 1]
      const prevIndex = prevTab?.index

      // If not first and sequence is correct, place new tab right after the previous
      if (prevIndex !== undefined && index !== undefined && item.index - prevIndex === 1) {
        index++
      }

      // Or place new tab just in provided index shifted by count of previously opened tabs
      else {
        index = item.index + i
      }
    }

    // Or use fallback index
    else if (fallbackIndex !== undefined) {
      index = fallbackIndex + i
    }

    if (!item.url && !item.title) continue
    if (!Settings.state.tabsTree && groupCreationNeeded) continue
    if (!Sidebar.hasTabs && groupCreationNeeded) continue
    if (dst.pinned && groupCreationNeeded) continue
    // TODO: handle tree lvl limit
    if (Settings.state.tabsTreeLimit !== 'none' && groupCreationNeeded) continue

    const conf: browser.tabs.CreateProperties = {
      index: index,
      url: groupCreationNeeded
        ? Utils.createGroupUrl(item.title)
        : Utils.normalizeUrl(item.url, item.title),
      windowId: Windows.id,
      pinned: dst.pinned,
      active: !!item.active,
      cookieStoreId: dst.containerId ?? item.container,
    }

    if (dst.discarded === undefined && items.length > 1) dst.discarded = true
    if (dst.discarded && conf.url && !conf.url.startsWith('a') && !dst.pinned && !conf.active) {
      conf.discarded = true
      conf.title = item.title
    }

    let parentId = NOID
    if (!dst.pinned) {
      if (item.parentId !== undefined && +idsMap[item.parentId] >= 0) {
        parentId = idsMap[item.parentId] ?? NOID
      } else if (parent) {
        parentId = parent.id
      }
    }

    if (index !== undefined) {
      setNewTabPosition(index, parentId, dstPanel?.id ?? NOID)
    }

    const tab = await browser.tabs.create(conf)
    idsMap[item.id] = tab.id

    if (item.customTitle) {
      const newTab = Tabs.byId[tab.id]
      if (newTab) newTab.reactive.customTitle = newTab.customTitle = item.customTitle
    }

    if (item.customColor) {
      const newTab = Tabs.byId[tab.id]
      if (newTab) newTab.reactive.customColor = newTab.customColor = item.customColor
    }
  }

  return true
}

export async function reopenInContainer(ids: ID[], containerId: string) {
  sortTabIds(ids)
  const firstTab = Tabs.byId[ids[0]]
  if (!firstTab) return

  const items = Tabs.getTabsInfo(ids)
  setURLsFromTitles(items)
  const rule = Tabs.findMoveRuleBy(containerId, firstTab.lvl)
  const panel = Sidebar.panelsById[rule?.panelId ?? NOID]
  if (Utils.isTabsPanel(panel) && panel.id !== firstTab.panelId && !firstTab.pinned) {
    const dst = { panelId: panel.id, containerId: containerId, index: panel.nextTabIndex }
    await Tabs.reopen(items, dst)
  } else {
    await Tabs.reopen(items, { panelId: firstTab.panelId, containerId, pinned: firstTab.pinned })
  }
}

function setURLsFromTitles(items: ItemInfo[]) {
  for (const item of items) {
    if (item.url !== 'about:blank') continue
    if (item.title && INITIAL_TITLE_RE.test(item.title)) {
      item.url = 'https://' + item.title
    }
  }
}

export async function openInContainer(ids: ID[], containerId: string) {
  sortTabIds(ids)
  const firstTab = Tabs.byId[ids[0]]
  const lastTab = Tabs.byId[ids[ids.length - 1]]
  if (!firstTab || !lastTab) return

  const items = Tabs.getTabsInfo(ids)
  const rule = Tabs.findMoveRuleBy(containerId, firstTab.lvl)
  const panel = Sidebar.panelsById[rule?.panelId ?? NOID]
  if (Utils.isTabsPanel(panel) && panel.id !== firstTab.panelId && !firstTab.pinned) {
    const dst = { panelId: panel.id, containerId: containerId, index: panel.nextTabIndex }
    await Tabs.open(items, dst)
  } else {
    const dst = { panelId: firstTab.panelId, containerId: containerId, index: lastTab.index + 1 }
    await Tabs.open(items, dst)
  }
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
          if (setPanelId) subInfo.panelId = child.panelId
          items.push(subInfo)
        }
      }
    }
  }

  return items
}

export function getBranch(tab: Tab, withRoot = true): Tab[] {
  const result: Tab[] = []
  if (withRoot) result.push(tab)

  // Check tab index
  const target = Tabs.list[tab.index]
  if (!target || target.id !== tab.id) return result

  const rootLvl = tab.lvl
  let index = tab.index + 1
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

export async function copyUrls(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let urls = ''
  for (const id of ids) {
    const tab = Tabs.byId[id]
    if (tab) urls += '\n' + tab.url
  }

  const resultString = urls.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export async function copyTitles(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let titles = ''
  for (const id of ids) {
    const tab = Tabs.byId[id]
    if (tab) titles += '\n' + tab.title
  }

  const resultString = titles.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export async function createTabInNewContainer(): Promise<void> {
  const panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel)) throw 'Current panel is not TabsPanel'

  // Open config popup
  const result = await Popups.openContainerPopup(NOID)
  if (result === null) return

  const container = Containers.reactive.byId[result]
  if (!container) return

  const dst: DstPlaceInfo = { panelId: panel.id, containerId: container.id }
  await Tabs.open([{ id: -1, url: 'about:newtab' }], dst)
}

export async function reopenTabsInNewContainer(tabIds: ID[]): Promise<void> {
  const firstTab = Tabs.byId[tabIds[0]]
  if (!firstTab) return

  // Open config popup
  const result = await Popups.openContainerPopup(NOID)
  if (!result) return

  const container = Containers.reactive.byId[result]
  if (!container) return

  const items = Tabs.getTabsInfo(tabIds)
  await Tabs.reopen(items, { panelId: firstTab.panelId, containerId: container.id })
}

let flashAnimationTimeout: number | undefined
export function triggerFlashAnimation(tab: Tab): void {
  if (flashAnimationTimeout) return
  tab.reactive.flash = true
  flashAnimationTimeout = setTimeout(() => {
    flashAnimationTimeout = undefined
    tab.reactive.flash = false
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
    const panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
        tab.panelId !== Sidebar.reactive.activePanelId
      ) {
        Sidebar.activatePanel(tab.panelId)
      }

      browser.tabs.update(tabId, { active: true }).catch(err => {
        Logs.err('Tabs.switchToRecentlyActiveTab: Cannot activate tab:', err)
      })
    }
  }
}

export function pringDbgInfo(reset = false): void {
  for (const tab of Tabs.list) {
    if (reset) {
      tab.reactive.title = tab.title
    } else {
      tab.reactive.title = `${tab.id} i${tab.index} p${tab.parentId} l${tab.lvl} ${tab.title}`
    }
  }
}

const updateTooltipBuf: Map<ID, number> = new Map()
export function updateTooltipDebounced(tabId: ID, delay: number) {
  clearTimeout(updateTooltipBuf.get(tabId))
  updateTooltipBuf.set(tabId, setTimeout(updateTooltip, delay, tabId))
}
export function updateTooltip(tabId: ID) {
  updateTooltipBuf.delete(tabId)

  const tab = Tabs.byId[tabId]
  if (!tab) return

  tab.reactive.tooltip = getTooltip(tab)
}
function getTooltip(tab: Tab): string {
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

  return str
}

export function recalcMoveRules() {
  const rules: TabToPanelMoveRule[] = []

  for (const panel of Sidebar.panels) {
    if (!Utils.isTabsPanel(panel)) continue

    if (panel.moveRules.length) {
      for (const ruleConf of panel.moveRules) {
        if (!ruleConf.active) continue

        const rule = createMoveToPanelRule(ruleConf, panel.id)
        if (!rule) continue

        rules.push(rule)
      }
    }
  }

  rules.sort((a, b) => {
    let aN = a.containerId ? 1 : 0
    aN += a.urlRE || a.urlStr ? 1 : 0
    let bN = b.containerId ? 1 : 0
    bN += b.urlRE || b.urlStr ? 1 : 0
    return bN - aN
  })

  Tabs.moveRules = rules
}

function createMoveToPanelRule(
  config: TabToPanelMoveRuleConfig,
  panelId: ID
): TabToPanelMoveRule | undefined {
  const rule: TabToPanelMoveRule = { panelId }

  // Match by container
  if (
    config.containerId &&
    (config.containerId === DEFAULT_CONTAINER_ID || Containers.reactive.byId[config.containerId])
  ) {
    rule.containerId = config.containerId
  }

  // Match by URL
  if (config.url) {
    if (config.url.startsWith('/') && config.url.endsWith('/')) {
      try {
        rule.urlRE = new RegExp(config.url.slice(1, -1))
      } catch {
        rule.urlStr = config.url
      }
    } else {
      rule.urlStr = config.url
    }
  }

  if (!rule.containerId && !rule.urlRE && !rule.urlStr) return

  if (config.topLvlOnly) rule.topLvlOnly = config.topLvlOnly

  return rule
}

const moveByRuleTimeouts: Map<ID, number> = new Map()
export function moveByRule(tabId: ID, delay: number) {
  let timeout = moveByRuleTimeouts.get(tabId)
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    const tab = Tabs.byId[tabId]
    if (!tab) return
    if (!Tabs.moveRules.length) return

    const currentPanel = Sidebar.panelsById[tab.panelId]
    let excludeTo = NOID
    if (Utils.isTabsPanel(currentPanel)) excludeTo = currentPanel.moveExcludedTo

    const rule = Tabs.findMoveRule(tab)
    if (rule) {
      if (rule.panelId === tab.panelId) return

      const panelId = rule.panelId
      moveTabToPanel(tab, panelId)
    } else if (
      excludeTo !== NOID &&
      excludeTo !== tab.panelId &&
      !tab.url.startsWith('a') &&
      !tab.url.startsWith('m')
    ) {
      moveTabToPanel(tab, excludeTo)
    }
  }, delay)
  moveByRuleTimeouts.set(tabId, timeout)
}

function moveTabToPanel(tab: Tab, panelId: ID) {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return
  const moveToPanelStart = Settings.state.moveNewTabParent === 'start'
  const index = moveToPanelStart ? panel.startTabIndex : panel.nextTabIndex
  const src: SrcPlaceInfo = { windowId: Windows.id, pinned: tab.pinned }
  const dst: DstPlaceInfo = { panelId, index }
  Utils.inQueue(Tabs.move, [tab], src, dst)

  if (tab.active && Settings.state.tabsPanelSwitchActMoveAuto) {
    Sidebar.switchToPanel(panelId, true, true)
  }
}

export function findMoveRuleBy(containerId: string, lvl?: number): TabToPanelMoveRule | undefined {
  for (const rule of Tabs.moveRules) {
    if (rule.urlRE || rule.urlStr) continue
    if (rule.containerId && rule.containerId !== containerId) continue
    if (rule.topLvlOnly && lvl !== undefined && lvl > 0) continue
    return rule
  }
}

export function findMoveRule(tab: Tab): TabToPanelMoveRule | undefined {
  for (const rule of Tabs.moveRules) {
    if (rule.topLvlOnly && tab.lvl > 0) continue

    if (rule.containerId && rule.containerId !== tab.cookieStoreId) continue

    if (rule.urlStr) {
      if (!tab.url.includes(rule.urlStr)) continue
    } else if (rule.urlRE) {
      if (!rule.urlRE.test(tab.url)) continue
    }

    return rule
  }
}

let updateSuccesionTimeout: number | undefined
export function updateSuccessionDebounced(delay: number, exclude?: ID[]) {
  if (Settings.state.activateAfterClosing === 'none') return

  clearTimeout(updateSuccesionTimeout)

  if (!delay) return updateSuccession(exclude)

  updateSuccesionTimeout = setTimeout(() => updateSuccession(exclude), delay)
}

function updateSuccession(exclude?: ID[]) {
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab) {
    const target = Tabs.findSuccessorTab(activeTab, exclude)
    // Logs.info('Tabs.updateSuccession: active, target', activeTab.id, target?.id)
    if (target) {
      browser.tabs.moveInSuccession([activeTab.id], target.id).catch(err => {
        Logs.err('Tabs.updateSuccession: Cannot update succession:', err)
      })
      return target
    }
  }
}
