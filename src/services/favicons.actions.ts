import * as Utils from 'src/utils'
import { Stored, FavDomain } from 'src/types'
import { Favicons } from 'src/services/favicons'
import * as IPC from 'src/services/ipc'
import { Store } from 'src/services/storage'
import { Tabs } from 'src/services/tabs.fg'
import { Info } from 'src/services/info'
import { FILE_RE, GROUP_URL, IMG_RE, MUS_RE, SETUP_URL, URL_URL, VID_RE } from 'src/defaults'
import * as Logs from './logs'

const SAVE_DELAY = 2000
const THRESHOLD_BYTES_DIFF = 150 * window.devicePixelRatio
const SIZE = Math.trunc(16 * window.devicePixelRatio)
const MAX_COUNT_LIMIT = 2000

let favRescaleCanvas: HTMLCanvasElement | undefined
let favPrescaleCanvas: HTMLCanvasElement | undefined
let favRescaleCanvasCtx: CanvasRenderingContext2D | null = null
let favPrescaleCanvasCtx: CanvasRenderingContext2D | null = null
let favRescaleImg: HTMLImageElement | undefined
let hashes: number[] = []
let domainsInfo: Record<string, FavDomain> = {}
let iconFillCanvas: HTMLCanvasElement | undefined
let iconFillCanvasCtx: CanvasRenderingContext2D | null = null
let iconFillImg: HTMLImageElement | undefined

/**
 * Load favicons
 */
export async function loadFavicons(): Promise<void> {
  let storage
  try {
    storage = await browser.storage.local.get<Stored>(['favicons', 'favHashes', 'favDomains'])
  } catch (err) {
    return Logs.err('loadFavicons: Cannot get favicons', err)
  }
  if (!storage.favicons?.length || !storage.favHashes?.length || !storage.favDomains) {
    storage.favicons = []
    storage.favHashes = []
    storage.favDomains = {}
  }

  hashes = []
  domainsInfo = {}
  const favicons: string[] = []
  const domains: Record<string, number> = {}
  let index = 0
  for (const domain of Object.keys(storage.favDomains)) {
    const info = storage.favDomains[domain]
    const favicon = storage.favicons[info.index]
    const hash = storage.favHashes[info.index]
    if (!favicon || hash === undefined) continue

    const existedIndex = hashes.indexOf(hash)
    if (existedIndex > -1) info.index = existedIndex
    else info.index = index++

    domains[domain] = info.index
    domainsInfo[domain] = info
    favicons[info.index] = favicon
    hashes[info.index] = hash
  }
  Favicons.reactive.list = favicons
  Favicons.reactive.domains = domains

  if (Info.isSidebar) {
    for (const tab of Tabs.list) {
      if (tab?.internal) continue
      if (tab?.favIconUrl) continue
      const domain = Utils.getDomainOf(tab.url)
      if (Favicons.reactive.list[Favicons.reactive.domains[domain]]) {
        const rTab = Tabs.reactive.byId[tab.id]
        tab.favIconUrl = Favicons.reactive.list[Favicons.reactive.domains[domain]]
        if (rTab) rTab.favIconUrl = tab.favIconUrl
      }
    }
  }
}

function limitFavicons(): number {
  let len = Favicons.reactive.list.length

  // Remove the last favicon
  if (len > MAX_COUNT_LIMIT) {
    const rmIndex = len - 1
    Favicons.reactive.list.splice(rmIndex, 1)
    hashes.splice(rmIndex, 1)
    for (const domain of Object.keys(domainsInfo)) {
      const domainInfo = domainsInfo[domain]
      if (domainInfo.index === rmIndex) {
        delete domainsInfo[domain]
      }
    }
    len--
  }

  // Get index to replace
  const randomIndex = Math.trunc(Math.random() * len)
  for (const domain of Object.keys(domainsInfo)) {
    const domainInfo = domainsInfo[domain]
    if (domainInfo.index === randomIndex) delete domainsInfo[domain]
  }

  return randomIndex
}

