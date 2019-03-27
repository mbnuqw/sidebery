import Vue from 'vue'
import Utils from '../../libs/utils'
import EventBus from '../event-bus'

export default {
  /**
   * Load custom styles and apply them
   */
  async loadStyles({ state }) {
    let ans = await browser.storage.local.get('styles')
    let loadedStyles = ans.styles
    if (!loadedStyles) return

    const rootEl = document.getElementById('root')
    for (let key in state.customStyles) {
      if (!state.customStyles.hasOwnProperty(key)) continue

      if (loadedStyles[key]) {
        rootEl.style.setProperty(Utils.CSSVar(key), loadedStyles[key])
      }
    }

    state.customStyles = loadedStyles
    EventBus.$emit('dynVarChange')
  },

  /**
   * Save custom styles
   */
  async saveStyles({ state }) {
    await browser.storage.local.set({
      styles: JSON.parse(JSON.stringify(state.customStyles)),
    })
  },

  /**
   * Apply provided styles
   */
  applyStyles({ state }, styles) {
    if (!styles) return

    const rootEl = document.getElementById('root')
    for (let key in state.customStyles) {
      if (!state.customStyles.hasOwnProperty(key)) continue

      if (styles[key]) {
        rootEl.style.setProperty(Utils.CSSVar(key), styles[key])
      } else {
        rootEl.style.removeProperty(Utils.CSSVar(key))
      }
    }

    setTimeout(() => EventBus.$emit('dynVarChange'), 256)
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