import EventBus from '../event-bus'
import { noiseBg } from '../noise-bg'

/**
 * Load predefined theme and apply it
 */
function initTheme() {
  let themeLinkEl = document.getElementById('theme_link')

  // Remove theme css
  if (this.state.theme === 'none') {
    if (themeLinkEl) themeLinkEl.setAttribute('disabled', 'disabled')
    return
  } else {
    if (themeLinkEl) themeLinkEl.removeAttribute('disabled')
  }

  if (!themeLinkEl) {
    themeLinkEl = document.createElement('link')
    themeLinkEl.id = 'theme_link'
    themeLinkEl.type = 'text/css'
    themeLinkEl.rel = 'stylesheet'
    document.head.appendChild(themeLinkEl)
  }

  themeLinkEl.href = `../themes/${this.state.theme}/${this.state.instanceType}.css`
  setTimeout(() => EventBus.$emit('dynVarChange'), 120)
}

/**
 * Load custom css and apply it
 */
async function loadCustomCSS() {
  const fieldName = this.state.instanceType + 'CSS'
  let ans = await browser.storage.local.get(fieldName)
  if (!ans || !ans[fieldName]) return

  this.actions.applyCustomCSS(ans[fieldName])
}

/**
 * Update custom css
 */
function applyCustomCSS(css) {
  // Find or create new style element
  let customStyleEl = document.getElementById('custom_css')
  if (!customStyleEl) {
    customStyleEl = document.createElement('style')
    customStyleEl.id = 'custom_css'
    customStyleEl.type = 'text/css'
    customStyleEl.rel = 'stylesheet'
    document.head.appendChild(customStyleEl)
  } else {
    while (customStyleEl.lastChild) {
      customStyleEl.removeChild(customStyleEl.lastChild)
    }
  }

  // Apply css
  if (css) {
    customStyleEl.appendChild(document.createTextNode(css))
  }
}

/**
 * Render noise-bg image and set css vars (--bg-img, --bg-size)
 */
function applyNoiseBg() {
  if (this.state.style === 'auto') return

  let conf = {
    width: 300,
    height: 300,
    gray: [18, 175],
    alpha: [0, 66],
    spread: [0, 9],
  }

  let el = document.getElementById('root')
  let scaleShift = ~~window.devicePixelRatio
  let sW = conf.width >> scaleShift
  let sH = conf.height >> scaleShift

  el.style.setProperty('--bg-size', `${sW}px ${sH}px`)
  noiseBg(el, {
    width: conf.width,
    height: conf.height,
    gray: conf.gray || [0, 255],
    alpha: conf.alpha || [1, 32],
    spread: conf.spread || [1, 8],
  })
}

/**
 * Remove noise bg css vars
 */
function removeNoiseBg() {
  if (this.state.style === 'auto') return

  let el = document.getElementById('root')
  el.style.removeProperty('--bg-img')
  el.style.removeProperty('--bg-size')
}

export default {
  initTheme,

  loadCustomCSS,
  applyCustomCSS,
  applyNoiseBg,
  removeNoiseBg,
}
