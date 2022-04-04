import { translate } from 'src/dict'
import Utils from 'src/utils'
import { NOID, CONTAINER_ID, DEFAULT_CONTAINER, GROUP_URL } from 'src/defaults'
import { Snapshot, SnapTab, NormalizedSnapshot } from 'src/types'
import { Stored, Notification, Snapshot_v4 } from 'src/types'
import { Logs } from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Tabs } from 'src/services/tabs.bg'
import { Store } from 'src/services/storage'
import { SetupPage } from 'src/services/setup-page'
import { Notifications } from 'src/services/notifications'
import { Sidebar } from 'src/services/sidebar'
import { InstanceType } from 'src/types/msg'
import { Msg } from './msg'
import { RemovingSnapshotResult, SnapStoreMode } from 'src/types/snapshots'
import { Containers } from './containers'
import { DEFAULT_CONTAINER_ID } from 'src/defaults/containers'
import { PanelType } from 'src/types/sidebar'
import { ItemInfo } from 'src/types/tabs'
import { Info } from './info'

const MIN_SNAP_INTERVAL = 60_000
const MIN_LIMITING_COUNT = 1
const MAX_SIZE_LIMIT = 50_000_000

let currentSnapshot: Snapshot | undefined

/**
 * Create base snapshot
 */
