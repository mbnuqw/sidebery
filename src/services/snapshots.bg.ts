import * as T from 'src/types'
import * as E from 'src/enums'
import * as D from 'src/defaults'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Settings from 'src/services/settings.bg'
import * as Windows from 'src/services/windows.bg'
import * as Tabs from 'src/services/tabs.bg'
import * as Store from 'src/services/storage.bg'
import * as IPC from 'src/services/ipc'
import * as Containers from 'src/services/containers.bg'
import { ItemInfo } from 'src/types/tabs'
import * as SidebarConf from 'src/services/sidebar-config'

import { GLOB_PINNED_ID } from 'src/services/snapshots'
import { getNormalizedSnapshot, prepareExport } from 'src/services/snapshots'
export * from 'src/services/snapshots'

class SnapshotFile {
  #handle: FileSystemFileHandle
  #cachedSize?: number

  id: ID
  time: number
  winCount: number
  tabCount: number

  constructor(handle: FileSystemFileHandle) {
    this.#handle = handle
    const info = parseSnapshotFileName(handle.name)
    if (!info) throw 'SnapshotFile: Unable to parse name'
    this.id = info.id
    this.time = info.time
    this.winCount = info.winCount
    this.tabCount = info.tabCount
  }

  get name(): string {
    return this.#handle.name
  }

  async getSize() {
    if (this.#cachedSize === undefined) {
      const file = await this.#handle.getFile()
      this.#cachedSize = file.size
    }
    return this.#cachedSize
  }

  async readSnapshot() {
    const jsonStr = await this.#handle.getFile().then(f => f.text())
    const parsedObject = JSON.parse(jsonStr) as T.Snapshot
    if (!parsedObject.id) throw 'Not a snapshot: No id'
    if (parsedObject.time === undefined) throw 'Not a snapshot: No time'
    if (parsedObject.containers === undefined) throw 'Not a snapshot: No containers'
    if (parsedObject.sidebar === undefined) throw 'Not a snapshot: No sidebar'
    if (parsedObject.tabs === undefined) throw 'Not a snapshot: No tabs'
    return parsedObject
  }
}

class SnapshotFileList {
  static #byId: Map<ID, SnapshotFile> = new Map()
  static #files: SnapshotFile[] = []
  static #st: number = Number.MIN_SAFE_INTEGER
  static #et: number = Number.MAX_SAFE_INTEGER
  static len: number = 0

  static get files(): readonly SnapshotFile[] {
    return this.#files
  }

  static getByName(name: string) {
    return this.#files.find(f => f.name === name)
  }

  static getByIndex(index: number): SnapshotFile | undefined {
    return this.#files[index]
  }

  static getById(id: ID) {
    return this.#byId.get(id)
  }

  static getRecent(): SnapshotFile | undefined {
    return this.#files[0]
  }

  static getOldest(): SnapshotFile | undefined {
    return this.#files[this.#files.length - 1]
  }

