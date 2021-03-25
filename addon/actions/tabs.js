const detachedTabs = []

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

    if (this.proxies[tab.cookieStoreId]) {
      tab.proxified = true
      this.actions.showProxyBadge(tab.id)
    }
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

  let len = tabWindow.tabs.length
  for (let i = tab.index; i < len; i++) {
    tabWindow.tabs[i].index = i
  }
}

/**
 * Handle tab removing
 */
function onTabRemoved(tabId, info) {
  if (!this.windows[info.windowId] || info.isWindowClosing) return
  let tabWindow = this.windows[info.windowId]
  let index = tabWindow.tabs.findIndex(t => t.id === tabId)
  if (index === -1) return
  tabWindow.tabs.splice(index, 1)
  delete this.tabsMap[tabId]

  let len = tabWindow.tabs.length
  for (let i = index; i < len; i++) {
    tabWindow.tabs[i].index = i
  }
}

/**
 * Handle tab update
 */
function onTabUpdated(tabId, change) {
  let targetTab = this.tabsMap[tabId]
  if (!targetTab) return

  Object.assign(targetTab, change)

  if (this.proxies[targetTab.cookieStoreId]) {
    targetTab.proxified = true
    this.actions.showProxyBadgeDebounced(tabId)
  }
  if (!this.proxies[targetTab.cookieStoreId] && targetTab.proxified) {
    targetTab.proxified = false
    this.actions.hideProxyBadge(tabId)
  }
}

/**
 * Handle tab activation event
 */
function onTabActivated(info) {
  let tab = this.tabsMap[info.tabId]
  if (tab) tab.active = true

  let prevTab = this.tabsMap[info.previousTabId]
  if (prevTab) prevTab.active = false

  // Workaround for #196, https://bugzilla.mozilla.org/show_bug.cgi?id=1581872
  if (tab && tab.url.startsWith('about:blank#url')) {
    browser.tabs.update(tab.id, { url: tab.url.substring(15) })
  }
}

/**
 * Show proxy badge (pageActive) for given tab
 */
function showProxyBadge(tabId) {
  let tab = this.tabsMap[tabId]
  if (!tab) return
  let container = this.containers[tab.cookieStoreId]
  if (!container) return

  let titlePre = browser.i18n.getMessage('proxy_popup.title_prefix')
  let titlePost = browser.i18n.getMessage('proxy_popup.title_postfix')
  let title = titlePre + container.name + titlePost
  browser.pageAction.setTitle({ title, tabId })
  browser.pageAction.show(tabId)
}
function showProxyBadgeDebounced(tabId, delay = 500) {
  if (this._showProxyBadgeTimeout) clearTimeout(this._showProxyBadgeTimeout)
  this._showProxyBadgeTimeout = setTimeout(() => {
    this.actions.showProxyBadge(tabId)
  }, delay)
}

/**
 * Hide proxy badge (pageActive) for given tab
 */
function hideProxyBadge(tabId) {
  browser.pageAction.hide(tabId)
  browser.pageAction.setTitle({ title: 'Sidebery proxy off', tabId })
}

/**
 * Handle tab moving
 */
function onTabMoved(id, info) {
  if (!this.windows[info.windowId]) return
  let tabWindow = this.windows[info.windowId]

  if (!tabWindow.tabs) return
  let movedTab = tabWindow.tabs.splice(info.fromIndex, 1)[0]
  tabWindow.tabs.splice(info.toIndex, 0, movedTab)

  for (let i = tabWindow.tabs.length; i--; ) {
    tabWindow.tabs[i].index = i
  }
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
 * Backup tabs data
 */
async function backupTabsData() {
  let tabsData
  try {
    let storage = await browser.storage.local.get({ tabsData_v4: tabsData })
    tabsData = storage.tabsData_v4
  } catch (err) {
    // Logs.push('[ERROR:BG] backupTabsData: ', err.toString())
    return
  }

  await browser.storage.local.set({ prevTabsData_v4: tabsData })
}

/**
 * Save tabs of panels
 */
function saveTabsData(windowId, tabs, delay = 300) {
  if (!tabs) return
  if (!this._tabsDataByWin) this._tabsDataByWin = {}
  this._tabsDataByWin[windowId] = tabs

  if (this._saveTabsDataTimeout) clearTimeout(this._saveTabsDataTimeout)
  this._saveTabsDataTimeout = setTimeout(() => {
    this._saveTabsDataTimeout = null

    let tabsData = []
    for (let tabs of Object.values(this._tabsDataByWin)) {
      if (tabs.length) tabsData.push(tabs)
    }

    browser.storage.local.set({ tabsData_v4: tabsData })
  }, delay)
}

/**
 * Update trees state from sidebars
 */
async function updateTabsTree() {
  let receiving = []
  let windows = []
  for (let window of Object.values(this.windows)) {
    receiving.push(
      browser.runtime.sendMessage({
        windowId: window.id,
        instanceType: 'sidebar',
        action: 'getTabsTree',
      })
    )
    windows.push(window)
  }

  let trees
  try {
    trees = await Promise.all(receiving)
  } catch (err) {
    trees = []
  }

  for (let info, i = 0; i < windows.length; i++) {
    info = trees[i]
    for (let tab of windows[i].tabs) {
      tab.lvl = undefined
      tab.panelId = undefined

      if (!info) continue
      let tabInfo = info[String(tab.id)]
      if (!tabInfo) continue
      tab.lvl = tabInfo.lvl
      tab.panelId = tabInfo.panel
    }
  }
}

function setupTabsListeners() {
  browser.tabs.onCreated.addListener(this.actions.onTabCreated)
  browser.tabs.onRemoved.addListener(this.actions.onTabRemoved)
  try {
    // From v88 (https://bugzilla.mozilla.org/show_bug.cgi?id=1680279)
    browser.tabs.onUpdated.addListener(this.actions.onTabUpdated, {
      properties: ['pinned', 'title', 'status', 'url'],
    })
  } catch (err) {
    // Before v88 (Remove after next ESR - v91)
    browser.tabs.onUpdated.addListener(this.actions.onTabUpdated, {
      properties: ['pinned', 'title', 'status'],
    })
  }
  browser.tabs.onActivated.addListener(this.actions.onTabActivated)
  browser.tabs.onMoved.addListener(this.actions.onTabMoved)
  browser.tabs.onAttached.addListener(this.actions.onTabAttached)
  browser.tabs.onDetached.addListener(this.actions.onTabDetached)
}

export default {
  loadTabs,

  onTabCreated,
  onTabRemoved,
  onTabUpdated,
  onTabActivated,
  onTabMoved,
  onTabAttached,
  onTabDetached,

  showProxyBadge,
  showProxyBadgeDebounced,
  hideProxyBadge,

  updateTabsTree,
  backupTabsData,
  saveTabsData,

  setupTabsListeners,
}
