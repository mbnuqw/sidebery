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

  this.actions.infoLog('Settings loaded')
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

  if (settings.syncSaveSettings) {
    let profileId = await this.actions.getProfileId()
    await browser.storage.sync.set({
      [profileId + '::settings']: {
        value: { settings },
        time: Date.now(),
        name: this.state.syncName,
      },
    })
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

async function getProfileId() {
  let { profileID } = await browser.storage.local.get({ profileID: null })
  if (!profileID) {
    profileID = Utils.uid()
    browser.storage.local.set({ profileID })
  }
  return profileID
}

function parseCtxMenuContainersRules(value) {
  if (!value) return null

  let rules = []
  try {
    let rawRules = value.split(',')
    for (let rule of rawRules) {
      rule = rule.trim()
      if (!rule) continue
      if (rule.startsWith('/') && rule.endsWith('/')) rule = new RegExp(rule.slice(1, -1))
      rules.push(rule)
    }
  } catch (err) {
    return null
  }

  if (rules.length) return rules
  else return null
}

function checkCtxMenuContainer(container, rules) {
  if (!container || !rules) return false

  let value = false
  for (let rule of rules) {
    if (rule.test) value = rule.test(container.name)
    else value = rule === container.name
    if (value) return value
  }

  return value
}

export default {
  loadSettings,
  saveSettings,
  updateFontSize,
  getProfileId,
  parseCtxMenuContainersRules,
  checkCtxMenuContainer,
}
