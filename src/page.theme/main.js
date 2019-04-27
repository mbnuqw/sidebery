import { CUSTOM_STYLES } from '../sidebar/store.state'
import { NoiseBg } from '../libs/noise-bg'
import Utils from '../libs/utils'

void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'

  // Set theme class
  document.body.classList.add('-' + theme)

  // Set background noise
  if (settings.bgNoise) {
    NoiseBg(document.body, {
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
  ans = await browser.storage.local.get('styles')
  let loadedStyles = ans.styles
  if (loadedStyles) {
    for (let key in CUSTOM_STYLES) {
      if (!CUSTOM_STYLES.hasOwnProperty(key)) continue
      if (loadedStyles[key]) {
        document.body.style.setProperty(Utils.CSSVar(key), loadedStyles[key])
      }
    }
  }

  // Get selectors
  // const currentWindow = await browser.windows.getCurrent()
  // const selectors = await browser.runtime.sendMessage({
  //   instanceType: 'sidebar',
  //   windowId: currentWindow.id,
  //   action: 'getCssSelectors',
  // })

  // Render selectors
  // const boxEl = document.getElementById('selectors')
  // for (let sel of selectors) {
  //   appendSelector(boxEl, sel)
  // }
})()

/**
 * Create selector element and append it to provided element
 */
function appendSelector(el, sel) {
  const selEl = document.createElement('div')
  selEl.classList.add('selector')
  selEl.setAttribute('lvl', sel.lvl)

  let tag = sel.tag ? sel.tag : ''
  if (tag === 'div') tag = ''
  let id = sel.id ? '#' + sel.id : ''
  let classList = sel.classList ? '.' + sel.classList.join('.') : ''
  selEl.innerText = tag + id + classList

  if (classList[1] && classList[1] === classList[1].toUpperCase()) {
    selEl.setAttribute('is-component', 'true')
  }

  el.appendChild(selEl)
}