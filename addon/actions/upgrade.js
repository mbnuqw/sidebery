import Actions from '../actions.js'

/**
 * Compare previous and current versions of addon and
 * if they differ run upgrade action
 */
async function checkVersion(settings) {
  if (!settings) return
  if (!settings.version) await Actions.upgradeToV3(settings)
}

/**
 * Upgrade stored values to version 3.x.x
 */
async function upgradeToV3(settings) {
  // --- Settings ---
  settings.version = browser.runtime.getManifest().version
  if (['dark', 'light'].includes(settings.theme)) {
    settings.style = settings.theme
    settings.theme = 'default'
  }
  delete settings.snapshotsTargets
  await browser.storage.local.set({ settings })

  // --- Custom CSS vars ---
  let { styles } = await browser.storage.local.get({ styles: null })
  if (styles) {
    await browser.storage.local.set({ cssVars: styles })
    await browser.storage.local.remove('styles')
  }

  // --- Favicons ---
  await browser.storage.local.remove('favicons')

  // --- Panels ---
  let { containers } = await browser.storage.local.get({ containers: null })
  if (containers) {
    await browser.storage.local.set({ panels: containers })
    await browser.storage.local.remove('containers')
  }

  // --- Snapshots ---
  let { snapshots } = await browser.storage.local.get({ snapshots: null })
  if (snapshots) {
    // ... convert old snapshots to new ...
  }

  // --- Tree ---
  let { tabsTreeState } = await browser.storage.local.get({
    tabsTreeState: null,
  })
  if (tabsTreeState) {
    // ... convert old tree state ...
  }

  setTimeout(() => {
    browser.runtime.sendMessage({ action: 'stopUpgrading' })
  }, 3000)
}

export default {
  checkVersion,
  upgradeToV3,
}