const saveFaviconTimeouts: Record<string, number | undefined> = {}
export function saveFavicon(url: string, icon: string): void {
  if (!url || !icon) return
  if (icon.length > 234567) return
  if (url.startsWith('about')) return

  clearTimeout(saveFaviconTimeouts[url])
  saveFaviconTimeouts[url] = setTimeout(async () => {
    delete saveFaviconTimeouts[url]

    const domain = Utils.getDomainOf(url)
    if (!domain) return

    const domainInfo = domainsInfo[domain]
    const hash = Utils.strHash(icon)

    let index = hashes.indexOf(hash)
    const sameIcon = index > -1

    // Prefer an icon of page with shorter URL
    if (domainInfo && domainInfo.src.length < url.length) return

    // Icon not cached but domainInfo exists - favicon was changed
    if (!sameIcon && domainInfo) index = domainInfo.index

    // Check limit and find target index
    if (index === -1) {
      // Replace random existed favicon
      if (!sameIcon && Favicons.reactive.list.length >= MAX_COUNT_LIMIT) index = limitFavicons()
      // Append favicon
      else index = Favicons.reactive.list.length
    }

    // Resize and set icon
    if (!sameIcon) {
      try {
        icon = await resizeFavicon(icon)
      } catch {
        return
      }
      Favicons.reactive.list[index] = icon
    }

    // Create/Update domain info
    if (!domainInfo) {
      domainsInfo[domain] = { index, src: url }
    } else {
      domainInfo.index = index
      domainInfo.src = url
    }

    // Set index and hash
    Favicons.reactive.domains[domain] = index
    hashes[index] = hash

    const toSave: Stored = { favDomains: domainsInfo, favHashes: hashes }
    if (!sameIcon) toSave.favicons = Favicons.reactive.list
    Store.set(toSave)

    IPC.sendToSidebars('setFavicon', domain, url, hash, icon)
  }, SAVE_DELAY)
}

export async function upgradeFaviCache(stored: Stored, newStorage: Stored): Promise<void> {
  const favicons = stored.favicons ?? []
  const favUrls = stored.favUrls ?? {}

  // Get urls map
  const urlsMap: Record<number, string> = {}
  for (const url of Object.keys(favUrls)) {
    if (!urlsMap[favUrls[url]]) urlsMap[favUrls[url]] = url
  }

  // Resize
  const newFavs: string[] = []
  const newFavDomains: Record<string, FavDomain> = {}
  const newHashes: number[] = []

  for (let hash, favicon, i = 0; i < favicons.length; i++) {
    favicon = favicons[i]
    if (!favicon) continue

    hash = Utils.strHash(favicon)

    let newFav
    try {
      newFav = await resizeFavicon(favicon)
    } catch {
      continue
    }
    const newIndex = newFavs.push(newFav) - 1
    newHashes.push(hash)
    if (urlsMap[i]) {
      const url = urlsMap[i]
      const domain = Utils.getDomainOf(url)
      if (!newFavDomains[domain]) {
        newFavDomains[domain] = { index: newIndex, src: url }
      }
    }
  }

  newStorage.favicons = newFavs
  newStorage.favHashes = newHashes
  newStorage.favDomains = newFavDomains
}

export async function resizeFavicon(fav: string): Promise<string> {
  // Prescale size
  const ds = SIZE * 2

  if (!favRescaleCanvas || !favRescaleCanvasCtx) {
    favRescaleCanvas = Utils.createCanvas(SIZE, SIZE)
    favPrescaleCanvas = Utils.createCanvas(ds, ds)
    favRescaleCanvasCtx = favRescaleCanvas.getContext('2d')
    favPrescaleCanvasCtx = favPrescaleCanvas.getContext('2d')
  }
  if (!favRescaleCanvasCtx || !favPrescaleCanvasCtx) return fav
  if (!favRescaleImg) favRescaleImg = new Image()

  favRescaleCanvasCtx.clearRect(0, 0, SIZE, SIZE)
  favPrescaleCanvasCtx.clearRect(0, 0, ds, ds)

  await Utils.setImageSrc(favRescaleImg, fav)

  try {
    let sw = favRescaleImg.naturalWidth
    let sh = favRescaleImg.naturalHeight
    if (sw === 0 || sh === 0) {
      const svgWithSize = Utils.setSvgImageSize(fav, ds, ds)
      if (!svgWithSize) return fav
      await Utils.setImageSrc(favRescaleImg, svgWithSize)
      sw = favRescaleImg.naturalWidth
      sh = favRescaleImg.naturalHeight
    }
    if (sw === 0 || sh === 0) return fav
    if (sw > ds && favPrescaleCanvas) {
      favPrescaleCanvasCtx.drawImage(favRescaleImg, 0, 0, sw, sh, 0, 0, ds, ds)
      favRescaleCanvasCtx.drawImage(favPrescaleCanvas, 0, 0, ds, ds, 0, 0, SIZE, SIZE)
    } else {
      favRescaleCanvasCtx.drawImage(favRescaleImg, 0, 0, sw, sh, 0, 0, SIZE, SIZE)
    }
  } catch (err) {
    return fav
  }

  const newFav = favRescaleCanvas.toDataURL('image/png')

  if (newFav.length + THRESHOLD_BYTES_DIFF >= fav.length) return fav
  else return newFav
}

