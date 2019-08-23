import Actions, { injectInActions } from './actions.js'

void async function main() {
  const state = injectInActions()
  state.actions = Actions

  // Init first-need stuff
  Actions.initToolbarButton()
  Actions.initGlobalMessaging()
  Actions.initMessaging()

  state.containers = await Actions.getContainers()
  state.windows = await Actions.getWindows()
  state.tabsMap = []

  // Load settings
  let { settings } = await browser.storage.local.get({ settings: null })
  await Actions.checkVersion(settings)
  state.settings = settings ? settings : {}

  Actions.loadPanels()
  Actions.loadTabs(state.windows, state.tabsMap)

  // Setup event listeners for
  Actions.setupWindowsListeners()
  Actions.setupContainersListeners()
  Actions.setupTabsListeners()
  Actions.setupStorageListeners()

  if (!state.settings.tabsTree) Actions.scheduleSnapshots()
  else Actions.onFirstSidebarInit(Actions.scheduleSnapshots)

  Actions.loadFavicons()
  Actions.clearFaviCacheAfter(86420)
}()
