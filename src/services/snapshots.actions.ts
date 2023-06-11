import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import { NOID, CONTAINER_ID, DEFAULT_CONTAINER, GROUP_URL, TABS_PANEL_CONFIG } from 'src/defaults'
import { Snapshot, SnapTab, NormalizedSnapshot, SnapExportTypes, SnapExportInfo } from 'src/types'
import { RemovingSnapshotResult, SnapPanelState, SnapStoreMode, SnapTabState } from 'src/types'
import { Stored, Notification, Snapshot_v4, SnapWindowState, SnapshotState } from 'src/types'
import * as Logs from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Tabs } from 'src/services/tabs.bg'
import { Store } from 'src/services/storage'
import { SetupPage } from 'src/services/setup-page'
import { Notifications } from 'src/services/notifications'
import * as IPC from './ipc'
import { Containers } from './containers'
import { DEFAULT_CONTAINER_ID } from 'src/defaults/containers'
import { PanelType } from 'src/types/sidebar'
import { ItemInfo } from 'src/types/tabs'
import { Info } from './info'
import { createDefaultSidebarConfig, getSidebarConfigFromV4 } from './sidebar-config'
import { Favicons } from './favicons'

const MIN_SNAP_INTERVAL = 60_000
const MIN_LIMITING_COUNT = 1
const MAX_SIZE_LIMIT = 50_000_000

/**
 * Create base snapshot
 */
export async function createSnapshot(auto = false): Promise<Snapshot | undefined> {
  if (!Info.isBg) return await IPC.bg('createSnapshot')

  // Get snapshot src data and current snapshots list
  let waiting
  try {
    waiting = await Promise.allSettled([
      browser.storage.local.get<Stored>(['sidebar', 'containers', 'snapshots']),
      Tabs.updateBgTabsTreeData(),
    ])
  } catch (err) {
    Logs.err('createSnapshot: Cannot get source data', err)
    return
  }
  const storedResult = waiting[0]
  const stored = storedResult?.status === 'fulfilled' ? storedResult.value : undefined
  if (!stored) return

  if (!stored.containers) stored.containers = {}
  if (!stored.sidebar) stored.sidebar = createDefaultSidebarConfig()
  if (!stored.snapshots) stored.snapshots = []

  // Get tabs info per window per panel
  const tabs: SnapTab[][][] = []
  for (const window of Object.values(Windows.byId)) {
    if (Settings.state.snapExcludePrivate && window.incognito) continue
    if (window.id === undefined || !window.tabs) continue
    if (window.type !== 'normal') continue

    const winTabs: SnapTab[][] = []
    const snapTabsById: Record<ID, SnapTab> = {}
    let panelTabs: SnapTab[] | undefined
    let targetGroup: ID = ''

    for (const tab of window.tabs) {
      const snapTab: SnapTab = { url: tab.url, title: tab.title, panelId: tab.panelId }
      const parent = snapTabsById[tab.parentId]
      if (parent && parent.panelId === tab.panelId) snapTab.lvl = (parent.lvl ?? 0) + 1
      if (tab.pinned) {
        snapTab.pinned = true
        if (Settings.state.pinnedTabsPosition !== 'panel') snapTab.panelId = -1
      }
      if (tab.cookieStoreId !== CONTAINER_ID) snapTab.containerId = tab.cookieStoreId
      if (tab.customTitle) snapTab.customTitle = tab.customTitle
      if (tab.customColor) snapTab.customColor = tab.customColor

      snapTab.url = Utils.denormalizeUrl(snapTab.url) ?? snapTab.url
      snapTabsById[tab.id] = snapTab

      // Check panel
      if (snapTab.panelId !== -1) {
        const panelConf = stored.sidebar.panels[snapTab.panelId]
        if (!panelConf) snapTab.panelId = -1
      }

      // Check container
      if (snapTab.containerId) {
        const containerConf = stored.containers[snapTab.containerId]
        if (!containerConf) delete snapTab.containerId
      }

      // Pinned tabs
      if (tab.pinned && targetGroup !== 'pinned') {
        panelTabs = []
        winTabs.push(panelTabs)
        targetGroup = 'pinned'
      }

      // Tabs by panel
      if (!tab.pinned && targetGroup !== tab.panelId) {
        panelTabs = []
        winTabs.push(panelTabs)
        targetGroup = tab.panelId
      }

      if (panelTabs) panelTabs.push(snapTab)
    }

    tabs.push(winTabs)
  }

  const currentSnapshot: NormalizedSnapshot = {
    id: Math.random().toString(36).replace('0.', Date.now().toString(36)),
    time: Date.now(),
    containers: stored.containers,
    sidebar: stored.sidebar,
    tabs,
  }

  if (Settings.state.snapAutoExport) {
    exportSnapshot(currentSnapshot)
  }

  minimizeSnapshot(stored.snapshots, currentSnapshot)

  const prevSnapshot = stored.snapshots[stored.snapshots.length - 1]
  if (auto && prevSnapshot && isSnapshotRedundant(prevSnapshot, currentSnapshot)) return

  stored.snapshots.push(currentSnapshot)

  try {
    const limited = limitSnapshots(stored.snapshots)
    if (limited) stored.snapshots = limited
  } catch (err) {
    Logs.err('Cannot limit snapshots', err)
  }

  await Store.set({ snapshots: stored.snapshots, lastSnapTime: currentSnapshot.time })

  if (Settings.state.snapNotify) {
    IPC.sendToSidebars('notifyAboutNewSnapshot')
  }

  return currentSnapshot
}