export async function createSnapshot(auto = false): Promise<Snapshot | undefined> {
  if (!Info.isBg) return await Msg.req(InstanceType.bg, 'createSnapshot')

  // Get snapshot src data and current snapshots list
  let waiting
  try {
    waiting = await Promise.all([
      browser.storage.local.get<Stored>(['sidebar', 'containers', 'snapshots']),
      Tabs.updateBgTabsTreeData(),
    ])
  } catch (err) {
    Logs.err('createSnapshot: Cannot get source data', err)
    return
  }
  const stored = waiting[0]
  if (!stored) return
  if (!stored.containers) stored.containers = {}
  if (!stored.sidebar) stored.sidebar = Sidebar.createDefaultSidebar()
  if (!stored.snapshots) stored.snapshots = []

  // Get tabs info per window per panel
  const tabs: SnapTab[][][] = []
  for (const window of Object.values(Windows.byId)) {
    if (Settings.reactive.snapExcludePrivate && window.incognito) continue
    if (window.id === undefined || !window.tabs) continue

    const winTabs: SnapTab[][] = []
    const snapTabsById: Record<ID, SnapTab> = {}
    let panelTabs: SnapTab[] | undefined
    let targetGroup: ID = ''

    for (const tab of window.tabs) {
      const snapTab: SnapTab = { url: tab.url, title: tab.title, panelId: tab.panelId }
      const parent = snapTabsById[tab.parentId]
      if (parent && parent.panelId === tab.panelId) snapTab.lvl = (parent.lvl ?? 0) + 1
      if (tab.pinned) snapTab.pinned = true
      if (tab.cookieStoreId !== CONTAINER_ID) snapTab.containerId = tab.cookieStoreId

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

  currentSnapshot = {
    id: Math.random().toString(36).replace('0.', Date.now().toString(36)),
    time: Date.now(),
    containers: stored.containers,
    sidebar: stored.sidebar,
    tabs,
  }

  minimizeSnapshot(stored.snapshots, currentSnapshot)

  const prevSnapshot = stored.snapshots[stored.snapshots.length - 1]
  if (auto && isSnapshotRedundant(prevSnapshot, currentSnapshot)) return

  stored.snapshots.push(currentSnapshot)

  try {
    const limited = limitSnapshots(stored.snapshots)
    if (limited) stored.snapshots = limited
  } catch (err) {
    Logs.err('Cannot limit snapshots', err)
  }

  await Store.set({ snapshots: stored.snapshots, lastSnapTime: currentSnapshot.time })

  if (Settings.reactive.snapNotify) {
    Msg.call(InstanceType.sidebar, 'notifyAboutNewSnapshot')
  }

  return currentSnapshot
}

function isSnapshotRedundant(prevSnapshot: Snapshot, snapshot: Snapshot): boolean {
  if (snapshot.containers !== SnapStoreMode.Unchanged) return false
  if (snapshot.sidebar !== SnapStoreMode.Unchanged) return false

  if (prevSnapshot.tabs.length !== snapshot.tabs.length) return false

  for (let wi = 0; wi < snapshot.tabs.length; wi++) {
    const win = snapshot.tabs[wi]
    const prevWin = prevSnapshot.tabs[wi]
    if (prevWin?.length !== win?.length) return false

    for (let pi = 0; pi < win.length; pi++) {
      const panel = win[pi]
      const prevPanel = prevWin[pi]
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

    // per group (current)
    per_panel: for (let gi = 0; gi < win.length; gi++) {
      const tabs = win[gi]

      // per tab (current)
      per_tab: for (let ti = 0; ti < tabs.length; ti++) {
        const tab = tabs[ti]
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
            tab.lvl === tabN.lvl
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

    for (let pi = 0; pi < win.length; pi++) {
      const panel = win[pi]

      for (let ti = 0; ti < panel.length; ti++) {
        const tab = panel[ti]

        if (tab === SnapStoreMode.Unchanged) {
          for (let i = index; i--; ) {
            const snapN = snapshots[i]
            const tabN = snapN?.tabs[wi]?.[pi]?.[ti]
            if (tabN && tabN !== SnapStoreMode.Unchanged) {
              panel[ti] = tabN
              break
            }
          }
        }
      }
    }
  }

  return snapshot as NormalizedSnapshot
}

export function notifyAboutNewSnapshot(): void {
  if (Settings.reactive.snapExcludePrivate && Windows.incognito) return
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

  Logs.info('Auto snapshots scheduled')
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
  let interval = Settings.reactive.snapInterval
  const unit = Settings.reactive.snapIntervalUnit
  if (!interval || typeof interval !== 'number') return 0
  if (unit === 'min') interval = Settings.reactive.snapInterval * 60000
  if (unit === 'hr') interval = Settings.reactive.snapInterval * 3600000
  if (unit === 'day') interval = Settings.reactive.snapInterval * 86400000
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
  Logs.info('Snapshots.adaptContainers')

  const currentContainers = Object.values(Containers.reactive.byId)
  const oldNewIds: Record<string, string> = {}

  for (const container of Object.values(snapshot.containers)) {
    const currentContainer = currentContainers.find(c => {
      return c.name === container.name && c.icon === container.icon && c.color === container.color
    })

    // Create new container
    if (!currentContainer) {
      const newContainer = await Containers.create(container.name, container.color, container.icon)
      newContainer.proxified = container.proxified
      newContainer.proxy = container.proxy
      newContainer.includeHostsActive = container.includeHostsActive
      newContainer.includeHosts = container.includeHosts
      newContainer.excludeHostsActive = container.excludeHostsActive
      newContainer.excludeHosts = container.excludeHosts
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
  Logs.info('Snapshots.adaptTabsPanels')

  const stored = await browser.storage.local.get<Stored>('sidebar')
  if (!stored.sidebar) return

  // Find last index of tabs panel
  let lastStoredTabsPanelIndex = stored.sidebar.nav.length
  while (lastStoredTabsPanelIndex-- > 0) {
    const storedId = stored.sidebar.nav[lastStoredTabsPanelIndex]
    const storedPanel = stored.sidebar.panels[storedId]
    if (storedPanel && storedPanel.type === PanelType.tabs) break
  }

  // Recreate tabs panels
  let changed = false
  for (let i = 0; i < snapshot.sidebar.nav.length; i++) {
    const snapId = snapshot.sidebar.nav[i]
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
    if (win.length <= 1) continue

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
  Logs.info('Snapshots.openWindows')

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
  Logs.info('Snapshots.openWindow')
  const winTabs = snapshot.tabs[winIndex]

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

  items[0].active = true

  await Windows.createWithTabs(items, { incognito: false })
}

function limitSnapshots(snapshots: Snapshot[]): Snapshot[] | undefined {
  if (snapshots.length <= MIN_LIMITING_COUNT) return

  const limit = Settings.reactive.snapLimit
  const unit = Settings.reactive.snapLimitUnit

  if (!limit) return snapshots

  let normLimit = limit
  if (unit === 'day') normLimit = Date.now() - limit * 86400000
  if (unit === 'kb') normLimit = limit * 1024

  let index = snapshots.length
  let accum = 0
  let sizeAccum = 0
  while (index--) {
    const snapshot = snapshots[index]

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
      snapshot.sidebar = Sidebar.convertOldPanelsConfigToNew(snapshotV4.panels)
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
