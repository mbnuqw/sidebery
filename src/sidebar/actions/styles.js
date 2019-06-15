import Utils from '../../utils'
import Logs from '../../logs'
import EventBus from '../../event-bus'
import CommonActions from '../../actions/styles'
import { CUSTOM_CSS_VARS } from '../../defaults'

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
  for (let key in loadedStyles) {
    if (!loadedStyles.hasOwnProperty(key)) continue

    if (loadedStyles[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), loadedStyles[key])
    }
  }

  EventBus.$emit('dynVarChange')
  Logs.push('[INFO] Styles loaded')
}

/**
 * Apply provided styles
 */
function applyStyles(styles) {
  if (!styles) return

  const rootEl = document.getElementById('root')
  for (let key in CUSTOM_CSS_VARS) {
    if (!CUSTOM_CSS_VARS.hasOwnProperty(key)) continue

    if (styles[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), styles[key])
    } else {
      rootEl.style.removeProperty(Utils.toCSSVarName(key))
    }
  }

  setTimeout(() => EventBus.$emit('dynVarChange'), 256)
}

export default {
  ...CommonActions,

  loadStyles,
  applyStyles,
}