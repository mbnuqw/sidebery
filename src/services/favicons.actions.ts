import Utils from 'src/utils'
import { Stored, FavDomain, InstanceType } from 'src/types'
import { Favicons } from 'src/services/favicons'
import { Msg } from 'src/services/msg'
import { Store } from 'src/services/storage'
import { Tabs } from 'src/services/tabs.fg'
import { Info } from 'src/services/info'
import { FILE_RE, GROUP_RE, IMG_RE, MUS_RE, SETTINGS_RE, URL_PAGE_RE, VID_RE } from 'src/defaults'
import { Logs } from './logs'

const SAVE_DELAY = 2000
const THRESHOLD_BYTES_DIFF = 150 * window.devicePixelRatio
const SIZE = Math.trunc(16 * window.devicePixelRatio)

let favRescaleCanvas: HTMLCanvasElement | undefined
let favPrescaleCanvas: HTMLCanvasElement | undefined
let favRescaleCanvasCtx: CanvasRenderingContext2D | null = null
let favPrescaleCanvasCtx: CanvasRenderingContext2D | null = null
let favRescaleImg: HTMLImageElement | undefined
let hashes: number[] = []
let domainsInfo: Record<string, FavDomain> = {}

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
    const iconExists = index > -1

    // Check if everything are the same - no need to update
    if (iconExists && domainInfo && domainInfo.src.length <= url.length) return

    // Icon not cached but domainInfo exists - favicon was changed
    if (!iconExists && domainInfo) index = domainInfo.index

    // Append favicon
    if (index === -1) index = Favicons.reactive.list.length

    // Resize and set icon
    if (!iconExists) {
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
    if (!iconExists) toSave.favicons = Favicons.reactive.list
    Store.set(toSave)

    Msg.call(InstanceType.sidebar, 'setFavicon', domain, url, hash, icon)
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
    const sw = favRescaleImg.naturalWidth
    const sh = favRescaleImg.naturalHeight
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
    if (GROUP_RE.test(url)) return '#icon_group'
    if (URL_PAGE_RE.test(url)) return '#icon_link_favicon'
    if (SETTINGS_RE.test(url)) return '#icon_settings'
  }

  if (IMG_RE.test(url)) return '#icon_img'
  if (VID_RE.test(url)) return '#icon_vid'
  if (MUS_RE.test(url)) return '#icon_music'
  if (FILE_RE.test(url)) return '#icon_local_file'

  if (url.startsWith('a')) {
    if (url.startsWith('about:preferences')) return '#icon_pref'
    if (url.startsWith('about:addons')) return '#icon_addons'
    if (url.startsWith('about:performance')) return '#icon_perf'
  }

  return '#icon_ff'
}
