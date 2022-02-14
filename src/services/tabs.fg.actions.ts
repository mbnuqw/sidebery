import Utils from 'src/utils'
import { CONTAINER_ID, GROUP_URL, NOID, NEWID, Err, ASKID, MOVEID, PRE_SCROLL } from 'src/defaults'
import { BKM_OTHER_ID } from 'src/defaults'
import { translate } from 'src/dict'
import { Stored, Tab, Panel, TabCache, ActiveTabsHistory, ReactiveTab, TabStatus } from 'src/types'
import { SavedGroup, Notification, TabSessionData, TabsTreeData } from 'src/types'
import { WindowChoosingDetails, SrcPlaceInfo, DstPlaceInfo, ItemInfo } from 'src/types'
import { InstanceType, TabsPanel, PanelType } from 'src/types'
import { Tabs } from 'src/services/tabs.fg'
import { Msg } from 'src/services/msg'
import { Logs } from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Bookmarks } from 'src/services/bookmarks'
import { Permissions } from 'src/services/permissions'
import { Notifications } from 'src/services/notifications'
import { SetupPage } from 'src/services/setup-page'
import { Favicons } from './favicons'

const URL_WITHOUT_PROTOCOL_RE = /^(.+\.)\/?(.+\/)?\w+/

export function toReactive(tab: Tab): ReactiveTab {
  return {
    id: tab.id,
    active: tab.active,
    mediaAudible: tab.audible ?? false,
    mediaMuted: tab.mutedInfo?.muted ?? false,
    mediaPaused: tab.mediaPaused,
    cookieStoreId: tab.cookieStoreId,
    discarded: tab.discarded ?? false,
    favIconUrl: tab.favIconUrl,
    invisible: tab.hidden || tab.invisible,
    pinned: tab.pinned,
    status: Tabs.getStatus(tab),
    isParent: tab.isParent,
    folded: tab.folded,
    title: tab.title,
    url: tab.url,
    lvl: tab.lvl,
    sel: tab.sel,
    warn: tab.warn,
    updated: tab.updated,
    unread: tab.unread,
  }
}

export function updateReactiveTab(tab: Tab): void {
  const rTab = Tabs.reactive.byId[tab.id]
  if (!rTab) return

  rTab.active = tab.active
  rTab.mediaAudible = tab.audible ?? false
  rTab.mediaMuted = tab.mutedInfo?.muted ?? false
  rTab.mediaPaused = tab.mediaPaused
  rTab.cookieStoreId = tab.cookieStoreId
  rTab.discarded = tab.discarded ?? false
  rTab.favIconUrl = tab.favIconUrl
  rTab.invisible = tab.hidden || tab.invisible
  rTab.pinned = tab.pinned
  rTab.status = Tabs.getStatus(tab)
  rTab.isParent = tab.isParent
  rTab.folded = tab.folded
  rTab.title = tab.title
  rTab.url = tab.url
  rTab.lvl = tab.lvl
  rTab.sel = tab.sel
  rTab.warn = tab.warn
  rTab.updated = tab.updated
  rTab.unread = tab.unread
}

export function getStatus(tab: Tab): TabStatus {
  if (tab.status === 'loading') return TabStatus.Loading
  if (tab.status === 'pending') return TabStatus.Pending
  return TabStatus.Complete
}

export async function load(): Promise<void> {
  Logs.info('Tabs.load')

  if (Tabs.shadowMode) Tabs.unloadShadowed()

  Logs.info('Tabs.load: Setup listeners')
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
  Logs.info('Tabs.load: Scroll to active tab')
  const activeTab = Tabs.reactive.byId[Tabs.activeId]
  if (activeTab && !activeTab.pinned) Tabs.scrollToTab(activeTab.id)

  Logs.info('Tabs.load: Save tabs and cache')
  Tabs.updateTabsVisability()
  Tabs.cacheTabsData()
  Tabs.saveGroups()
  Tabs.list.forEach(t => saveTabData(t.id))

  for (const panel of Sidebar.reactive.panels) {
    if (Utils.isTabsPanel(panel)) panel.ready = true
  }

  Logs.info('Tabs: Loaded')
}

export function unload(): void {
  Tabs.resetTabsListeners()

  Tabs.reactive.byId = {}
  Tabs.reactive.pinned = []
  Tabs.list = []
  Tabs.byId = {}

  Tabs.tabsNormalizing = false
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

  for (const panel of Sidebar.reactive.panels) {
    if (Utils.isTabsPanel(panel)) {
      panel.tabs = []
      panel.len = 0
      panel.ready = false
    }
  }

  Tabs.loadInShadowMode()
}