function getExportPath(expInfo: SnapExportInfo) {
  let snapAutoExportPath = Settings.state.snapAutoExportPath
  if (!snapAutoExportPath) snapAutoExportPath = 'Sidebery/snapshot-%Y.%M.%D-%h.%m.%s'
  snapAutoExportPath = Utils.dateTimeTemplate(snapAutoExportPath, expInfo.time)
  snapAutoExportPath = snapAutoExportPath.replace(/^\.+/, '')

  const pathArr = snapAutoExportPath.split(/\/|\\/)
  const normPathArr = pathArr.filter(part => !!part)
  const normPath = normPathArr.join('/')

  return normPath
}

export function exportSnapshot(snapshot: NormalizedSnapshot) {
  if (!browser?.downloads) return

  const expType = Settings.state.snapAutoExportType
  const expInfo = prepareExport(snapshot, {
    JSON: expType === 'json' || expType === 'both',
    Markdown: expType === 'md' || expType === 'both',
  })

  const path = getExportPath(expInfo)

  if (expInfo.jsonFile) {
    browser.downloads.download({
      url: URL.createObjectURL(expInfo.jsonFile),
      filename: `${path}.json`,
      conflictAction: 'overwrite',
      saveAs: false,
    })
  }

  if (expInfo.mdFile) {
    browser.downloads.download({
      url: URL.createObjectURL(expInfo.mdFile),
      filename: `${path}.md`,
      conflictAction: 'overwrite',
      saveAs: false,
    })
  }
}
export async function addSnapshot(snapshot: NormalizedSnapshot) {
  if (!Info.isBg) return await IPC.bg('addSnapshot', snapshot)

  const stored = await browser.storage.local.get<Stored>('snapshots').catch(() => undefined)
  const snapshots = stored?.snapshots ?? []
  const timestamp = Date.now()

  snapshot.time = timestamp
  snapshots.push(snapshot)

  return await Store.set({ snapshots, lastSnapTime: timestamp })
}

function isSnapshotRedundant(prevSnapshot: Snapshot, snapshot: Snapshot): boolean {
  if (snapshot.containers !== SnapStoreMode.Unchanged) return false
  if (snapshot.sidebar !== SnapStoreMode.Unchanged) return false

  if (prevSnapshot.tabs.length !== snapshot.tabs.length) return false

  for (let wi = 0; wi < snapshot.tabs.length; wi++) {
    const win = snapshot.tabs[wi]
    const prevWin = prevSnapshot.tabs[wi]
    if (!win) return false
    if (prevWin?.length !== win?.length) return false

    for (let pi = 0; pi < win.length; pi++) {
      const panel = win[pi]
      const prevPanel = prevWin[pi]
      if (!panel) return false
      if (prevPanel?.length !== panel?.length) return false

      for (const tab of panel) {
        if (tab !== SnapStoreMode.Unchanged) return false
      }
    }
  }
  return true
}

