import { DEFAULT_SETTINGS, CUSTOM_CSS_VARS } from '../../addon/defaults'

void (async function() {
  let linkEl = document.getElementById('url')
  let copyBtnEl = document.getElementById('copy_btn')

  // Update labels
  let pageTitle = browser.i18n.getMessage('unhandled_url')
  if (pageTitle) document.title = pageTitle

  let copyBtnLabel = browser.i18n.getMessage('copy')
  if (copyBtnLabel) copyBtnEl.innerText = copyBtnLabel

  // Load settings and set theme
  let { settings } = await browser.storage.local.get({ settings: DEFAULT_SETTINGS })
  let style = settings ? settings.style : 'dark'

  initTheme(settings.theme)

  // Set style
  document.body.setAttribute('data-style', style)

  // Set background noise
  if (settings.bgNoise) {
    let scaleShift = ~~window.devicePixelRatio
    let sW = 300 >> scaleShift
    let sH = 300 >> scaleShift
    document.body.style.setProperty('--bg-size', `${sW}px ${sH}px`)
    document.body.style.setProperty('--bg-img', 'url("/assets/bg/noise-300x300.png")')
  }

  // Set user styles
  let { cssVars } = await browser.storage.local.get({ cssVars: {} })
  for (let key of Object.keys(CUSTOM_CSS_VARS)) {
    if (!cssVars[key]) continue
    document.body.style.setProperty(Utils.toCSSVarName(key), cssVars[key])
  }

  // Setup link
  const hash = location.hash
  if (!hash) return
  const url = hash.slice(1)
  linkEl.innerText = url
  linkEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(linkEl)
    selection.addRange(range)
  })

  // Setup copy button
  copyBtnEl.addEventListener('click', () => {
    navigator.clipboard.writeText(url)
  })
})()

/**
 * Load predefined theme and apply it
 */
function initTheme(theme) {
  let themeLinkEl = document.getElementById('theme_link')

  // Remove theme css
  if (theme === 'none') {
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

  themeLinkEl.href = `../themes/${theme}/url.css`
}