async function restoreTabsState(): Promise<void> {
  if (!Sidebar.hasTabs) return

  Logs.info('Tabs.restoreTabsState')

  const windowId = browser.windows.WINDOW_ID_CURRENT
  const isWindowTabsLockedRequest = Msg.req(InstanceType.bg, 'isWindowTabsLocked', Windows.id)
  const waitGroup = await Promise.all([
    browser.tabs.query({ windowId }),
    browser.storage.local.get<Stored>('tabsDataCache'),
    browser.sessions.getWindowValue<Record<ID, SavedGroup>>(Windows.id, 'groups'),
    isWindowTabsLockedRequest,
  ])
  const tabs = waitGroup[0] as Tab[]
  const storage = waitGroup[1]
  const savedGroups = waitGroup[2] ?? {}
  const isWindowTabsLocked = waitGroup[3] ?? false

  // Check if tabs are locked right now
  if (isWindowTabsLocked) throw Err.TabsLocked

  const storedTabsCache = storage.tabsDataCache ? storage.tabsDataCache : []
  let tabsCache: ParsedTabsCache | undefined
  let tabsSessionData: TabSessionData[] | undefined

  const lastPanel = Sidebar.reactive.panels.find(p => Utils.isTabsPanel(p))
  if (!lastPanel) return Logs.err('Cannot load tabs: No tabs panels')

  // Find most appropriate cache data
  tabsCache = findCachedData(tabs, storedTabsCache)

  // Check prev cache
  if (!tabsCache) {
    Logs.info('Tabs.restoreTabsState: No cache - try to get prev cache')
    const { prevTabsDataCache } = await browser.storage.local.get<Stored>('prevTabsDataCache')
    if (prevTabsDataCache) tabsCache = findCachedData(tabs, prevTabsDataCache)
  }

  // Restore tabs data from cache
  if (tabsCache) {
    await restoreTabsFromCache(tabs, tabsCache, lastPanel)
  }

  // From session data
  else {
    const querying = tabs.map(t => browser.sessions.getTabValue<TabSessionData>(t.id, 'data'))
    tabsSessionData = (await Promise.all(querying)) ?? []

    await restoreTabsFromSessionData(tabs, tabsSessionData, savedGroups, lastPanel)
  }

  Tabs.list = tabs
  Sidebar.recalcTabsPanels()
  if (Settings.reactive.tabsTree) updateTabsTree()

  const activeTab = tabs.find(t => t.active)
  if (activeTab) {
    // Switch to panel with active tab
    const actTabPanel = Sidebar.reactive.panelsById[activeTab.panelId]
    const actTabPanelIsNotActive = actTabPanel?.id !== Sidebar.reactive.activePanelId

    if (!activeTab.pinned && actTabPanel && actTabPanelIsNotActive) {
      const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
      if (Utils.isTabsPanel(actPanel)) Sidebar.activatePanel(actTabPanel.id, false)
    }

    // Set active tab id
    Tabs.activeId = activeTab.id

    // Update succession
    if (Settings.reactive.activateAfterClosing !== 'none' && activeTab) {
      const target = findSuccessorTab(activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []
}

async function restoreTabsFromCache(
  tabs: Tab[],
  cache: ParsedTabsCache,
  lastPanel: Panel
): Promise<void> {
  Logs.info('Tabs.restoreTabsFromCache')

  let logWrongPanels: Record<string, null> | undefined
  const firstPanelId = lastPanel.id
  const idsMap: Record<ID, ID> = {}

  // Go through tabs and restore sidebery props
  Tabs.byId = {}
  Tabs.reactive.byId = {}
  for (const tab of [...tabs]) {
    const data = cache.existedTabs[tab.id]

    // Normalize tab
    normalizeTab(tab, tab.pinned ? firstPanelId : NOID)

    if (data) {
      if (data.parentId === undefined) data.parentId = NOID

      // If parent tab is missed try to find it in groups
      if (data.parentId > -1 && idsMap[data.parentId] === undefined) {
        let group = cache.missedGroups[data.parentId]

        if (group) {
          if (group.parentId === undefined) group.parentId = NOID
          const toRestore = [group]

          while (group.parentId > -1 && idsMap[group.parentId] === undefined) {
            group = cache.missedGroups[group.parentId]
            if (!group) break
            if (group.parentId === undefined) group.parentId = NOID
            toRestore.unshift(group)
          }

          await Tabs.recreateParentGroups(tabs, toRestore, idsMap, tab.index)
          for (let k = tab.index + 1; k < tabs.length; k++) {
            tabs[k].index = k
          }
        }
      }

      // Restore props
      tab.panelId = data.panelId ?? lastPanel.id
      if (idsMap[data.parentId] >= 0) tab.parentId = idsMap[data.parentId]
      tab.folded = !!data.folded
      idsMap[data.id] = tab.id

      if (tab.url.startsWith(GROUP_URL)) Tabs.linkGroupWithPinnedTab(tab, tabs)
    }

    // Normalize panelId
    const panel = Sidebar.reactive.panelsById[tab.panelId]
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

    Tabs.byId[tab.id] = tab
    Tabs.reactive.byId[tab.id] = Tabs.toReactive(tab)
  }

  if (logWrongPanels) {
    Logs.warn('Tabs loading: Cannot find panels: ' + Object.keys(logWrongPanels).join(' '))
  }
}

async function restoreTabsFromSessionData(
  tabs: Tab[],
  tabsData: TabSessionData[],
  groupsData: Record<ID, SavedGroup>,
  lastPanel: Panel
): Promise<void> {
  Logs.info('Tabs.restoreTabsFromSessionData')

  let offset = 0
  let logWrongPanels: Record<string, null> | undefined
  const firstPanelId = lastPanel.id
  const idsMap: Record<ID, ID> = {}

  // Set tabs initial props and update state
  Tabs.byId = {}
  Tabs.reactive.byId = {}
  for (let data, tab, i = 0; i < tabs.length; i++) {
    tab = tabs[i]
    data = tabsData[i - offset]

    normalizeTab(tab, tab.pinned ? firstPanelId : NOID)

    if (data) {
      // Check if parent tab is missing and it group page
      if (data.parentId > -1 && idsMap[data.parentId] === undefined && groupsData[data.parentId]) {
        let group = groupsData[data.parentId]

        const toRestore = [group]
        while (idsMap[group.parentId] === undefined && groupsData[group.parentId]) {
          group = groupsData[group.parentId]
          toRestore.unshift(group)
        }

        await Tabs.recreateParentGroups(tabs, toRestore, idsMap, tab.index)
        i += toRestore.length
        offset += toRestore.length
        for (let k = tab.index + 1; k < tabs.length; k++) {
          tabs[k].index = k
        }
      }

      // Restore props
      tab.panelId = data.panelId || lastPanel.id
      if (idsMap[data.parentId] >= 0) tab.parentId = idsMap[data.parentId]
      tab.folded = !!data.folded
      idsMap[data.id] = tab.id

      if (tab.url.startsWith(GROUP_URL)) Tabs.linkGroupWithPinnedTab(tab, tabs)
    }

    // Normalize panelId
    const panel = Sidebar.reactive.panelsById[tab.panelId]
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
    if (
      tab.parentId === -1 &&
      tab.openerTabId !== undefined &&
      Tabs.reactive.byId[tab.openerTabId]
    ) {
      tab.parentId = tab.openerTabId
    }

    Tabs.byId[tab.id] = tab
    Tabs.reactive.byId[tab.id] = Tabs.toReactive(tab)
  }

  if (logWrongPanels) {
    Logs.warn('Tabs loading: Cannot find panels: ' + Object.keys(logWrongPanels).join(' '))
  }
}

/**
 * Find suitable tabs data for current window
 */
interface ParsedTabsCache {
  existedTabs: Record<ID, TabCache>
  missedGroups: Record<ID, TabCache>
}
function findCachedData(tabs: readonly Tab[], data: TabCache[][]): ParsedTabsCache | undefined {
  let maxEqualityCounter = 1
  let result: ParsedTabsCache | undefined

  for (const winTabs of data) {
    let equalityCounter = 0

    const existedTabs: Record<ID, TabCache> = {}
    const missedGroups: Record<ID, TabCache> = {}

    let dataIndex = 0
    let tabIndex = 0
    perTab: for (let tab, tabData; dataIndex < winTabs.length; dataIndex++, tabIndex++) {
      tab = tabs[tabIndex]
      if (!tab) break
      tabData = winTabs[dataIndex]

      // Saved tab is a group and its missing
      if (Utils.isGroupUrl(tabData.url) && tabData.url !== tab.url) {
        tabData.isMissedGroup = true
        missedGroups[tabData.id] = tabData
        tabIndex--
        continue
      }

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
          if (tabs[j] && tabs[j].url === tabData.url) {
            tabIndex = j
            existedTabs[tabs[j].id] = tabData
            equalityCounter++
            continue perTab
          }
        }
        tabIndex--
      }
    }

    if (maxEqualityCounter <= equalityCounter) {
      maxEqualityCounter = equalityCounter
      if (!result) {
        result = { existedTabs, missedGroups }
      } else {
        result.existedTabs = existedTabs
        result.missedGroups = missedGroups
      }
    }

    if (equalityCounter === tabs.length) break
  }

  return result
}

export function normalizeTab(tab: Tab, defaultPanelId: ID): void {
  if (tab.isParent === undefined) tab.isParent = false
  if (tab.folded === undefined) tab.folded = false
  if (tab.invisible === undefined) tab.invisible = false
  if (tab.parentId === undefined) tab.parentId = NOID
  if (tab.panelId === undefined || tab.panelId === NOID) tab.panelId = defaultPanelId
  if (tab.lvl === undefined) tab.lvl = 0
  if (tab.sel === undefined) tab.sel = false
  if (tab.updated === undefined) tab.updated = false
  if (tab.loading === undefined) tab.loading = false
  if (tab.status === undefined) tab.status = 'complete'
  if (tab.warn === undefined) tab.warn = false
  if (tab.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
    tab.warn = true
  }
  if (tab.favIconUrl === undefined) tab.favIconUrl = ''
  else if (tab.favIconUrl.startsWith('chrome:')) tab.favIconUrl = ''
  if (tab.unread === undefined) tab.unread = false
  if (tab.mediaPaused === undefined) tab.mediaPaused = false
}

/**
 * Save tabs data
 */
export function cacheTabsData(delay = 300): void {
  // console.log('[DEBUG] Tabs.cacheTabsData()', delay)
  if (cacheTabsDataTimeout) clearTimeout(cacheTabsDataTimeout)
  cacheTabsDataTimeout = setTimeout(() => {
    if (Tabs.tabsNormalizing) return
    const data = []
    for (const tab of Tabs.list) {
      const info: TabCache = { id: tab.id, url: tab.url }
      if (tab.pinned) info.pin = true
      if (tab.parentId > -1) info.parentId = tab.parentId
      if (tab.panelId !== CONTAINER_ID) info.panelId = tab.panelId
      if (tab.folded) info.folded = tab.folded
      if (tab.cookieStoreId !== CONTAINER_ID) info.ctx = tab.cookieStoreId
      data.push(info)
    }

    Msg.call(InstanceType.bg, 'cacheTabsData', Windows.id, data)
  }, delay)
}
let cacheTabsDataTimeout: number | undefined

/**
 * Save tab data to its session storage
 */
export function saveTabData(tabId: ID): void {
  // console.log('[DEBUG] tabs.saveTabData()', tabId)
  const tab = Tabs.byId[tabId]
  if (!tab) return

  browser.sessions.setTabValue(tabId, 'data', {
    id: tabId,
    panelId: tab.panelId,
    parentId: tab.parentId,
    folded: tab.folded,
  })
}

let normTabsTimeout: number | undefined
/**
 * Load tabs and normalize order.
 */
export function normalizeTabs(delay = 500): void {
  // console.log('[DEBUG] tabs.normalizeTabs()')
  if (!Tabs.tabsNormalizing) Tabs.tabsNormalizing = true
  clearTimeout(normTabsTimeout)
  normTabsTimeout = setTimeout(async () => {
    const panelsList = []
    for (const panel of Sidebar.reactive.panels) {
      if (Utils.isTabsPanel(panel)) panelsList.push({ id: panel.id, index: -1 })
    }

    const normTabs = []
    const normTabsMap: Record<ID, Tab> = {}
    const normReactiveTabsMap: Record<ID, ReactiveTab> = {}
    const nativeTabs = (await browser.tabs.query({
      windowId: browser.windows.WINDOW_ID_CURRENT,
    })) as Tab[]
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

        if (!tab.pinned) {
          if (panelsList[panelIndex].id !== tab.panelId) {
            const pi = panelsList.findIndex(p => {
              if (p.index === -1) p.index = index - 1
              return p.id === tab.panelId
            })
            if (pi > panelIndex) {
              panelIndex = pi
              panelsList[panelIndex].index = index
            } else {
              moves.push([tab.id, panelsList[pi].index])
              for (let i = pi; i < panelsList.length; i++) {
                panelsList[i].index++
              }
            }
          } else {
            panelsList[panelIndex].index = index
          }
        }

        normTabs.push(tab)
        normTabsMap[tab.id] = tab
        normReactiveTabsMap[tab.id] = Tabs.toReactive(tab)
        panelId = tab.panelId
      } else {
        normalizeTab(nativeTab, panelId ?? NOID)
        normTabs.push(nativeTab)
        normTabsMap[nativeTab.id] = nativeTab
        normReactiveTabsMap[nativeTab.id] = Tabs.toReactive(nativeTab)
        index++
      }
    }

    if (moves.length && !Tabs.normTabsMoving) {
      Tabs.normTabsMoving = true
      const moving = moves.map(m => browser.tabs.move(m[0], { index: m[1] }))
      await Promise.all(moving)
      normalizeTabs(0)
      return
    }

    Tabs.list = normTabs
    Tabs.byId = normTabsMap
    Tabs.reactive.byId = normReactiveTabsMap
    Sidebar.recalcTabsPanels()
    updateTabsTree()

    Tabs.tabsNormalizing = false
    Tabs.normTabsMoving = false

    Tabs.list.forEach(t => saveTabData(t.id))
    cacheTabsData()
    Tabs.saveGroups()
  }, delay)
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
      if (t.lvl <= tab.lvl) break
      if (!toRm.includes(t.id)) toRm.push(t.id)
    }
  }

  removeTabs(toRm)
}

/**
 * Remove tabs above
 */