export function minimizeSnapshot(snapshots: Snapshot[], snapshot: Snapshot): void {
  const newContainersJSON = JSON.stringify(snapshot.containers)
  const newSidebarJSON = JSON.stringify(snapshot.sidebar)

  // Containers
  for (let i = snapshots.length; i--; ) {
    const snapN = snapshots[i]
    if (!snapN || !snapN.containers) break

    if (snapN.containers === SnapStoreMode.Unchanged) continue

    const lastContainersJSON = JSON.stringify(snapN.containers)
    if (newContainersJSON === lastContainersJSON) {
      snapshot.containers = SnapStoreMode.Unchanged
    }

    break
  }

  // Nav and panels
  for (let i = snapshots.length; i--; ) {
    const snapN = snapshots[i]
    if (!snapN || !snapN.sidebar) break

    if (snapN.sidebar === SnapStoreMode.Unchanged) continue

    const lastSidebarJSON = JSON.stringify(snapN.sidebar)
    if (newSidebarJSON === lastSidebarJSON) {
      snapshot.sidebar = SnapStoreMode.Unchanged
    }

    break
  }

  // Tabs (by relative index)
  // per win (current)
  per_win: for (let wi = 0; wi < snapshot.tabs.length; wi++) {
    const win = snapshot.tabs[wi]
    if (!win) break per_win // stop tabs minimizing

    // per group (current)
    per_panel: for (let gi = 0; gi < win.length; gi++) {
      const tabs = win[gi]
      if (!tabs) break per_win // stop tabs minimizing

      // per tab (current)
      per_tab: for (let ti = 0; ti < tabs.length; ti++) {
        const tab = tabs[ti]
        if (!tab) break per_win // stop tabs minimizing
        if (tab === SnapStoreMode.Unchanged) continue

        // per snapshot (previous)
        for (let i = snapshots.length; i--; ) {
          const snapN = snapshots[i]
          if (!snapN) break per_win // stop tabs minimizing

          const winN = snapN.tabs[wi]
          if (!winN) break per_win // stop tabs minimizing

          const panelN = winN[gi]
          if (!panelN) break per_panel // go to the next win

          const tabN = panelN[ti]
          if (!tabN) break per_tab // go to the next panel

          if (tabN === SnapStoreMode.Unchanged) continue // go to the prev snapshot

          if (
            tab.url === tabN.url &&
            tab.title === tabN.title &&
            tab.pinned === tabN.pinned &&
            tab.containerId === tabN.containerId &&
            tab.panelId === tabN.panelId &&
            tab.lvl === tabN.lvl &&
            tab.customTitle === tabN.customTitle &&
            tab.customColor === tabN.customColor
          ) {
            tabs[ti] = SnapStoreMode.Unchanged
          }

          break // go to the next tab
        }
      }
    }
  }
}

export function getNormalizedSnapshot(
  snapshots: Snapshot[],
  index: number
): NormalizedSnapshot | undefined {
  const snapshot = snapshots[index]
  if (!snapshot) return

  // Containers
  if (snapshot.containers === SnapStoreMode.Unchanged) {
    for (let i = index; i--; ) {
      const snapN = snapshots[i]
      if (snapN && snapN.containers !== SnapStoreMode.Unchanged) {
        snapshot.containers = snapN.containers
        break
      }
    }
  }

  // Nav and panels
  if (snapshot.sidebar === SnapStoreMode.Unchanged) {
    for (let i = index; i--; ) {
      const snapN = snapshots[i]
      if (snapN && snapN.sidebar !== SnapStoreMode.Unchanged) {
        snapshot.sidebar = snapN.sidebar
        break
      }
    }
  }

  // Tabs
  for (let wi = 0; wi < snapshot.tabs.length; wi++) {
    const win = snapshot.tabs[wi]
    if (!win) continue

    for (let pi = 0; pi < win.length; pi++) {
      const panel = win[pi]
      if (!panel) continue

      for (let ti = 0; ti < panel.length; ti++) {
        const tab = panel[ti]

        if (tab === SnapStoreMode.Unchanged) {
          if (index === 0) return

          for (let i = index; i--; ) {
            const snapN = snapshots[i]
            const tabN = snapN?.tabs[wi]?.[pi]?.[ti]
            if (tabN && tabN !== SnapStoreMode.Unchanged) {
              panel[ti] = tabN
              break
            }

            if (i === 0) return
          }
        }
      }
    }
  }

  if (!snapshot.sidebar || snapshot.sidebar === SnapStoreMode.Unchanged) return
  if (!snapshot.containers || snapshot.containers === SnapStoreMode.Unchanged) return

  return snapshot as NormalizedSnapshot
}

