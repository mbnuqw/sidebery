import { DEFAULT_SETTINGS } from '../defaults'

/**
 * Try to load settings from local storage.
 */
async function loadSettings(settings) {
  // Check version
  if (!settings.version && this.actions.startUpgrading) {
    await this.actions.startUpgrading()
    let ans = await browser.storage.local.get({ settings: DEFAULT_SETTINGS })
    settings = ans.settings
  }

  settings.version = browser.runtime.getManifest().version

  for (const key of Object.keys(settings)) {
    if (settings[key] === undefined) continue
    this.state[key] = settings[key]
  }
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
  updateFontSize,
}