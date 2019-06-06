import Vue from 'vue'
import Utils from '../../utils'
import Logs from '../../logs'
import EventBus from '../../event-bus'
import CommonActions from '../../actions/styles'
import Actions from '../actions'

/**
 * Get stored custom css
 */
async function getCustomCSS() {
  let ans = await browser.storage.local.get('css')
  if (!ans || !ans.customTheme) return ''
  return ans.css
}

/**
 * Apply custom theme and save it
 */
function setCustomCSS(css) {
  CommonActions.applyCustomCSS(css)

  if (css) this.state.customCSS = true
  else this.state.customCSS = false

  Actions.saveSettings()
  browser.storage.local.set({ css })
}

/**
 * Load css vars and apply them
 */
async function loadStyles() {
  let ans = await browser.storage.local.get('styles')
  let loadedStyles = ans.styles
  if (!loadedStyles) {
    Logs.push('[WARN] Cannot load styles')
    return
  }

  const rootEl = document.getElementById('root')
  for (let key in this.state.customStyles) {
    if (!this.state.customStyles.hasOwnProperty(key)) continue

    if (loadedStyles[key] !== undefined) {
      this.state.customStyles[key] = loadedStyles[key]
    }
    if (loadedStyles[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), loadedStyles[key])
    }
  }

  EventBus.$emit('dynVarChange')
  Logs.push('[INFO] Styles loaded')
}

/**
 * Save custom styles
 */
async function saveStyles() {
  await browser.storage.local.set({
    styles: JSON.parse(JSON.stringify(this.state.customStyles)),
  })
}

/**
 * Apply provided styles
 */
function applyStyles(styles) {
  if (!styles) return

  const rootEl = document.getElementById('root')
  for (let key in this.state.customStyles) {
    if (!this.state.customStyles.hasOwnProperty(key)) continue

    if (styles[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), styles[key])
    } else {
      rootEl.style.removeProperty(Utils.toCSSVarName(key))
    }
  }

  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

/**
 * Set custom style
 */
function setStyle(key, val) {
  const rootEl = document.getElementById('root')
  Vue.set(this.state.customStyles, key, val)
  rootEl.style.setProperty(Utils.toCSSVarName(key), val)
  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

/**
 * Remove custom style
 */
function removeStyle(key) {
  const rootEl = document.getElementById('root')
  Vue.set(this.state.customStyles, key, null)
  rootEl.style.removeProperty(Utils.toCSSVarName(key))
  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

export default {
  ...CommonActions,

  getCustomCSS,
  setCustomCSS,

  loadStyles,
  saveStyles,
  applyStyles,
  setStyle,
  removeStyle,
}