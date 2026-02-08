import * as T from 'src/types'
import * as D from 'src/defaults'
import { translate } from 'src/dict'
import * as Notifications from 'src/services/notifications.fg'
import * as Settings from 'src/services/settings'
import * as SetupPage from 'src/services/setup-page.fg'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as Favicons from 'src/services/favicons.fg'
import * as Utils from 'src/utils'
import * as Windows from 'src/services/windows.fg'
import * as Containers from 'src/services/containers.fg'

import { getNormalizedSnapshot, GLOB_PINNED_ID } from 'src/services/snapshots'
export * from 'src/services/snapshots'

export interface SnapshotsState {
  list: T.Snapshot[]
}

export const state: SnapshotsState = {
  list: [],
}

export async function createSnapshot(auto = false): Promise<T.Snapshot | undefined> {
  Logs.info('Snapshots.createSnapshot', auto)

  return await IPC.bg('createSnapshot')
}

export function notifyAboutNewSnapshot(): void {
  if (Settings.state.snapExcludePrivate && Windows.incognito) return
  const config: T.Notification = {
    icon: '#icon_snapshot',
    title: translate('notif.snapshot_created'),
    ctrl: translate('notif.view_snapshot'),
    callback: () => SetupPage.open('snapshots'),
  }

  Notifications.notify(config)
}

export async function adaptContainer(
  snapshot: T.SnapshotState,
  containerId: string
): Promise<string> {
  if (containerId === D.DEFAULT_CONTAINER_ID || containerId === D.PRIVATE_CONTAINER_ID) {
    return containerId
  }

  const snapContainer: T.Container | undefined = snapshot.containers[containerId]
  const matchedLocalContainer = Containers.findUnique({
    name: snapContainer.name,
    color: snapContainer.color,
    icon: snapContainer.icon,
  })
  if (matchedLocalContainer) {
    return matchedLocalContainer.id
  }

  // Create new container
  const newContainer = await Containers.create(
    snapContainer.name,
    snapContainer.color,
    snapContainer.icon
  )
  newContainer.proxified = snapContainer.proxified
  newContainer.proxy = Utils.clone(snapContainer.proxy)
  newContainer.reopenRulesActive = snapContainer.reopenRulesActive
  newContainer.reopenRules = Utils.clone(snapContainer.reopenRules)
  newContainer.userAgentActive = snapContainer.userAgentActive
  newContainer.userAgent = snapContainer.userAgent
  await Containers.saveContainers()

  return newContainer.id
}

