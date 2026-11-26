import * as T from 'src/types'
import * as D from 'src/defaults'
import * as E from 'src/enums'
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

import { GLOB_PINNED_ID } from 'src/services/snapshots'
export * from 'src/services/snapshots'

interface SnapshotViewModelReactiveProps {
  selectionFocusTabId: ID | null
  selectionFocusSelect: boolean
}

interface ParseContext {
  tabCounter: number
  tabPanelIds: ID[]
  foldedBranchLvl: number
}

export class SnapshotVM {
  #ref: T.Snapshot

  id: ID
  time: number
  containers: Record<ID, T.Container>
  sidebar: T.SidebarConfig
  tabs: T.SnapTab[][][]
  windows: SnapshotVMWindow[] = []
  dateStr: string
  timeStr: string
  sizeStr: string
  winCount: number
  tabCount: number

  panelsById: Record<ID, SnapshotVMPanel> = {}

  reactive: SnapshotViewModelReactiveProps

  constructor(s: T.Snapshot, si: T.SnapshotInfo) {
    this.#ref = s

    this.id = s.id
    this.time = s.time
    this.containers = s.containers
    this.sidebar = s.sidebar
    this.tabs = s.tabs

    this.#parseSnapshot(s)

    this.dateStr = si.dateStr ?? '-'
    this.timeStr = si.timeStr ?? '-'
    this.sizeStr = si.sizeStr ?? '-'
    this.winCount = si.winCount
    this.tabCount = si.tabCount

    this.reactive = {
      selectionFocusTabId: null,
      selectionFocusSelect: true,
    }

    if (reactFn) this.reactive = reactFn(this.reactive)
  }

  #parseSnapshot(snapshot: T.Snapshot) {
    if (!snapshot) throw 'no snapshot'

    const parseCtx: ParseContext = {
      tabCounter: 0,
      tabPanelIds: [],
      foldedBranchLvl: -1,
    }

    // Get ordered list of tab panel ids
    for (const id of snapshot.sidebar.nav ?? []) {
      const panel = snapshot.sidebar.panels[id]
      if (Utils.isTabsPanel(panel)) parseCtx.tabPanelIds.push(id)
    }

    // Per windows
    for (const win of snapshot.tabs) {
      if (!win.length) continue
      this.windows.push(new SnapshotVMWindow(this, parseCtx, win))
    }
  }

  getSnapshot() {
    return this.#ref
  }

  setRangeSelection(tabAId: ID, tabBId?: ID, value = false): void {
    if (tabBId === undefined) tabBId = tabAId
    const oneTab = tabAId === tabBId
    let lastTab: SnapshotVMTabStruct | undefined
    let inRange = false

    for (const win of this.windows) {
      for (const panel of win.panels) {
        for (const tab of panel.tabs) {
          if (inRange) {
            tab.reactive.sel = !value
            lastTab = tab
          }

          if (tab.id === tabAId || tab.id === tabBId) {
            inRange = !inRange
            if (inRange) tab.reactive.sel = !value
            if (oneTab) inRange = !inRange
          }
        }
      }
    }

    // Toggle selection state for folded children
    if (lastTab?.isParent && lastTab.reactive.folded) {
      lastTab.setBranchSelection(!!lastTab.reactive.sel)
    }
  }

  resetSelection() {
    this.reactive.selectionFocusTabId = null
    this.reactive.selectionFocusSelect = true

    for (const win of this.windows) {
      for (const panel of win.panels) {
        for (const tab of panel.tabs) {
          tab.reactive.sel = false
        }
      }
    }
  }
}
export type SnapshotVMStruct = InstanceType<typeof SnapshotVM>

export class SnapshotVMWindow {
  snapshot: SnapshotVMStruct
  id: ID
  panels: SnapshotVMPanel[] = []
  tabsLen: number = 0
  private: boolean
  reactive: { folded: boolean } = { folded: false }