export function removeTabsAbove(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

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
export function removeTabsBelow(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

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
export function removeOtherTabs(tabIds: ID[]): void {
  if (!tabIds || !tabIds.length) return

  const firstTab = Tabs.byId[tabIds[0]]
  if (!firstTab || firstTab.pinned) return

  const panel = Sidebar.reactive.panelsById[firstTab.panelId]
  if (!Utils.isTabsPanel(panel)) return
  const panelTabs = panel.tabs
  const toRm = []
  for (const tab of panelTabs) {
    if (!tabIds.includes(tab.id)) toRm.push(tab.id)
  }

  removeTabs(toRm)
}

/**
 * Remove tabs
 */
export async function removeTabs(tabIds: ID[], silent?: boolean): Promise<void> {
  if (!tabIds || !tabIds.length) return

  const firstTab = Tabs.byId[tabIds[0]]
  if (!firstTab) return

  const panelId = firstTab.panelId
  const panel = Sidebar.reactive.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const tabsMap: Record<ID, Tab> = {}
  let hasInvisibleTab = false
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) continue
    if (tab.panelId !== panelId) continue
    if (panel.lockedTabs && !tab.url.startsWith('about')) continue

    tabsMap[id] = tab
    if (tab.invisible) hasInvisibleTab = true

    if (
      (Settings.reactive.rmChildTabs === 'folded' && tab.folded) ||
      Settings.reactive.rmChildTabs === 'all'
    ) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (t.lvl <= tab.lvl) break
        if (t.invisible) hasInvisibleTab = true
        tabsMap[t.id] = t
      }
    }
  }

  const count = Object.keys(tabsMap).length
  const warn =
    Settings.reactive.warnOnMultiTabClose === 'any' ||
    (hasInvisibleTab && Settings.reactive.warnOnMultiTabClose === 'collapsed')
  if (!silent && warn && count > 1) {
    const pre = translate('confirm.tabs_close_pre', count)
    const post = translate('confirm.tabs_close_post', count)
    const ok = await Sidebar.confirm(pre + String(count) + post)
    if (!ok) return
  }

  // Set tabs to be removed
  const parents: Record<ID, ID> = {}
  const tabs = Object.values(tabsMap).sort((a, b) => a.index - b.index)
  const toRemove = tabs.map(t => {
    const rTab = Tabs.reactive.byId[t.id]
    parents[t.id] = t.parentId
    t.invisible = true
    if (rTab) rTab.invisible = true
    return t.id
  })
  if (Tabs.removingTabs && Tabs.removingTabs.length) {
    Tabs.removingTabs = [...Tabs.removingTabs, ...toRemove]
  } else {
    Tabs.removingTabs = [...toRemove]
  }

  // No-empty panels
  if (tabs.length === panel.len && panel.noEmpty) {
    Tabs.createTabInPanel(panel)
  }

  // Update successorTabId if there are active tab
  const activeTab = tabs.find(t => t.active)
  if (activeTab) {
    const target = findSuccessorTab(activeTab, tabs.map(t => t.id)) // prettier-ignore
    if (target && activeTab.successorTabId !== target.id) {
      browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (!silent && tabs.length > 1 && Settings.reactive.tabsRmUndoNote && !warn) {
    const favicons: string[] = []
    for (const tab of tabs) {
      if (tab.favIconUrl) favicons.push(tab.favIconUrl)
      else favicons.push(Favicons.getFavPlaceholder(tab.url))
    }
    Notifications.notify({
      icon: '#icon_trash',
      title: String(tabs.length) + translate('notif.tabs_rm_post', tabs.length),
      ctrl: translate('notif.undo_ctrl'),
      favicons: favicons.length ? favicons : undefined,
      callback: async () => undoRemove(tabs, parents),
    })
  }

  browser.tabs.remove(toRemove)
  checkRemovedTabs()

  Logs.info('Tabs: Removing tabs finished')
}

let isRmFinishedInterval: number | undefined
/**
 * Checks if there is no more removing tabs with polling Tabs.removingTabs.length
 * @param checkDelay - (default: 100ms) Polling interval in ms.
 * @param stopThreshold - (default: 3) Max count of the same length of removingTabs
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

export async function undoRemove(tabs: Tab[], parents: Record<ID, ID>): Promise<void> {
  const oldNewIds: Record<ID, ID> = {}
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const panel = Sidebar.reactive.panelsById[tab.panelId]
    if (!panel) continue

    const index = tab.index + i
    let parentId = oldNewIds[parents[tab.id]]
    const parent = Tabs.byId[parents[tab.id]]
    if (parentId === undefined && parent && parent.index < tab.index) {
      parentId = parent.id
    }

    setNewTabPosition(index, parentId, panel.id)

    const conf: browser.tabs.CreateProperties = {
      windowId: Windows.id,
      index,
      url: Utils.normalizeUrl(tab.url, tab.title),
      cookieStoreId: tab.cookieStoreId,
      active: false,
    }
    if (conf.cookieStoreId === CONTAINER_ID && conf.url) {
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
function checkRemovedTabs(delay = 640): void {
  clearTimeout(checkRemovedTabsTimeout)
  checkRemovedTabsTimeout = setTimeout(() => {
    Logs.info('Tabs: Check removed tabs')
    if (!Tabs.removingTabs || !Tabs.removingTabs.length) return
    for (const tabId of Tabs.removingTabs) {
      browser.tabs
        .get(tabId)
        .then(() => {
          const tab = Tabs.byId[tabId]
          if (tab) {
            const rParent = Tabs.reactive.byId[tab.parentId]

            tab.lvl = rParent ? rParent.lvl + 1 : 0
            tab.invisible = false
          }
        })
        .catch(() => {
          // Tab already removed
        })
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

  const pinnedAndPanel = Settings.reactive.pinnedTabsPosition === 'panel' || (globaly && cycle)
  const visibleOnly = Settings.reactive.scrollThroughVisibleTabs
  const skipDiscarded = Settings.reactive.scrollThroughTabsSkipDiscarded

  let activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
    if (step > 0) targetTabId = panelTabs[0]?.id ?? NOID
    if (step < 0) {
      for (let i = panelTabs.length, t; i--; ) {
        t = panelTabs[i]
        if (visibleOnly && t.invisible) continue
        if (skipDiscarded && t.discarded) continue
        targetTabId = t.id
        break
      }
    }
    if (targetTabId !== NOID) browser.tabs.update(targetTabId, { active: true })
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
    browser.tabs.update(targetTabId, { active: true })
  }
}

const RELOADING_QUEUE = [] as Tab[]
const CHECK_INTERVAL = 300
const MAX_CHECK_COUNT = 35
export function reloadTabs(tabIds: ID[] = []): void {
  if (!Settings.reactive.tabsReloadLimit || typeof Settings.reactive.tabsReloadLimit !== 'number') {
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
      const rTab = Tabs.reactive.byId[tab.id]
      if (rTab) rTab.status = TabStatus.Pending
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
          const rTab = Tabs.reactive.byId[tab.id]
          if (rTab) rTab.status = TabStatus.Pending
          tab.status = 'pending'
          tab.reloadingChecks = 1
          tabs.push(tab)
        }
        tab = Tabs.list[tab.index + 1]
      }
    }
  }

  if (RELOADING_QUEUE.length > 0) {
    const hm = tabs.splice(0, Settings.reactive.tabsReloadLimit)
    hm.forEach(tab => reloadTab(tab))
    RELOADING_QUEUE.push(...tabs)
    return
  }

  let progressNotification: Notification
  if (Settings.reactive.tabsReloadLimitNotif && tabs.length > Settings.reactive.tabsReloadLimit) {
    progressNotification = Notifications.progress({
      icon: '#icon_reload',
      title: translate('notif.tabs_reloading'),
      ctrl: translate('notif.tabs_reloading_stop'),
      callback: () => stopReloading(),
    })
  }

  const reloadingTabs = tabs.splice(0, Settings.reactive.tabsReloadLimit)
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

      for (let i = Settings.reactive.tabsReloadLimit - loading.length; i-- > 0; ) {
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
      const rTab = Tabs.reactive.byId[tab.id]
      if (rTab) rTab.status = TabStatus.Complete
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
    browser.tabs.update(tab.id, { url: 'https://' + tab.title })
    return
  }
  if (tab.url.startsWith('about:') && tab.status === 'loading') return
  browser.tabs.reload(tab.id)
}

/**
 * Discard tabs
 */
export async function discardTabs(tabIds: ID[] = []): Promise<void> {
  // Update succession for active tab to prevent switching to discarded tabs
  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab) {
    const target = findSuccessorTab(activeTab, tabIds)

    if (target) {
      // If active tab will be discraded activate another
      if (tabIds.includes(Tabs.activeId)) {
        await browser.tabs.update(target.id, { active: true })
      } else if (activeTab.successorTabId !== target.id) {
        browser.tabs.moveInSuccession([activeTab.id], target.id)
      }
    }
  }

  browser.tabs.discard(tabIds)
}

/**
 * Try to activate last active tab on the panel
 */
export function activateLastActiveTabOf(panelId: ID): void {
  const panel = Sidebar.reactive.panelsById[panelId]
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
  if (tab && tab.discarded) tab = panelTabs.find(t => !t.discarded)
  if (tab) browser.tabs.update(tab.id, { active: true })
}

/**
 * (un)Pin tabs
 */
export function pinTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < Tabs.list.length; i++) {
      const child = Tabs.list[i]
      if (child.lvl <= tab.lvl) break
      if (child.parentId === tab.id) child.parentId = tab.parentId
    }
    browser.tabs.update(tabId, { pinned: true })
  }
}
export function unpinTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) browser.tabs.update(tabId, { pinned: false })
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
    browser.tabs.update(tabId, { pinned: !tab.pinned })
  }
}

/**
 * (un)Mute tabs
 */
export function muteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) browser.tabs.update(tabId, { muted: true })
}
export function unmuteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) browser.tabs.update(tabId, { muted: false })
}
export function remuteTabs(tabIds: ID[]): void {
  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue
    browser.tabs.update(tabId, { muted: !tab.mutedInfo?.muted })
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
  const panel = Sidebar.reactive.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  if (Settings.reactive.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.audible && tab.panelId === panel.id) browser.tabs.update(tab.id, { muted: true })
    }
  }

  for (const rTab of panel.tabs) {
    const tab = Tabs.byId[rTab.id]
    if (tab?.audible) browser.tabs.update(tab.id, { muted: true })
  }
}
export function unmuteAudibleTabsOfPanel(id: ID): void {
  const panel = Sidebar.reactive.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  if (Settings.reactive.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.mutedInfo?.muted && tab.panelId === panel.id) {
        browser.tabs.update(tab.id, { muted: false })
      }
    }
  }

  for (const rTab of panel.tabs) {
    const tab = Tabs.byId[rTab.id]
    if (tab?.mutedInfo?.muted) browser.tabs.update(tab.id, { muted: false })
  }
}
export function switchToFirstAudibleTab(): void {
  const tab = Tabs.list.find(t => t.audible && !t.mutedInfo?.muted)
  if (tab) browser.tabs.update(tab.id, { active: true })
}

