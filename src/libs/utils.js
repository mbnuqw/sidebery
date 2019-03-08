import { Translate, PlurTrans } from '../mixins/dict'

/*global browser:true*/
// prettier-ignore
const Alph = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_',
]
const UNDERSCORE_RE = /_/g
const CSS_NUM_RE = /([\d.]+)(\w*)/
const URL_RE =  /^(https?:\/\/)/

/**
 *  Generate base64-like uid
 **/
export function Uid() {
  // Get time and random parts
  let tp = Date.now()
  let rp1 = (Math.random() * 2147483648) | 0
  let rp2 = (Math.random() * 2147483648) | 0
  let chars = []

  // Rand part
  for (let i = 0; i < 5; i++) {
    chars.push(Alph[rp1 & 63])
    rp1 = rp1 >> 6
  }
  for (let i = 5; i < 7; i++) {
    chars.push(Alph[rp2 & 63])
    rp2 = rp2 >> 6
  }

  // Time part
  for (let i = 7; i < 12; i++) {
    chars.push(Alph[tp & 63])
    tp = tp >> 6
  }

  return chars.join('')
}

/**
 * Run function ASAP
 */
function Asap(cb, delay) {
  const ctx = { busy: false }
  ctx.func = a => {
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
  }
  return ctx
}

/**
 * Debounce function call
 */
function Debounce(cb, delay, instant) {
  const ctx = {}
  ctx.func = val => {
    if (ctx.busy) clearTimeout(ctx.busy)
    else if (instant) {
      if (instant.call) instant(val)
      else cb(val)
    }
    ctx.busy = setTimeout(() => {
      ctx.busy = null
      cb(val)
    }, delay)
  }
  return ctx
}

/**
 * Sleep
 */
async function Sleep(ms = 1000) {
  return new Promise(wakeup => {
    setTimeout(wakeup, ms)
  })
}

/**
 * Bytes to readable string
 */
function BytesToStr(bytes) {
  if (bytes <= 1024) return bytes + ' b'
  let kb = Math.trunc(bytes / 102.4) / 10
  if (kb <= 1024) return kb + ' kb'
  let mb = Math.trunc(bytes / 104857.6) / 10
  if (mb <= 1024) return mb + ' mb'
  let gb = Math.trunc(bytes / 107374182.4) / 10
  return gb + ' gb'
}

/**
 * Get byte len of string
 */
function StrSize(str) {
  const bytes = new Blob([str]).size
  return BytesToStr(bytes)
}

/**
 * Get panel index of tab
 */
function GetPanelIndex(panels, tabId) {
  let panelIndex = panels.findIndex(p => {
    if (p.tabs && p.tabs.length) {
      if (tabId === undefined) return !!p.tabs.find(t => t.active)
      return !!p.tabs.find(t => t.id === tabId)
    }
  })
  return panelIndex
}

/**
 * Get panel by tab obj.
 */
function GetPanelOf(panels, tab) {
  if (tab.pinned) return panels[1]
  for (let i = 1; i < panels.length; i++) {
    if (panels[i].cookieStoreId === tab.cookieStoreId) return panels[i]
  }
  return null
}

/**
 * Get date string from unix seconds
 */
function UDate(sec) {
  if (!sec) return null
  const dt = new Date(sec * 1000)
  let dtday = dt.getDate()
  if (dtday < 10) dtday = '0' + dtday
  let dtmth = dt.getMonth() + 1
  if (dtmth < 10) dtmth = '0' + dtmth
  return `${dt.getFullYear()}.${dtmth}.${dtday}`
}

/**
 * Get time string from unix seconds
 */
function UTime(sec) {
  if (!sec) return null
  const dt = new Date(sec * 1000)
  let dtsec = dt.getSeconds()
  if (dtsec < 10) dtsec = '0' + dtsec
  let dtmin = dt.getMinutes()
  if (dtmin < 10) dtmin = '0' + dtmin
  let dthr = dt.getHours()
  if (dthr < 10) dthr = '0' + dthr
  return `${dthr}:${dtmin}:${dtsec}`
}