  constructor(s: SnapshotVM, parseCtx: ParseContext, windowTree: T.SnapTab[][]) {
    this.snapshot = s
    // Use current tab counter as id
    this.id = parseCtx.tabCounter
    this.private = !!windowTree[0]?.[0]?.priv
    this.#parseWindowTree(s, parseCtx, windowTree)
    if (reactFn) this.reactive = reactFn(this.reactive)
  }

  #parseWindowTree(s: SnapshotVM, parseCtx: ParseContext, windowTree: T.SnapTab[][]) {
    const globPinnedTabs = this.#getGlobalPinnedTabs(windowTree)
    if (globPinnedTabs.length) {
      const panelConf = Utils.clone(D.TABS_PANEL_CONFIG)
      panelConf.id = GLOB_PINNED_ID
      panelConf.name = translate('snapshot.global_pin_title')
      panelConf.iconSVG = 'icon_pin'
      const gpPanel = new SnapshotVMPanel(s, this, parseCtx, panelConf, globPinnedTabs)
      s.panelsById[gpPanel.id] = gpPanel
      this.panels.push(gpPanel)
    }

    for (const id of parseCtx.tabPanelIds) {
      const panelTabs = this.#getPanelTabs(id, windowTree)
      if (panelTabs.length) {
        const panelConf = s.sidebar.panels[id]
        const panel = new SnapshotVMPanel(s, this, parseCtx, panelConf, panelTabs)
        s.panelsById[panel.id] = panel
        this.panels.push(panel)
      }
    }

    const orphanTabs = this.#getOrphanTabs(windowTree)
    if (orphanTabs.length) {
      const panelConf = Utils.clone(D.TABS_PANEL_CONFIG)
      Logs.warn(`Snapshots.fg.SnapshotVMWindow: No panel config for ${orphanTabs.length} tabs`)
      panelConf.id = D.NOID
      panelConf.name = translate('panel.tabs.title')
      const unknownPanel = new SnapshotVMPanel(s, this, parseCtx, panelConf, orphanTabs)
      s.panelsById[unknownPanel.id] = unknownPanel
      this.panels.push(unknownPanel)
    }
  }

  #getGlobalPinnedTabs(windowTree: T.SnapTab[][]) {
    const tabs: T.SnapTab[] = []
    for (const panelTree of windowTree) {
      for (const tab of panelTree) {
        if (tab.pinned && tab.panelId === D.NOID) tabs.push(tab)
        else if (!tab.pinned) break
      }
    }
    return tabs
  }

  #getPanelTabs(panelId: ID, windowTree: T.SnapTab[][]) {
    const tabs: T.SnapTab[] = []
    for (const panelTree of windowTree) {
      for (const tab of panelTree) {
        if (tab.panelId === panelId) tabs.push(tab)
      }
    }
    return tabs
  }

  #getOrphanTabs(windowTree: T.SnapTab[][]) {
    const tabs: T.SnapTab[] = []
    for (const panelTree of windowTree) {
      for (const tab of panelTree) {
        if (!tab.pinned && tab.panelId === D.NOID) tabs.push(tab)
      }
    }
    return tabs
  }
}
export type SnapshotVMWindowStruct = InstanceType<typeof SnapshotVMWindow>

export class SnapshotVMPanel {
  window: SnapshotVMWindowStruct
  id: ID
  tabs: SnapshotVMTab[] = []
  name: string
  iconSVG: string
  iconIMG?: string
  color?: string
  reactive: { folded: boolean } = { folded: false }

  constructor(
    s: SnapshotVM,
    w: SnapshotVMWindow,
    parseCtx: ParseContext,
    panelConf: T.PanelConfig,
    panelTree: T.SnapTab[]
  ) {
    this.window = w
    this.id = panelConf.id
    this.name = panelConf.name
    this.iconSVG = panelConf.iconSVG || 'icon_tabs'
    this.iconIMG = panelConf.iconIMG
    this.color = panelConf.color
    this.#parsePanelTree(s, w, parseCtx, panelTree)
    if (reactFn) this.reactive = reactFn(this.reactive)
  }

