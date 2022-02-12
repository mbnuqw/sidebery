import { GroupConfig, AnyFunc, NavItem, NavBtn, NavSpace, Panel, PanelConfig } from './types'
import { TabsPanel, BookmarksPanel, PanelType, NavItemClass, HistoryPanel } from './types'
import { DownloadsPanel, TrashPanel, SubListTitleInfo } from './types'
import { DOMAIN_RE, URL_PAGE_RE, URL_URL } from './defaults'
import { translate } from './dict'

// prettier-ignore
const ALPH = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_',
]
const UNDERSCORE_RE = /_/g
const CSS_NUM_RE = /([\d.]+)(\w*)/
const URL_RE = /^https?:\/\/.+/
const PunycodeConf = {
  maxInt: 2147483647,
  base: 36,
  tMin: 1,
  baseMinusTMin: 35,
  tMax: 26,
  skew: 38,
  damp: 700,
  initialBias: 72,
  initialN: 128,
  delimiter: '-',
} as const

/**
 *  Generate base64-like uid
 **/
export function uid(): string {
  // Get time and random parts
  let tp = Date.now()
  let rp1 = (Math.random() * 2147483648) | 0
  let rp2 = (Math.random() * 2147483648) | 0
  const chars = []

  // Rand part
  for (let i = 0; i < 5; i++) {
    chars.push(ALPH[rp1 & 63])
    rp1 = rp1 >> 6
  }
  for (let i = 5; i < 7; i++) {
    chars.push(ALPH[rp2 & 63])
    rp2 = rp2 >> 6
  }

  // Time part
  for (let i = 7; i < 12; i++) {
    chars.push(ALPH[tp & 63])
    tp = tp >> 6
  }

  return chars.join('')
}

export interface FuncCtx {
  busy: boolean
  func: (arg: any) => void
}

/**
 * Run function ASAP
 */
function asap(cb: AnyFunc, delay: number): FuncCtx {
  const ctx: FuncCtx = {
    busy: false,
    func: (a: any) => {
      if (ctx.busy) return
      ctx.busy = true

      if (!delay && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          cb(a)
          ctx.busy = false
        })
      } else {
        setTimeout(() => {
          cb(a)
          ctx.busy = false
        }, delay || 66)
      }
    },
  }
  return ctx
}

function debounce<T extends (...a: any[]) => void>(cb: T, delay: number): T {
  const ctx = { timeout: -1 as number | null, cb: cb.bind(self) as T }
  return ((...a: Parameters<T>) => {
    if (ctx.timeout) clearTimeout(ctx.timeout)
    ctx.timeout = setTimeout(() => {
      ctx.timeout = null
      ctx.cb(...a)
    }, delay)
  }) as T
}

function wait(timeout: number | undefined, delay: number, cb: () => void): number {
  clearTimeout(timeout)
  return setTimeout(() => cb(), delay)
}

/**
 * Sleep
 */
export async function sleep(ms = 1000): Promise<void> {
  return new Promise(wakeup => {
    setTimeout(wakeup, ms)
  })
}

/**
 * Bytes to readable string
 */
function bytesToStr(bytes: number): string {
  if (bytes < 1000) return `${bytes} b`

  const kb = bytes / 1024
  if (kb < 10) return `${Math.round(kb * 100) / 100} kb`
  if (kb < 100) return `${Math.round(kb * 10) / 10} kb`
  if (kb < 1000) return `${Math.round(kb)} kb`

  const mb = bytes / 1048576
  if (mb < 10) return `${Math.round(mb * 100) / 100} mb`
  if (mb < 100) return `${Math.round(mb * 10) / 10} mb`
  if (mb < 1000) return `${Math.round(mb)} mb`

  const gb = bytes / 1073741824
  if (gb < 10) return `${Math.round(gb * 100) / 100} gb`
  if (gb < 100) return `${Math.round(gb * 10) / 10} gb`
  return `${Math.round(gb)} gb`
}