export function pauseTabMedia(id?: ID): void {
  if (!Permissions.reactive.webData) {
    SetupPage.open('all-urls')
    return
  }

  let tab: Tab | undefined
  if (id !== undefined) tab = Tabs.byId[id]
  else tab = Tabs.list.find(t => t.audible)
  if (!tab) return

  const rTab = Tabs.reactive.byId[tab.id]
  if (!rTab) return

  tab.mediaPaused = true
  rTab.mediaPaused = true

  browser.tabs
    .executeScript(tab.id, {
      file: '../injections/pauseMedia.js',
      runAt: 'document_start',
      allFrames: true,
    })
    .then(result => {
      if (result[0] === false) {
        if (tab) tab.mediaPaused = false
        if (rTab) rTab.mediaPaused = false
      }
    })
    .catch(err => {
      Logs.err('Tabs.pauseTabMedia: Cannot executeScript', err)
    })

  recheckPausedTabs()
}
export function playTabMedia(id?: ID): void {
  if (!Permissions.reactive.webData) {
    SetupPage.open('all-urls')
    return
  }

  let tab: Tab | undefined
  if (id !== undefined) tab = Tabs.byId[id]
  else tab = Tabs.list.find(t => t.mediaPaused)
  if (!tab) return

  const rTab = Tabs.reactive.byId[tab.id]
  if (!rTab) return

  tab.mediaPaused = false
  rTab.mediaPaused = false

  browser.tabs.executeScript(tab.id, {
    file: '../injections/playMedia.js',
    runAt: 'document_start',
    allFrames: true,
  })
}
export function pauseTabsMediaOfPanel(id: ID): void {
  if (!Permissions.reactive.webData) {
    SetupPage.open('all-urls')
    return
  }

  const panel = Sidebar.reactive.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/pauseMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  if (Settings.reactive.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.audible && tab.panelId === panel.id) {
        const rTab = Tabs.reactive.byId[tab.id]
        if (rTab) rTab.mediaPaused = true
        tab.mediaPaused = true
        browser.tabs
          .executeScript(tab.id, injectionConfig)
          .then(result => {
            if (result[0] === false) {
              if (rTab) rTab.mediaPaused = false
              tab.mediaPaused = false
            }
          })
          .catch(err => {
            Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
          })
      }
    }
  }

  for (const rTab of panel.tabs) {
    const tab = Tabs.byId[rTab.id]
    if (tab?.audible) {
      rTab.mediaPaused = true
      tab.mediaPaused = true
      browser.tabs
        .executeScript(tab.id, injectionConfig)
        .then(result => {
          if (result[0] === false) {
            rTab.mediaPaused = false
            tab.mediaPaused = false
          }
        })
        .catch(err => {
          Logs.err('Tabs.pauseTabsMediaOfPanel: Cannot executeScript', err)
        })
    }
  }

  recheckPausedTabs()
}
export function playTabsMediaOfPanel(id: ID): void {
  if (!Permissions.reactive.webData) {
    SetupPage.open('all-urls')
    return
  }

  const panel = Sidebar.reactive.panelsById[id]
  if (!Utils.isTabsPanel(panel)) return

  const injectionConfig: browser.tabs.ExecuteOpts = {
    file: '../injections/playMedia.js',
    runAt: 'document_start',
    allFrames: true,
  }

  if (Settings.reactive.pinnedTabsPosition === 'panel') {
    for (const tab of Tabs.list) {
      if (!tab.pinned) break
      if (tab.mediaPaused && tab.panelId === panel.id) {
        const rTab = Tabs.reactive.byId[tab.id]
        if (rTab) rTab.mediaPaused = false
        tab.mediaPaused = false
        browser.tabs.executeScript(tab.id, injectionConfig)
      }
    }
  }

  for (const rTab of panel.tabs) {
    const tab = Tabs.byId[rTab.id]
    if (tab?.mediaPaused) {
      rTab.mediaPaused = false
      tab.mediaPaused = false
      browser.tabs.executeScript(tab.id, injectionConfig)
    }
  }
}
let recheckPausedTabsTimeout: number | undefined
function recheckPausedTabs(delay = 3500): void {
  clearTimeout(recheckPausedTabsTimeout)
  recheckPausedTabsTimeout = setTimeout(() => {
    for (const tab of Tabs.list) {
      if (tab.mediaPaused && tab.audible) {
        const rTab = Tabs.reactive.byId[tab.id]
        if (rTab) rTab.mediaPaused = false
        tab.mediaPaused = false
      }
    }
  }, delay)
}

/**
 * Duplicate tabs
 */
export async function duplicateTabs(tabIds: ID[]): Promise<void> {
  const active = tabIds.length === 1

  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    if (!tab) continue

    let index = tab.index + 1
    for (let t; index < Tabs.list.length; index++) {
      t = Tabs.list[index]
      if (t.lvl <= tab.lvl) break
    }

    setNewTabPosition(index, tab.parentId, tab.panelId)

    await browser.tabs.duplicate(tabId, { active, index })
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
  if (!Permissions.reactive.bookmarks) return SetupPage.open('bookmarks')

  let parentId: ID | undefined = BKM_OTHER_ID

  const tabs: Tab[] = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab) tabs.push(tab)
  }

  if (tabs.length === 1 && Settings.reactive.askNewBookmarkPlace) {
    const tab = tabs[0]
    const result = await Bookmarks.openBookmarksPopup({
      title: translate('popup.bookmarks.save_in_bookmarks'),
      name: tab.title,
      nameField: true,
      url: tab.url,
      urlField: true,
      location: parentId,
      locationField: true,
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
      Bookmarks.attachContainerInfoToTitle(info)

      await browser.bookmarks.create({
        parentId,
        type: 'bookmark',
        title: info.title,
        url: result.url,
      })
    }
  } else {
    if (Settings.reactive.askNewBookmarkPlace) {
      const result = await Bookmarks.openBookmarksPopup({
        title: translate('popup.bookmarks.save_in_bookmarks'),
        location: parentId,
        locationField: true,
        locationTree: true,
        controls: [{ label: 'btn.save' }],
      })
      if (!result) return
      if (result.location) parentId = result.location
    }

    tabs.sort((a, b) => a.index - b.index)
    await Bookmarks.createFrom(tabs, { index: 0, parentId })
  }

  // Show notification for silent bookmarks creation
  if (!Settings.reactive.askNewBookmarkPlace) {
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
  if (!Permissions.reactive.webData) return SetupPage.open('all-urls')

  for (const tabId of tabIds) {
    const tab = Tabs.byId[tabId]
    const rTab = Tabs.reactive.byId[tabId]
    if (!rTab || !tab) continue

    rTab.status = TabStatus.Loading

    const url = new URL(tab.url)
    const domain = url.hostname.split('.').slice(-2).join('.')

    if (!domain) {
      rTab.status = TabStatus.Err
      setTimeout(() => {
        rTab.status = Tabs.getStatus(tab)
      }, 2000)
      continue
    }

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
        setTimeout(() => {
          rTab.status = TabStatus.Ok
        }, 250)
        setTimeout(() => {
          rTab.status = Tabs.getStatus(tab)
        }, 2000)
      })
      .catch(() => {
        setTimeout(() => {
          rTab.status = TabStatus.Err
        }, 250)
        setTimeout(() => {
          rTab.status = Tabs.getStatus(tab)
        }, 2000)
      })
  }
}

export function sortTabIds(tabIds: ID[]): void {
  tabIds.sort((a, b) => {
    const aTab = Tabs.byId[a]
    const bTab = Tabs.byId[b]
    if (!aTab || !bTab) return 0
    return aTab.index - bTab.index
  })
}

