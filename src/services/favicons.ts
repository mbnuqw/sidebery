import { Stored } from 'src/types'
import { FILE_RE, GROUP_URL, IMG_RE, MUS_RE, SETUP_URL, URL_URL, VID_RE } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

export const MAX_COUNT_LIMIT = 2000
export const SHARD_SIZE = 400

export async function loadFaviconsData() {
  const keys: (keyof Stored)[] = [
    // *** rc4>>rc5
    'favicons',
    // rc4>>rc5 ***
    'favicons_01',
    'favicons_02',
    'favicons_03',
    'favicons_04',
    'favicons_05',
    'favHashes',
    'favDomains',
  ]
  const storage = await browser.storage.local.get<Stored>(keys)
  let fullList: string[] | undefined
  const RC4toRC5 = !!storage.favicons
  if (storage.favicons_01?.length) {
    fullList = storage.favicons_01
    if (storage.favicons_02?.length) fullList.push(...storage.favicons_02)
    if (storage.favicons_03?.length) fullList.push(...storage.favicons_03)
    if (storage.favicons_04?.length) fullList.push(...storage.favicons_04)
    if (storage.favicons_05?.length) fullList.push(...storage.favicons_05)
  } else if (storage.favicons?.length) {
    fullList = storage.favicons
  }
  if (!fullList?.length || !storage.favHashes?.length || !storage.favDomains) {
    fullList = []
    storage.favHashes = []
    storage.favDomains = {}
  }

  if (fullList.length > MAX_COUNT_LIMIT) {
    fullList = fullList.slice(0, MAX_COUNT_LIMIT)
  }

  return {
    favicons: fullList,
    favHashes: storage.favHashes,
    favDomains: storage.favDomains,
    RC4toRC5,
  }
}

export const SIZE = Math.trunc(16 * window.devicePixelRatio)
const THRESHOLD_BYTES_DIFF = 150 * window.devicePixelRatio

let favRescaleCanvas: HTMLCanvasElement | undefined
let favPrescaleCanvas: HTMLCanvasElement | undefined
let favRescaleCanvasCtx: CanvasRenderingContext2D | null = null
let favPrescaleCanvasCtx: CanvasRenderingContext2D | null = null
let favRescaleImg: HTMLImageElement | undefined

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
    if (url.startsWith('about:debug')) return '#icon_dev'
  }

  return '#icon_ff'
}