  static add(f: SnapshotFile) {
    if (this.#byId.has(f.id)) return
    if (this.#files.length === 0) {
      this.len = this.#files.push(f)
      this.#st = f.time
      this.#et = f.time
    } else {
      if (f.time >= this.#st) {
        this.len = this.#files.unshift(f)
        this.#st = f.time
      } else if (f.time <= this.#et) {
        this.len = this.#files.push(f)
        this.#et = f.time
      } else {
        const len = this.#files.length
        let si = 0
        let ei = len - 1
        let insertIndex = len
        while (si <= ei) {
          const mi = (si + ei) >> 1
          if (f.time >= this.#files[mi].time) ei = (insertIndex = mi) - 1
          else si = mi + 1
        }
        this.#files.splice(insertIndex, 0, f)
        this.len = this.#files.length
      }
    }
    this.#byId.set(f.id, f)
  }

  static removeById(id: ID) {
    const index = this.#files.findIndex(f => f.id === id)
    if (index === -1) return false
    this.#files.splice(index, 1)
    if (!this.#files.length) {
      this.#st = Number.MIN_SAFE_INTEGER
      this.#et = Number.MAX_SAFE_INTEGER
    } else if (index === 0) {
      this.#st = this.#files[0].time
    } else if (index === this.#files.length) {
      this.#et = this.#files[this.#files.length - 1].time
    }
    this.len--
    this.#byId.delete(id)
    return true
  }

  static clear() {
    this.#files.length = 0
    this.#st = Number.MIN_SAFE_INTEGER
    this.#et = Number.MAX_SAFE_INTEGER
    this.len = 0
    this.#byId.clear()
  }

  static async getSnapshotsInfo() {
    const result: T.SnapshotInfo[] = []
    const files = this.files
    const sizeResults = await Promise.allSettled(files.map(f => f.getSize()))
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const sizeResult = sizeResults[i]
      result.push({
        id: file.id,
        time: file.time,
        winCount: file.winCount,
        tabCount: file.tabCount,
        size: Utils.settledOr(sizeResult, 0),
      })
    }
    return result
  }

  static async getSnapshotsSize() {
    const files = this.files
    const sizeResults = await Promise.allSettled(files.map(f => f.getSize()))
    return sizeResults.reduce((a, sr) => a + Utils.settledOr(sr, 0), 0)
  }
}

let snapDirHandle: FileSystemDirectoryHandle | undefined

const MIN_SNAP_INTERVAL = 60_000
const MIN_LIMITING_COUNT = 1

let ready = false

export async function load() {
  Logs.info('Snapshots.load')
  const ts = performance.now()
  ready = false

  // Get the OPFS handle for the snapshots dir
  snapDirHandle = await getSnapshotsDirHandle()
  if (!snapDirHandle) {
    ready = true
    Logs.err('Snapshots.load: Unable to getSnapshotsDirHandle')
    return
  }
  Logs.info('Snapshots.load: snapDirHandle is ok:', !!snapDirHandle)

  // Load snapshots info
  try {
    SnapshotFileList.clear()
    for await (const [_, handle] of snapDirHandle.entries()) {
      if (handle.kind !== 'file') continue
      try {
        SnapshotFileList.add(new SnapshotFile(handle))
      } catch (err) {
        Logs.warn('Snapshots.load: Unable to load snapshot:', err)
      }
    }
  } catch (err) {
    ready = true
    Logs.err('Snapshots.load: Unable to load snapshots info:', err)
    return
  }
  Logs.info('Snapshots.load: loaded:', SnapshotFileList.len)

  // Check if there are old snapshots
  try {
    const lStore = await browser.storage.local.get<T.Stored>('snapshots').catch(() => undefined)
    const snapshots = lStore?.snapshots
    if (snapshots) await migrateSnapshots(snapshots, true, true)
  } catch (err) {
    Logs.err('Snapshots.load: Unable to migrateSnapshots:', err)
  }

  ready = true

  waitingForSnapshotsReadiness.forEach(cb => cb())
  waitingForSnapshotsReadiness.length = 0

  Logs.info('Snapshots.bg.load: Done:', performance.now() - ts)
}

const waitingForSnapshotsReadiness: (() => void)[] = []
export async function waitForSnapshotsReady(): Promise<void> {
  if (ready) return
  return new Promise(ok => {
    waitingForSnapshotsReadiness.push(ok)
  })
}

async function getSnapshotsDirHandle() {
  let root
  try {
    root = await navigator.storage?.getDirectory()
  } catch (err) {
    Logs.err('Snapshots.getSnapshotsDirHandle: Unable to obtain the root dir handle:', err)
    return
  }
  let snapDirHandle
  try {
    snapDirHandle = await root.getDirectoryHandle('snapshots', { create: true })
  } catch (err) {
    Logs.err('Snapshots.getSnapshotsDirHandle: Unable to obtain the snapshots dir handle:', err)
    return
  }
  navigator.storage
    ?.persisted()
    .then(persisted => !persisted && navigator.storage.persist())
    .catch(() => {})
  return snapDirHandle
}

async function migrateSnapshots(
  minifiedSnapshots: T.MinifiedSnapshot[],
  rmFromLocalStorage: boolean,
  fixSettings: boolean
) {
  const ts = performance.now()
  const len = minifiedSnapshots.length

  Logs.info('Snapshots.migrateSnapshots: length:', len)
  if (len) {
    const ids = new Set<ID>()
    for (let i = 0; i < len; i++) {
      // Get normalized snapshot
      const snapshot = getNormalizedSnapshot(minifiedSnapshots, i)
      if (!snapshot) {
        const ms = minifiedSnapshots[i]
        Logs.warn('Snapshots.migrateSnapshots: Unable to get normalized snapshot:', i, ms)
        continue
      }

      // Regenerate id
      if (ids.has(snapshot.id)) snapshot.id = genSnapshotId(snapshot.time)
      ids.add(snapshot.id)

      try {
        await saveSnapshot(snapshot, false)
      } catch (err) {
        Logs.warn('Snapshots.migrateSnapshots: Unable to save snapshot:', i, snapshot.id)
        continue
      }
      const time = Utils.dateTimeTemplate('%Y.%M.%D - %h:%m:%s', snapshot.time)
      Logs.info(`Snapshots.migrateSnapshots: ${i + 1}/${len}:`, time)
    }
  }

  // Update user defined limit by size if needed
  if (fixSettings && Settings.state.snapLimit && Settings.state.snapLimitUnit === 'kb') {
    const snapshotsSize = await SnapshotFileList.getSnapshotsSize().catch(() => 0)
    Logs.info(`Snapshots.migrateSnapshots: snapshotsSize: ${Utils.sizeToString(snapshotsSize)}`)
    Logs.info(`Snapshots.migrateSnapshots: Upd limit: ${Settings.state.snapLimit}kb`)
    const sizeKb = Math.ceil(snapshotsSize / 1024)
    Logs.info(`Snapshots.migrateSnapshots: Upd limit: New size: ${sizeKb}kb`)
    if (Settings.state.snapLimit < sizeKb) {
      Logs.info('Snapshots.migrateSnapshots: Upd limit: Updating...')
      Settings.state.snapLimit = sizeKb + 1
      await Settings.saveSettings().catch(() => {})
    }
  }

  if (rmFromLocalStorage) {
    Logs.info('Snapshots.migrateSnapshots: Removing old snapshots from local storage..')
    try {
      await browser.storage.local.remove<T.Stored>(['snapshots', 'lastSnapTime'])
    } catch (err) {
      Logs.err('Snapshots.migrateSnapshots: Unable to remove snapshots from local storage:', err)
    }
  }
  Logs.info('Snapshots.migrateSnapshots: Done:', performance.now() - ts)
  Logs.info('Snapshots.migrateSnapshots: SnapFileStorage:', SnapshotFileList.len)
}

/**
 * timestamp-id-win-tabs-optName
 */
function getSnapshotFileName(s: T.Snapshot): string {
  const winCount = s.tabs.length
  let tabCount = 0
  for (const win of s.tabs) {
    for (const panel of win) {
      tabCount += panel.length
    }
  }
  let flags
  if (s.auto !== undefined) flags = s.auto ? 'a' : 'm'
  else flags = '_'
  return `${s.time.toString(36)}-${s.id}-${winCount}-${tabCount}-${flags}.json`
}

const SNAP_FILE_NAME_RE =
  /^(?<time>\w+?)-(?<id>\w+?)-(?<winCount>\d+?)-(?<tabCount>\d+?)-(?<flags>\w+?)\.json/
function parseSnapshotFileName(name: string) {
  const result = SNAP_FILE_NAME_RE.exec(name)
  if (!result?.groups) return

  const timeRaw = result.groups['time']
  if (!timeRaw) return
  const time = parseInt(timeRaw, 36)
  if (isNaN(time)) return

  const id = result.groups['id']

  const winCountRaw = result.groups['winCount']
  if (!winCountRaw) return
  const winCount = parseInt(winCountRaw)
  if (isNaN(winCount)) return

  const tabCountRaw = result.groups['tabCount']
  if (!tabCountRaw) return
  const tabCount = parseInt(tabCountRaw)
  if (isNaN(tabCount)) return

  const flagsRaw = result.groups['flags']
  let auto
  if (flagsRaw) {
    if (flagsRaw.includes('a')) auto = true
    else if (flagsRaw.includes('m')) auto = false
  }

  return { id, time, winCount, tabCount, auto }
}

let creatingSnapshot = false
let prevSnapshot: T.Snapshot | undefined

/**
 * Create base snapshot
 */
export async function createSnapshot(auto = false) {
  if (!ready) await waitForSnapshotsReady()
  if (creatingSnapshot) return
  creatingSnapshot = true

  // Get snapshot src data
  const [stored, recentSnapshot] = await Promise.all([
    browser.storage.local.get<T.Stored>(['sidebar', 'containers']).catch(() => undefined),
    // prettier-ignore
    !prevSnapshot ? SnapshotFileList.getRecent()?.readSnapshot().catch(() => undefined) : undefined,
    Tabs.updateBgTabsTreeData().catch(() => {}),
  ])
  if (!stored) {
    Logs.err('createSnapshot: Cannot get source data')
    creatingSnapshot = false
    return
  }
  if (recentSnapshot && !prevSnapshot) prevSnapshot = recentSnapshot

  if (!stored.containers) stored.containers = {}
  if (!stored.sidebar) stored.sidebar = SidebarConf.createDefaultSidebarConfig()

  // Get tabs info per window per panel
  const tabs: T.SnapTab[][][] = []
  for (const window of Windows.byId.values()) {
    if (Settings.state.snapExcludePrivate && window.incognito) continue
    if (window.id === undefined || !window.tabs) continue
    if (window.type !== 'normal') continue

    const winTabs: T.SnapTab[][] = []
    const snapTabsById: Record<ID, T.SnapTab> = {}
    let panelTabs: T.SnapTab[] | undefined
    let targetGroup: ID = ''

    for (const tab of window.tabs) {
      const snapTab: T.SnapTab = { url: tab.url, title: tab.title, panelId: tab.panelId ?? D.NOID }
      const parent = snapTabsById[tab.parentId ?? D.NOID]
      if (parent && parent.panelId === tab.panelId) snapTab.lvl = (parent.lvl ?? 0) + 1
      if (tab.pinned) {
        snapTab.pinned = true
        if (Settings.state.pinnedTabsPosition !== 'panel') snapTab.panelId = -1
      }
      if (tab.folded) snapTab.folded = true
      if (tab.cookieStoreId !== D.CONTAINER_ID) snapTab.containerId = tab.cookieStoreId
      if (tab.customTitle) snapTab.customTitle = tab.customTitle
      if (tab.customColor) snapTab.customColor = tab.customColor

      snapTab.url = Utils.restoreUrl(snapTab.url) ?? snapTab.url
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
        if (!containerConf) snapTab.containerId = undefined
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
        targetGroup = tab.panelId ?? D.NOID
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
    creatingSnapshot = false
    return
  }

  const time = Date.now()
  const snapshot: T.Snapshot = {
    id: genSnapshotId(time),
    time,
    containers: stored.containers,
    sidebar: stored.sidebar,
    tabs,
    auto,
  }

  if (auto && prevSnapshot && isSnapshotRedundant(prevSnapshot, snapshot)) {
    creatingSnapshot = false
    return
  }
  prevSnapshot = snapshot

  try {
    await saveSnapshot(snapshot, Settings.state.snapAutoExport)
  } catch (err) {
    Logs.err('Snapshots.createSnapshot: Unable to save snapshot:', err)
    creatingSnapshot = false
    throw err
  }

  try {
    await limitSnapshots()
  } catch (err) {
    Logs.err('Cannot limit snapshots', err)
  }

  if (Settings.state.snapNotify) {
    IPC.sendToSidebars('notifyAboutNewSnapshot')
  }

  SnapshotFileList.getSnapshotsInfo()
    .then(snapshotsInfo => IPC.event('snapshotsUpd', snapshotsInfo))
    .catch(err => Logs.err('Snapshots.createSnapshot: Unable to upd snapshots info:', err))

  creatingSnapshot = false
}

function genSnapshotId(timestamp: number) {
  return Math.random().toString(36).replace('0.', timestamp.toString(36))
}

export async function addSnapshot(snapshot: T.Snapshot) {
  const timestamp = Date.now()
  snapshot.id = genSnapshotId(timestamp)
  snapshot.time = timestamp
  await saveSnapshot(snapshot, false)
  SnapshotFileList.getSnapshotsInfo()
    .then(snapshotsInfo => IPC.event('snapshotsUpd', snapshotsInfo))
    .catch(err => Logs.err('Snapshots.createSnapshot: Unable to upd snapshots info:', err))
  return snapshot.id
}

export async function saveLegacySnapshots(minifiedSnapshots: T.MinifiedSnapshot[]) {
  await migrateSnapshots(minifiedSnapshots, false, false)
  SnapshotFileList.getSnapshotsInfo()
    .then(snapshotsInfo => IPC.event('snapshotsUpd', snapshotsInfo))
    .catch(err => Logs.err('Snapshots.saveSnapshot: Unable to upd snapshots info:', err))
}

export async function saveSnapshots(snapshots: T.Snapshot[]) {
  for (const snapshot of snapshots) {
    await saveSnapshot(snapshot, false)
  }
  SnapshotFileList.getSnapshotsInfo()
    .then(snapshotsInfo => IPC.event('snapshotsUpd', snapshotsInfo))
    .catch(err => Logs.err('Snapshots.saveSnapshot: Unable to upd snapshots info:', err))
}

async function saveSnapshot(snapshot: T.Snapshot, download: boolean) {
  if (!snapDirHandle) throw E.Err.NoSnapshotsDirHandle

  const snapJsonStr = JSON.stringify(snapshot)
  const maxPossibleSize = snapJsonStr.length * 3
  const REMOVE_RETRY_COUNT = 2
  const rmStep = Math.ceil(maxPossibleSize / REMOVE_RETRY_COUNT)

  // Get snapshot file name and check if there is already existed one
  const snapFileName = getSnapshotFileName(snapshot)
  const existedSnapFile = SnapshotFileList.getByName(snapFileName)
  if (existedSnapFile) return false

  let newFileHandle
  let writableStream
  let writen = false
  let tryCount = 0
  while (!writen) {
    try {
      tryCount++
      newFileHandle = await snapDirHandle.getFileHandle(snapFileName, { create: true })
      writableStream = await newFileHandle.createWritable()
      await writableStream.write(snapJsonStr)
      await writableStream.close()
      writen = true
    } catch (err: any) {
      Logs.warn('Snapshots.saveSnapshot: Error from write() or close():', err)
      await writableStream?.abort()
      await snapDirHandle.removeEntry(snapFileName)
      if (err?.name === 'QuotaExceededError' && tryCount <= REMOVE_RETRY_COUNT) {
        await removeOldestSnapshots({ size: rmStep, allOrNothing: true })
      } else {
        throw err
      }
    }
  }

  if (newFileHandle) SnapshotFileList.add(new SnapshotFile(newFileHandle))

  if (download) downloadSnapshot(snapshot, snapJsonStr)

  return true
}

function getExportPath(expInfo: T.SnapExportInfo) {
  let snapAutoExportPath = Settings.state.snapAutoExportPath
  if (!snapAutoExportPath) snapAutoExportPath = 'Sidebery/snapshot-%Y.%M.%D-%h.%m.%s'
  snapAutoExportPath = Utils.dateTimeTemplate(snapAutoExportPath, expInfo.time)
  snapAutoExportPath = snapAutoExportPath.replace(/^\.+/, '')

  const pathArr = snapAutoExportPath.split(/\/|\\/)
  const normPathArr = pathArr.filter(part => !!part)
  const normPath = normPathArr.join('/')

  return normPath
}

function downloadSnapshot(snapshot: T.Snapshot, json: string) {
  if (!browser?.downloads) return

  const expType = Settings.state.snapAutoExportType
  const expInfo = prepareExport(snapshot, {
    json: (expType === 'json' || expType === 'both') && json,
    md: expType === 'md' || expType === 'both',
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

function isSnapshotRedundant(prevSnapshot: T.Snapshot, snapshot: T.Snapshot): boolean {
  if (!Utils.compare(snapshot.containers, prevSnapshot.containers)) return false
  if (!Utils.compare(snapshot.sidebar, prevSnapshot.sidebar)) return false
  if (!Utils.compare(snapshot.tabs, prevSnapshot.tabs)) return false
  return true
}

export async function getSnapshotsInfo() {
  if (!ready) await waitForSnapshotsReady()
  return SnapshotFileList.getSnapshotsInfo()
}

export async function getSnapshot(query?: { id?: ID; index?: number }) {
  let file
  if (query?.id) file = SnapshotFileList.getById(query.id)
  else file = SnapshotFileList.getByIndex(query?.index ?? 0)
  if (!file) throw `no file with ${query?.id ? 'id: ' + query?.id : 'index: ' + query?.index}`

  return await file.readSnapshot()
}

export async function getAllSnapshots() {
  const snapshots = []
  const snapshotsReading = []
  const files = SnapshotFileList.files
  for (const file of files) {
    snapshotsReading.push(file.readSnapshot())
  }
  const snapshotReadingResults = await Promise.allSettled(snapshotsReading)
  for (const snapshotReadingResult of snapshotReadingResults) {
    const result = Utils.settledOr(snapshotReadingResult, undefined)
    if (result) snapshots.push(result)
    else Logs.warn('Snapshots.getAllSnapshots: Unable to get snapshot')
  }
  return snapshots
}

let scheduleTimeoutId: number | undefined
let intervalId: number | undefined
export async function scheduleSnapshots(): Promise<void> {
  clearTimeout(scheduleTimeoutId)
  clearInterval(intervalId)

  const interval = getSnapInterval()
  if (interval < MIN_SNAP_INTERVAL) return

  const elapsed = await getLastSnapTimeElapsed()
  let startTimeout = interval - elapsed
  if (startTimeout < MIN_SNAP_INTERVAL) startTimeout = MIN_SNAP_INTERVAL

  scheduleTimeoutId = setTimeout(() => {
    intervalId = setInterval(() => {
      createSnapshot(true).catch(err => {
        Logs.err('Snapshots.scheduleSnapshots: Cannot create snapshot:', err)
      })
    }, interval)
  }, startTimeout)
}

function getSnapInterval(): number {
  let interval = Settings.state.snapInterval
  const unit = Settings.state.snapIntervalUnit
  if (typeof interval !== 'number' || interval < 1) return 0
  if (unit === 'min') interval = Settings.state.snapInterval * 60000
  if (unit === 'hr') interval = Settings.state.snapInterval * 3600000
  if (unit === 'day') interval = Settings.state.snapInterval * 86400000
  return interval
}

async function getLastSnapTimeElapsed(): Promise<number> {
  if (!ready) await waitForSnapshotsReady()
  const snapshotFile = SnapshotFileList.getRecent()
  const now = Date.now()
  const lastSnapTime = snapshotFile?.time ?? now
  const elapsed = now - lastSnapTime
  if (elapsed < 0) return 0
  return elapsed
}

async function adaptContainers(snapshot: T.Snapshot): Promise<void> {
  const currentContainers = Object.values(Containers.reactive.byId)
  const oldNewIds: Record<string, string> = {}

  for (const container of Object.values(snapshot.containers)) {
    let sColor = container.color
    if (sColor === 'turquoise') sColor = 'cyan'
    if (sColor === 'toolbar') sColor = 'gray'

    const currentContainer = currentContainers.find(c => {
      let lColor = c.color
      if (lColor === 'turquoise') lColor = 'cyan'
      if (lColor === 'toolbar') lColor = 'gray'
      return c.name === container.name && c.icon === container.icon && lColor === sColor
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

async function adaptTabsPanels(snapshot: T.Snapshot): Promise<void> {
  const stored = await browser.storage.local.get<T.Stored>('sidebar')
  if (!stored.sidebar?.nav) return

  // Find last index of tabs panel
  let lastStoredTabsPanelIndex = stored.sidebar.nav.length
  while (lastStoredTabsPanelIndex-- > 0) {
    const storedId = stored.sidebar.nav[lastStoredTabsPanelIndex]
    if (storedId === undefined) break
    const storedPanel = stored.sidebar.panels[storedId]
    if (storedPanel && storedPanel.type === E.PanelType.tabs) break
  }

  // Recreate tabs panels
  let changed = false
  for (let i = 0; i < snapshot.sidebar.nav.length; i++) {
    const snapNavId = snapshot.sidebar.nav[i]
    if (snapNavId === undefined) continue
    const snapPanel = snapshot.sidebar.panels[snapNavId]
    if (!snapPanel || snapPanel.type !== E.PanelType.tabs) continue

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

    const newOrder: T.SnapTab[][] = []

    // Pinned tabs
    if (win[0]?.[0]?.pinned) {
      newOrder.push(win[0])
      win.shift()
    }

    // Tabs list w/o panelId in the first tab
    for (const tabs of win) {
      if (tabs[0]?.panelId === D.NOID) {
        Logs.warn('Snapshots.adaptTabsPanels: Tabs list without panelId, len:', tabs.length)
        newOrder.push(tabs)
      }
    }

    for (const storedId of stored.sidebar.nav) {
      const storedPanel = stored.sidebar.panels[storedId]
      if (!storedPanel || storedPanel.type !== E.PanelType.tabs) continue

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
  snapshot: T.Snapshot,
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
  snapshot: T.Snapshot,
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
      if (tab.panelId === GLOB_PINNED_ID) tab.panelId = D.NOID

      let url: string | undefined = tab.url
      if (Utils.isGroupUrl(url)) url = Utils.updateGroupUrlBase(url)
      else if (Utils.isPlaceholderUrl(url)) url = Utils.updatePlaceholderUrlBase(url)
      else url = Utils.sanitizeUrl(url, tab.title)

      const tabInfo: ItemInfo = {
        id: index++,
        url,
        title: tab.title,
        parentId: D.NOID,
        folded: tab.folded,
        panelId: tab.panelId ?? D.NOID,
        container: tab.containerId ?? D.DEFAULT_CONTAINER_ID,
      }
      if (tab.customTitle) tabInfo.customTitle = tab.customTitle
      if (tab.customColor) tabInfo.customColor = tab.customColor
      tabsInfoByLvl[tab.lvl ?? 0] = tabInfo

      if (tab.pinned) tabInfo.pinned = true

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

async function limitSnapshots() {
  if (SnapshotFileList.len <= MIN_LIMITING_COUNT) return

  const unit = Settings.state.snapLimitUnit
  const limit = Settings.state.snapLimit
  let thresholdValue = limit
  if (limit <= 0) return

  // Time threshold (ms)
  if (unit === 'day') thresholdValue = Date.now() - limit * 86400000
  // Size threshold (b)
  else if (unit === 'kb') {
    thresholdValue = limit * 1024
  }

  const snapshotFilesInfo = await SnapshotFileList.getSnapshotsInfo()
  const toRemove = []
  for (const info of snapshotFilesInfo) {
    if (unit === 'day' && info.time < thresholdValue) toRemove.push(info.id)
    else if (unit === 'kb' && (thresholdValue -= info.size) < 0) toRemove.push(info.id)
    else if (unit === 'snap' && thresholdValue-- <= 0) toRemove.push(info.id)
  }

  // Always keep the latest snapshot
  if (toRemove.length === SnapshotFileList.len) toRemove.shift()

  return removeSnapshots(toRemove)
}

export async function removeSnapshot(id: ID) {
  if (!snapDirHandle) throw E.Err.NoSnapshotsDirHandle

  const snapshotFile = SnapshotFileList.getById(id)
  if (!snapshotFile) throw E.Err.NoSnapshotFile

  await snapDirHandle.removeEntry(snapshotFile.name)

  SnapshotFileList.removeById(id)

  const snapshotsInfo = await SnapshotFileList.getSnapshotsInfo()
  IPC.event('snapshotsUpd', snapshotsInfo)
}

async function removeSnapshots(ids: ID[]) {
  if (!snapDirHandle) throw 'No dir handle'
  const removing = []
  for (const id of ids) {
    const file = SnapshotFileList.getById(id)
    if (!file) continue
    removing.push(
      snapDirHandle.removeEntry(file.name).then(() => SnapshotFileList.removeById(file.id))
    )
  }

  return await Promise.allSettled(removing)
}

async function removeOldestSnapshots(conf: {
  size?: number
  count?: number
  allOrNothing?: boolean
}) {
  const toRemove = []
  let size = conf.size ?? 0
  let count = conf.count ?? 0
  const files = SnapshotFileList.files
  const bySize = size > 0
  const byCount = count > 0

  for (let i = files.length; i--;) {
    const file = files[i]
    if (size <= 0 && count <= 0) break
    if (bySize) size -= await file.getSize()
    if (byCount) count--
    toRemove.push(file.id)
  }

  if (conf.allOrNothing) {
    if (bySize && size > 0) return
    if (byCount && count > 0) return
  }

  return removeSnapshots(toRemove)
}

export const TESTING = {
  SnapshotFile,
  SnapshotFileList,
  getSnapshotFileName,
  parseSnapshotFileName,
}
