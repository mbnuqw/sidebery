import { DEFAULT_SETTINGS } from '../../addon/defaults'

/**
 * Try to load settings from local storage.
 */
async function loadSettings() {
  let { settings } = await browser.storage.local.get({ settings: {} })
  settings.version = browser.runtime.getManifest().version

  for (let key of Object.keys(settings)) {
    if (settings[key] === undefined) continue
    this.state[key] = settings[key]
  }
}

/**
 * Save settings to local storage
 */
async function saveSettings() {
  let settings = {}
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (this.state[key] == null || this.state[key] == undefined) continue
    if (this.state[key] instanceof Object) {
      if (Array.isArray(this.state[key])) settings[key] = Utils.cloneArray(this.state[key])
      else settings[key] = Utils.cloneObject(this.state[key])
    } else {
      settings[key] = this.state[key]
    }
  }
  await browser.storage.local.set({ settings: settings })
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
