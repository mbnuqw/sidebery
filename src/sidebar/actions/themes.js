import Vue from 'vue'
import Utils from '../../libs/utils'
// import Logs from '../../libs/logs'
import EventBus from '../event-bus'

export default {
  /**
   * Load custom theme and apply it
   */
  async loadTheme({ state }) {
    let themeLinkEl = document.getElementById('theme_link')
    if (!themeLinkEl) {
      themeLinkEl = document.createElement('link')
      themeLinkEl.id = 'theme_link'
      themeLinkEl.type = 'text/css'
      themeLinkEl.rel = 'stylesheet'
    }

    themeLinkEl.href = `../themes/${state.look}.css`
    document.head.appendChild(themeLinkEl)
    // let ans = await browser.storage.local.get('styles')
    // let loadedStyles = ans.styles
    // if (!loadedStyles) {
    //   Logs.push('[WARN] Cannot load styles')
    //   return
    // }

    // const rootEl = document.getElementById('root')
    // for (let key in state.customStyles) {
    //   if (!state.customStyles.hasOwnProperty(key)) continue

    //   if (loadedStyles[key] !== undefined) {
    //     state.customStyles[key] = loadedStyles[key]
    //   }
    //   if (loadedStyles[key]) {
    //     rootEl.style.setProperty(Utils.CSSVar(key), loadedStyles[key])
    //   }
    // }

    // EventBus.$emit('dynVarChange')
    // Logs.push('[INFO] Styles loaded')
  },

  /**
   * Save custom theme
   */
  async saveTheme({ state }) {
    await browser.storage.local.set({
      styles: JSON.parse(JSON.stringify(state.customStyles)),
    })
  },

  /**
   * Apply theme
   */
  // applyTheme({ state }, theme) {
  //   if (!theme) return
  // },

  /**
   * Apply custom theme
   */
  applyThemeCSS(_, themeCSS) {
    if (!themeCSS) return

    // Find or create new style element
    let customThemeStyleEl = document.getElementById('custom_theme_css')
    if (!customThemeStyleEl) {
      customThemeStyleEl = document.createElement('style')
      customThemeStyleEl.id = 'custom_theme_css'
      customThemeStyleEl.type = 'text/css'
      customThemeStyleEl.rel = 'stylesheet'
    } else {
      while (customThemeStyleEl.lastChild) {
        customThemeStyleEl.removeChild(customThemeStyleEl.lastChild)
      }
    }

    // Apply css
    customThemeStyleEl.appendChild(document.createTextNode(themeCSS))
    document.head.appendChild(customThemeStyleEl)
  },

  /**
   * Set custom style
   */
  setStyle({ state }, { key, val }) {
    const rootEl = document.getElementById('root')
    Vue.set(state.customStyles, key, val)
    rootEl.style.setProperty(Utils.CSSVar(key), val)
    setTimeout(() => EventBus.$emit('dynVarChange'), 256)
  },

  /**
   * Remove custom style
   */
  removeStyle({ state }, key) {
    const rootEl = document.getElementById('root')
    Vue.set(state.customStyles, key, null)
    rootEl.style.removeProperty(Utils.CSSVar(key))
    setTimeout(() => EventBus.$emit('dynVarChange'), 256)
  },
}