export function parseSnapshot(
  snapshots: T.Snapshot[],
  index: number,
  dayStartMs: number
): T.SnapshotState | undefined {
  const sizeStr = Utils.strSize(JSON.stringify(snapshots[index]))
  const snapshot = getNormalizedSnapshot(snapshots, index)
  if (!snapshot) return

  // Get ordered list of tab panel ids
  const tabPanelIds: ID[] = []
  for (const id of snapshot.sidebar.nav ?? []) {
    const panel = snapshot.sidebar.panels[id]
    if (Utils.isTabsPanel(panel)) tabPanelIds.push(id)
  }

  const windows: T.SnapWindowState[] = []
  const winCount = snapshot.tabs.length
  let tabsCount = 0

  // Per windows
  for (const win of snapshot.tabs) {
    if (!win.length) continue

    // const winTabPanelIds = [...tabPanelIds]
    const panelsById: Record<ID, T.SnapPanelState> = {}
    const winState: T.SnapWindowState = {
      id: tabsCount,
      panels: [],
      tabsLen: 0,
      folded: false,
      private: !!win[0]?.[0]?.priv,
    }
    windows.push(winState)

    // Per panels (or pinned tabs)
    for (const panel of win) {
      if (!panel.length) continue

      // Per tabs
      for (let i = 0; i < panel.length; i++) {
        const tab = panel[i]
        const nextTab = panel[i + 1]
        if (!tab) break

        const container = tab.containerId ? snapshot.containers[tab.containerId] : undefined

        if (tab.pinned && tab.panelId === D.NOID) tab.panelId = GLOB_PINNED_ID

        let panelState = panelsById[tab.panelId]
        if (!panelState) {
          let panelConfig = snapshot.sidebar.panels[tab.panelId]
          if (!panelConfig) {
            panelConfig = Utils.cloneObject(D.TABS_PANEL_CONFIG)
            if (tab.pinned && tab.panelId === GLOB_PINNED_ID) {
              panelConfig.id = GLOB_PINNED_ID
              panelConfig.name = translate('snapshot.global_pin_title')
              panelConfig.iconSVG = 'icon_pin'
            } else {
              Logs.warn('Snapshots.parseSnapshot: No panel config for', tab.panelId)
              panelConfig.id = D.NOID
              panelConfig.name = translate('panel.tabs.title')
              tab.panelId = D.NOID
            }
          }

          panelState = {
            id: panelConfig.id,
            tabs: [],
            name: panelConfig.name,
            iconSVG: panelConfig.iconSVG || 'icon_tabs',
            iconIMG: panelConfig.iconIMG,
            color: panelConfig.color,
            folded: false,
          }
          panelsById[panelState.id] = panelState
        }

        const tabLvl = tab.lvl ?? 0
        const tabState: T.SnapTabState = {
          ...tab,
          ref: tab,
          id: tabsCount,
          containerIcon: container?.icon,
          containerColor: container?.color,
          domain: Utils.getDomainOf(tab.url),
          iconSVG: Favicons.getFavPlaceholder(tab.url),
          sel: false,
          folded: !!tab.folded,
          isParent: !!nextTab && (nextTab.lvl ?? 0) > tabLvl && tab.panelId === nextTab.panelId,
          invisible: false,
          branchLen: 0,
        }

        panelState.tabs.push(tabState)
        tabsCount++
        winState.tabsLen++
      }
    }

    if (panelsById[GLOB_PINNED_ID]) winState.panels.push(panelsById[GLOB_PINNED_ID])
    for (const id of tabPanelIds) {
      const panelState = panelsById[id]
      if (panelState?.tabs.length) winState.panels.push(panelState)
    }
    if (panelsById[D.NOID]) winState.panels.push(panelsById[D.NOID])
  }

  // Fold branches and count the descendants
  for (const win of windows) {
    for (const panel of win.panels) {
      for (let t, i = 0; i < panel.tabs.length; i++) {
        t = panel.tabs[i]

        if (t?.folded) {
          t.folded = false
          foldBranchInViewer(i, panel.tabs)
        }

        if (t.isParent) {
          t.branchLen = calcBranchLen(i, panel.tabs)
        }
      }
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

export function foldBranchInViewer(index: number, tabs: T.SnapTabState[]) {
  const rootTab = tabs[index]
  if (!rootTab || !rootTab.isParent) return

  rootTab.ref.folded = rootTab.folded = !rootTab.folded

  const rootTabLvl = rootTab.lvl ?? 0
  let foldedLvl = -1
  for (let t, i = index + 1; i < tabs.length; i++) {
    t = tabs[i]
    if (!t || (t.lvl ?? 0) <= rootTabLvl) break

    // Skip inner folded tabs
    if (foldedLvl > -1) {
      if (t.lvl && t.lvl > foldedLvl) continue
      if (foldedLvl === t.lvl) foldedLvl = -1
    }

    // Detect root lvl of inner folded tabs
    if (t.isParent && t.folded) {
      foldedLvl = t.lvl ?? 0
    }

    t.invisible = rootTab.folded
  }
}

function calcBranchLen(index: number, tabs: T.SnapTabState[]): number {
  let len = 0

  const rootTab = tabs[index]
  if (!rootTab || !rootTab.isParent) return len

  const rootTabLvl = rootTab.lvl ?? 0
  for (let t, i = index + 1; i < tabs.length; i++) {
    t = tabs[i]
    if (!t || (t.lvl ?? 0) <= rootTabLvl) break
    len++
  }

  return len
}

export function snapshotStateToNormalizedSnapshot(s: T.SnapshotState): T.NormalizedSnapshot {
  return {
    id: s.id,
    time: s.time,
    containers: Utils.clone(s.containers),
    sidebar: Utils.clone(s.sidebar),
    tabs: Utils.clone(s.tabs),
  }
}

export async function getStoredSnapshots() {
  let stored
  try {
    stored = await browser.storage.local.get<T.Stored>('snapshots')
  } catch (err) {
    return Logs.err('Snapshots: getStoredSnapshots: Cannot get snapshots', err)
  }
  return stored.snapshots
}

export async function addSnapshot(snapshot: T.NormalizedSnapshot): Promise<void> {
  return await IPC.bg('addSnapshot', snapshot)
}

export function updateInternalUrls(snapshot: T.NormalizedSnapshot): void {
  for (const win of snapshot.tabs) {
    for (const panel of win) {
      for (const tab of panel) {
        tab.url = updateInternalUrl(tab.url)
      }
    }
  }
}

export function updateInternalUrl(url: string): string {
  if (Utils.isGroupUrl(url)) {
    const newUrl = D.GROUP_URL + url.slice(D.GROUP_URL_LEN)
    url = newUrl
  } else if (Utils.isUrlUrl(url)) {
    const newUrl = D.URL_URL + url.slice(D.URL_URL_LEN)
    url = newUrl
  }
  return url
}

export function selectBranchInViewer(index: number, tabs: T.SnapTabState[], sel: boolean) {
  const rootTab = tabs[index]
  if (!rootTab || !rootTab.isParent) return

  const rootTabLvl = rootTab.lvl ?? 0
  for (let t, i = index + 1; i < tabs.length; i++) {
    t = tabs[i]
    if (!t || (t.lvl ?? 0) <= rootTabLvl) break

    t.sel = sel
  }
}
