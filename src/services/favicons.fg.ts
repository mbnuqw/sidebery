import { Stored } from 'src/types'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import { Tabs } from './tabs.fg'
import { SIZE, loadFaviconsData } from './favicons'
import { getFavPlaceholder } from './favicons'
import { Info } from './info'

export * from './favicons'

export interface FaviconsReactiveState {
  byDomains: Record<string, string>
}

export let ready = false
export let reactive: FaviconsReactiveState = {
  byDomains: {},
}

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initFavicons(react: (rObj: object) => object) {
  reactFn = react as <T extends object>(rObj: T) => T
  reactive = reactFn(reactive)
}

export async function loadFavicons(): Promise<void> {
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
      if (favicon) tab.reactive.favIconUrl = tab.favIconUrl = favicon
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