  #parsePanelTree(
    s: SnapshotVM,
    w: SnapshotVMWindow,
    parseCtx: ParseContext,
    tabsTree: T.SnapTab[]
  ) {
    for (let i = 0; i < tabsTree.length; i++) {
      if (!tabsTree[i]) break
      this.tabs.push(new SnapshotVMTab(s, this, parseCtx, i, tabsTree))
      parseCtx.tabCounter++
      w.tabsLen++
    }
    parseCtx.foldedBranchLvl = -1
  }
}
export type SnapshotVMPanelStruct = InstanceType<typeof SnapshotVMPanel>

export class SnapshotVMTab {
  #list: SnapshotVMTab[]
  #index: number

  panel: SnapshotVMPanelStruct
  id: ID
  url: string
  title: string
  panelId: ID
  isParent: boolean
  branchLen: number
  lvl: number
  pinned?: boolean
  containerId?: string
  containerIcon?: string
  containerColor?: string
  customTitle?: string
  customColor?: string
  priv?: boolean
  hostname?: string
  iconSVG?: string
  reactive: { folded: boolean; sel: boolean; invisible: boolean } = {
    folded: false,
    sel: false,
    invisible: false,
  }

  constructor(
    s: SnapshotVM,
    p: SnapshotVMPanel,
    parseCtx: ParseContext,
    index: number,
    tabs: T.SnapTab[]
  ) {
    const tab = tabs[index]
    const nextTab = tabs[index + 1]
    const tabLvl = tab.lvl ?? 0
    const container = tab.containerId ? s.containers[tab.containerId] : undefined

    this.#list = p.tabs
    this.#index = index

    this.panel = p
    this.id = parseCtx.tabCounter
    this.url = tab.url
    this.title = tab.title
    this.panelId = p.id
    this.isParent = !!nextTab && (nextTab.lvl ?? 0) > tabLvl && tab.panelId === nextTab.panelId
    this.branchLen = this.isParent ? this.#calcBranchLen(index, tabs) : 0
    this.lvl = tabLvl
    this.pinned = tab.pinned
    this.containerId = tab.containerId
    this.containerIcon = container?.icon
    this.containerColor = container?.color
    this.customTitle = tab.customTitle
    this.customColor = tab.customColor
    this.priv = tab.priv
    this.hostname = Utils.getHostname(tab.url)
    this.iconSVG = Favicons.getFavPlaceholder(tab.url)

    if (parseCtx.foldedBranchLvl >= this.lvl) parseCtx.foldedBranchLvl = -1
    else if (parseCtx.foldedBranchLvl > -1) this.reactive.invisible = true

    if (tab.folded) {
      this.reactive.folded = true
      if (parseCtx.foldedBranchLvl === -1) parseCtx.foldedBranchLvl = this.lvl
    }

    if (reactFn) this.reactive = reactFn(this.reactive)
  }

  #calcBranchLen(index: number, tabs: T.SnapTab[]): number {
    let len = 0

    const rootTab = tabs[index]
    if (!rootTab) return len

    const rootTabLvl = rootTab.lvl ?? 0
    for (let t, i = index + 1; i < tabs.length; i++) {
      t = tabs[i]
      if (!t || (t.lvl ?? 0) <= rootTabLvl) break
      len++
    }