export async function fillIcon(icon: string, color: string): Promise<string> {
  const ds = SIZE * 2

  if (!iconFillCanvas || !iconFillCanvasCtx) {
    iconFillCanvas = Utils.createCanvas(ds, ds)
    iconFillCanvasCtx = iconFillCanvas.getContext('2d')
    if (iconFillCanvasCtx) iconFillCanvasCtx.save()
    else return icon
  }

  if (!iconFillImg) iconFillImg = new Image()

  iconFillCanvasCtx.clearRect(0, 0, ds, ds)

  try {
    await Utils.setImageSrc(iconFillImg, icon)
  } catch {
    return icon
  }

  try {
    let sw = iconFillImg.naturalWidth
    let sh = iconFillImg.naturalHeight
    if (sw === 0 || sh === 0) {
      const svgWithSize = Utils.setSvgImageSize(icon, ds, ds)
      if (!svgWithSize) return icon
      await Utils.setImageSrc(iconFillImg, svgWithSize)
      sw = iconFillImg.naturalWidth
      sh = iconFillImg.naturalHeight
    }
    iconFillCanvasCtx.fillStyle = color
    iconFillCanvasCtx.fillRect(0, 0, ds, ds)
    iconFillCanvasCtx.globalCompositeOperation = 'destination-in'
    iconFillCanvasCtx.drawImage(iconFillImg, 0, 0, sw, sh, 0, 0, ds, ds)
    iconFillCanvasCtx.globalCompositeOperation = 'source-over'
  } catch (err) {
    return icon
  }

  const filledIcon = iconFillCanvas.toDataURL('image/png')
  iconFillCanvasCtx.restore()

  return filledIcon
}

export function set(domain: string, url: string, hash: number, icon: string): void {
  const domainInfo = domainsInfo[domain]

  let index = hashes.indexOf(hash)
  const iconExists = index > -1

  // Check if I need to invalidate domain cache
  if (iconExists && domainInfo && domainInfo.src.length <= url.length) return

  // Icon not cached but domainInfo exists - favicon was changed
  if (!iconExists && domainInfo) index = domainInfo.index

  // Append favicon
  if (index === -1) index = Favicons.reactive.list.length

  // Update local state
  if (index > -1) {
    if (!domainInfo) {
      domainsInfo[domain] = { index, src: url }
    } else {
      domainInfo.index = index
      domainInfo.src = url
    }

    Favicons.reactive.domains[domain] = index
    Favicons.reactive.list[index] = icon
    hashes[index] = hash
  }
}

export function getFavicon(url: string): string {
  return Favicons.reactive.list[Favicons.reactive.domains[Utils.getDomainOf(url)]] || ''
}

export function getIcon(url: string): string {
  const state = Favicons.reactive
  return state.list[state.domains[Utils.getDomainOf(url)]] || Favicons.getFavPlaceholder(url)
}

export function getFavPlaceholder(url: string): string {
  if (url.startsWith('m')) {
    if (url.startsWith(GROUP_URL)) return '#icon_group'
    if (url.startsWith(URL_URL)) return '#icon_link_favicon'
    if (url.startsWith(SETUP_URL)) return '#icon_settings'
  }

  if (IMG_RE.test(url)) return '#icon_img'
  if (VID_RE.test(url)) return '#icon_vid'
  if (MUS_RE.test(url)) return '#icon_music'
  if (FILE_RE.test(url)) return '#icon_local_file'

  if (url.startsWith('a')) {
    if (url.startsWith('about:new')) return '#icon_ff'
    if (url.startsWith('about:bla')) return '#icon_ff'
    if (url.startsWith('about:pre')) return '#icon_pref'
    if (url.startsWith('about:con')) return '#icon_pref'
    if (url.startsWith('about:add')) return '#icon_addons'
    if (url.startsWith('about:per')) return '#icon_perf'
    if (url.startsWith('about:dev')) return '#icon_code'
    if (url.startsWith('about:proc')) return '#icon_perf'
    if (url.startsWith('about:prot')) return '#icon_dashboard'
  }

  return '#icon_ff'
}
