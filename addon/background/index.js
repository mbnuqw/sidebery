import Actions, { injectInActions } from '../actions/index.js'

void async function main() {
  const state = injectInActions()

  // Init first-need stuff
  initToolbarButton()
  Actions.initGlobalMessaging()
  Actions.initMessaging()

  // Load settings
  const ans = await browser.storage.local.get({ settings: {} })
  state.settings = ans ? ans.settings : {}

  state.containers = await getContainers()
  state.windows = await getWindows()
  loadTabs(state.windows)

  // Setup event listeners for
  // windows
  browser.windows.onCreated.addListener(Actions.onWindowCreated)
  browser.windows.onRemoved.addListener(Actions.onWindowRemoved)
  // containers
  browser.contextualIdentities.onCreated.addListener(Actions.onContainerCreated)
  browser.contextualIdentities.onRemoved.addListener(Actions.onContainerRemoved)
  browser.contextualIdentities.onUpdated.addListener(Actions.onContainerUpdated)
  // tabs
  browser.tabs.onCreated.addListener(Actions.onTabCreated)
  browser.tabs.onRemoved.addListener(Actions.onTabRemoved)
  browser.tabs.onUpdated.addListener(Actions.onTabUpdated, {
    properties: [ 'pinned', 'title' ],
  })
  browser.tabs.onMoved.addListener(Actions.onTabMoved)
  browser.tabs.onAttached.addListener(Actions.onTabAttached)
  browser.tabs.onDetached.addListener(Actions.onTabDetached)

  if (!state.settings.tabsTree) Actions.scheduleSnapshots()
  else Actions.onFirstSidebarInit(Actions.scheduleSnapshots)
}()

/**
 * Handle click on browser-action button
 */
function initToolbarButton() {
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open()
  })
}

/**
 * Get windows
 */
async function getWindows() {
  const windows = await browser.windows.getAll({})
  const windowsMap = {}
  for (let window of windows) {
    windowsMap[window.id] = window
  }
  return windowsMap
}

/**
 * Load tabs
 */
async function loadTabs(windows) {
  const tabs = await browser.tabs.query({})
  for (let tab of tabs) {
    if (!windows[tab.windowId]) continue

    const tabWindow = windows[tab.windowId]
    if (tabWindow.tabs) tabWindow.tabs.push(tab)
    else tabWindow.tabs = [tab]
  }
}

/**
 * Get containers
 */
async function getContainers() {
  const containers = await browser.contextualIdentities.query({})
  const containersMap = {}
  for (let container of containers) {
    containersMap[container.cookieStoreId] = container
  }
  return containersMap
}