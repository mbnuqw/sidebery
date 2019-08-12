const detachedTabs = [], tabsTreesByWin = {}
let tabsTreeSaveTimeout

/**
 * Handle new tab
 */
function onTabCreated(tab) {
  if (!this.windows[tab.windowId]) return
  const tabWindow = this.windows[tab.windowId]
  if (tabWindow.tabs) tabWindow.tabs.splice(tab.index, 1, tab)
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
  tabWindow.tabs.splice(info.newPosition, 1, detachedTabs[id])
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
  if (!treeState || !treeState.length) return
  tabsTreesByWin[windowId] = treeState

  if (tabsTreeSaveTimeout) clearTimeout(tabsTreeSaveTimeout)
  tabsTreeSaveTimeout = setTimeout(async () => {
    const tabsTrees = []
    for (let winId in tabsTreesByWin) {
      if (!tabsTreesByWin.hasOwnProperty(winId)) continue
      tabsTrees.push(tabsTreesByWin[winId])
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
  for (let windowId in this.windows) {
    if (!this.windows.hasOwnProperty(windowId)) continue
    receiving.push(browser.runtime.sendMessage({
      windowId: this.windows[windowId].id,
      instanceType: 'sidebar',
      action: 'getTabsTree',
    }))
    windows.push(this.windows[windowId])
  }

  const trees = await Promise.all(receiving)
  for (let i = 0; i < trees.length; i++) {
    for (let tab of windows[i].tabs) {
      if (trees[i]) tab.lvl = trees[i][String(tab.id)] || 0
    }
  }
}

export default {
  onTabCreated,
  onTabRemoved,
  onTabUpdated,
  onTabMoved,
  onTabAttached,
  onTabDetached,
  updateTabsTree,
  saveTabsTree,
}