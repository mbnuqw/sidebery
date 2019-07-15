const detachedTabs = []

/**
 * Handle new tab
 */
function onTabCreated(tab) {
  if (!this.windows[tab.windowId]) return
  const tabWindow = this.windows[tab.windowId]
  if (tabWindow.tabs) tabWindow.tabs.splice(tab.index, 1, tab)
  else tabWindow.tabs = [tab]
}

/**
 * Handle tab removing
 */
function onTabRemoved(tabId, info) {
  if (!this.windows[info.windowId] || info.isWindowClosing) return
  const tabWindow = this.windows[info.windowId]
  for (let i = 0; i < tabWindow.tabs.length; i++) {
    if (tabWindow.tabs[i].id === tabId) {
      tabWindow.tabs.splice(i, 1)
      break
    }
  }
}

/**
 * Handle tab update
 */
function onTabUpdated(tabId, change, tab) {
  if (!this.windows[tab.windowId]) return
  const tabWindow = this.windows[tab.windowId]
  for (let i = 0; i < tabWindow.tabs.length; i++) {
    if (tabWindow.tabs[i].id === tabId) {
      tabWindow.tabs.splice(i, 1, tab)
      break
    }
  }
}

/**
 * Handle tab moving
 */
function onTabMoved(id, info) {
  if (!this.windows[info.windowId]) return
  const tabWindow = this.windows[info.windowId]
  const movedTab = tabWindow.tabs.splice(info.fromIndex, 1)[0]
  tabWindow.tabs.splice(info.toIndex, 1, movedTab)
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
      tab.lvl = trees[i][String(tab.id)] || 0
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
}