export async function move(
  tabsInfo: ItemInfo[],
  src: SrcPlaceInfo,
  dst: DstPlaceInfo
): Promise<void> {
  // console.log('[DEBUG] move', tabsInfo, src, dst)
  // console.log('[DEBUG] tabs before moving:', Utils.cloneArray(Tabs.list))

  // Ask about target window
  if (dst.windowChooseConf) {
    dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
    if (dst.windowId === NOID) return
  }

  // Move tabs from another window to this window
  if (src.windowId !== undefined && src.windowId !== Windows.id) {
    const tabIds = tabsInfo.map(t => t.id)
    const externalTabs = await Msg.reqSidebar(src.windowId, 'getTabs', tabIds)
    if (externalTabs) moveToThisWin(externalTabs, dst)
    return
  }

  // Move tabs to new window
  if (dst.windowId === NEWID) {
    const info: ItemInfo[] = tabsInfo.map(t => ({
      id: t.id,
      url: t.url,
      parentId: t.parentId,
      panelId: t.panelId,
    }))
    Msg.call(InstanceType.bg, 'createWindowWithTabs', info, {
      incognito: dst.incognito,
      tabId: MOVEID,
    })
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

  // Moving tabs in current window

  const tabs: Tab[] = []
  for (const info of tabsInfo) {
    const tab = Tabs.list[info.index ?? Tabs.byId[info.id]?.index ?? -1]
    if (tab) tabs.push(tab)
  }
  const isActive = tabs.some(t => t.active)

  if (dst.index === undefined) dst.index = 0
  if (dst.parentId === undefined) dst.parentId = NOID

  // Check if tabs was dropped to same place
  const inside = dst.index > tabs[0].index && dst.index <= tabs[tabs.length - 1].index
  const inFirst = tabs[0].id === dst.parentId
  const inLast = tabs[tabs.length - 1].id === dst.parentId
  if (inside || inFirst || inLast) return

  // Normalize target index for tabs droped to the same panel
  // If target index is greater that first tab index - decrease it by 1
  const initialTargetIndex = dst.index
  dst.index = dst.index <= tabs[0].index ? dst.index : dst.index - 1
  // console.log('[DEBUG] target index after normalization', dst.index)

  const pinTab = !src.pinned && dst.pinned
  const unpinTab = src.pinned && !dst.pinned

  // Unpin tab
  if (unpinTab) {
    for (const t of tabs) {
      t.unpinning = true
      if (dst.panelId !== undefined) t.panelId = dst.panelId
      await browser.tabs.update(t.id, { pinned: false })
      t.unpinning = false
    }
  }

  // Pin tab
  if (pinTab) {
    for (const t of tabs) {
      t.lvl = 0
      t.parentId = -1
      await browser.tabs.update(t.id, { pinned: true })
    }
  }

  // Move if target index is different or pinned state changed
  const lastTab = tabs[tabs.length - 1]
  let moving: Promise<browser.tabs.Tab[]> | undefined
  let moveNeeded = tabs[0].index !== dst.index && lastTab.index !== dst.index
  if (!moveNeeded) moveNeeded = lastTab.index - tabs[0].index + 1 !== tabs.length
  if (moveNeeded || pinTab || unpinTab) {
    Tabs.movingTabs = []
    let index = 0
    for (const tab of tabs) {
      index = Tabs.list.indexOf(tab, index)
      Tabs.list.splice(index, 1)
      Tabs.movingTabs.push(tab.id)
    }
    let targetIndex = initialTargetIndex
    if (tabs[0].index < initialTargetIndex) targetIndex = initialTargetIndex - tabs.length
    // console.log('[DEBUG] splice tabs list', targetIndex, ...tabs)
    Tabs.list.splice(targetIndex, 0, ...tabs)
    updateTabsIndexes()
    // console.log('[DEBUG] moving (tabIds, index):', Tabs.movingTabs, dst.index)
    moving = browser.tabs.move([...Tabs.movingTabs], {
      windowId: Windows.id,
      index: dst.index,
    })
  }

  if (dst.panelId !== undefined && src.panelId !== dst.panelId) {
    for (const tab of tabs) {
      tab.panelId = dst.panelId
    }
    if (isActive && !dst.pinned && Settings.reactive.tabsPanelSwitchActMove) {
      Sidebar.activatePanel(dst.panelId)
    }
  }

  Sidebar.recalcTabsPanels()
  // TODO: I need update reactive values manualy or move this recalc to the end
  // of this function.

  const parent = Tabs.byId[dst.parentId]
  const toHide: ID[] = []
  const toShow: ID[] = []

  // Update tabs tree
  if (Settings.reactive.tabsTree) {
    // Set first tab parentId and other parameters
    tabs[0].parentId = dst.parentId

    // Get level offset for gragged branch
    const minLvl = tabs[0].lvl

    if (parent && parent.folded) {
      const activeDroppedTab = tabs.find(t => t.active)
      if (activeDroppedTab) browser.tabs.update(dst.parentId, { active: true })
    }

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]

      // Flat nodes below first node's level
      if (tabs[i].lvl <= minLvl) {
        tab.parentId = dst.parentId
      }

      // Update invisibility of tabs
      if (parent && parent.folded) {
        if (Settings.reactive.hideFoldedTabs && !tab.hidden) toHide.push(tab.id)
      } else if (tab.parentId === dst.parentId) {
        if (Settings.reactive.hideFoldedTabs && tab.hidden) toShow.push(tab.id)
      }
    }

    updateTabsTree()
  }

  tabs.forEach(t => saveTabData(t.id))
  cacheTabsData()

  // console.log('[DEBUG] tabs after moving', Utils.cloneArray(Tabs.list))

  // Hide/Show tabs
  if (toHide.length) browser.tabs.hide(toHide)
  if (toShow.length) browser.tabs.show(toShow)

  if (moving) await moving
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
export async function moveTabsToWin(
  tabIds: ID[],
  windowIdOrConfig?: ID | WindowChoosingDetails
): Promise<void> {
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
    const rTab = Tabs.reactive.byId[id]
    if (!tab || !rTab) continue
    if (tab.parentId > -1 && !tabIds.includes(tab.parentId)) {
      rTab.lvl = 0
      tab.lvl = 0
      tab.parentId = -1
    }
    tabs.push(Utils.cloneObject(tab))
    if (tab.folded) {
      for (let i = tab.index + 1; i < Tabs.list.length; i++) {
        const childTab = Tabs.list[i]
        if (childTab.lvl <= tab.lvl) break
        tabs.push(Utils.cloneObject(childTab))
      }
    }
  }

  const ans = await Msg.reqSidebar(windowId, 'moveTabsToThisWin', tabs)
  if (!ans) {
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
    const panel = Sidebar.reactive.panelsById[tabs[0].panelId]
    let nextIndex
    if (Utils.isTabsPanel(panel) && panel.nextTabIndex > -1) nextIndex = panel.nextTabIndex
    else nextIndex = Tabs.list.length
    dst = { panelId: tabs[0].panelId, parentId: -1, index: isPinned ? 0 : nextIndex }
  }

  const tabIds = tabs.map(t => t.id)

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const rTab = Tabs.reactive.byId[tab.id]
    const parent = Tabs.reactive.byId[dst.parentId ?? tab.parentId ?? NOID]
    const index = (dst.index ?? 0) + i
    if (!!tab.pinned !== !!dst.pinned) {
      await browser.tabs.update(tab.id, { pinned: !!dst.pinned })
      tab.pinned = !!dst.pinned
      if (rTab) rTab.pinned = tab.pinned
    }
    if (tab.parentId === -1 || (tab.parentId !== -1 && !tabIds.includes(tab.parentId))) {
      tab.lvl = parent ? parent.lvl + 1 : 0
      if (rTab) rTab.lvl = tab.lvl
      tab.parentId = parent ? parent.id : -1
    }
    setNewTabPosition(index, tab.parentId, dst.panelId ?? NOID)
    browser.tabs.move(tab.id, { windowId: Windows.id, index })
  }

  return true
}

export async function moveToNewPanel(tabIds: ID[]): Promise<void> {
  const probeTab = Tabs.byId[tabIds[0]]
  if (!probeTab) return Logs.warn('Tabs.moveToNewPanel: No first tab')

  const srcPanel = Sidebar.reactive.panelsById[probeTab?.panelId ?? NOID]
  if (!Utils.isTabsPanel(srcPanel)) return Logs.warn('Tabs.moveToNewPanel: No src panel')

  const index = Sidebar.reactive.nav.indexOf(srcPanel.id)
  if (index === -1) return Logs.warn('Tabs.moveToNewPanel: Cannot find target index')

  // Create new panel
  const isFirstTabsPanel = !Sidebar.hasTabs
  const dstPanel = Sidebar.createTabsPanel()
  Sidebar.reactive.nav.splice(index + 1, 0, dstPanel.id)
  Sidebar.recalcPanels()
  Sidebar.recalcTabsPanels()
  Sidebar.activatePanel(dstPanel.id)
  Sidebar.saveSidebar(300)

  const result = await Sidebar.startFastEditingOfPanel(dstPanel.id, true)
  if (!result) return Logs.info('Tabs: Panel creation canceled')

  if (isFirstTabsPanel) await Tabs.load()

  // Move
  const items = Tabs.getTabsInfo(tabIds)
  const src = { windowId: Windows.id, panelId: srcPanel.id, pinned: probeTab.pinned }
  await Tabs.move(items, src, { panelId: dstPanel.id, index: dstPanel.nextTabIndex })
}

/**
 * Update tabs visability
 */
export function updateTabsVisability(): void {
  // console.log('[DEBUG] tabs.updateTabsVisability()')
  const hideFolded = Settings.reactive.hideFoldedTabs
  const hideInact = Settings.reactive.hideInact

  let actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!actPanel) actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.lastActivePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  const toShow = []
  const toHide = []
  for (const tab of Tabs.list) {
    if (tab.pinned) continue

    if (hideFolded && tab.invisible) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (hideInact && tab.panelId !== actPanel.id) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (tab.hidden) toShow.push(tab.id)
  }

  if (toShow.length) browser.tabs.show(toShow)
  if (toHide.length) browser.tabs.hide(toHide)
}

/**
 * Hide children of tab
 */
