import Utils from 'src/utils'
import { Stored, DownloadItem, StoredDownloadItem } from 'src/types'
import { Downloads } from './downloads'
import { Store } from './storage'
import { Info } from './info'
import { LINUX_HOME_RE } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import { Notifications } from './notifications'
import { translate } from 'src/dict'
import { Tabs } from './tabs.fg'
import { Windows } from './windows'
import { Permissions } from './permissions'
import { SetupPage } from './setup-page'
import { Logs } from './logs'
import { Favicons } from './favicons'

const POLLING_INTERVAL_MS = 1000

export async function load(): Promise<void> {
  if (!browser.downloads) return

  Downloads.setupListeners()

  const waitGroup = await Promise.all([
    browser.storage.local.get<Stored>('downloads'),
    browser.downloads.search({}),
  ])

  const stored = waitGroup[0]
  if (!stored.downloads) stored.downloads = []
  const storedItems = stored.downloads.map(item => convertStoredItem(item))

  const currentItems = waitGroup[1] as DownloadItem[]
  const result: DownloadItem[] = []
  for (let i = currentItems.length; i--; ) {
    const item = currentItems[i]
    normalizeItem(item)
    const storedItem = storedItems.find(s => s.startMS === item.startMS && s.url === item.url)
    if (storedItem) Utils.updateObject(storedItem, item)
    else result.push(item)
  }

  Downloads.reactive.list = result.concat(storedItems)
  Downloads.reactive.byId = {}
  Downloads.reactive.list.forEach(item => {
    if (item.id > -1) Downloads.reactive.byId[item.id] = item
    if (item.uid) Downloads.reactive.byId[item.uid] = item
  })

  if (!pollingInterval) startPolling()
  updatePanelLen()

  Downloads.reactive.list.sort((a, b) => (b.startMS ?? 0) - (a.startMS ?? 0))

  if (Sidebar.reactive.panelsById.downloads) Sidebar.reactive.panelsById.downloads.ready = true

  Logs.info('Downloads: Loaded')
}

export function unload(): void {
  Downloads.resetListeners()
  Downloads.reactive.list = []
  if (Sidebar.reactive.panelsById.downloads) Sidebar.reactive.panelsById.downloads.ready = false
}

function convertStoredItem(stored: StoredDownloadItem): DownloadItem {
  const item: DownloadItem = {
    id: -1,
    url: stored.url,
    filename: stored.path,
    fileSize: stored.size,
    state: 'complete', // stored.state
    incognito: false,
    paused: false,
    referrer: stored.ref,
    totalBytes: stored.size,
    bytesReceived: stored.size,
    startTime: '',
    endTime: null,
    canResume: false,
    danger: 'accepted',
    mime: '',
    exists: false,
    error: null,

    uid: stored.uid,
    startMS: stored.start,
    leftMS: -1,
    endMS: stored.start,
  }

  setFileInfo(item)
  setIconSVG(item)

  if (item.referrer) item.srcDomain = Utils.getDomainOf(item.referrer)

  return item
}

export function setFileInfo(item: DownloadItem): void {
  let shortPath = item.filename.replace(LINUX_HOME_RE, '~/')

  // File ext
  const extIndex = shortPath.lastIndexOf('.')
  if (extIndex !== -1) {
    item.ext = shortPath.slice(extIndex)
    shortPath = shortPath.slice(0, extIndex)
  }

  // File name and dir path
  let nameIndex = shortPath.lastIndexOf('/')
  if (nameIndex === -1) nameIndex = shortPath.lastIndexOf('\\')
  if (nameIndex !== -1) {
    item.name = shortPath.slice(nameIndex + 1)
    shortPath = shortPath.slice(0, nameIndex)
    item.dirPath = shortPath
  }

  // Dir name
  let dirIndex = shortPath.lastIndexOf('/')
  if (dirIndex === -1) dirIndex = shortPath.lastIndexOf('\\')
  if (dirIndex !== -1) item.dirName = shortPath.slice(dirIndex + 1)
  else item.dirName = shortPath
}

export function setIconSVG(item: DownloadItem): void {
  item.iconSvg = Favicons.getFavPlaceholder(item.url)
}

export function normalizeItem(nativeItem: browser.downloads.DownloadItem): DownloadItem {
  const item = nativeItem as DownloadItem

  if (item.estimatedEndTime === undefined) item.estimatedEndTime = undefined // wtf
  if (item.error === undefined) item.error = undefined // wtf

  if (item.uid === undefined) item.uid = Utils.uid()
  if (item.name === undefined || item.dirName === undefined) setFileInfo(item)
  if (item.iconSvg === undefined) setIconSVG(item)
  if (item.srcDomain === undefined) item.srcDomain = Utils.getDomainOf(item.referrer || item.url)
  if (item.startMS === undefined) item.startMS = new Date(item.startTime).getTime()
  if (item.leftMS === undefined) {
    if (!item.estimatedEndTime) item.leftMS = -1
    else {
      const estEndMS = new Date(item.estimatedEndTime).getTime()
      item.leftMS = estEndMS - Date.now()
    }
  }
  if (item.endMS === undefined && item.endTime) {
    if (item.endTime !== item.startTime) item.endMS = new Date(item.endTime).getTime()
    else item.endMS = item.startMS
  }

  return item
}

let saveTimeout: number | undefined
export function save(delay: number): void {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    const downloads: StoredDownloadItem[] = Downloads.reactive.list.map(item => {
      return {
        uid: item.uid ?? Utils.uid(),
        url: item.url,
        ref: item.referrer,
        path: item.filename,
        size: item.fileSize,
        start: item.startMS ?? -1,
        state: item.state,
      }
    })
    Store.set({ downloads })
  }, delay)
}

