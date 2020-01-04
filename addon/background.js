import Actions, { injectInActions } from './actions.js'

void (async function main() {
  const state = injectInActions()

  state.actions = Actions
  state.tabsMap = []
  state.images = {}
  state.windows = {}

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
  let { settings } = await browser.storage.local.get({ settings: null })
  state.settings = settings ? settings : {}

  await Actions.loadTabs(state.windows, state.tabsMap)
  await Actions.backupTabsData()
  Actions.setupTabsListeners()

  Actions.setupStorageListeners()

  if (!state.settings.tabsTree) Actions.scheduleSnapshots()
  else Actions.onFirstSidebarInit(Actions.scheduleSnapshots)

  Actions.loadPermissions()
  Actions.loadFavicons()
  Actions.clearFaviCacheAfter(86420)

  Actions.setupMenuListeners()
})()
