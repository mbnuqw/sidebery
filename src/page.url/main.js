import { DEFAULT_SETTINGS, CUSTOM_CSS_VARS } from '../defaults'
import { noiseBg } from '../noise-bg'
import Utils from '../utils'

void (async function() {
  // Load settings and set theme
  let { settings } = await browser.storage.local.get({ settings: DEFAULT_SETTINGS })
  let style = settings ? settings.style : 'dark'

  // Set style
  document.body.setAttribute('data-style', style)

  // Set background noise
  if (settings.bgNoise) {
    noiseBg(document.body, {
      width: 300,
      height: 300,
      gray: [12, 175],
      alpha: [0, 66],
      spread: [0, 9],
    })
    let scaleShift = ~~window.devicePixelRatio
    let sW = 300 >> scaleShift
    let sH = 300 >> scaleShift
    document.body.style.backgroundSize = `${sW}px ${sH}px`
  }

  // Set user styles
  let { cssVars } = await browser.storage.local.get({ cssVars: {} })
  for (let key in CUSTOM_CSS_VARS) {
    if (!CUSTOM_CSS_VARS.hasOwnProperty(key)) continue
    if (cssVars[key]) {
      document.body.style.setProperty(Utils.toCSSVarName(key), cssVars[key])
    }
  }

  // Setup link
  const hash = location.hash
  if (!hash) return
  const url = hash.slice(1)
  const linkEl = document.getElementById('url')
  linkEl.innerText = url
  linkEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(linkEl)
    selection.addRange(range)
  })
})()