export function foldTabsBranch(tabId: ID): void {
  const toHide: ID[] = []
  const tab = Tabs.byId[tabId]
  const rTab = Tabs.reactive.byId[tabId]
  if (!tab || !rTab) return
  tab.folded = true
  rTab.folded = true
  for (let i = tab.index + 1; i < Tabs.list.length; i++) {
    const t = Tabs.list[i]
    if (t.lvl <= tab.lvl) break
    if (t.active) browser.tabs.update(tabId, { active: true })
    if (!t.invisible) {
      const rTab = Tabs.reactive.byId[t.id]
      if (rTab) rTab.invisible = true
      t.invisible = true
      toHide.push(t.id)
    }
  }

  // Update succession
  if (tab.active) {
    const target = findSuccessorTab(tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (Settings.reactive.discardFolded) {
    if (Settings.reactive.discardFoldedDelay === 0) {
      toHide.map(id => browser.tabs.discard(id))
    } else {
      let delayMS = Settings.reactive.discardFoldedDelay
      if (Settings.reactive.discardFoldedDelayUnit === 'sec') delayMS *= 1000
      if (Settings.reactive.discardFoldedDelayUnit === 'min') delayMS *= 60000
      setTimeout(() => {
        const stillValid = toHide.every(id => {
          return Tabs.reactive.byId[id] && Tabs.reactive.byId[id]?.invisible
        })
        if (stillValid) browser.tabs.discard(toHide)
      }, delayMS)
    }
  }

  if (Settings.reactive.hideFoldedTabs && toHide.length) {
    browser.tabs.hide(toHide)
  }

  saveTabData(tabId)
  cacheTabsData()
}

/**
 * Show children of tab
 */
export function expTabsBranch(tabId: ID): void {
  const autoFoldTabs = Settings.reactive.autoFoldTabs
  const toShow: ID[] = []
  const preserve: ID[] = []
  let autoFold: Tab[] = []

  const tab = Tabs.byId[tabId]
  if (!tab) return

  tab.lastAccessed = Date.now()
  if (tab.invisible) expTabsBranch(tab.parentId)
  for (const tab of Tabs.list) {
    if (tab.pinned || tab.panelId !== tab.panelId) continue
    if (autoFoldTabs && tab.id !== tabId && tab.isParent && !tab.folded && tab.lvl === tab.lvl) {
      autoFold.push(tab)
    }
    if (tab.id === tabId) {
      const rTab = Tabs.reactive.byId[tab.id]
      tab.folded = false
      if (rTab) rTab.folded = false
    }
    if (tab.id !== tabId && tab.folded) preserve.push(tab.id)
    if (tab.parentId === tabId || toShow.includes(tab.parentId)) {
      if (tab.invisible && (tab.parentId === tabId || !preserve.includes(tab.parentId))) {
        const rTab = Tabs.reactive.byId[tab.id]
        toShow.push(tab.id)
        if (rTab) rTab.invisible = false
        tab.invisible = false
      }
    }
  }

  // Auto fold
  if (Settings.reactive.autoFoldTabs) {
    autoFold.sort((a, b) => {
      let aMax = a.lastAccessed
      let bMax = b.lastAccessed
      if (a.childLastAccessed) aMax = Math.max(a.lastAccessed, a.childLastAccessed)
      if (b.childLastAccessed) bMax = Math.max(b.lastAccessed, b.childLastAccessed)
      return aMax - bMax
    })

    if (Settings.reactive.autoFoldTabsExcept > 0) {
      autoFold = autoFold.slice(0, -Settings.reactive.autoFoldTabsExcept)
    }
    for (const t of autoFold) {
      foldTabsBranch(t.id)
    }
  }

  // Update succession
  if (tab.active) {
    const target = findSuccessorTab(tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (Settings.reactive.hideFoldedTabs && toShow.length) {
    browser.tabs.show(toShow)
  }

  saveTabData(tabId)
  cacheTabsData()
}

/**
 * Toggle tabs branch visability (fold/expand)
 */
export function toggleBranch(tabId?: ID): void {
  // console.log(`[DEBUG] tabs.toggleBranch(tabId: ${tabId})`)
  if (!Settings.reactive.tabsTree) return
  if (tabId === undefined) return

  let tab = Tabs.byId[tabId]
  if (!tab) tab = Tabs.byId[Tabs.activeId]
  if (tab && !tab.isParent && tab.parentId > -1) tab = Tabs.byId[tab.parentId]
  if (!tab) return

  if (tab.folded) expTabsBranch(tabId)
  else foldTabsBranch(tabId)
}

/**
 * Collaplse all inactive branches.
 */
export function foldAllInactiveBranches(tabs: Tab[] = []): void {
  const toFold = []
  let activeTab
  let actParentId

  for (const tab of tabs) {
    if (tab.active && (tab.lvl > 0 || tab.isParent)) {
      activeTab = tab
      actParentId = tab.parentId
      continue
    }

    if (tab.isParent && !tab.folded) {
      if (activeTab) {
        if (tab.lvl > activeTab.lvl) continue
        else activeTab = null
      }
      toFold.push(tab)
    }
  }

  for (let tab, i = toFold.length; i--; ) {
    tab = toFold[i]
    if (tab.id === actParentId) {
      actParentId = tab.parentId
      continue
    }
    foldTabsBranch(tab.id)
  }
}

export function activateParent(tabId?: ID): void {
  if (!Settings.reactive.tabsTree) return
  if (tabId === undefined) tabId = Tabs.activeId
  const tab = Tabs.byId[tabId]
  if (tab && Tabs.byId[tab.parentId]) browser.tabs.update(tab.parentId, { active: true })
}

/**
 * Flatten tabs tree
 */
export function flattenTabs(tabIds: ID[]): void {
  // Gather children
  let minLvlTab = { lvl: 999 } as Tab
  const toFlat = [...tabIds]
  const ttf: Tab[] = []
  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (tab) ttf.push(tab)
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
    const rTab = Tabs.reactive.byId[tab.id]
    if (rTab) rTab.lvl = minLvlTab.lvl
    tab.lvl = minLvlTab.lvl
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

  browser.tabs.create({
    index,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: Windows.id,
    openerTabId: parentId >= 0 ? parentId : undefined,
  })
}

/**
 * Create child tab
 */
export function createChildTab(tabId: ID, url?: string, containerId?: string): void {
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  const config: browser.tabs.CreateProperties = {
    index: targetTab.index + 1,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: Windows.id,
    openerTabId: targetTab.id,
  }

  if (url) config.url = url
  if (containerId) config.cookieStoreId = containerId

  browser.tabs.create(config)
}

/**
 * Create new tab in panel
 */
export function createTabInPanel(
  panel: Panel,
  conf?: Partial<browser.tabs.CreateProperties>
): void {
  if (!Utils.isTabsPanel(panel)) return

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
  if (panel.newTabCtx !== 'none') config.cookieStoreId = panel.newTabCtx

  browser.tabs.create(config)
}

/**
 * Normalize tree levels
 */
export function updateTabsTree(startIndex = 0, endIndex = -1): void {
  Logs.info(`Tabs.updateTabsTree: ${startIndex} - ${endIndex}`)
  if (!Settings.reactive.tabsTree) return
  if (!Tabs.list || !Tabs.list.length) return
  if (startIndex < 0) startIndex = 0
  if (endIndex === -1) endIndex = Tabs.list.length
  const maxLvl =
    typeof Settings.reactive.tabsTreeLimit === 'number' ? Settings.reactive.tabsTreeLimit : 123

  // Reset parent-flags of the last tab
  if (Tabs.list[endIndex - 1]) {
    const tab = Tabs.list[endIndex - 1]
    const rTab = Tabs.reactive.byId[tab.id]
    if (tab && rTab) {
      rTab.isParent = false
      tab.isParent = false
      rTab.folded = false
      tab.folded = false
    }
  }

  for (let prevTab, tab, i = startIndex; i < endIndex; i++) {
    tab = Tabs.list[i]
    const rTab = Tabs.reactive.byId[tab.id]
    if (!tab || !rTab) return Logs.err('Tabs.updateTabsTree: Cannot get tab')

    if (rTab && tab.pinned) {
      tab.parentId = -1
      rTab.lvl = 0
      tab.lvl = 0
      rTab.invisible = false
      tab.invisible = false
      rTab.isParent = false
      tab.isParent = false
      rTab.folded = false
      tab.folded = false
      continue
    }
    prevTab = Tabs.list[i - 1]

    let parent = Tabs.byId[tab.parentId]
    let rParent = Tabs.reactive.byId[tab.parentId]
    if (parent && (parent.pinned || parent.index >= tab.index)) {
      parent = undefined
      rParent = undefined
    }

    // Parent is defined
    if (parent && rParent && !parent.pinned && parent.panelId === tab.panelId) {
      if (parent.lvl === maxLvl) {
        parent.isParent = false
        rParent.isParent = false
        parent.folded = false
        rParent.folded = false
        tab.parentId = parent.parentId
        tab.lvl = parent.lvl
        rTab.lvl = parent.lvl
        tab.invisible = parent.invisible
        rTab.invisible = parent.invisible
      } else {
        parent.isParent = true
        rParent.isParent = true
        tab.lvl = parent.lvl + 1
        rTab.lvl = parent.lvl + 1
        tab.invisible = parent.folded || parent.invisible
        rTab.invisible = parent.folded || parent.invisible
      }

      // if prev tab is not parent and with smaller lvl
      // go back and set lvl and parentId
      if (prevTab && prevTab.id !== tab.parentId && prevTab.lvl < tab.lvl) {
        for (let j = tab.index; j--; ) {
          const backTab = Tabs.list[j]
          if (backTab.id === parent.id) break
          if (backTab.panelId !== tab.panelId) break
          const rBackTab = Tabs.reactive.byId[backTab.id]
          if (!rBackTab) {
            Logs.warn('Tabs.updateTabsTree: Cannot get reactive tab')
            break
          }
          if (parent.lvl === maxLvl) {
            backTab.parentId = parent.parentId
            backTab.isParent = false
            rBackTab.isParent = false
            backTab.folded = false
            rBackTab.folded = false
          } else {
            backTab.parentId = parent.id
          }
          rBackTab.lvl = tab.lvl
          rBackTab.invisible = tab.invisible
        }
      }
    } else {
      tab.parentId = -1
      tab.lvl = 0
      rTab.lvl = 0
      tab.invisible = false
      rTab.invisible = false
    }

    // Reset parent-flags of prev tab if current tab have same lvl
    if (prevTab && prevTab.lvl >= tab.lvl) {
      const rPrevTab = Tabs.reactive.byId[prevTab.id]
      prevTab.isParent = false
      if (rPrevTab) rPrevTab.isParent = false
      prevTab.folded = false
      if (rPrevTab) rPrevTab.folded = false
    }

    // Update openerTabId
    if (tab.parentId === -1 && tab.openerTabId !== undefined) {
      browser.tabs.update(tab.id, { openerTabId: tab.id })
      tab.openerTabId = undefined
    }
    if (tab.parentId !== -1 && tab.openerTabId !== tab.parentId) {
      browser.tabs.update(tab.id, { openerTabId: tab.parentId })
      tab.openerTabId = tab.parentId
    }
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

export function getTabs(tabIds: ID[]): Tab[] | undefined {
  const tabs = Tabs.list.filter(t => tabIds.includes(t.id))
  if (tabs.length) return Utils.cloneArray(tabs)
}

export function getTabsTreeData(): TabsTreeData {
  const tree: TabsTreeData = {}
  for (const tab of Tabs.list) {
    tree[tab.id] = [tab.panelId, tab.parentId]
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
    nearestPanel = Sidebar.reactive.panelsById[prevTab.panelId] as TabsPanel
  }
  if (!nearestPanel && nextTab) {
    nearestPanel = Sidebar.reactive.panelsById[nextTab.panelId] as TabsPanel
  }
  if (!nearestPanel) {
    nearestPanel = Sidebar.reactive.panels.find(p => Utils.isTabsPanel(p)) as TabsPanel
  }

  return nearestPanel
}

export function getPanelForNewTab(tab: Tab): TabsPanel | undefined {
  const parentTab = Tabs.byId[tab.openerTabId ?? NOID]
  let activePanel: Panel | undefined = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) activePanel = undefined

  // Find panel with matched moveTabCtx rule
  const panel = Sidebar.reactive.panels.find(
    p => Utils.isTabsPanel(p) && p.moveTabCtx === tab.cookieStoreId
  )
  const isChildTab = parentTab && !parentTab.pinned
  if (Utils.isTabsPanel(panel) && (!panel.moveTabCtxNoChild || !isChildTab)) return panel

  // Find panel for tab opened from pinned tab
  if (parentTab && parentTab.pinned) {
    if (Settings.reactive.moveNewTabPin === 'start' || Settings.reactive.moveNewTabPin === 'end') {
      return activePanel || findTabsPanelNearToTabIndex(tab.index)
    }
  }

  // Find panel for tab opened from another tab
  if (parentTab && !parentTab.pinned) {
    const panelOfParent = Sidebar.reactive.panelsById[parentTab.panelId] as TabsPanel
    if (!Settings.reactive.moveNewTabParentActPanel || panelOfParent === activePanel) {
      return panelOfParent
    }
  }

  // Find panel in other cases
  if (Settings.reactive.moveNewTab === 'start' || Settings.reactive.moveNewTab === 'end') {
    return activePanel || findTabsPanelNearToTabIndex(tab.index)
  }
  if (
    Settings.reactive.moveNewTab === 'before' ||
    Settings.reactive.moveNewTab === 'after' ||
    Settings.reactive.moveNewTab === 'first_child' ||
    Settings.reactive.moveNewTab === 'last_child'
  ) {
    const activeTab = Tabs.byId[Tabs.activeId]
    const panelOfActiveTab = Sidebar.reactive.panelsById[activeTab?.panelId ?? NOID] as TabsPanel

    if (activeTab && !activeTab.pinned && panelOfActiveTab) return panelOfActiveTab
    else return activePanel || findTabsPanelNearToTabIndex(tab.index)
  }

  return findTabsPanelNearToTabIndex(tab.index)
}

/**
 * Find and return index for new tab.
 * Side effect: tab.openerTabId
 */
export function getIndexForNewTab(panel: TabsPanel, tab: Tab): number {
  const parent = Tabs.byId[tab.openerTabId ?? NOID]
  const startIndex = panel.startTabIndex > -1 ? panel.startTabIndex : 0
  const nextIndex = panel.nextTabIndex > -1 ? panel.nextTabIndex : Tabs.list.length
  const activeTab = Tabs.byId[Tabs.activeId]

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) {
    if (Settings.reactive.moveNewTabPin === 'start') return startIndex
    if (Settings.reactive.moveNewTabPin === 'end') return nextIndex
  }

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (Settings.reactive.moveNewTabParent === 'before' && !tab.autoGroupped) return parent.index
    if (Settings.reactive.moveNewTabParent === 'first_child') return parent.index + 1
    if (
      Settings.reactive.moveNewTabParent === 'sibling' ||
      Settings.reactive.moveNewTabParent === 'last_child' ||
      tab.autoGroupped
    ) {
      if (Settings.reactive.tabsTree) {
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
    if (Settings.reactive.moveNewTabParent === 'start' && !tab.autoGroupped) return startIndex
    if (Settings.reactive.moveNewTabParent === 'end' && !tab.autoGroupped) return nextIndex
    if (Settings.reactive.moveNewTabParent === 'default' && !tab.autoGroupped) return tab.index
  }

  // Place new tab (for the other cases)
  if (Settings.reactive.moveNewTab === 'start') return startIndex
  if (Settings.reactive.moveNewTab === 'end') return nextIndex
  if (Settings.reactive.moveNewTab === 'before') {
    if (!activeTab || activeTab.panelId !== panel.id) return nextIndex
    else if (activeTab.pinned) return startIndex
    else return activeTab.index
  }
  if (Settings.reactive.moveNewTab === 'after') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
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
  if (Settings.reactive.moveNewTab === 'first_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
      return startIndex
    } else {
      return activeTab.index + 1
    }
  }
  if (Settings.reactive.moveNewTab === 'last_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return nextIndex
    } else if (activeTab.pinned) {
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

  // Check tab is out of range of panel with moveTabCtx rule
  if (panel.moveTabCtx === tab.cookieStoreId) {
    if (startIndex > tab.index || nextIndex < tab.index) return nextIndex
  }

  return tab.index
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
    if (Settings.reactive.moveNewTabParent === 'before') return parent.parentId
    if (Settings.reactive.moveNewTabParent === 'sibling') return parent.parentId
    if (Settings.reactive.moveNewTabParent === 'first_child') return openerTabId
    if (Settings.reactive.moveNewTabParent === 'last_child') return openerTabId
    if (Settings.reactive.moveNewTabParent === 'start') return
    if (Settings.reactive.moveNewTabParent === 'end') return
    if (Settings.reactive.moveNewTabParent === 'default') return openerTabId
    if (Settings.reactive.moveNewTabParent === 'none') return openerTabId
  }

  // Place new tab (for the other cases)
  if (Settings.reactive.moveNewTab === 'start') return
  if (Settings.reactive.moveNewTab === 'end') return
  if (activeTab && activeTab.panelId === panel.id && !activeTab.pinned) {
    if (Settings.reactive.moveNewTab === 'before') return activeTab.parentId
    else if (Settings.reactive.moveNewTab === 'after') return activeTab.parentId
    else if (Settings.reactive.moveNewTab === 'first_child') return activeTab.id
    else if (Settings.reactive.moveNewTab === 'last_child') return activeTab.id
  }

  return openerTabId
}

/**
 * Check url rules of tabs panel and move/create tab if needed
 */
export async function checkUrlRules(url: string, tab: Tab): Promise<void> {
  const panelId = Sidebar.findTabsPanelForUrl(url, tab.panelId)
  if (panelId === undefined) return

  const panel = Sidebar.reactive.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  let index = Tabs.getIndexForNewTab(panel, tab)
  if (index === undefined) index = panel.nextTabIndex ?? Tabs.list.length

  if (panel.newTabCtx !== 'none' && tab.cookieStoreId !== panel.newTabCtx) {
    await browser.tabs.remove(tab.id)
    Tabs.createTabInPanel(panel, { url: tab.url })
    return
  }

  if (index > tab.index) index--
  if (index !== tab.index) {
    tab.dstPanelId = panelId
    browser.tabs.move(tab.id, { windowId: Windows.id, index })
  } else {
    tab.panelId = panel.id
  }

  if (tab.active) Sidebar.switchToPanel(panel.id, true)
}

export function handleReopening(tabId: ID, newCtx: string): number | undefined {
  // console.log(`[DEBUG] tabs.handleReopening(tabId: ${tabId}, newCtx: ${newCtx})`)
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  let parent: ID = -1
  const panel = Sidebar.reactive.panels.find(
    p => Utils.isTabsPanel(p) && p.moveTabCtx === newCtx
  ) as TabsPanel
  let panelId
  let index
  if (panel) {
    index = getIndexForNewTab(panel, {} as Tab)
    if (index === undefined) index = panel.nextTabIndex
    panelId = panel.id
  } else {
    parent = targetTab.parentId
    panelId = targetTab.panelId
  }
  if (index === undefined) index = targetTab.index

  setNewTabPosition(index, parent, panelId)

  return index
}

/**
 * Update indexes of tabs
 */
export function updateTabsIndexes(fromIndex = 0, toIndex = -1): void {
  // console.log(`[DEBUG] tabs.updateTabsIndexes(fromIndex: ${fromIndex}, toIndex: ${toIndex})`)
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
export function setNewTabPosition(index: number, parentId: ID, panelId: ID): void {
  Tabs.newTabsPosition[index] = {
    parent: parentId < 0 ? undefined : parentId,
    panel: panelId,
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
  let target
  const rmFolded = Settings.reactive.rmChildTabs === 'folded'
  const rmChild = Settings.reactive.rmChildTabs === 'all'
  const skipFolded = Settings.reactive.activateAfterClosingNoFolded
  const skipDiscarded = Settings.reactive.activateAfterClosingNoDiscarded
  const dirNext = Settings.reactive.activateAfterClosing === 'next'
  const dirPrev = Settings.reactive.activateAfterClosing === 'prev'

  if (Tabs.removingTabs && !exclude) exclude = Tabs.removingTabs

  if (tab.pinned && (dirNext || dirPrev)) {
    const pinInPanels = Settings.reactive.pinnedTabsPosition === 'panel'
    const dirDir = dirNext ? 1 : -1
    const opDir = dirDir * -1
    if (Tabs.byId[tab.relGroupId]) target = Tabs.byId[tab.relGroupId]
    if (!target) {
      for (let foundTab, i = tab.index + dirDir; (foundTab = Tabs.list[i]); i += dirDir) {
        if (!foundTab?.pinned) break
        if (pinInPanels && foundTab.panelId === tab.panelId) target = foundTab
        else if (!pinInPanels) target = foundTab
      }
    }
    if (!target) {
      for (let foundTab, i = tab.index + opDir; (foundTab = Tabs.list[i]); i += opDir) {
        if (!foundTab?.pinned) break
        if (pinInPanels && foundTab.panelId === tab.panelId) target = foundTab
        else if (!pinInPanels) target = foundTab
      }
    }
    if (!target) {
      const panel = Sidebar.reactive.panelsById[tab.panelId]
      if (pinInPanels && Utils.isTabsPanel(panel)) {
        target = Tabs.byId[panel.tabs[0]?.id]
      }
    }

    return target
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

  const panel = Sidebar.reactive.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  let dir: 1 | -1 = dirNext ? 1 : -1
  let mode = SuccessorSearchMode.InBranchTick
  if (dirNext) {
    if (tab.parentId === -1) mode = SuccessorSearchMode.InPanelTick
    else mode = SuccessorSearchMode.InBranchTick
  } else {
    mode = SuccessorSearchMode.InPanelTick
  }
  let inBranch = true
  let upI = tab.index - 1
  let downI = tab.index + 1
  let foundTab: Tab | undefined
  let discardedFallback: Tab | undefined
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
              target = Tabs.byId[pTab.id]
              break mainLoop
            }
          }
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
    if (dir === -1 && foundTab.invisible) continue

    // Skip discarded tab
    if (skipDiscarded && foundTab.discarded) {
      if (!discardedFallback) discardedFallback = foundTab
      continue
    }

    target = foundTab
    break
  }

  // Previously active tab
  if (Settings.reactive.activateAfterClosing === 'prev_act') {
    let history: ActiveTabsHistory
    if (Settings.reactive.activateAfterClosingGlobal) history = Tabs.activeTabsGlobal
    else history = Tabs.activeTabsPerPanel[tab.panelId] || Tabs.activeTabsGlobal

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
  if (!prevTab.pinned || Settings.reactive.pinnedTabsPosition === 'panel') {
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
  const result = await Utils.parseDragEvent(e)
  const panel = Sidebar.reactive.panelsById[dst.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) return

  const container = panel.dropTabCtx ? Containers.reactive.byId[panel.dropTabCtx] : undefined
  const inside = dst.index === -1
  if (dst.parentId === undefined) dst.parentId = NOID
  if (inside) {
    const parentTab = Tabs.byId[dst.parentId]
    if (parentTab) dst.index = parentTab.index + 1
  }

  if (result?.file) result.url = URL.createObjectURL(result.file)

  if (result?.url) {
    if (inside && dst.parentId > -1 && e.shiftKey) {
      browser.tabs.update(dst.parentId, { url: result.url })
    } else {
      setNewTabPosition(dst.index ?? 0, dst.parentId, panel.id)
      browser.tabs.create({
        active: true,
        url: result.url,
        index: dst.index,
        openerTabId: dst.parentId < 0 ? undefined : dst.parentId,
        cookieStoreId: container?.id,
        windowId: Windows.id,
        pinned: dst.pinned,
      })
    }
    return
  }

  if (result?.text) {
    let tabId: ID
    if (inside && dst.parentId > -1 && e.shiftKey) tabId = dst.parentId
    else {
      setNewTabPosition(dst.index ?? 0, dst.parentId, panel.id)
      const tab = await browser.tabs.create({
        active: true,
        index: dst.index,
        openerTabId: dst.parentId < 0 ? undefined : dst.parentId,
        cookieStoreId: container?.id,
        windowId: Windows.id,
        pinned: dst.pinned,
      })
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
    const activeTab = Tabs.byId[Tabs.activeId]
    if (Settings.reactive.activateAfterClosing !== 'none' && activeTab) {
      const target = findSuccessorTab(activeTab, ids)
      if (target && target.id !== activeTab.successorTabId) {
        browser.tabs.moveInSuccession([activeTab.id], target.id)
      }
    }
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
    return await Msg.req(InstanceType.bg, 'createWindowWithTabs', items, {
      incognito: dst.incognito,
    })
  }

  // Open tabs in another window
  if (dst.windowId !== undefined && dst.windowId !== Windows.id) {
    if (dst.windowId === ASKID) {
      if (dst.windowChooseConf === undefined) dst.windowId = await Windows.showWindowsPopup()
      else dst.windowId = await Windows.showWindowsPopup(dst.windowChooseConf)
      if (dst.windowId === undefined || dst.windowId < 0) return true

      delete dst.windowChooseConf
    }

    const ans = await Msg.reqSidebar(dst.windowId, 'openTabs', items, dst)
    if (!ans) {
      for (const item of items) {
        await browser.tabs.create({ url: item.url, windowId: dst.windowId })
      }
    }

    return true
  }

  // Open tabs in current window
  // ---

  Logs.info('Tabs: Open tabs in current window')

  // Get dst panel
  let dstPanel: Panel | undefined = Sidebar.reactive.panelsById[dst.panelId ?? NOID]
  if (dst.panelId === undefined || !dstPanel || dstPanel.type !== PanelType.tabs) {
    dstPanel = Sidebar.reactive.panels.find(p => p.type === PanelType.tabs)
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
    const parent = Tabs.reactive.byId[dst.parentId ?? item.parentId ?? NOID]

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
    if (!Settings.reactive.tabsTree && groupCreationNeeded) continue
    if (!Sidebar.hasTabs && groupCreationNeeded) continue
    if (dst.pinned && groupCreationNeeded) continue
    // Temporarily ignore groups with tree limit, I fix this later, ...yep
    if (Settings.reactive.tabsTreeLimit > 0 && groupCreationNeeded) continue

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
    const isDefaultContainer = !conf.cookieStoreId || conf.cookieStoreId === CONTAINER_ID
    if (
      dst.discarded &&
      isDefaultContainer &&
      conf.url &&
      !conf.url.startsWith('about') &&
      !dst.pinned
    ) {
      conf.discarded = true
      conf.title = item.title
      conf.active = false
    }

    if (!dst.pinned) {
      if (item.parentId !== undefined && idsMap[item.parentId] >= 0) {
        conf.openerTabId = idsMap[item.parentId]
      } else if (parent) conf.openerTabId = parent.id
    }

    if (index !== undefined) {
      setNewTabPosition(index, conf.openerTabId ?? NOID, dstPanel?.id ?? NOID)
    }

    const tab = await browser.tabs.create(conf)
    idsMap[item.id] = tab.id
  }

  return true
}

export function getTabsInfo(ids: ID[]): ItemInfo[] {
  const items: ItemInfo[] = []

  for (const id of ids) {
    const tab = Tabs.byId[id]
    if (tab) {
      items.push({
        id,
        url: tab.url,
        parentId: tab.parentId,
        title: tab.title,
        active: tab.active,
        index: tab.index,
        pinned: tab.pinned,
        container: tab.cookieStoreId,
      })

      // Include folded tabs
      if (tab.folded) {
        for (let i = tab.index + 1; i < Tabs.list.length; i++) {
          const child = Tabs.list[i]
          if (!child.invisible) break
          if (ids.includes(child.id)) continue
          items.push({
            id,
            url: child.url,
            parentId: child.parentId,
            title: child.title,
            active: child.active,
            index: child.index,
            pinned: child.pinned,
            container: child.cookieStoreId,
          })
        }
      }
    }
  }

  return items
}

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
export function scrollToTab(id: ID): void {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.scrollEl) return

  const elId = 'tab' + id.toString()
  const el = document.getElementById(elId)
  if (!el) return

  const pH = panel.scrollEl.offsetHeight
  const pS = panel.scrollEl.scrollTop
  const tH = el.offsetHeight
  const tY = el.offsetTop

  if (tY < pS + PRE_SCROLL) {
    if (pS > 0) {
      let y = tY - PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      panel.scrollEl.scroll(scrollConf)
    }
  } else if (tY + tH > pS + pH - PRE_SCROLL) {
    scrollConf.top = tY + tH - pH + PRE_SCROLL
    panel.scrollEl.scroll(scrollConf)
  }
}

export function getBranch(tab: Tab): Tab[] {
  const result: Tab[] = [tab]

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

export function copyUrls(ids: ID[]): void {
  if (!Permissions.reactive.clipboardWrite) {
    SetupPage.open('clipboard-write')
    return
  }

  let urls = ''
  for (const id of ids) {
    const tab = Tabs.reactive.byId[id]
    if (tab) urls += '\n' + tab.url
  }

  const resultString = urls.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export function copyTitles(ids: ID[]): void {
  if (!Permissions.reactive.clipboardWrite) {
    SetupPage.open('clipboard-write')
    return
  }

  let titles = ''
  for (const id of ids) {
    const tab = Tabs.reactive.byId[id]
    if (tab) titles += '\n' + tab.title
  }

  const resultString = titles.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export async function createTabInNewContainer(): Promise<void> {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel)) throw 'Current panel is not TabsPanel'

  // Create container
  const len = Object.keys(Containers.reactive.byId).length
  const name = translate('container.new_container_name') + ' ' + len.toString()
  const container = await Containers.create(name, 'toolbar', 'fingerprint')

  // Open config popup
  const result = await Sidebar.startFastEditingOfContainer(container.id, true)
  if (!result) return Logs.info('Tabs: Container creation canceled')

  const dst: DstPlaceInfo = { panelId: panel.id, containerId: container.id }
  await Tabs.open([{ id: -1, url: 'about:newtab' }], dst)
}

export async function reopenTabsInNewContainer(tabIds: ID[]): Promise<void> {
  const firstTab = Tabs.byId[tabIds[0]]
  if (!firstTab) return

  // Create container
  const len = Object.keys(Containers.reactive.byId).length
  const name = translate('container.new_container_name') + ' ' + len.toString()
  const container = await Containers.create(name, 'toolbar', 'fingerprint')

  // Open config popup
  const result = await Sidebar.startFastEditingOfContainer(container.id, true)
  if (!result) return Logs.info('Tabs: Container creation canceled')

  const items = Tabs.getTabsInfo(tabIds)
  await Tabs.reopen(items, { panelId: firstTab.panelId, containerId: container.id })
}
