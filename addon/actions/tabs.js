const detachedTabs = [], tabsTreesByWin = {}
let tabsTreeSaveTimeout

/**
 * Load tabs
 */
async function loadTabs(windows, tabsMap) {
  const tabs = await browser.tabs.query({})
  for (let tab of tabs) {
    if (!windows[tab.windowId]) continue

    const tabWindow = windows[tab.windowId]
    if (tabWindow.tabs) tabWindow.tabs.push(tab)
    else tabWindow.tabs = [tab]

    tabsMap[tab.id] = tab
  }
}


/**
 * Handle new tab
 */
function onTabCreated(tab) {
  if (!this.windows[tab.windowId]) return
  const tabWindow = this.windows[tab.windowId]
  if (tabWindow.tabs) tabWindow.tabs.splice(tab.index, 0, tab)
  else tabWindow.tabs = [tab]
  this.tabsMap[tab.id] = tab
}

/**
 * Handle tab removing
 */
function onTabRemoved(tabId, info) {
  if (!this.windows[info.windowId] || info.isWindowClosing) return
  const tabWindow = this.windows[info.windowId]
  let index = tabWindow.tabs.findIndex(t => t.id === tabId)
  if (index === -1) return
  tabWindow.tabs.splice(index, 1)
  this.tabsMap[tabId] = undefined
}

/**
 * Handle tab update
 */
function onTabUpdated(tabId, change) {
  let targetTab = this.tabsMap[tabId]
  if (targetTab) Object.assign(targetTab, change)
}

/**
 * Handle tab moving
 */
function onTabMoved(id, info) {
  if (!this.windows[info.windowId]) return
  const tabWindow = this.windows[info.windowId]
  const movedTab = tabWindow.tabs.splice(info.fromIndex, 1)[0]
  tabWindow.tabs.splice(info.toIndex, 0, movedTab)
}

/**
 * Handle tab attachment
 */
function onTabAttached(id, info) {
  if (!this.windows[info.newWindowId]) return
  if (!detachedTabs[id]) return
  const tabWindow = this.windows[info.newWindowId]
  tabWindow.tabs.splice(info.newPosition, 0, detachedTabs[id])
}

/**
 * Handle tab detach
 */
function onTabDetached(id, info) {
  if (!this.windows[info.oldWindowId]) return
  const tabWindow = this.windows[info.oldWindowId]
  detachedTabs[id] = tabWindow.tabs.splice(info.oldPosition, 1)[0]
}

/**
 * Save tabs tree
 */
function saveTabsTree(windowId, treeState, delay = 300) {
  if (!treeState) return
  tabsTreesByWin[windowId] = treeState

  if (tabsTreeSaveTimeout) clearTimeout(tabsTreeSaveTimeout)
  tabsTreeSaveTimeout = setTimeout(async () => {
    const tabsTrees = []
    for (let tree of Object.values(tabsTreesByWin)) {
      if (tree.length) tabsTrees.push(tree)
    }

    browser.storage.local.set({ tabsTrees })
    tabsTreeSaveTimeout = null
  }, delay)
}

/**
 * updateTabsTree
 */
async function updateTabsTree() {
  const receiving = [], windows = []
  for (let window of Object.values(this.windows)) {
    receiving.push(browser.runtime.sendMessage({
      windowId: window.id,
      instanceType: 'sidebar',
      action: 'getTabsTree',
    }))
    windows.push(window)
  }

  const trees = await Promise.all(receiving)
  for (let i = 0; i < trees.length; i++) {
    for (let tab of windows[i].tabs) {
      if (trees[i]) tab.lvl = trees[i][String(tab.id)] || 0
    }
  }
}

function setupTabsListeners() {
  browser.tabs.onCreated.addListener(this.actions.onTabCreated)
  browser.tabs.onRemoved.addListener(this.actions.onTabRemoved)
  browser.tabs.onUpdated.addListener(this.actions.onTabUpdated, {
    properties: [ 'pinned', 'title', 'status' ],
  })
  browser.tabs.onMoved.addListener(this.actions.onTabMoved)
  browser.tabs.onAttached.addListener(this.actions.onTabAttached)
  browser.tabs.onDetached.addListener(this.actions.onTabDetached)
}

export default {
  loadTabs,

  onTabCreated,
  onTabRemoved,
  onTabUpdated,
  onTabMoved,
  onTabAttached,
  onTabDetached,
  updateTabsTree,
  saveTabsTree,

  setupTabsListeners,
}