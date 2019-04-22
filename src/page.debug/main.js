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

  // Wait for the info
  const win = await browser.windows.getCurrent()
  const info = await browser.runtime.sendMessage({
    action: 'getDbgInfo',
    windowId: win.id,
  })

  if (!info) return

  const settingsEl = document.getElementById('settings')
  const panelsEl = document.getElementById('panels')
  const tabsEl = document.getElementById('tabs')

  settingsEl.innerText = JSON.stringify(info.settings, null, '   ')
  panelsEl.innerText = JSON.stringify(info.panels, null, '   ')
  tabsEl.innerText = JSON.stringify(info.tabs, null, '   ')

  settingsEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(settingsEl)
    selection.addRange(range)
  })

  panelsEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(panelsEl)
    selection.addRange(range)
  })

  tabsEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(tabsEl)
    selection.addRange(range)
  })
})()
