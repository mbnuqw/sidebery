import { CUSTOM_STYLES } from '../sidebar/store/state'
import { noiseBg } from '../noise-bg'
import Utils from '../utils'

// Load settings and set theme
void (async function() {
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'

  // Set theme class
  document.body.classList.add('-' + theme)

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
  ans = await browser.storage.local.get('styles')
  let loadedStyles = ans.styles
  if (loadedStyles) {
    for (let key in CUSTOM_STYLES) {
      if (!CUSTOM_STYLES.hasOwnProperty(key)) continue
      if (loadedStyles[key]) {
        document.body.style.setProperty(Utils.toCSSVarName(key), loadedStyles[key])
      }
    }
  }
})()

// Translation
void (async function() {
  document.title = browser.i18n.getMessage('permissions.all_urls.title')
  const logoEl = document.getElementById('logo')
  if (logoEl) logoEl.innerText = browser.i18n.getMessage('permissions.all_urls.logo')
  const msgEl = document.getElementById('msg')
  if (msgEl) msgEl.innerText = browser.i18n.getMessage('permissions.all_urls.msg')
  const btnEl = document.getElementById('req_btn')
  if (btnEl) {
    const permName = btnEl.getAttribute('data-perm')
    btnEl.innerText = browser.i18n.getMessage(`permissions.${permName}.btn`)
  }
  const noteEl = document.getElementById('note')
  if (noteEl) noteEl.innerText = browser.i18n.getMessage('permissions.all_urls.note')
})()

// Permission requesting
void (async function() {
  const reqBtnEl = document.getElementById('req_btn')
  if (!reqBtnEl) return

  // Get permissions
  const origins = []
  const permissions = []
  let perm = reqBtnEl.getAttribute('data-perm')
  if (perm === 'all_urls') origins.push('<all_urls>')
  else if (perm) permissions.push(perm)

  reqBtnEl.addEventListener('click', () => {
    browser.permissions.request({ origins, permissions }).then(() => {
      browser.runtime.sendMessage({ action: 'loadPermissions' })
      browser.tabs.getCurrent().then(tab => browser.tabs.remove([tab.id]))
    })
  })
})()