export function notifyAboutNewSnapshot(): void {
  if (Settings.state.snapExcludePrivate && Windows.incognito) return
  const config: Notification = {
    icon: '#icon_snapshot',
    title: translate('notif.snapshot_created'),
    ctrl: translate('notif.view_snapshot'),
    callback: () => SetupPage.open('snapshots'),
  }

  Notifications.notify(config)
}

export async function scheduleSnapshots(): Promise<void> {
  clearTimeout(scheduleTimeout)

  const interval = getSnapInterval()
  if (interval < MIN_SNAP_INTERVAL) return

  const elapsed = await getLastSnapTimeElapsed()
  let nextInterval = interval - elapsed
  if (nextInterval < MIN_SNAP_INTERVAL) nextInterval = MIN_SNAP_INTERVAL

  scheduleNextSnapshot(nextInterval)
}

let scheduleTimeout: number | undefined
function scheduleNextSnapshot(nextTimeout: number): void {
  scheduleTimeout = setTimeout(() => {
    nextTimeout = getSnapInterval()
    if (nextTimeout < MIN_SNAP_INTERVAL) nextTimeout = MIN_SNAP_INTERVAL
    createSnapshot(true)
    scheduleNextSnapshot(nextTimeout)
  }, nextTimeout)
}

function getSnapInterval(): number {
  let interval = Settings.state.snapInterval
  const unit = Settings.state.snapIntervalUnit
  if (!interval || typeof interval !== 'number') return 0
  if (unit === 'min') interval = Settings.state.snapInterval * 60000
  if (unit === 'hr') interval = Settings.state.snapInterval * 3600000
  if (unit === 'day') interval = Settings.state.snapInterval * 86400000
  return interval
}

async function getLastSnapTimeElapsed(): Promise<number> {
  const stored = await browser.storage.local.get<Stored>('lastSnapTime')
  const now = Date.now()
  const lastSnapTime = stored.lastSnapTime ?? now
  const elapsed = now - lastSnapTime
  if (elapsed < 0) return 0
  return elapsed
}

async function adaptContainers(snapshot: NormalizedSnapshot): Promise<void> {
  const currentContainers = Object.values(Containers.reactive.byId)
  const oldNewIds: Record<string, string> = {}

  for (const container of Object.values(snapshot.containers)) {
    const currentContainer = currentContainers.find(c => {
      return c.name === container.name && c.icon === container.icon && c.color === container.color
    })

    Containers.updateReopeningRules(container)

    // Create new container
    if (!currentContainer) {
      const newContainer = await Containers.create(container.name, container.color, container.icon)
      newContainer.proxified = container.proxified
      newContainer.proxy = container.proxy
      newContainer.reopenRulesActive = container.reopenRulesActive
      newContainer.reopenRules = Utils.cloneArray(container.reopenRules)
      newContainer.userAgentActive = container.userAgentActive
      newContainer.userAgent = container.userAgent
      oldNewIds[container.id] = newContainer.id
    }

    // Do nothing with extisted
    else {
      oldNewIds[container.id] = currentContainer.id
    }
  }

  // Update snapshot tabs container ids
  for (const win of snapshot.tabs) {
    for (const panel of win) {
      for (const tab of panel) {
        if (tab.containerId && oldNewIds[tab.containerId]) {
          tab.containerId = oldNewIds[tab.containerId]
        }
      }
    }
  }

  // Save containers config
  await Containers.saveContainers()
}

