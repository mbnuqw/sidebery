import Actions, { injectInActions } from './actions.js'

void async function main() {
  const state = injectInActions()

  state.actions = Actions
  state.tabsMap = []
  state.images = {}
  state.windows = {}

  // Init first-need stuff
  Actions.initToolbarButton()
  Actions.initGlobalMessaging()
  Actions.initMessaging()

  // Load containers
  Actions.setupContainersListeners()
  await Actions.loadContainers()

  // Load windows
  state.windows = await Actions.getWindows()
  Actions.setupWindowsListeners()

  // Load settings
  let { settings_v4 } = await browser.storage.local.get({ settings_v4: null })
  state.settings = settings_v4 ? settings_v4 : {}

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
}()
