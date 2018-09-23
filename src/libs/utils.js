/*global browser:true*/
// prettier-ignore
const Alph = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_',
]

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
  ctx.func = (a) => {
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
  const bytes = encodeURI(str).split(/%..|./).length - 1
  return BytesToStr(bytes)
}

/**
 * Get all windows and check which current
 */
async function GetAllWindows() {
  return Promise.all([browser.windows.getCurrent(), browser.windows.getAll()])
    .then(([current, all]) => {
      return all.map(w => {
        if (w.id === current.id) w.current = true
        return w
      })
    })
}

export default {
  Uid,
  Asap,
  Debounce,
  Sleep,
  StrSize,
  BytesToStr,
  GetAllWindows,
}