async function adaptTabsPanels(snapshot: NormalizedSnapshot): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('sidebar')
  if (!stored.sidebar?.nav) return

  // Find last index of tabs panel
  let lastStoredTabsPanelIndex = stored.sidebar.nav.length
  while (lastStoredTabsPanelIndex-- > 0) {
    const storedId = stored.sidebar.nav[lastStoredTabsPanelIndex]
    if (storedId === undefined) break
    const storedPanel = stored.sidebar.panels[storedId]
    if (storedPanel && storedPanel.type === PanelType.tabs) break
  }

  // Recreate tabs panels
  let changed = false
  for (let i = 0; i < snapshot.sidebar.nav.length; i++) {
    const snapId = snapshot.sidebar.nav[i]
    if (snapId === undefined) continue
    const snapPanel = snapshot.sidebar.panels[snapId]
    if (!snapPanel || snapPanel.type !== PanelType.tabs) continue

    const storedIndex = stored.sidebar.nav.indexOf(snapId)
    if (storedIndex === -1) {
      changed = true
      lastStoredTabsPanelIndex++
      stored.sidebar.nav.splice(lastStoredTabsPanelIndex, 0, snapId)
      stored.sidebar.panels[snapId] = snapPanel
    }
  }

  // Update snapshot tabs ordering
  for (let i = 0; i < snapshot.tabs.length; i++) {
    const win = snapshot.tabs[i]
    if (!win || win.length <= 1) continue

    const newOrder: SnapTab[][] = []

    // Pinned tabs
    if (win[0]?.[0]?.pinned) {
      newOrder.push(win[0])
      win.shift()
    }

    // Tabs w/o panelId
    for (const tabs of win) {
      if (tabs[0]?.panelId === NOID) newOrder.push(tabs)
    }

    for (const storedId of stored.sidebar.nav) {
      const storedPanel = stored.sidebar.panels[storedId]
      if (!storedPanel || storedPanel.type !== PanelType.tabs) continue

      const snapPanelTabs = win.find(tabs => tabs[0]?.panelId === storedPanel.id)
      if (snapPanelTabs) newOrder.push(snapPanelTabs)
      else continue
    }

    snapshot.tabs[i] = newOrder
  }

  if (changed) await Store.set({ sidebar: stored.sidebar })
}

/**
 * Open windows (all or by index) of snapshot
 */
export async function openWindows(snapshot: NormalizedSnapshot, winIndex?: number): Promise<void> {
  // Adapt containers
  await adaptContainers(snapshot)

  // Adapt nav and panels
  await adaptTabsPanels(snapshot)

  // Open windows
  if (winIndex === undefined) {
    for (let i = 0; i < snapshot.tabs.length; i++) {
      await openWindow(snapshot, i)
    }
  } else {
    await openWindow(snapshot, winIndex)
  }
}

/**
 * Open window of snapshot
 */
async function openWindow(snapshot: NormalizedSnapshot, winIndex: number): Promise<void> {
  const winTabs = snapshot.tabs[winIndex]
  if (!winTabs) return Logs.warn('Snapshots.openWindow: No winTabs')

  // Create tabs info
  const items: ItemInfo[] = []
  const tabsInfoByLvl: Record<number, ItemInfo> = {}
  let index = 0
  for (const panel of winTabs) {
    for (const tab of panel) {
      const tabInfo: ItemInfo = {
        id: index++,
        url: tab.url,
        title: tab.title,
        parentId: NOID,
        panelId: tab.panelId ?? NOID,
        container: tab.containerId ?? DEFAULT_CONTAINER_ID,
      }
      if (tab.customTitle) tabInfo.customTitle = tab.customTitle
      if (tab.customColor) tabInfo.customColor = tab.customColor
      tabsInfoByLvl[tab.lvl ?? 0] = tabInfo

      if (tab.pinned) tabInfo.pinned = true

      if (Utils.isGroupUrl(tab.url)) {
        const index = tab.url.indexOf('group.html') + 10
        const newUrl = GROUP_URL + tab.url.slice(index)
        tabInfo.url = newUrl
      }

      if (tab.lvl) {
        const parent = tabsInfoByLvl[tab.lvl - 1]
        if (parent) tabInfo.parentId = parent.id
      }

      items.push(tabInfo)
    }
  }

  const firstItem = items[0]
  if (firstItem) firstItem.active = true

  await Windows.createWithTabs(items, { incognito: false })
}