export function updatePanelLen(): void {
  const panels = Sidebar.reactive.panelsById.downloads
  if (!panels) return

  let len = 0
  for (const item of Downloads.reactive.list) {
    if (item.paused || item.state === 'in_progress') len++
    if (item.id === -1) break
  }

  panels.len = len
}

export async function recheckProgress(): Promise<void> {
  let result = await browser.downloads.search({})
  if (!result) result = []

  for (const item of result) {
    const inState = Downloads.reactive.byId[item.id]
    if (inState && inState.state !== item.state) inState.state = item.state
  }
}

let pollingInterval: number | undefined
let pollingTime: number | undefined
export function startPolling(): void {
  if (pollingInterval || !Info.isSidebar) return

  pollingInterval = setInterval(async () => {
    const result = await browser.downloads.search({ state: 'in_progress' })
    if (!result || !result.length) return stopPolling()

    const timestamp = Date.now()
    let timestampDelta = POLLING_INTERVAL_MS
    if (pollingTime) timestampDelta = timestamp - pollingTime
    pollingTime = timestamp

    for (const newItem of result as DownloadItem[]) {
      if (newItem.id === -1) continue
      const item = Downloads.reactive.byId[newItem.id]
      if (!item) continue

      let bps = 0
      if (newItem.bytesReceived || item.bytesReceived) {
        const bytesDelta = newItem.bytesReceived - item.bytesReceived
        bps = Math.round(bytesDelta / (timestampDelta / 1000))
      }

      newItem.uid = item.uid
      if (!newItem.referrer) newItem.referrer = item.referrer
      normalizeItem(newItem)
      Utils.updateObject(item, newItem)
      item.bytesPerSecond = bps
    }
  }, POLLING_INTERVAL_MS)

  Logs.info('Downloads: polling started')
}
export function stopPolling(): void {
  if (!Info.isSidebar) return

  clearInterval(pollingInterval)
  pollingInterval = undefined
  pollingTime = undefined

  Logs.info('Downloads: polling stoped')
}
export function checkPolling(): void {
  if (!Info.isSidebar) return
  Logs.info('Downloads: checking polling')

  const need = Downloads.reactive.list.some(item => item.id > -1 && item.state === 'in_progress')
  if (need) startPolling()
  else stopPolling()
}

export async function reload(item: DownloadItem): Promise<void> {
  if (item.id > -1 && item.referrer) {
    let id: number
    try {
      id = await browser.downloads.download({
        url: item.url,
        headers: [{ name: 'Referer', value: item.referrer }],
        saveAs: true,
      })
    } catch (err) {
      item.error = err as browser.downloads.InterruptReason
      const errorInfo = `${translate('notif.download_err')} ${item.error ?? 'UNKNOWN'}`
      Notifications.notify({
        icon: '#icon_download_in_progress',
        lvl: 'err',
        title: translate('notif.download_retry_failed'),
        details: errorInfo,
      })
      return
    }
    const newDownload = Downloads.reactive.byId[id]
    if (newDownload) newDownload.referrer = item.referrer
  }
}

export function openRef(item: DownloadItem): void {
  if (!item.referrer) return
  const tab = Tabs.list.find(t => t.url === item.referrer)
  if (tab) {
    browser.tabs.update(tab.id, { active: true })
  } else {
    Tabs.open([{ id: '_', url: item.referrer, active: true }], { windowId: Windows.id })
  }
}

export function copyFullPath(item: DownloadItem): void {
  if (!item.filename) return
  if (!Permissions.reactive.clipboardWrite) {
    SetupPage.open('clipboard-write')
    return
  }

  navigator.clipboard.writeText(item.filename)
}

export function copyRef(item: DownloadItem): void {
  if (!item.referrer) return
  if (!Permissions.reactive.clipboardWrite) {
    SetupPage.open('clipboard-write')
    return
  }

  navigator.clipboard.writeText(item.referrer)
}

export function copyURL(item: DownloadItem): void {
  if (!item.url) return
  if (!Permissions.reactive.clipboardWrite) {
    SetupPage.open('clipboard-write')
    return
  }

  navigator.clipboard.writeText(item.url)
}

export async function remove(item: DownloadItem): Promise<void> {
  if (item.id !== -1) {
    if (item.state === 'in_progress') await browser.downloads.cancel(item.id)
    await browser.downloads.erase({ id: item.id })
  }

  const index = Downloads.reactive.list.findIndex(d => d.uid === item.uid)
  if (index === -1) return
  Downloads.reactive.list.splice(index, 1)
  delete Downloads.reactive.byId[item.id]
  if (item.uid) delete Downloads.reactive.byId[item.uid]

  checkPolling()
  Downloads.save(300)
}

export async function pauseAllActive(): Promise<void> {
  const panel = Sidebar.reactive.panelsById.downloads
  const ids: ID[] = []

  if (Utils.isDownloadsPanel(panel) && panel.ready) {
    for (const item of Downloads.reactive.list) {
      if (item.id === -1) break
      if (item.state === 'in_progress' && !item.paused) ids.push(item.id)
    }
  }

  await Promise.all(ids.map(id => browser.downloads.pause(id as number)))
}

export async function resumeAllPaused(): Promise<void> {
  const panel = Sidebar.reactive.panelsById.downloads
  const ids: ID[] = []

  if (Utils.isDownloadsPanel(panel) && panel.ready) {
    for (const item of Downloads.reactive.list) {
      if (item.id === -1) break
      if (item.paused) ids.push(item.id)
    }
  }

  await Promise.all(ids.map(id => browser.downloads.resume(id as number)))
}

export function scrollToDownloadItem(uid: ID): void {
  const elId = 'download' + uid.toString()
  const el = document.getElementById(elId)

  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}
