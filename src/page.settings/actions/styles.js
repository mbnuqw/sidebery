import Vue from 'vue'
import Utils from '../../libs/utils'
import Logs from '../../libs/logs'
import EventBus from '../../event-bus'
import CommonActions from '../../actions/styles'
import Actions from '../store.actions'

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
function setCustomCSS(state, css) {
  CommonActions.applyCustomCSS(css)

  if (css) state.customCSS = true
  else state.customCSS = false

  Actions.saveSettings()
  browser.storage.local.set({ css })
}

/**
 * Load css vars and apply them
 */
async function loadStyles(state) {
  let ans = await browser.storage.local.get('styles')
  let loadedStyles = ans.styles
  if (!loadedStyles) {
    Logs.push('[WARN] Cannot load styles')
    return
  }

  const rootEl = document.getElementById('root')
  for (let key in state.customStyles) {
    if (!state.customStyles.hasOwnProperty(key)) continue

    if (loadedStyles[key] !== undefined) {
      state.customStyles[key] = loadedStyles[key]
    }
    if (loadedStyles[key]) {
      rootEl.style.setProperty(Utils.CSSVar(key), loadedStyles[key])
    }
  }

  EventBus.$emit('dynVarChange')
  Logs.push('[INFO] Styles loaded')
}

/**
 * Save custom styles
 */
async function saveStyles(state) {
  await browser.storage.local.set({
    styles: JSON.parse(JSON.stringify(state.customStyles)),
  })
}

/**
 * Apply provided styles
 */
function applyStyles(state, styles) {
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
}

/**
 * Set custom style
 */
function setStyle(state, key, val) {
  const rootEl = document.getElementById('root')
  Vue.set(state.customStyles, key, val)
  rootEl.style.setProperty(Utils.CSSVar(key), val)
  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

/**
 * Remove custom style
 */
function removeStyle(state, key) {
  const rootEl = document.getElementById('root')
  Vue.set(state.customStyles, key, null)
  rootEl.style.removeProperty(Utils.CSSVar(key))
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