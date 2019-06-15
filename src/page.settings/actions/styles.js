import Vue from 'vue'
import Utils from '../../utils'
import Logs from '../../logs'
import EventBus from '../../event-bus'
import CommonActions from '../../actions/styles'
import Actions from '../actions'

/**
 * Get stored custom css
 * 
 * @param {string} target - 'sidebar', 'settings' or 'group'
 */
async function getCustomCSS(target) {
  const fieldName = target + 'CSS'
  let ans = await browser.storage.local.get(fieldName)
  if (!ans || !ans[fieldName]) return ''
  return ans[fieldName]
}

/**
 * Apply custom css and save it
 * 
 * @param {string} target - 'sidebar', 'settings' or 'group'
 * @param {string} css
 */
function setCustomCSS(target, css) {
  const fieldName = target + 'CSS'
  if (target === 'settings') Actions.applyCustomCSS(css)

  if (css) Vue.set(this.state, fieldName, true)
  else Vue.set(this.state, fieldName, false)

  Actions.saveSettings()
  browser.storage.local.set({ [fieldName]: css })
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