/**
 * Get elapsed time string from unix seconds
 */
function UElapsed(sec = 0, nowSec = 0) {
  const now = nowSec || ~~(Date.now() / 1000)
  let elapsed = now - sec
  if (elapsed < 60) return Translate('elapsed.now')
  elapsed = ~~(elapsed / 60)
  // Less then an hour
  if (elapsed < 60) return `${elapsed} ${Translate('elapsed.min')}`
  elapsed = ~~(elapsed / 60)
  // Less then a day
  if (elapsed < 24) return `${elapsed} ${Translate('elapsed.hr')}`
  elapsed = ~~(elapsed / 24)
  // Less then a week
  if (elapsed < 7) return `${elapsed} ${PlurTrans('elapsed.day', elapsed)}`
  let weeks = ~~(elapsed / 7)
  // Less then a longest month
  if (elapsed < 31) return `${weeks} ${PlurTrans('elapsed.week', weeks)}`
  elapsed = ~~(elapsed / 30.44)
  // Less then a year
  if (elapsed < 12) return `${elapsed} ${PlurTrans('elapsed.month', elapsed)}`
  // Years
  elapsed = ~~(elapsed / 12)
  return `${elapsed} ${PlurTrans('elapsed.year', elapsed)}`
}

/**
 * Convert key to css variable --kebab-case
 */
function CSSVar(key) {
  return '--' + key.replace(UNDERSCORE_RE, '-')
}

/**
 * Calculate tree levels of tabs
 */
function CalcTabsTreeLevels(tabs) {
  // console.log('[DEBUG] UTILS CalcTabsTreeLevels');
  let lvl = 0
  let parents = {}
  let path = []
  for (let i = 0; i < tabs.length; i++) {
    let pt = tabs[i - 1]
    let t = tabs[i]

    // Normalize parents props
    t.isParent = !!t.isParent
    t.folded = !!t.folded

    // Tabs without parents
    if (t.parentId < 0) {
      lvl = 0
      path = []
    }

    // Reset circular reference
    if (t.parentId === t.id) t.parentId = lvl ? path[lvl - 1] : -1

    // With parent
    if (t.parentId >= 0) {
      // Set parent id
      parents[t.parentId] = true

      // First child
      // tab
      //   tab <
      if (pt && pt.id === t.parentId) {
        path[lvl] = t.parentId
        pt.isParent = true
        pt.folded = pt.folded || !!t.invisible
        lvl++
      }

      // After the last child
      //   tab
      // tab <
      if (pt && pt.id !== t.parentId && pt.parentId !== t.parentId) {
        lvl = path.indexOf(t.parentId) + 1
      }
    }

    // Set tab lvl
    t.lvl = lvl
  }

  // Reset parents without children
  for (let t of tabs) {
    t.isParent = !!parents[t.id]
    if (!t.isParent) t.folded = false
  }

  return tabs
}

/**
 * Parse numerical css value
 */
function ParseCSSNum(cssValue, or = 0) {
  let [, num, unit] = CSS_NUM_RE.exec(cssValue.trim())
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
function CommonSubStr(strings) {
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

/**
 * Try to find url in dragged items and return first valid
 */
async function GetUrlFromDragEvent(event) {
  return new Promise(res => {
    if (!event.dataTransfer) return res()

    for (let item of event.dataTransfer.items) {
      if (item.kind !== 'string') continue

      item.getAsString(s => {
        if (URL_RE.test(s)) res(s)
      })
    }
  })
}

export default {
  Uid,
  Asap,
  Debounce,
  Sleep,
  StrSize,
  BytesToStr,
  GetPanelIndex,
  GetPanelOf,
  UDate,
  UTime,
  UElapsed,
  CSSVar,
  CalcTabsTreeLevels,
  ParseCSSNum,
  CommonSubStr,
  GetUrlFromDragEvent,
}
