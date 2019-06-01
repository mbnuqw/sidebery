import Logs from '../logs'

/**
 * Try to load settings from local storage.
 */
async function loadSettings() {
  let ans = await browser.storage.local.get('settings')
  if (!ans || !ans.settings) {
    Logs.push('[WARN] Cannot load settings')
    this.state.settingsLoaded = true
    return
  }

  let settings = ans.settings
  for (const key in settings) {
    if (!settings.hasOwnProperty(key)) continue
    if (settings[key] === undefined) continue
    this.state[key] = settings[key]
  }

  this.state.settingsLoaded = true
  Logs.push('[INFO] Settings loaded')
}

/**
 * Update font size for 'html' tag.
 */
function updateFontSize() {
  const htmlEl = document.documentElement
  if (this.state.fontSize === 'xs') htmlEl.style.fontSize = '13.5px'
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