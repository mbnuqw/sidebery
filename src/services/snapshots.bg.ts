import { Snapshot, SnapTab, NormalizedSnapshot, SnapExportInfo, Stored } from 'src/types'
import { RemovingSnapshotResult, SnapStoreMode, PanelType } from 'src/enums'
import { NOID, CONTAINER_ID, GROUP_URL, DEFAULT_CONTAINER_ID } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Settings from 'src/services/settings'
import * as Windows from 'src/services/windows.bg'
import * as Tabs from 'src/services/tabs.bg'
import * as Store from 'src/services/storage.bg'
import * as IPC from 'src/services/ipc'
import * as Containers from 'src/services/containers.bg'
import { ItemInfo } from 'src/types/tabs'
import * as SidebarConf from 'src/services/sidebar-config'

import { GLOB_PINNED_ID, MAX_SIZE_LIMIT } from 'src/services/snapshots'
import { getNormalizedSnapshot, minimizeSnapshot, prepareExport } from 'src/services/snapshots'
export * from 'src/services/snapshots'

export interface SnapshotsState {
  list: Snapshot[]
}

export const Snapshots = {
  state: { list: [] } as SnapshotsState,
}

const MIN_SNAP_INTERVAL = 60_000
const MIN_LIMITING_COUNT = 1

/**
 * Create base snapshot
 */