function limitSnapshots(snapshots: Snapshot[]): Snapshot[] | undefined {
  if (snapshots.length <= MIN_LIMITING_COUNT) return

  const limit = Settings.state.snapLimit
  const unit = Settings.state.snapLimitUnit

  if (!limit) return snapshots

  let normLimit = limit
  if (unit === 'day') normLimit = Date.now() - limit * 86400000
  if (unit === 'kb') normLimit = limit * 1024

  let index = snapshots.length
  let accum = 0
  let sizeAccum = 0
  while (index--) {
    const snapshot = snapshots[index]
    if (!snapshot) continue

    sizeAccum += new Blob([JSON.stringify(snapshot)]).size

    if (unit === 'snap') {
      accum++
      if (accum > normLimit) break
    }

    if (unit === 'kb' && sizeAccum > normLimit) break

    if (unit === 'day' && snapshot.time < normLimit) break

    if (sizeAccum > MAX_SIZE_LIMIT) break
  }

  index++

  const normSnapshot = getNormalizedSnapshot(snapshots, index)
  if (normSnapshot) snapshots[index] = normSnapshot
  else return

  return snapshots.slice(index)
}

export async function removeSnapshot(id: ID): Promise<RemovingSnapshotResult> {
  let stored
  try {
    stored = await browser.storage.local.get<Stored>(['snapshots'])
  } catch (err) {
    Logs.err('removeSnapshot: Cannot get snapshots', err)
    return RemovingSnapshotResult.Err
  }
  if (!stored.snapshots) return RemovingSnapshotResult.Err

  const index = stored.snapshots.findIndex(s => s.id === id)
  const snapshot = stored.snapshots[index]
  if (!snapshot) return RemovingSnapshotResult.Err

  const nextSnapshot = stored.snapshots[index + 1]
  if (nextSnapshot) {
    const normSnapshot = getNormalizedSnapshot(stored.snapshots, index + 1)
    if (!normSnapshot) return RemovingSnapshotResult.Err
    stored.snapshots[index + 1] = normSnapshot
  }

  stored.snapshots.splice(index, 1)

  await Store.set(stored)

  return RemovingSnapshotResult.Ok
}

export function parseSnapshot(
  snapshots: Snapshot[],
  index: number,
  dayStartMs: number
): SnapshotState | undefined {
  const sizeStr = Utils.strSize(JSON.stringify(snapshots[index]))
  const snapshot = getNormalizedSnapshot(snapshots, index)
  if (!snapshot) return

  const windows: SnapWindowState[] = []
  const winCount = snapshot.tabs.length
  let tabsCount = 0

  // Per windows
  for (const win of snapshot.tabs) {
    if (!win.length) continue

    const panelsById: Record<ID, SnapPanelState> = {}
    const winState: SnapWindowState = { id: tabsCount, panels: [], tabsLen: 0 }
    windows.push(winState)

    // Per panels (or pinned tabs)
    for (const panel of win) {
      if (!panel.length) continue

      // Per tabs
      for (const tab of panel) {
        const container = tab.containerId ? snapshot.containers[tab.containerId] : undefined

        if (tab.pinned && tab.panelId === NOID) tab.panelId = 'global_pinned'

        let panelState = panelsById[tab.panelId]
        if (!panelState) {
          let panelConfig = snapshot.sidebar.panels[tab.panelId]
          if (!panelConfig) {
            panelConfig = Utils.cloneObject(TABS_PANEL_CONFIG)
            if (tab.pinned && tab.panelId === 'global_pinned') {
              panelConfig.id = 'global_pinned'
              panelConfig.name = translate('snapshot.global_pin_title')
              panelConfig.iconSVG = 'icon_pin'
            } else {
              panelConfig.id = NOID
              tab.panelId = NOID
            }
          }

          panelState = {
            id: panelConfig.id,
            tabs: [],
            name: panelConfig.name,
            iconSVG: panelConfig.iconSVG || 'icon_tabs',
            iconIMG: panelConfig.iconIMG,
            color: panelConfig.color,
          }
          panelsById[panelState.id] = panelState
        }

        const tabState: SnapTabState = {
          ...tab,
          id: tabsCount,
          containerIcon: container?.icon,
          containerColor: container?.color,
          domain: Utils.getDomainOf(tab.url),
          iconSVG: Favicons.getFavPlaceholder(tab.url),
          sel: false,
        }

        panelState.tabs.push(tabState)
        tabsCount++
        winState.tabsLen++
      }
    }

    if (panelsById['global_pinned']) winState.panels.push(panelsById['global_pinned'])
    for (const id of snapshot.sidebar.nav ?? []) {
      const panelState = panelsById[id]
      if (panelState?.tabs.length) winState.panels.push(panelState)
    }
  }

  return {
    ...snapshot,
    windows,
    dateStr: Utils.uDate(snapshot.time, '.', dayStartMs),
    timeStr: Utils.uTime(snapshot.time),
    sizeStr,
    winCount,
    tabsCount,
  }
}

