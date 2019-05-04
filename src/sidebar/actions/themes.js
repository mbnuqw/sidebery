export default {
  /**
   * Load custom theme and apply it
   */
  loadTheme({ state }) {
    let themeLinkEl = document.getElementById('theme_link')
    if (!themeLinkEl) {
      themeLinkEl = document.createElement('link')
      themeLinkEl.id = 'theme_link'
      themeLinkEl.type = 'text/css'
      themeLinkEl.rel = 'stylesheet'
    }

    themeLinkEl.href = `../themes/${state.look}.css`
    document.head.appendChild(themeLinkEl)
  },

  /**
   * Load custom theme
   */
  async loadCustomTheme({ dispatch }) {
    let ans = await browser.storage.local.get('customTheme')
    if (!ans || !ans.customTheme) return

    dispatch('applyCustomThemeCSS', ans.customTheme)
  },

  /**
   * Update css of custom theme
   */
  applyCustomThemeCSS(_, themeCSS) {
    // Find or create new style element
    let customThemeStyleEl = document.getElementById('custom_theme_css')
    if (!customThemeStyleEl) {
      customThemeStyleEl = document.createElement('style')
      customThemeStyleEl.id = 'custom_theme_css'
      customThemeStyleEl.type = 'text/css'
      customThemeStyleEl.rel = 'stylesheet'
      document.head.appendChild(customThemeStyleEl)
    } else {
      while (customThemeStyleEl.lastChild) {
        customThemeStyleEl.removeChild(customThemeStyleEl.lastChild)
      }
    }

    // Apply css
    if (themeCSS) {
      customThemeStyleEl.appendChild(document.createTextNode(themeCSS))
    }
  },

  /**
   * Apply custom theme and save it
   */
  setCustomTheme({ state, dispatch }, themeCSS) {
    dispatch('applyCustomThemeCSS', themeCSS)

    if (themeCSS) state.customTheme = true
    else state.customTheme = false

    dispatch('saveSettings')
    browser.storage.local.set({ customTheme: themeCSS })
  },

  /**
   * Get curretn custom theme
   */
  async getCustomTheme() {
    let ans = await browser.storage.local.get('customTheme')
    if (!ans || !ans.customTheme) return ''
    return ans.customTheme
  },
}
