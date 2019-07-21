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
async function loadCSSVars() {
  let ans = await browser.storage.local.get('cssVars')
  let loadedVars = ans.cssVars
  if (!loadedVars) {
    Logs.push('[WARN] Cannot load styles')
    return
  }

  const rootEl = document.getElementById('root')
  for (let key in this.state.cssVars) {
    if (!this.state.cssVars.hasOwnProperty(key)) continue

    if (loadedVars[key] !== undefined) {
      this.state.cssVars[key] = loadedVars[key]
    }
    if (loadedVars[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), loadedVars[key])
    }
  }

  EventBus.$emit('dynVarChange')
  Logs.push('[INFO] Styles loaded')
}

/**
 * Save custom styles
 */
async function saveCSSVars() {
  await browser.storage.local.set({
    cssVars: JSON.parse(JSON.stringify(this.state.cssVars)),
  })
}

/**
 * Apply provided styles
 */
function applyCSSVars(styles) {
  if (!styles) return

  const rootEl = document.getElementById('root')
  for (let key in this.state.cssVars) {
    if (!this.state.cssVars.hasOwnProperty(key)) continue

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
function setCSSVar(key, val) {
  const rootEl = document.getElementById('root')
  Vue.set(this.state.cssVars, key, val)
  rootEl.style.setProperty(Utils.toCSSVarName(key), val)
  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

/**
 * Remove custom style
 */
function removeCSSVar(key) {
  const rootEl = document.getElementById('root')
  Vue.set(this.state.cssVars, key, null)
  rootEl.style.removeProperty(Utils.toCSSVarName(key))
  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

export default {
  ...CommonActions,

  getCustomCSS,
  setCustomCSS,

  loadCSSVars,
  saveCSSVars,
  applyCSSVars,
  setCSSVar,
  removeCSSVar,
}