export function isV4(snapshots?: Snapshot_v4[] | Snapshot[]): snapshots is Snapshot_v4[] {
  if (!snapshots) return false

  const first = snapshots[0]
  if (!first) return false

  return !!(first as Snapshot_v4).containersById
}

export function convertFromV4(oldSnapshots: Snapshot_v4[]): Snapshot[] {
  const result: Snapshot[] = []

  for (const snapshotV4 of oldSnapshots) {
    if (!snapshotV4.windows) continue

    const snapshot: NormalizedSnapshot = {
      id: snapshotV4.id ?? Math.random().toString(36).replace('0.', Date.now().toString(36)),
      time: snapshotV4.time ?? Date.now(),
      containers: {},
      sidebar: { nav: [], panels: {} },
      tabs: [],
    }

    // Containers
    if (snapshotV4.containersById) {
      for (const ctrV4 of Object.values(snapshotV4.containersById)) {
        if (ctrV4.id === undefined) continue
        const ctr = Utils.cloneObject(DEFAULT_CONTAINER)
        ctr.id = ctr.cookieStoreId = ctrV4.id
        ctr.name = ctrV4.name ?? ''
        ctr.color = ctrV4.color ?? 'toolbar'
        ctr.icon = ctrV4.icon ?? 'fingerprint'
        snapshot.containers[ctr.id] = ctr
      }
    }

    // Nav and panels
    let defaultPanelId = NOID
    if (snapshotV4.panels) {
      const defaultPanel = snapshotV4.panels.find(p => p.type === 'default')
      defaultPanelId = defaultPanel?.id ?? 'firefox-default'
      snapshot.sidebar = getSidebarConfigFromV4(snapshotV4.panels)
    }

    // Tabs
    for (const winV4 of Object.values(snapshotV4.windows)) {
      if (!winV4.items?.length) continue

      const win: SnapTab[][] = []
      let panelTabs: SnapTab[] | undefined
      let targetGroup: ID | undefined

      for (const tabV4 of winV4.items) {
        if (tabV4.url === undefined) continue

        const snapTab: SnapTab = { url: tabV4.url, title: tabV4.title ?? '', panelId: NOID }
        if (tabV4.panel) snapTab.panelId = tabV4.panel
        else snapTab.panelId = defaultPanelId
        if (tabV4.lvl) snapTab.lvl = tabV4.lvl
        if (tabV4.pinned) snapTab.pinned = true
        if (tabV4.ctr && tabV4.ctr !== CONTAINER_ID) snapTab.containerId = tabV4.ctr

        // Check panel
        if (snapTab.panelId !== -1) {
          const panelConf = snapshot.sidebar.panels[snapTab.panelId]
          if (!panelConf) snapTab.panelId = -1
        }

        // Check container
        if (snapTab.containerId) {
          const containerConf = snapshot.containers[snapTab.containerId]
          if (!containerConf) delete snapTab.containerId
        }

        // Pinned tabs
        if (snapTab.pinned && targetGroup !== 'pinned') {
          panelTabs = []
          win.push(panelTabs)
          targetGroup = 'pinned'
        }

        // Tabs by panel
        if (!snapTab.pinned && targetGroup !== snapTab.panelId) {
          panelTabs = []
          win.push(panelTabs)
          targetGroup = snapTab.panelId
        }

        if (panelTabs) panelTabs.push(snapTab)
      }

      snapshot.tabs.push(win)
    }

    // Minimize
    minimizeSnapshot(result, snapshot)

    result.push(snapshot)
  }

  return result
}

export function updateV4GroupUrls(snapshot: NormalizedSnapshot): void {
  for (const win of snapshot.tabs) {
    for (const panel of win) {
      for (const tab of panel) {
        if (Utils.isGroupUrl(tab.url)) {
          const index = tab.url.indexOf('group.html') + 10
          const newUrl = GROUP_URL + tab.url.slice(index)
          tab.url = newUrl
        }
      }
    }
  }
}