/**
 * Get byte len of string
 */
function strSize(str: string): string {
  const bytes = new Blob([str]).size
  return bytesToStr(bytes)
}

function uDate(ms: number, delimiter = '.', dayStartTime?: number): string {
  if (dayStartTime) {
    if (ms > dayStartTime) return translate('time.today')
    if (ms > dayStartTime - 86400000) return translate('time.yesterday')
  }

  const dt = new Date(ms)
  const dtday = `${dt.getDate()}`.padStart(2, '0')
  const dtmth = `${dt.getMonth() + 1}`.padStart(2, '0')
  return `${dt.getFullYear()}${delimiter}${dtmth}${delimiter}${dtday}`
}

/**
 * Get time string from unix seconds
 */
function uTime(ms: number, delimiter = ':', sec = true): string {
  const dt = new Date(ms)
  let time = `${dt.getHours()}`.padStart(2, '0')
  time += delimiter + `${dt.getMinutes()}`.padStart(2, '0')
  if (sec) time += delimiter + `${dt.getSeconds()}`.padStart(2, '0')

  return time
}

/**
 * Get domain of the url
 */
function getDomainOf(url: string): string {
  if (!url) return url
  return DOMAIN_RE.exec(url)?.[2] ?? url
}

/**
 * Generate HSL color from string
 */
function colorFromString(str: string, minLightness = 50): string {
  let c = 0
  let s = 0
  let l = 0
  for (let i = 2; i < str.length; i += 3) {
    c += str.charCodeAt(i - 2) + str.charCodeAt(i - 1) + str.charCodeAt(i)
    s += str.charCodeAt(i - 1)
    l += str.charCodeAt(i)
  }

  if (minLightness < 20) minLightness = 20
  else if (minLightness > 80) minLightness = 80

  return `hsl(${c % 361}deg, ${(s % 6) * 10 + 50}%, ${(l % 3) * 10 + minLightness}%)`
}

const RGBA_RE = /rgba?\((\d+%?)[,\s]\s*(\d+%?)[,\s]\s*(\d+%?)(,|\s\/\s)?\s*([\d.]+%?)?\)/
const HEXA_RE =
  /^#([0-f])([0-f])([0-f])([0-f])?$|^#([0-f][0-f])([0-f][0-f])([0-f][0-f])([0-f][0-f])?$/
const HSLA_RE = /hsla?\((\d+%?)[,\s]\s*(\d+%?)[,\s]\s*(\d+%?)[,\s]?\s*([\d.]+%?)?\)/
export function toRGBA(color?: string | null): [number, number, number, number] | undefined {
  if (!color) return

  const rgba = RGBA_RE.exec(color)
  if (rgba) {
    const r = rgba[1]
    let rn = parseInt(r)
    if (isNaN(rn)) return
    if (r.endsWith('%')) rn = Math.round((rn / 100) * 255)
    if (rn > 255) rn = 255

    const g = rgba[2]
    let gn = parseInt(g)
    if (isNaN(gn)) return
    if (g.endsWith('%')) gn = Math.round((rn / 100) * 255)
    if (gn > 255) gn = 255

    const b = rgba[3]
    let bn = parseInt(b)
    if (isNaN(bn)) return
    if (b.endsWith('%')) bn = Math.round((rn / 100) * 255)
    if (bn > 255) bn = 255

    const a = rgba[5]
    let an = 1
    if (a !== undefined) {
      an = parseFloat(a)
      if (a.endsWith('%')) an = an / 100
      if (isNaN(an)) an = 1
    }

    return [rn, gn, bn, an]
  }

  const hexa = HEXA_RE.exec(color)
  if (hexa) {
    const r = hexa[1]?.repeat(2) || hexa[5]
    const rn = parseInt(r, 16)
    if (isNaN(rn)) return

    const g = hexa[2]?.repeat(2) || hexa[6]
    const gn = parseInt(g, 16)
    if (isNaN(gn)) return

    const b = hexa[3]?.repeat(2) || hexa[7]
    const bn = parseInt(b, 16)
    if (isNaN(bn)) return

    const a = hexa[4]?.repeat(2) ?? hexa[8]
    let an = 1
    if (a !== undefined) {
      an = parseInt(a, 16) / 255
      if (isNaN(an)) an = 1
    }

    return [rn, gn, bn, an]
  }

  const hsla = HSLA_RE.exec(color)
  if (hsla) {
    const h = hsla[1]
    const hn = parseInt(h)
    if (isNaN(hn)) return

    const s = hsla[2]
    const sn = parseInt(s)
    if (isNaN(sn)) return

    const l = hsla[3]
    const ln = parseInt(l)
    if (isNaN(ln)) return

    const a = hsla[4]
    let an = 1
    if (a !== undefined) {
      an = parseFloat(a)
      if (a.endsWith('%')) an = an / 100
      if (isNaN(an)) an = 1
    }

    const rgb = HSLtoRGB(hn, sn, ln) as number[]
    rgb.push(an)

    return rgb as [number, number, number, number]
  }

  if (color === 'black') return [0, 0, 0, 1]
  if (color === 'white') return [255, 255, 255, 1]
  if (color === 'gray') return [128, 128, 128, 1]
  if (color === 'transparent') return [0, 0, 0, 0]
}

