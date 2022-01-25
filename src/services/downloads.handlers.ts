import Utils from 'src/utils'
import { DownloadItem } from 'src/types'
import { Downloads, STORED_LIMIT } from './downloads'
import { Info } from './info'
import { Settings } from './settings'
import { Notifications } from './notifications'
import { translate } from 'src/dict'
import { Logs } from './logs'

export function setupListeners(): void {
  if (!browser.downloads) return
  if (Downloads.listening) return
  browser.downloads.onCreated.addListener(onCreated)
  browser.downloads.onChanged.addListener(onChanged)
  browser.downloads.onErased.addListener(onErased)
  Downloads.listening = true
  Logs.info('Downloads: Listeners initialized')
}

export function resetListeners(): void {
  if (!browser.downloads) return
  if (!Downloads.listening) return
  browser.downloads.onCreated.removeListener(onCreated)
  browser.downloads.onChanged.removeListener(onChanged)
  browser.downloads.onErased.removeListener(onErased)
  Downloads.listening = false
}

function onCreated(newItem: browser.downloads.DownloadItem): void {
  if (!newItem.startTime) newItem.startTime = new Date().toISOString()

  const item = Downloads.normalizeItem(newItem)
  Downloads.reactive.list.unshift(item)
  Downloads.reactive.byId[item.id] = item
  if (item.uid) Downloads.reactive.byId[item.uid] = item

  if (Downloads.reactive.list.length > STORED_LIMIT) Downloads.reactive.list.splice(STORED_LIMIT)
  if (item.state === 'in_progress') Downloads.startPolling()
  if (Info.isBg) Downloads.save(500)
  if (Info.isSidebar) Downloads.updatePanelLen()
}

async function onChanged(update: browser.downloads.DownloadItemDelta): Promise<void> {
  const item = Downloads.reactive.byId[update.id]
  if (!item) return

  const downloads = (await browser.downloads.search({ id: item.id })) as DownloadItem[]
  const newItem = downloads?.[0]
  if (!newItem) return

  newItem.uid = item.uid

  const finished = item.state === 'in_progress' && newItem.state === 'complete'
  const failed =
    item.state === 'in_progress' &&
    newItem.state === 'interrupted' &&
    !newItem.error?.startsWith('USER')
  const filenameChanged = item.filename !== newItem.filename
  const urlChanged = item.url !== newItem.url
  const refChanged = item.referrer !== newItem.referrer
  const startTimeChanged = item.startTime !== newItem.startTime
  const leftTimeChanged = item.estimatedEndTime !== newItem.estimatedEndTime
  const endTimeChanged = item.endTime !== newItem.endTime && newItem.endTime

  item.estimatedEndTime = newItem.estimatedEndTime
  item.error = newItem.error
  Utils.updateObject(item, newItem)

  if (filenameChanged) Downloads.setFileInfo(item)
  if (urlChanged) Downloads.setIconSVG(item)
  if (urlChanged || refChanged) item.srcDomain = Utils.getDomainOf(item.referrer || item.url)
  if (startTimeChanged) item.startMS = new Date(item.startTime).getTime()
  if (leftTimeChanged) {
    if (!item.estimatedEndTime) item.leftMS = -1
    else {
      const estEndMS = new Date(item.estimatedEndTime).getTime()
      item.leftMS = estEndMS - Date.now()
    }
  }
  if (endTimeChanged && item.endTime) {
    if (item.endTime !== item.startTime) item.endMS = new Date(item.endTime).getTime()
    else item.endMS = item.startMS
  }

  if (update.state) {
    if (item.state === 'complete') item.bytesReceived = item.totalBytes
    if (item.state === 'in_progress') Downloads.startPolling()
    else Downloads.checkPolling()
  }

  if (Info.isBg) Downloads.save(500)

  if (Info.isSidebar) Downloads.updatePanelLen()
  if (Info.isSidebar && finished && Settings.reactive.showNotifOnDownloadOk) {
    const filename = item.name && item.ext ? item.name + item.ext : item.name
    const pathInfo = `${translate('notif.download_in')} ${item.dirPath ?? ''}`
    const domain = Utils.getDomainOf(item.referrer || item.url)
    const domainInfo = `${translate('notif.download_from')} ${domain}`
    Notifications.notify({
      icon: '#icon_download_in_progress',
      title: filename ?? item.filename,
      details: `${pathInfo}\n${domainInfo}`,
      controls: [
        {
          label: translate('notif.download_open_file'),
          callback: () => browser.downloads.open(item.id),
        },
        {
          label: translate('notif.download_open_dir'),
          icon: '#icon_folder',
          callback: () => browser.downloads.show(item.id),
        },
      ],
    })
  }
  if (Info.isSidebar && failed && Settings.reactive.showNotifOnDownloadErr) {
    const filename = item.name && item.ext ? item.name + item.ext : item.name
    const domain = Utils.getDomainOf(item.referrer || item.url)
    const domainInfo = `${translate('notif.download_from')} ${domain}`
    const error = item.error ?? 'UNKNOWN'
    const errorInfo = `${translate('notif.download_err')} ${error}`
    Notifications.notify({
      icon: '#icon_download_in_progress',
      lvl: 'err',
      title: filename ?? item.filename,
      details: `${domainInfo}\n${errorInfo}`,
      ctrl: translate('notif.download_retry'),
      callback: () => Downloads.reload(item),
    })
  }
}

function onErased(id: number): void {
  const index = Downloads.reactive.list.findIndex(d => d.id === id)
  if (index === -1) return

  const item = Downloads.reactive.byId[id]
  const uid = item?.uid
  if (uid) delete Downloads.reactive.byId[uid]
  delete Downloads.reactive.byId[id]
  Downloads.reactive.list.splice(index, 1)

  Downloads.checkPolling()

  if (Info.isBg) Downloads.save(500)
}
