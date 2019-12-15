import { DEFAULT_SETTINGS } from '../defaults'

/**
 * Try to load settings from local storage.
 */
async function loadSettings() {
  let settings = {}
  let saveNeeded = false
  let storage = await browser.storage.local.get({ settings_v4: null })

  // Try to use value from prev version
  if (!storage.settings_v4) {
    saveNeeded = true
    let oldStorage = await browser.storage.local.get({ settings: null })
    if (oldStorage.settings) {
      browser.storage.local.remove('settings')
      settings = oldStorage.settings
    }
  }

  settings.version = browser.runtime.getManifest().version

  for (let key of Object.keys(settings)) {
    if (settings[key] === undefined) continue
    this.state[key] = settings[key]
  }

  if (saveNeeded) this.actions.saveSettings()
}

/**
 * Save settings to local storage
 */
async function saveSettings() {
  let settings = {}
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (this.state[key] == null || this.state[key] == undefined) continue
    if (this.state[key] instanceof Object) settings[key] = JSON.parse(JSON.stringify(this.state[key]))
    else settings[key] = this.state[key]
  }
  await browser.storage.local.set({ settings_v4: settings })
}

/**
 * Update font size for 'html' tag.
 */
function updateFontSize() {
  const htmlEl = document.documentElement
  if (this.state.fontSize === 'xxs') htmlEl.style.fontSize = '13px'
  else if (this.state.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
  else if (this.state.fontSize === 's') htmlEl.style.fontSize = '14px'
  else if (this.state.fontSize === 'm') htmlEl.style.fontSize = '14.5px'
  else if (this.state.fontSize === 'l') htmlEl.style.fontSize = '15px'
  else if (this.state.fontSize === 'xl') htmlEl.style.fontSize = '15.5px'
  else if (this.state.fontSize === 'xxl') htmlEl.style.fontSize = '16px'
  else htmlEl.style.fontSize = '14.5px'
}

export default {
  loadSettings,
  saveSettings,
  updateFontSize,
}