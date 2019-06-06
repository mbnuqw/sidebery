/**
 * Load predefined theme and apply it
 */
function initTheme() {
  let themeLinkEl = document.getElementById('theme_link')
  if (!themeLinkEl) {
    themeLinkEl = document.createElement('link')
    themeLinkEl.id = 'theme_link'
    themeLinkEl.type = 'text/css'
    themeLinkEl.rel = 'stylesheet'
  }

  themeLinkEl.href = `../themes/${this.state.look}/${this.state.instanceType}.css`
  document.head.appendChild(themeLinkEl)
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