function hueToChan(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function HSLtoRGB(hue: number, sat: number, lit: number): [number, number, number] {
  let r, g, b

  hue = hue / 360
  sat = sat / 100
  lit = lit / 100

  if (sat === 0) {
    r = g = b = lit
  } else {
    const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat
    const p = 2 * lit - q
    r = hueToChan(p, q, hue + 1 / 3)
    g = hueToChan(p, q, hue)
    b = hueToChan(p, q, hue - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * Convert key to css variable --kebab-case
 */
export function toCSSVarName(key: string): string {
  return `--${key.replace(UNDERSCORE_RE, '-')}`
}

/**
 * Parse numerical css value
 */
function parseCSSNum(cssValue: string, or = 0): [number, string] {
  const parseResult = CSS_NUM_RE.exec(cssValue.trim())
  if (!parseResult) return [0, '']
  let num: number | string = parseResult[1]
  const unit = parseResult[2]

  if (num.includes('.')) {
    if (num[0] === '.') num = '0' + num
    num = parseFloat(num)
  } else {
    num = parseInt(num)
  }
  if (isNaN(num)) num = or
  return [num, unit]
}

/**
 * Find common substring
 */
function commonSubStr(strings: string[]): string {
  if (!strings || !strings.length) return ''
  if (strings.length === 1) return strings[0]
  const first = strings[0]
  const others = strings.slice(1)
  let start = 0
  let end = 1
  let out = ''
  let common = ''

  while (end <= first.length) {
    common = first.slice(start, end)

    const isCommon = others.every(s => {
      return s.toLowerCase().includes(common.toLowerCase())
    })

    if (isCommon) {
      if (common.length > out.length) out = common
      end++
    } else {
      end = ++start + 1
    }
  }

  return out
}

async function _getStringFromDragItem(item: DataTransferItem): Promise<string> {
  return new Promise(res => item.getAsString(s => res(s)))
}

interface DragEventParseResult {
  url?: string
  text?: string
  file?: File | null
}
async function parseDragEvent(event: DragEvent): Promise<DragEventParseResult | undefined> {
  return new Promise<DragEventParseResult | undefined>(async res => {
    if (!event.dataTransfer) return res(undefined)
    const result: DragEventParseResult = {}
    const types = event.dataTransfer.types

    let urlType
    if (types.includes('text/x-moz-url-data')) urlType = 'text/x-moz-url-data'
    else if (types.includes('text/x-moz-url')) urlType = 'text/x-moz-url'
    else if (types.includes('text/x-moz-text-internal')) urlType = 'text/x-moz-text-internal'

    let textType
    if (types.includes('text/x-moz-url-desc')) textType = 'text/x-moz-url-desc'
    else if (types.includes('text/plain')) textType = 'text/plain'

    for (const item of event.dataTransfer.items) {
      if (!result.url && item.type === urlType) {
        const value = await _getStringFromDragItem(item)
        if (value && urlType === 'text/x-moz-url') {
          const urlAndTitle = value.split('\n')
          result.url = urlAndTitle[0]
          result.text = urlAndTitle[1]
        } else {
          result.url = value
        }
      }
      if (!result.text && item.type === textType) result.text = await _getStringFromDragItem(item)
      if (!result.file && item.kind === 'file') result.file = item.getAsFile()
    }

    res(result)
  })
}

/**
 * Check if string is group url
 */
function isGroupUrl(url: string): boolean {
  return url.startsWith('m') && url.includes('/group.html')
}

function isUrlUrl(url: string): boolean {
  return url.startsWith('m') && url.includes('/url.html')
}

/**
 * Get group id
 */
function getGroupId(url: string): string {
  const idIndex = url.lastIndexOf('#') + 1
  return url.slice(idIndex)
}

function getGroupRawParams(url: string): string {
  const startIndex = url.indexOf('?')
  if (startIndex === -1) return ''
  const endIndex = url.lastIndexOf('#')
  return url.substring(startIndex, endIndex)
}

function createGroupUrl(name?: string, conf?: GroupConfig): string {
  let urlBase = browser.runtime.getURL('page.group/group.html')
  if (!name) name = uid()
  if (conf && conf.pin !== undefined) urlBase += '?pin=' + conf.pin
  return urlBase + `#${encodeURIComponent(name)}:id:${uid()}`
}

/**
 * Clone Array
 */
export function cloneArray<T>(arr: T[]): T[] {
  const out: T[] = []
  for (const item of arr) {
    if (Array.isArray(item)) {
      out.push(cloneArray<T>(item) as unknown as T)
    } else if (typeof item === 'object' && item !== null) {
      out.push(cloneObject(item))
    } else {
      out.push(item)
    }
  }
  return out
}

export type AnyObject = { [key: string]: any } // eslint-disable-line

/**
 * Clone Object
 */
export function cloneObject<T>(obj: T & AnyObject): T {
  const out: AnyObject = {}
  for (const prop of Object.keys(obj)) {
    if (Array.isArray(obj[prop])) {
      out[prop] = cloneArray(obj[prop] as any[])
    } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
      out[prop] = cloneObject<unknown>(obj[prop] as AnyObject)
    } else {
      out[prop] = obj[prop] as unknown
    }
  }
  return out as unknown as T
}

/**
 * Prepare url to be opened by sidebery
 */
function normalizeUrl(url?: string, title?: string): string | undefined {
  if (!url) return url
  if (url === 'about:newtab') return undefined
  if (
    url.startsWith('chrome:') ||
    url.startsWith('javascript:') ||
    url.startsWith('data:') ||
    url.startsWith('file:') ||
    url.startsWith('jar:file:') ||
    url.startsWith('about:')
  ) {
    if (title) return URL_URL + '#' + encodeURIComponent(JSON.stringify([url, title]))
    return URL_URL + '#' + url
  } else {
    return url
  }
}

/**
 * Convert url from Sidebery-safe to its original form
 */
function denormalizeUrl(url?: string): string | undefined {
  if (!url) return url
  // Workaround for containered tabs
  if (url.startsWith('about:blank#url')) return url.slice(15)
  // Unavailable URLs
  else if (url.startsWith('m') && URL_PAGE_RE.test(url)) {
    let data = url.slice(71)
    try {
      data = decodeURIComponent(data)
      const [url, _] = JSON.parse(data) as string[]
      return url
    } catch {
      return data
    }
  }
  // Ok
  else return url
}

function recreateNormalizedObject<T>(obj: T & AnyObject, defaults: T & AnyObject): T {
  const result = cloneObject(defaults) as AnyObject
  for (const key of Object.keys(defaults)) {
    if (obj[key] !== undefined) result[key] = obj[key] as unknown
  }
  return result as T
}

export function normalizeObject<T>(obj: T & AnyObject, defaults: T & AnyObject): void {
  const clonedDefaults = cloneObject(defaults)
  for (const key of Object.keys(clonedDefaults) as (keyof T)[]) {
    if (obj[key] === undefined) obj[key] = clonedDefaults[key]
  }
}

export function updateObject<T>(target: T & AnyObject, newValues: T & AnyObject): void {
  for (const key of Object.keys(target) as (keyof T)[]) {
    if (newValues[key] === undefined) continue
    target[key] = newValues[key]
  }
}

function findUrls(str: string): string[] {
  const urls = []
  const words = str.split(/\s|,/)
  for (const word of words) {
    if (URL_RE.test(word)) urls.push(word)
  }
  return urls
}

async function loadBinAsBase64(url: string): Promise<string | ArrayBuffer | null> {
  return new Promise(async res => {
    const deadline = setTimeout(() => res(null), 2000)

    let response
    try {
      response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'omit',
      })
      clearTimeout(deadline)
    } catch (err) {
      return res(null)
    }
    if (!response) return res(null)

    const blob = await response.blob()
    const reader = new FileReader()
    reader.onload = () => res(reader.result)
    reader.readAsDataURL(blob)
  })
}

/**
 *  Create canvas
 *
 * > width: number - canvas width
 * > height: number - canvas heihgt
 * < Element - canvas
 **/
function createCanvas(width: number, height: number): HTMLCanvasElement {
  // Canvas box
  const canvasBoxEl = document.createElement('div')
  canvasBoxEl.style.position = 'absolute'
  canvasBoxEl.style.overflow = 'hidden'
  canvasBoxEl.style.opacity = '0'
  canvasBoxEl.style.top = '0'
  canvasBoxEl.style.left = '0'
  canvasBoxEl.style.width = '1px'
  canvasBoxEl.style.height = '1px'
  document.body.appendChild(canvasBoxEl)

  // Canvas
  const canvasEl = document.createElement('canvas')
  canvasEl.width = width
  canvasEl.height = height
  canvasBoxEl.appendChild(canvasEl)

  return canvasEl
}

async function createImage(src: string, w: number, h: number): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image(w, h)
    img.onload = () => res(img)
    img.onerror = e => rej(e)
    img.src = src
  })
}

