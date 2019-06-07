import EventBus from '../event-bus'

/**
 * Load predefined theme and apply it
 */
function initTheme() {
  let themeLinkEl = document.getElementById('theme_link')

  // Remove theme css
  if (this.state.look === 'none') {
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
  }

  const url = browser.runtime.getURL(`../themes/${this.state.look}/${this.state.instanceType}.css`)
  if (themeLinkEl.href !== url) themeLinkEl.href = url
  document.head.appendChild(themeLinkEl)

  setTimeout(() => EventBus.$emit('dynVarChange'), 13)
}

/**
 * Load custom css and apply it
 */
async function loadCustomCSS() {
  let ans = await browser.storage.local.get('css')
  if (!ans || !ans.css) return

  applyCustomCSS(ans.css)
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

export default {
  initTheme,

  loadCustomCSS,
  applyCustomCSS,
}