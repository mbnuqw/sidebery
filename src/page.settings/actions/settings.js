import { DEFAULT_SETTINGS } from '../../settings'
import CommonActions from '../../actions/settings'
import Actions from './index'

/**
 * Set setting value
 */
function setSetting(state, keyVal) {
  if (!DEFAULT_SETTINGS.hasOwnProperty(keyVal.key)) return
  state[keyVal.key] = keyVal.val
}

/**
 * Reset settings to defaults
 * and store them to local storage
 */
function resetSettings(state) {
  // Reset settings
  for (const key in DEFAULT_SETTINGS) {
    if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
    if (state[key] == null || state[key] == undefined) continue
    state[key] = DEFAULT_SETTINGS[key]
  }
}

/**
 * Save settings to local storage
 */
async function saveSettings(state) {
  if (!state.settingsLoaded || !state.windowFocused) return
  let settings = {}
  for (const key in DEFAULT_SETTINGS) {
    if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue
    if (state[key] == null || state[key] == undefined) continue
    if (state[key] instanceof Object) settings[key] = JSON.parse(JSON.stringify(state[key]))
    else settings[key] = state[key]
  }
  await browser.storage.local.set({ settings })
}

/**
 * Update settings
 */
function updateSettings(state, settings) {
  if (!settings) return

  // Check what values was updated
  const look = state.look !== settings.look

  // Update settings
  for (let k in settings) {
    if (!settings.hasOwnProperty(k)) continue
    if (settings[k] !== undefined) state[k] = settings[k]
  }

  if (look) {
    Actions.updateTheme(state)
  }
}

export default {
  ...CommonActions,

  setSetting,
  resetSettings,
  saveSettings,
  updateSettings,
}