    return len
  }

  foldBranch() {
    this.reactive.folded = true
    const branchLvl = this.lvl

    for (let t, i = this.#index + 1; i < this.#list.length; i++) {
      t = this.#list[i]
      if (!t || !t.lvl || t.lvl <= branchLvl) break
      t.reactive.invisible = true
    }
  }

  unfoldBranch() {
    this.reactive.folded = false
    const branchLvl = this.lvl
    let innerFoldedLvl = -1

    for (let t, i = this.#index + 1; i < this.#list.length; i++) {
      t = this.#list[i]
      if (!t || !t.lvl || t.lvl <= branchLvl) break
      if (innerFoldedLvl >= t.lvl) innerFoldedLvl = -1
      if (innerFoldedLvl === -1) t.reactive.invisible = false
      if (t.reactive.folded && innerFoldedLvl === -1) innerFoldedLvl = t.lvl
    }
  }

  toggleBranch() {
    if (this.reactive.folded) this.unfoldBranch()
    else this.foldBranch()
  }

  setBranchSelection(value: boolean) {
    if (!this.isParent) return

    const rootTab = this.#list[this.#index]
    if (!rootTab || rootTab !== this) return

    const rootTabLvl = rootTab.lvl ?? 0
    for (let t, i = this.#index + 1; i < this.#list.length; i++) {
      t = this.#list[i]
      if (!t || (t.lvl ?? 0) <= rootTabLvl) break

      t.reactive.sel = value
    }
  }

  toggleSelection(conf?: { deepIfFolded?: boolean; focus?: boolean }) {
    this.reactive.sel = !this.reactive.sel

    if (conf?.focus) {
      const snapshot = this.panel.window.snapshot
      snapshot.reactive.selectionFocusTabId = this.id
      snapshot.reactive.selectionFocusSelect = this.reactive.sel
    }

    // Toggle selection state for folded children
    if (conf?.deepIfFolded && this.isParent && this.reactive.folded) {
      this.setBranchSelection(this.reactive.sel)
    }
  }
}
export type SnapshotVMTabStruct = InstanceType<typeof SnapshotVMTab>

let dayStartMs = 0
export let ready = false
const vmById = new Map<ID, SnapshotVM>()

export let reactive = {
  lenStr: '-',
  sizeStr: '-',
  snapshotsInfo: [] as T.SnapshotInfo[],
  ready: false,
  activeSnapshot: undefined as SnapshotVMStruct | undefined,
  activeSnapshotError: undefined as string | undefined,
}

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function reactivate(r: T.Reactivator<any>) {
  reactive = r(reactive)
  reactFn = r
}

export async function load() {
  Logs.info('Snapshots.fg.load')
  const ts = performance.now()

  reactive.ready = ready = false
  dayStartMs = Utils.getDayStartMS()

  let snapshotsInfo
  try {
    snapshotsInfo = await IPC.bg('getSnapshotsInfo')
  } catch (err) {
    Logs.err('Snapshots.init: Unable to get the list of snapshots:', err)
    return
  }

  parseSnapshotsInfo(snapshotsInfo, dayStartMs)

  reactive.lenStr = snapshotsInfo.length.toString()
  reactive.sizeStr = Utils.sizeToString(snapshotsInfo.reduce((a, v) => a + v.size, 0))
  reactive.snapshotsInfo = snapshotsInfo
  reactive.ready = ready = true

  waitingForSnapshotsReadiness.forEach(cb => cb())
  waitingForSnapshotsReadiness.length = 0

  setupListeners()

  Logs.info('Snapshots.fg.load: Done:', performance.now() - ts)
}

const waitingForSnapshotsReadiness: (() => void)[] = []
export async function waitForSnapshotsReady(): Promise<void> {
  if (ready) return
  return new Promise(ok => {
    waitingForSnapshotsReadiness.push(ok)
  })
}

