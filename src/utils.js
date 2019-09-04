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
const URL_RE = /^(https?:\/\/)/

/**
 *  Generate base64-like uid
 **/
export function uid() {
  // Get time and random parts
  let tp = Date.now()
  let rp1 = (Math.random() * 2147483648) | 0
  let rp2 = (Math.random() * 2147483648) | 0
  let chars = []

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

/**
 * Run function ASAP
 */
function asap(cb, delay) {
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
function debounce(cb, delay, instant, ctx = {}) {
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
async function sleep(ms = 1000) {
  return new Promise(wakeup => {
    setTimeout(wakeup, ms)
  })
}

/**
 * Bytes to readable string
 */
function bytesToStr(bytes) {
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
function strSize(str) {
  const bytes = new Blob([str]).size
  return bytesToStr(bytes)
}

/**
 * Get date string from unix seconds
 */
function uDate(ms, delimiter = '.') {
  if (!ms) return null
  const dt = new Date(ms)
  let dtday = dt.getDate()
  if (dtday < 10) dtday = '0' + dtday
  let dtmth = dt.getMonth() + 1
  if (dtmth < 10) dtmth = '0' + dtmth
  return `${dt.getFullYear()}${delimiter}${dtmth}${delimiter}${dtday}`
}

/**
 * Get time string from unix seconds
 */
function uTime(ms, delimiter = ':') {
  if (!ms) return null
  const dt = new Date(ms)
  let dtsec = dt.getSeconds()
  if (dtsec < 10) dtsec = '0' + dtsec
  let dtmin = dt.getMinutes()
  if (dtmin < 10) dtmin = '0' + dtmin
  let dthr = dt.getHours()
  if (dthr < 10) dthr = '0' + dthr
  return `${dthr}${delimiter}${dtmin}${delimiter}${dtsec}`
}

/**
 * Convert key to css variable --kebab-case
 */
function toCSSVarName(key) {
  return '--' + key.replace(UNDERSCORE_RE, '-')
}

/**
 * Parse numerical css value
 */
function parseCSSNum(cssValue, or = 0) {
  const parseResult = CSS_NUM_RE.exec(cssValue.trim())
  if (!parseResult) return [0, '']
  let num = parseResult[1]
  let unit = parseResult[2]

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
function commonSubStr(strings) {
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
async function getUrlFromDragEvent(event) {
  return new Promise(res => {
    if (!event.dataTransfer) return res()

    for (let item of event.dataTransfer.items) {
      if (item.kind !== 'string') continue
      const typeOk =
        item.type === 'text/x-moz-url-data' ||
        item.type === 'text/uri-list' ||
        item.type === 'text/x-moz-text-internal'

      if (!typeOk) continue

      item.getAsString(s => {
        if (URL_RE.test(s)) res(s)
        else res()
      })
    }
  })
}

/**
 * Try to get desciption string from drag event
 */
async function getDescFromDragEvent(event) {
  return new Promise(res => {
    if (!event.dataTransfer) return res()
    let typeOk

    for (let item of event.dataTransfer.items) {
      if (item.kind !== 'string') continue
      typeOk = item.type === 'text/x-moz-url-desc'

      if (typeOk) {
        item.getAsString(s => res(s))
        break
      }
    }

    if (typeOk) setTimeout(() => res(), 1000)
    else res()
  })
}

/**
 * Check if string is group url
 */
function isGroupUrl(url) {
  return url.startsWith('moz') && url.includes('/group.html')
}

/**
 * Get group id
 */
function getGroupId(url) {
  const idIndex = url.indexOf('/group.html') + 12
  return url.slice(idIndex)
}

function createGroupUrl(name) {
  const urlBase = browser.runtime.getURL('group/group.html')
  return urlBase + `#${encodeURI(name)}:id:${uid()}`
}

/**
 * Find successor tab
 */
function findSuccessorTab(state, tab, exclude) {
  let target
  let isNextTree = state.activateAfterClosingNextRule === 'tree'
  let rmFolded = state.rmChildTabs === 'folded'
  let rmChild = state.rmChildTabs === 'all'
  let isPrevTree = state.activateAfterClosingPrevRule === 'tree'
  let isPrevVisible = state.activateAfterClosingPrevRule === 'visible'

  if (state.removingTabs && !exclude) exclude = state.removingTabs

  // Next tab
  if (state.activateAfterClosing === 'next') {
    for (let i = tab.index + 1, next; i < state.tabs.length; i++) {
      next = state.tabs[i]

      // Next tab is the last of group and rule is TREE
      if (isNextTree && next.lvl < tab.lvl) break

      // Next tab is out of target panel
      if (next.cookieStoreId !== tab.cookieStoreId || next.pinned !== tab.pinned) break
    
      // Next tab excluded
      if (exclude && exclude.includes(next.id)) continue

      // Next invisible tab will be removed too
      if (rmFolded && next.invisible) continue

      // Next child tab will be removed too
      if (rmChild && next.lvl > tab.lvl) continue

      // OK: Next tab is in current panel
      if (next.cookieStoreId === tab.cookieStoreId) {
        target = next
        break
      }
    }

    if (!target) {
      for (let i = tab.index, prev; i--; ) {
        prev = state.tabs[i]

        // Prev tab is out of target panel
        if (prev.cookieStoreId !== tab.cookieStoreId || prev.pinned !== tab.pinned) break

        // Prev tab is excluded
        if (exclude && exclude.includes(prev.id)) continue

        // Prev tab is too far in tree structure
        if (isPrevTree && prev.lvl > tab.lvl) continue

        // Prev tab is invisible
        if (isPrevVisible && prev.invisible) continue

        // OK: Prev tab is in target panel
        if (prev.cookieStoreId === tab.cookieStoreId) {
          target = prev
          break
        }
      }
    }
  }

  // Previous tab
  if (state.activateAfterClosing === 'prev' || (state.actTabs == null && state.activateAfterClosing === 'prev_act')) {
    for (let i = tab.index, prev; i--; ) {
      prev = state.tabs[i]

      // Prev tab is out of target panel
      if (prev.cookieStoreId !== tab.cookieStoreId || prev.pinned !== tab.pinned) break

      // Prev tab is excluded
      if (exclude && exclude.includes(prev.id)) continue

      // Prev tab is too far in tree structure
      if (isPrevTree && prev.lvl > tab.lvl) continue

      // Prev tab is invisible
      if (isPrevVisible && prev.invisible) continue

      // OK: Prev tab is in target panel
      if (prev.cookieStoreId === tab.cookieStoreId) {
        target = prev
        break
      }
    }

    if (!target) {
      for (let i = tab.index + 1, next; i < state.tabs.length; i++) {
        next = state.tabs[i]

        // Next tab is the last of group and rule is TREE
        if (isNextTree && next.lvl < tab.lvl) break

        // Next tab is out of target panel
        if (next.cookieStoreId !== tab.cookieStoreId || next.pinned !== tab.pinned) break
      
        // Next tab excluded
        if (exclude && exclude.includes(next.id)) continue

        // Next invisible tab will be removed too
        if (rmFolded && next.invisible) continue

        // Next child tab will be removed too
        if (rmChild && next.lvl > tab.lvl) continue

        // OK: Next tab is in current panel
        if (next.cookieStoreId === tab.cookieStoreId) {
          target = next
          break
        }
      }
    }
  }

  // Previously active tab
  if (state.actTabs != null && state.activateAfterClosing === 'prev_act') {
    let targetId
    for (let i = state.actTabs.length; i--; ) {
      targetId = state.actTabs[i]

      // Tab excluded
      if (exclude && exclude.includes(targetId)) continue

      if (targetId !== tab.id && state.tabsMap[targetId]) {
        target = state.tabsMap[targetId]
        break
      }
    }
  }

  return target
}

/**
 * Clone Array
 */
function cloneArray(arr) {
  const out = []
  for (let item of arr) {
    if (Array.isArray(item)) {
      out.push(cloneArray(item))
    } else if (typeof item === 'object' && item !== null) {
      out.push(cloneObject(item))
    } else {
      out.push(item)
    }
  }
  return out
}

/**
 * Clone Object
 */
function cloneObject(obj) {
  const out = {}
  for (let prop of Object.keys(obj)) {
    if (Array.isArray(obj[prop])) {
      out[prop] = cloneArray(obj[prop])
    } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
      out[prop] = cloneObject(obj[prop])
    } else {
      out[prop] = obj[prop]
    }
  }
  return out
}

/**
 * Prepare url to be opened by sidebery
 */
function normalizeUrl(url) {
  if (
    url.startsWith('about:') ||
    url.startsWith('data:') ||
    url.startsWith('file:')
  ) {
    return browser.runtime.getURL('url/url.html') + '#' + url
  } else {
    return url
  }
}

export default {
  uid,
  asap,
  debounce,
  sleep,
  strSize,
  bytesToStr,
  uDate,
  uTime,
  toCSSVarName,
  parseCSSNum,
  commonSubStr,
  getUrlFromDragEvent,
  getDescFromDragEvent,
  isGroupUrl,
  getGroupId,
  createGroupUrl,
  findSuccessorTab,
  cloneArray,
  cloneObject,
  normalizeUrl,
}