async function setImageSrc(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((res, rej) => {
    img.onload = () => res()
    img.onerror = e => rej(e)
    img.src = src
  })
}

function strHash(str: string): number {
  let hash = 0
  const len = str.length
  for (let chc, i = 0; i < len; i++) {
    chc = str.charCodeAt(i)
    hash = (hash << 5) - hash + chc
    hash |= 0
  }
  return hash
}

// Stolen from https://github.com/bestiejs/punycode.js/ (MIT License)
/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 * @private
 */
function adapt(delta: number, numPoints: number, firstTime: boolean) {
  let k = 0
  delta = firstTime ? Math.floor(delta / PunycodeConf.damp) : delta >> 1
  delta += Math.floor(delta / numPoints)
  for (; delta > (PunycodeConf.baseMinusTMin * PunycodeConf.tMax) >> 1; k += PunycodeConf.base) {
    delta = Math.floor(delta / PunycodeConf.baseMinusTMin)
  }
  return Math.floor(k + ((PunycodeConf.baseMinusTMin + 1) * delta) / (delta + PunycodeConf.skew))
}

// Stolen from https://github.com/bestiejs/punycode.js/ (MIT License)
/**
 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
 * symbols.
 */
function decodePunycode(input: string): string {
  const output = []
  const inputLength = input.length
  const base = PunycodeConf.base
  let i = 0
  let n = 128
  let bias = 72

  // Handle the basic code points: let `basic` be the number of input code
  // points before the last delimiter, or `0` if there is none, then copy
  // the first basic code points to the output.

  let basic = input.lastIndexOf('-')
  if (basic < 0) basic = 0

  for (let j = 0; j < basic; ++j) {
    // if it's not a basic code point
    if (input.charCodeAt(j) >= 0x80) return input
    output.push(input.charCodeAt(j))
  }

  // Main decoding loop: start just after the last delimiter if any basic code
  // points were copied; start at the beginning otherwise.

  for (let index = basic > 0 ? basic + 1 : 0; index < inputLength /* no final expression */; ) {
    // `index` is the index of the next character to be consumed.
    // Decode a generalized variable-length integer into `delta`,
    // which gets added to `i`. The overflow checking is easier
    // if we increase `i` as we go, then subtract off its starting
    // value at the end to obtain `delta`.
    const oldi = i
    for (let w = 1, k = base /* no condition */; ; k += base) {
      if (index >= inputLength) return input

      let digit: number
      const codePoint = input.charCodeAt(index++)
      if (codePoint - 0x30 < 0x0a) digit = codePoint - 0x16
      else if (codePoint - 0x41 < 0x1a) digit = codePoint - 0x41
      else if (codePoint - 0x61 < 0x1a) digit = codePoint - 0x61
      else digit = base

      if (digit >= base || digit > Math.floor((PunycodeConf.maxInt - i) / w)) return input

      i += digit * w
      let t: number
      if (k <= bias) t = PunycodeConf.tMin
      else if (k >= bias + PunycodeConf.tMax) t = PunycodeConf.tMax
      else t = k - bias

      if (digit < t) {
        break
      }

      const baseMinusT = base - t
      if (w > Math.floor(PunycodeConf.maxInt / baseMinusT)) return input

      w *= baseMinusT
    }

    const out = output.length + 1
    bias = adapt(i - oldi, out, oldi == 0)

    // `i` was supposed to wrap around from `out` to `0`,
    // incrementing `n` each time, so we'll fix that now:
    if (Math.floor(i / out) > PunycodeConf.maxInt - n) return input

    n += Math.floor(i / out)
    i %= out

    // Insert `n` at position `i` of the output.
    output.splice(i++, 0, n)
  }

  return String.fromCodePoint(...output)
}