export function setupListeners() {
  IPC.on<T.SnapshotInfo[]>(E.InstanceType.bg, D.NOID, 'snapshotsUpd', snapshotsInfo => {
    const activeSnapshotId = reactive.activeSnapshot?.id
    const prevSnapshotsInfo = reactive.snapshotsInfo
    const activeSnapshotCandidateId = activateOnUpd
    activateOnUpd = undefined
    snapshotsInfo = snapshotsInfo ?? []
    dayStartMs = Utils.getDayStartMS()
    parseSnapshotsInfo(snapshotsInfo, dayStartMs)
    reactive.lenStr = snapshotsInfo.length.toString()
    reactive.sizeStr = Utils.sizeToString(snapshotsInfo.reduce((a, v) => a + v.size, 0))
    reactive.snapshotsInfo = snapshotsInfo

    const activeSnapshotCandidate =
      activeSnapshotCandidateId && snapshotsInfo.find(s => s.id === activeSnapshotCandidateId)

    // Activate predefined snapshot
    if (activeSnapshotCandidate) {
      activateSnapshot(activeSnapshotCandidate)
    }

    // Activate another snapshot if the current has been removed
    else if (activeSnapshotId && !snapshotsInfo.find(s => s.id === activeSnapshotId)) {
      const activeSnapshotIndex = prevSnapshotsInfo.findIndex(s => s.id === activeSnapshotId)
      if (activeSnapshotIndex !== -1) {
        let nextActSnapshotInfo
        if (activeSnapshotIndex > 0) {
          nextActSnapshotInfo = reactive.snapshotsInfo[activeSnapshotIndex - 1]
        } else {
          nextActSnapshotInfo = reactive.snapshotsInfo[activeSnapshotIndex - 1]
        }
        if (!nextActSnapshotInfo) nextActSnapshotInfo = reactive.snapshotsInfo[0]
        if (nextActSnapshotInfo) activateSnapshot(nextActSnapshotInfo)
        else reactive.activeSnapshot = undefined
      }
    }

    // Activate the first snapshot if the previous snapshot was the first one
    else if (activeSnapshotId && snapshotsInfo[1]?.id === activeSnapshotId) {
      activateSnapshot(snapshotsInfo[0])
    }

    // Activate the first snapshot if there is no active snapshot
    else if (!activeSnapshotId && snapshotsInfo.length) {
      activateSnapshot(snapshotsInfo[0])
    }
  })
}

let targetId = D.NOID
export async function activateSnapshot(info?: T.SnapshotInfo) {
  if (!info || reactive.activeSnapshot?.id === info.id) return
  const prevSnapshot = reactive.activeSnapshot
  targetId = info.id
  reactive.activeSnapshot?.resetSelection()
  reactive.activeSnapshotError = undefined
  reactive.activeSnapshot = undefined
  try {
    const svm = await getVM(info)
    if (targetId === info.id) reactive.activeSnapshot = svm
    else {
      reactive.activeSnapshot = prevSnapshot
      targetId = prevSnapshot?.id ?? D.NOID
    }
  } catch (err) {
    reactive.activeSnapshotError = `Unable to load snapshot: ${err}`
  }
}

export async function getVM(info: T.SnapshotInfo) {
  const cached = vmById.get(info.id)
  if (cached) return cached
  const snapshot = await IPC.bg('getSnapshot', { id: info.id })
  const snapshotVM = new SnapshotVM(snapshot, info)
  vmById.set(info.id, snapshotVM)
  return snapshotVM
}

export async function createSnapshot() {
  try {
    await IPC.bg('createSnapshot')
  } catch (err: any) {
    const title = 'Cannot create snapshot'
    let details
    if (err === E.Err.NoWritableStream) details = 'Unable to get writable stream'
    else if (err?.name && err?.message) details = `${err.name}: ${err.message}`
    else details = String(err)
    Notifications.notify({ lvl: 'err', title, details })
    Logs.err(`${title}: ${details}`, err)
  }
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
  snapshot: SnapshotVMStruct,
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
  const newContainer = await Containers.create(Utils.clone(snapContainer))

  return newContainer.id
}

export function parseSnapshotsInfo(snapList: T.SnapshotInfo[], dayStartMs: number) {
  for (const s of snapList) {
    s.dateStr = Utils.uDate(s.time, '.', dayStartMs)
    s.timeStr = Utils.uTime(s.time)
    s.sizeStr = Utils.sizeToString(s.size)
  }
}

let activateOnUpd: ID | undefined
export async function addSnapshot(snapshot: T.Snapshot, activate: boolean): Promise<void> {
  const id = await IPC.bg('addSnapshot', snapshot)
  if (activate && id) activateOnUpd = id
  return
}

export function updateInternalUrls(snapshot: T.Snapshot): void {
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
    const newUrl = D.GROUP_URL + url.slice(D.GROUP_URL.length)
    url = newUrl
  } else if (Utils.isPlaceholderUrl(url)) {
    const newUrl = D.PLACEHOLDER_URL + url.slice(D.PLACEHOLDER_URL.length)
    url = newUrl
  }
  return url
}