export async function createSnapshot(auto = false): Promise<Snapshot | undefined> {
  Logs.info('Snapshots.bg.createSnapshot', auto)

  // Get snapshot src data and current snapshots list
  const [stored] = await Promise.all([
    browser.storage.local
      .get<Stored>(['sidebar', 'containers', 'snapshots'])
      .catch(() => undefined),
    Tabs.updateBgTabsTreeData().catch(() => {}),
  ])
  if (!stored) {
    Logs.err('createSnapshot: Cannot get source data')
    return
  }

  if (!stored.containers) stored.containers = {}
  if (!stored.sidebar) stored.sidebar = SidebarConf.createDefaultSidebarConfig()
  if (!stored.snapshots) stored.snapshots = []

  // Get tabs info per window per panel
  const tabs: SnapTab[][][] = []
  for (const window of Windows.byId.values()) {
    if (Settings.state.snapExcludePrivate && window.incognito) continue
    if (window.id === undefined || !window.tabs) continue
    if (window.type !== 'normal') continue

    const winTabs: SnapTab[][] = []
    const snapTabsById: Record<ID, SnapTab> = {}
    let panelTabs: SnapTab[] | undefined
    let targetGroup: ID = ''

    for (const tab of window.tabs) {
      const snapTab: SnapTab = { url: tab.url, title: tab.title, panelId: tab.panelId ?? NOID }
      const parent = snapTabsById[tab.parentId ?? NOID]
      if (parent && parent.panelId === tab.panelId) snapTab.lvl = (parent.lvl ?? 0) + 1
      if (tab.pinned) {
        snapTab.pinned = true
        if (Settings.state.pinnedTabsPosition !== 'panel') snapTab.panelId = -1
      }
      if (tab.folded) snapTab.folded = true
      if (tab.cookieStoreId !== CONTAINER_ID) snapTab.containerId = tab.cookieStoreId
      if (tab.customTitle) snapTab.customTitle = tab.customTitle
      if (tab.customColor) snapTab.customColor = tab.customColor

      snapTab.url = Utils.denormalizeUrl(snapTab.url) ?? snapTab.url
      snapTabsById[tab.id] = snapTab

      // Check panel
      if (snapTab.panelId !== -1) {
        const panelConf = stored.sidebar.panels[snapTab.panelId]
        if (!panelConf) {
          Logs.warn('Snapshots.createSnapshot: Unable to find a panel for tab:', snapTab.panelId)
          snapTab.panelId = -1
        }
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
        targetGroup = tab.panelId ?? NOID
      }

      if (panelTabs) panelTabs.push(snapTab)
    }

    // Mark private window
    if (window.incognito && winTabs[0]?.[0]) {
      winTabs[0][0].priv = true
    }

    tabs.push(winTabs)
  }

  if (!tabs.length) {
    Logs.warn('Snapshots.createSnapshot: No tabs')
    return
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

export async function addSnapshot(snapshot: NormalizedSnapshot): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('snapshots').catch(() => undefined)
  const snapshots = stored?.snapshots ?? []
  const timestamp = Date.now()

  snapshot.time = timestamp
  snapshots.push(snapshot)

  return await Store.set({ snapshots, lastSnapTime: timestamp })
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

    // Create new container
    if (!currentContainer) {
      const newContainer = await Containers.create(Utils.clone(container))
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
    const snapNavId = snapshot.sidebar.nav[i]
    if (snapNavId === undefined) continue
    const snapPanel = snapshot.sidebar.panels[snapNavId]
    if (!snapPanel || snapPanel.type !== PanelType.tabs) continue

    const storedIndex = stored.sidebar.nav.indexOf(snapNavId)
    if (storedIndex === -1) {
      changed = true
      lastStoredTabsPanelIndex++
      stored.sidebar.nav.splice(lastStoredTabsPanelIndex, 0, snapNavId)
      stored.sidebar.panels[snapNavId] = snapPanel
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

    // Tabs list w/o panelId in the first tab
    for (const tabs of win) {
      if (tabs[0]?.panelId === NOID) {
        Logs.warn('Snapshots.adaptTabsPanels: Tabs list without panelId, len:', tabs.length)
        newOrder.push(tabs)
      }
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
export async function openWindows(
  snapshot: NormalizedSnapshot,
  winIndex?: number,
  incognito: boolean = false
): Promise<void> {
  Logs.info('Snapshots.openWindows')

  // Adapt containers
  await adaptContainers(snapshot)

  // Adapt nav and panels
  await adaptTabsPanels(snapshot)

  // Open windows
  if (winIndex === undefined) {
    for (let i = 0; i < snapshot.tabs.length; i++) {
      await openWindow(snapshot, i, incognito)
    }
  } else {
    await openWindow(snapshot, winIndex, incognito)
  }
}

/**
 * Open window of snapshot
 */
async function openWindow(
  snapshot: NormalizedSnapshot,
  winIndex: number,
  incognito: boolean = false
): Promise<void> {
  Logs.info('Snapshots.openWindow')

  const winTabs = snapshot.tabs[winIndex]
  if (!winTabs) return Logs.warn('Snapshots.openWindow: No winTabs')

  // Create tabs info
  const items: ItemInfo[] = []
  const tabsInfoByLvl: Record<number, ItemInfo> = {}
  let index = 0
  for (const panel of winTabs) {
    Logs.info('Snapshots.openWindow: panel/pin panelId, len:', panel[0]?.panelId, panel.length)

    for (const tab of panel) {
      if (tab.panelId === GLOB_PINNED_ID) tab.panelId = NOID

      const tabInfo: ItemInfo = {
        id: index++,
        url: Utils.normalizeUrl(tab.url, tab.title),
        title: tab.title,
        parentId: NOID,
        folded: tab.folded,
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

  await Windows.createWithTabs(items, { incognito: incognito })
}

function limitSnapshots(snapshots: Snapshot[]): Snapshot[] | undefined {
  if (snapshots.length <= MIN_LIMITING_COUNT) return

  const normMaxSize = MAX_SIZE_LIMIT * 1024
  let limit = Settings.state.snapLimit
  let unit = Settings.state.snapLimitUnit

  if (!limit || limit < 0) {
    limit = MAX_SIZE_LIMIT
    unit = 'kb'
  }

  let normLimit = limit
  if (unit === 'day') normLimit = Date.now() - limit * 86400000
  else if (unit === 'kb') {
    if (limit > MAX_SIZE_LIMIT) limit = MAX_SIZE_LIMIT
    normLimit = limit * 1024
  }

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

    if (sizeAccum > normMaxSize) break
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
