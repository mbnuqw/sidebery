import { DataUriImage, Reactivator } from 'src/types'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import * as Tabs from 'src/services/tabs.fg'
import { SIZE, loadFaviconsData } from './favicons'
import { getFavPlaceholder } from './favicons'
import * as Info from 'src/services/info'

export * from './favicons'

export interface FaviconsReactiveState {
  byDomains: Record<string, string>
}

export let ready = false
export let reactive: FaviconsReactiveState = {
  byDomains: {},
}

export function reactivate(r: Reactivator<FaviconsReactiveState>) {
  reactive = r(reactive)
}

export async function load(): Promise<void> {
  let favData
  try {
    favData = await loadFaviconsData()
  } catch (err) {
    return Logs.err('loadFavicons: Cannot get favicons', err)
  }

  const byDomains: Record<string, string> = {}
  for (const domain of Object.keys(favData.favDomains)) {
    const domainInfo = favData.favDomains[domain]

    if (domainInfo.index === undefined) continue

    const favicon = favData.favicons[domainInfo.index]
    if (!favicon) continue

    byDomains[domain] = favicon
  }

  reactive.byDomains = byDomains

  if (Info.isSidebar) {
    for (const tab of Tabs.list) {
      if (tab?.internal) continue
      if (tab?.favIconUrl) continue
      const domain = Utils.getDomainOf(tab.url)
      const favicon = reactive.byDomains[domain]
      if (favicon) {
        tab.favIconUrl = favicon
        Tabs.renderFavicon(tab)
      }
    }
  }

  ready = true
  waitingForFavicons.forEach(cb => cb())
  waitingForFavicons = []
}

let waitingForFavicons: (() => void)[] = []
export async function waitForFaviconsReady(): Promise<void> {
  if (ready) return

  return new Promise(ok => {
    waitingForFavicons.push(ok)
  })
}

export function set(domain: string, icon: string): void {
  reactive.byDomains[domain] = icon
}

export function getFavicon(url: string): string {
  return reactive.byDomains[Utils.getDomainOf(url)] || ''
}

export function getIcon(url: string): string {
  return reactive.byDomains[Utils.getDomainOf(url)] || getFavPlaceholder(url)
}

// ---

let iconFillCanvas: HTMLCanvasElement | undefined
let iconFillCanvasCtx: CanvasRenderingContext2D | null = null
let iconFillImg: HTMLImageElement | undefined

export async function fillIcon(img: DataUriImage, color: string): Promise<string> {
  const ds = SIZE * 2

  if (!iconFillCanvas || !iconFillCanvasCtx) {
    iconFillCanvas = Utils.createCanvas(ds, ds)
    iconFillCanvasCtx = iconFillCanvas.getContext('2d')
    if (iconFillCanvasCtx) iconFillCanvasCtx.save()
    else return img
  }

  if (!iconFillImg) iconFillImg = new Image()

  iconFillCanvasCtx.clearRect(0, 0, ds, ds)

  try {
    await Utils.setImageSrc(iconFillImg, img)
  } catch {
    return img
  }

  try {
    let sw = iconFillImg.naturalWidth
    let sh = iconFillImg.naturalHeight
    const imgIsSVG = Utils.isSvg(img)
    if (imgIsSVG && (sw === 0 || sh === 0)) {
      const base64svgWithSize = Utils.setSvgImageSize(img, ds, ds)
      if (!base64svgWithSize) return img
      await Utils.setImageSrc(iconFillImg, base64svgWithSize)
      sw = iconFillImg.naturalWidth
      sh = iconFillImg.naturalHeight
    }
    iconFillCanvasCtx.fillStyle = color
    iconFillCanvasCtx.fillRect(0, 0, ds, ds)
    iconFillCanvasCtx.globalCompositeOperation = 'destination-in'
    iconFillCanvasCtx.drawImage(iconFillImg, 0, 0, sw, sh, 0, 0, ds, ds)
    iconFillCanvasCtx.globalCompositeOperation = 'source-over'
  } catch (err) {
    return img
  }

  const filledBase64Icon = iconFillCanvas.toDataURL('image/png')
  iconFillCanvasCtx.restore()

  return filledBase64Icon
}
