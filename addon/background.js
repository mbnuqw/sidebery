import Actions, { injectInActions } from './actions.js'
import { DEFAULT_SETTINGS } from './defaults.js'

void (async function main() {
  const state = injectInActions()

  state.actions = Actions
  state.tabsMap = []
  state.images = {}
  state.windows = {}

  Actions.initLogs()
  Actions.infoLog('Initialization start')

  // Init first-need stuff
  Actions.initToolbarButton()
  Actions.initGlobalMessaging()
  Actions.initMessaging()

  // Load windows
  state.windows = await Actions.getWindows()
  Actions.setupWindowsListeners()

  // Load containers
  Actions.setupContainersListeners()
  await Actions.loadContainers()

  // Load settings
  let { settings } = await browser.storage.local.get({ settings: {} })
  state.settings = Utils.normalizeObject(settings, DEFAULT_SETTINGS)

  await Actions.loadTabs(state.windows, state.tabsMap)
  await Actions.backupTabsData()
  Actions.setupTabsListeners()

  Actions.setupStorageListeners()

  Actions.loadPermissions()
  Actions.loadFavicons()
  Actions.clearFaviCacheAfter(86420)

  Actions.setupMenuListeners()

  // Defer creating schedule for snapshots
  setTimeout(() => {
    Actions.scheduleSnapshots()
  }, 5000)
})()