// Stolen from https://github.com/bestiejs/punycode.js/ (MIT License)
function decodeUrlPunycode(url: string): string {
  if (!url.startsWith('xn--')) return url

  const labels = url.split('.')
  const result = labels.map(l => decodePunycode(l.slice(4).toLowerCase())).join('.')
  return result
}

function getDayStartMS(): number {
  const now = new Date()
  now.setMilliseconds(0)
  now.setSeconds(0)
  now.setMinutes(0)
  now.setHours(0)
  return now.getTime()
}

function getTimeHHMM(t: number): string {
  const dt = new Date(t)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

/**
 * Remove first found value from array
 */
function rmFromArray<T>(arr: T[], val: T): number {
  const index = arr.indexOf(val)
  if (index > -1) arr.splice(index, 1)
  return index
}

function isRegExp(value: unknown): value is RegExp {
  return !!(value as RegExp).test
}

interface RetryConfig {
  action: (again: () => void) => Promise<void>
  interval: number
  count: number
  increment?: number
}

async function retry(conf: RetryConfig): Promise<void> {
  return new Promise(async res => {
    const increment = conf.increment ?? 0
    let count = conf.count
    let interval = conf.interval

    while (count--) {
      let result = false
      await conf.action(() => (result = true))

      if (!result || count <= 0) break

      await sleep(interval)
      interval += increment
    }

    res()
  })
}

/**
 * Search back then forth
 */
function findNear<T>(list: T[], index: number, cb: (v: T) => boolean): T | undefined {
  const len = list.length
  let result: T | undefined
  let i = index
  let v: T | undefined

  while (i-- > 0) {
    v = list[i]
    if (v !== undefined && cb(v)) {
      result = v
      break
    }
  }

  if (!result) {
    i = index
    while (++i < len) {
      v = list[i]
      if (v !== undefined && cb(v)) {
        result = v
        break
      }
    }
  }

  return result
}

function normalizeColor(color?: string): browser.ColorName {
  if (color === 'blue') return 'blue'
  if (color === 'turquoise') return 'turquoise'
  if (color === 'green') return 'green'
  if (color === 'yellow') return 'yellow'
  if (color === 'orange') return 'orange'
  if (color === 'red') return 'red'
  if (color === 'pink') return 'pink'
  if (color === 'purple') return 'purple'
  return 'toolbar'
}

function getShortTimestamp(ms: number, currentDate: Date): string {
  const dt = new Date(ms)

  const y = dt.getFullYear()
  const cy = currentDate.getFullYear()
  if (y !== cy) return y.toString()

  const m = (dt.getMonth() + 1).toString().padStart(2, '0')
  const d = dt.getDate().toString().padStart(2, '0')
  const md = `${m}/${d}`
  const cm = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const cd = currentDate.getDate().toString().padStart(2, '0')
  const cmd = `${cm}/${cd}`
  if (md !== cmd) return md

  const min: string = dt.getMinutes().toString().padStart(2, '0')
  const hr: string = dt.getHours().toString().padStart(2, '0')
  return `${hr}:${min}`
}

export function isNavBtn(item?: NavItem): item is NavBtn {
  if (!item) return false
  return (item as NavBtn).class === NavItemClass.btn
}
export function isNavSpace(item?: NavItem): item is NavSpace {
  if (!item) return false
  return (item as NavSpace).class === NavItemClass.space
}
export function isNavPanel(item?: NavItem): item is Panel {
  if (!item) return false
  return (item as Panel).class === NavItemClass.panel
}
export function isTabsPanel(panel?: PanelConfig): panel is TabsPanel {
  if (!panel) return false
  return panel.type === PanelType.tabs
}
export function isBookmarksPanel(panel?: PanelConfig): panel is BookmarksPanel {
  if (!panel) return false
  return panel.type === PanelType.bookmarks
}
export function isHistoryPanel(panel?: PanelConfig): panel is HistoryPanel {
  if (!panel) return false
  return panel.type === PanelType.history
}
export function isDownloadsPanel(panel?: PanelConfig): panel is DownloadsPanel {
  if (!panel) return false
  return panel.type === PanelType.downloads
}
export function isTrashPanel(panel?: PanelConfig): panel is TrashPanel {
  if (!panel) return false
  return panel.type === PanelType.trash
}
export function isSubListTitle(something: any): something is SubListTitleInfo {
  if (!something) return false
  if ((something as Record<string, any>).isSubListTitle) return true
  return false
}

const Utils = {
  uid,
  asap,
  debounce,
  wait,
  sleep,
  strSize,
  bytesToStr,
  uDate,
  uTime,
  getDomainOf,
  colorFromString,
  toRGBA,
  toCSSVarName,
  parseCSSNum,
  commonSubStr,
  parseDragEvent,
  isGroupUrl,
  isUrlUrl,
  getGroupId,
  getGroupRawParams,
  createGroupUrl,
  cloneArray,
  cloneObject,
  normalizeUrl,
  denormalizeUrl,
  recreateNormalizedObject,
  normalizeObject,
  updateObject,
  findUrls,
  loadBinAsBase64,
  createCanvas,
  createImage,
  setImageSrc,
  strHash,
  decodeUrlPunycode,
  getDayStartMS,
  getTimeHHMM,
  rmFromArray,
  isRegExp,
  retry,
  findNear,
  normalizeColor,
  getShortTimestamp,
  isNavBtn,
  isNavSpace,
  isNavPanel,
  isTabsPanel,
  isBookmarksPanel,
  isHistoryPanel,
  isDownloadsPanel,
  isTrashPanel,
  isSubListTitle,
}
export default Utils