export async function getStoredSnapshots() {
  let stored
  try {
    stored = await browser.storage.local.get<Stored>('snapshots')
  } catch (err) {
    return Logs.err('Snapshots: getStoredSnapshots: Cannot get snapshots', err)
  }
  return stored.snapshots
}

export function prepareExport(snapshot: NormalizedSnapshot, type: SnapExportTypes) {
  const { id, time, containers, sidebar, tabs } = snapshot
  const expInfo: SnapExportInfo = { id, time, containers, sidebar, tabs }

  if (type.JSON) {
    const jsonStr = JSON.stringify(snapshot)
    expInfo.jsonFile = new Blob([jsonStr], { type: 'application/json' })
  }

  if (type.Markdown) {
    expInfo.md = convertToMarkdown(snapshot)
    expInfo.mdFile = new Blob([expInfo.md], { type: 'text/markdown' })
  }

  return expInfo
}

export function convertToMarkdown(snapshot: NormalizedSnapshot): string {
  const dateStr = Utils.uDate(snapshot.time, '.')
  const timeStr = Utils.uTime(snapshot.time, '.')
  const dateTimeStr = `${dateStr} - ${timeStr}`
  const md = [`# ${dateTimeStr}`, '']
  const globalPinnedTabs = []
  const pinnedTabsByPanelId: Map<ID, SnapTab[]> = new Map()

  const indent = '  '
  const pinMark = '📌 '
  const winIndent = ''
  const panelsIndent = Settings.state.snapMdFullTree ? indent : ''
  const tabsIndent = Settings.state.snapMdFullTree ? indent.repeat(2) : ''
  const winBullet = Settings.state.snapMdFullTree ? '- ' : ''
  const panelBullet = Settings.state.snapMdFullTree ? '- ' : ''
  const tabBullet = '- '

  // Gather pinned tabs
  if (snapshot.tabs[0]?.[0]?.[0]?.pinned) {
    const pinnedTabs = snapshot.tabs[0]?.[0]
    for (const tab of pinnedTabs) {
      const panelConfig = snapshot.sidebar.panels[tab.panelId]
      if (panelConfig) {
        let panelPinnedTabs = pinnedTabsByPanelId.get(tab.panelId)
        if (!panelPinnedTabs) panelPinnedTabs = []
        panelPinnedTabs.push(tab)
        pinnedTabsByPanelId.set(tab.panelId, panelPinnedTabs)
      } else {
        globalPinnedTabs.push(tab)
      }
    }
  }

  // Per-window
  for (let i = 0; i < snapshot.tabs.length; i++) {
    const win = snapshot.tabs[i]
    const winTitle = `## ${translate('snapshot.window_title')} ${i + 1}`
    md.push(winIndent + winBullet + winTitle)

    // Global pinned tabs
    if (globalPinnedTabs.length) {
      const globalPinnedTitle = `### ${translate('snapshot.global_pin_title')}`
      md.push(panelsIndent + panelBullet + globalPinnedTitle)

      for (const tab of globalPinnedTabs) {
        const tabLink = `[${tab.title}](${tab.url})`
        md.push(tabsIndent + tabBullet + pinMark + tabLink)
      }
    }

    // Per-panel
    for (const id of snapshot.sidebar.nav) {
      const panel = snapshot.sidebar.panels[id]
      if (!Utils.isTabsPanel(panel)) continue

      // Get tabs
      const pinnedTabs = pinnedTabsByPanelId.get(id)
      const normalTabs = win.find(p => p[0] && p[0].panelId === id && !p[0].pinned)
      if (!pinnedTabs?.length && !normalTabs) continue

      // Create panel title
      const panelTitle = `### ${panel.name}`
      md.push(panelsIndent + panelBullet + panelTitle)

      // Pinned tabs
      if (pinnedTabs?.length) {
        for (const tab of pinnedTabs) {
          const tabLink = `[${tab.title}](${tab.url})`
          md.push(tabsIndent + tabBullet + pinMark + tabLink)
        }
      }

      // Normal tabs
      if (normalTabs?.length) {
        for (const tab of normalTabs) {
          const tabLink = `[${tab.title}](${tab.url})`
          md.push(tabsIndent + indent.repeat(tab.lvl ?? 0) + tabBullet + tabLink)
        }
      }
    }
  }

  return md.join('\n')
}
