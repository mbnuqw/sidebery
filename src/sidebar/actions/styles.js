import EventBus from '../../event-bus'
import CommonActions from '../../actions/styles'
import { CUSTOM_CSS_VARS } from '../../../addon/defaults'

/**
 * Load css vars and apply them
 */
async function loadCSSVars() {
  let { cssVars } = await browser.storage.local.get({ cssVars: CUSTOM_CSS_VARS })

  const rootEl = document.getElementById('root')
  for (let key of Object.keys(cssVars)) {
    if (cssVars[key]) {
      rootEl.style.setProperty(Utils.toCSSVarName(key), cssVars[key])
    }
  }

  EventBus.$emit('dynVarChange')
}

/**
 * Apply provided styles
 */
function applyCSSVars(styles) {
  if (!styles) return

  const rootEl = document.getElementById('root')
  for (let key of Object.keys(CUSTOM_CSS_VARS)) {
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

  loadCSSVars,
  applyCSSVars,
}
