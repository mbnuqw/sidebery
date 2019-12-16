import { CUSTOM_CSS_VARS } from '../../../addon/defaults'
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
 * Get stored css vars
 */
async function getCSSVars() {
  let ans = await browser.storage.local.get({ cssVars: CUSTOM_CSS_VARS })
  if (!ans || !ans.cssVars) return CUSTOM_CSS_VARS
  return ans.cssVars
}

/**
 * Load css vars and apply them
 */
async function loadCSSVars() {
  let ans = await browser.storage.local.get('cssVars')
  let loadedVars = ans.cssVars
  if (!loadedVars) {
    return
  }

  const rootEl = document.getElementById('root')
  for (let key of Object.keys(CUSTOM_CSS_VARS)) {
    if (!loadedVars[key]) continue
    rootEl.style.setProperty(Utils.toCSSVarName(key), loadedVars[key])
  }
}

/**
 * Save custom styles
 */
async function saveCSSVars(vars) {
  await browser.storage.local.set({
    cssVars: JSON.parse(JSON.stringify(vars)),
  })
}

/**
 * Apply provided styles
 */
function applyCSSVars(vars) {
  if (!vars) return

  const rootEl = document.getElementById('root')
  for (let key of Object.keys(CUSTOM_CSS_VARS)) {
    if (vars[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), vars[key])
    } else {
      rootEl.style.removeProperty(Utils.toCSSVarName(key))
    }
  }
}

export default {
  ...CommonActions,

  getCustomCSS,
  setCustomCSS,

  getCSSVars,
  loadCSSVars,
  saveCSSVars,
  applyCSSVars,
}