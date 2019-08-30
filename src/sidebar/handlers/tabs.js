import Utils from '../../utils'

const URL_HOST_PATH_RE = /^([a-z0-9-]{1,63}\.)+\w+(:\d+)?\/[A-Za-z0-9-._~:/?#[\]%@!$&'()*+,;=]*$/

/**
 * tabs.onCreated
 */
function onTabCreated(tab) {
  if (tab.windowId !== this.state.windowId) return

  if (this.state.highlightOpenBookmarks && this.state.bookmarksUrlMap && this.state.bookmarksUrlMap[tab.url]) {
    for (let b of this.state.bookmarksUrlMap[tab.url]) {
      b.isOpen = true
    }
  }

  this.actions.closeCtxMenu()
  this.actions.resetSelection()

  // If new tab is out of panel, move it to the end of this panel
  let panel = this.state.panelsMap[tab.cookieStoreId]
  let endIndex = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
  if (tab.index > endIndex || tab.index < panel.startIndex) {
    browser.tabs.move(tab.id, { index: endIndex })
  }

  // Shift tabs after inserted one. (NOT detected by vue)
  for (let i = tab.index; i < this.state.tabs.length; i++) {
    this.state.tabs[i].index++
  }

  // Set default custom props (for reactivity)
  tab.isParent = false
  tab.folded = false
  if (tab.parentId === undefined) tab.parentId = -1
  else tab.openerTabId = tab.parentId
  tab.lvl = 0
  tab.sel = false
  tab.invisible = false
  if (tab.favIconUrl) {
    if (tab.favIconUrl.startsWith('chrome')) tab.favIconUrl = ''
  } else {
    tab.favIconUrl = ''
  }
  tab.updated = false
  tab.loading = false
  tab.warn = false
  if (tab.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
    tab.warn = true
  }

  // Put new tab in tabs list
  this.state.tabsMap[tab.id] = tab
  this.state.tabs.splice(tab.index, 0, tab)

  // Put new tab in panel
  if (panel && panel.tabs) {
    let targetIndex = tab.index - panel.startIndex
    if (targetIndex <= panel.tabs.length) {
      panel.tabs.splice(tab.index - panel.startIndex, 0, tab)
      this.actions.updatePanelsRanges()
    }
  }

  // Update tree
  if (this.state.tabsTree && !tab.pinned) {
    if (tab.openerTabId === undefined) {
      // Set tab tree level
      const nextTab = this.state.tabs[tab.index + 1]
      if (nextTab && tab.cookieStoreId === nextTab.cookieStoreId) {
        tab.parentId = nextTab.parentId
        tab.lvl = nextTab.lvl
      }
    } else {
      let parent = this.state.tabsMap[tab.openerTabId]
      if (parent && parent.cookieStoreId === tab.cookieStoreId) {
        tab.parentId = tab.openerTabId
        const start = panel.startIndex
        this.actions.updateTabsTree(start, tab.index + 1)
        if (this.state.autoFoldTabs && !parent.folded) {
          this.actions.expTabsBranch(tab.parentId)
        }
      }
    }

    this.actions.saveTabsTree()
    const groupTab = this.actions.getGroupTab(tab)
    if (groupTab && !groupTab.discarded) {
      browser.tabs.sendMessage(groupTab.id, {
        name: 'create',
        id: tab.id,
        index: tab.index,
        lvl: tab.lvl - groupTab.lvl - 1,
        title: tab.title,
        url: tab.url,
        discarded: tab.discarded,
        favIconUrl: tab.favIconUrl,
      }).catch(() => {/** itsokay **/})
    }
  }

  // Update succession
  if (this.state.activateAfterClosing !== 'none') {
    const activeTab = this.state.tabsMap[this.state.activeTabId]
    if (activeTab && activeTab.active) {
      const target = Utils.findSuccessorTab(this.state, activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  this.actions.recalcPanelScroll()
}

/**
 * tabs.onUpdated
 */
function onTabUpdated(tabId, change, tab) {
  if (tab.windowId !== this.state.windowId) return

  const localTab = this.state.tabsMap[tabId]
  if (!localTab) return

  // Status change
  if (change.status !== undefined) {
    if (change.status === 'complete' && !localTab.url.startsWith('about')) {
      browser.tabs.get(localTab.id)
        .then(tabInfo => {
          if (tabInfo.favIconUrl && !tabInfo.favIconUrl.startsWith('chrome:')) {
            localTab.favIconUrl = tabInfo.favIconUrl
          } else {
            if (change.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
              localTab.warn = true
            }
            localTab.favIconUrl = ''
          }
        })
    }

    const groupTab = this.actions.getGroupTab(localTab)
    if (groupTab && !groupTab.discarded) {
      let updateData = {
        name: 'updateTab',
        id: localTab.id,
        status: change.status,
        title: localTab.title,
        url: localTab.url,
        lvl: localTab.lvl - groupTab.lvl - 1,
        discarded: localTab.discarded,
      }
      if (change.status === 'complete') updateData.favIconUrl = localTab.favIconUrl
      browser.tabs.sendMessage(groupTab.id, updateData)
        .catch(() => {/** itsokay **/})
    }
  }

  // Url
  if (change.url !== undefined) {
    if (change.url !== localTab.url) {
      this.actions.saveTabsTree()
      if (this.state.highlightOpenBookmarks && this.state.bookmarksUrlMap) {
        if (this.state.bookmarksUrlMap[localTab.url]) {
          for (let b of this.state.bookmarksUrlMap[localTab.url]) {
            b.isOpen = false
          }
        }
        if (this.state.bookmarksUrlMap[change.url]) {
          for (let b of this.state.bookmarksUrlMap[change.url]) {
            b.isOpen = true
          }
        }
      }
      if (!change.url.startsWith(localTab.url.slice(0, 16))) {
        localTab.favIconUrl = ''
      }
    }
  }

  // Handle favicon change
  // If favicon is base64 string - store it in cache
  if (change.favIconUrl) {
    if (change.favIconUrl.startsWith('data:')) {
      this.actions.setFavicon(tab.url, change.favIconUrl)
    } else if (change.favIconUrl.startsWith('chrome:')) {
      if (change.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
        localTab.warn = true
      }
      change.favIconUrl = ''
    }
  }

  let inact = Date.now() - tab.lastAccessed
  if (change.title !== undefined && !tab.active && inact > 5000) {
    // If prev url starts with 'http' and current url same as prev
    if (localTab.url.startsWith('http') && localTab.url === tab.url) {
      // and if title doesn't looks like url
      if (!URL_HOST_PATH_RE.test(localTab.title) && !URL_HOST_PATH_RE.test(tab.title)) {
        let panel = this.state.panelsMap[tab.cookieStoreId]
        localTab.updated = true
        if (!tab.pinned || this.state.pinnedTabsPosition === 'panel') {
          if (!panel.updated.includes(tabId)) panel.updated.push(tabId)
        }
      }
    }
  }

  // Update tab object
  Object.assign(localTab, change)

  // Handle unpinned tab
  if (change.pinned !== undefined && !change.pinned) {
    let panel = this.state.panelsMap[tab.cookieStoreId]
    if (!panel) return
    if (panel && panel.tabs) browser.tabs.move(tabId, { index: panel.endIndex - 1 })
    panel.tabs.splice(localTab.index - panel.startIndex + 1, 0, localTab)
    this.actions.updatePanelsRanges()
    if (tab.active) this.actions.setPanel(panel.index)
  }

  // Handle pinned tab
  if (change.pinned !== undefined && change.pinned) {
    let panel = this.state.panelsMap[tab.cookieStoreId]
    panel.tabs.splice(localTab.index - panel.startIndex, 1)
    this.actions.updatePanelsRanges()
    this.actions.updateTabsTree()
    if (panel.noEmpty && !panel.tabs.length) {
      browser.tabs.create({
        windowId: this.state.windowId,
        index: panel.startIndex,
        cookieStoreId: panel.cookieStoreId,
      })
    } else if (!panel.tabs.length) {
      this.actions.switchToNeighbourPanel()
    }
  }
}

/**
 * tabs.onRemoved
 */
function onTabRemoved(tabId, info) {
  if (info.windowId !== this.state.windowId) return

  if (!this.state.removingTabs) this.state.removingTabs = []
  else this.state.removingTabs.splice(this.state.removingTabs.indexOf(tabId), 1)

  if (!this.state.removingTabs.length) {
    this.actions.closeCtxMenu()
    this.actions.resetSelection()
  }

  // Try to get removed tab and his panel
  if (!this.state.tabsMap[tabId]) return
  let creatingNewTab
  const tab = this.state.tabsMap[tabId]
  const panel = this.state.panelsMap[tab.cookieStoreId]

  // Recreate locked tab
  if (!tab.pinned && panel && panel.lockedTabs && tab.url.startsWith('http')) {
    browser.tabs.create({
      windowId: this.state.windowId,
      index: tab.index,
      url: tab.url,
      openerTabId: tab.parentId > -1 ? tab.parentId : undefined,
      cookieStoreId: tab.cookieStoreId,
    })
    creatingNewTab = true
  }

  // No-empty
  if (!tab.pinned && panel && panel.noEmpty && panel.tabs && panel.tabs.length === 1) {
    if (!creatingNewTab) {
      browser.tabs.create({
        windowId: this.state.windowId,
        index: panel.startIndex,
        cookieStoreId: panel.cookieStoreId,
        active: tab.active,
      })
    }
  }

  // Handle child tabs
  if (this.state.tabsTree && tab.isParent) {
    const toRemove = []
    for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
      const t = this.state.tabs[i]
      if (t.lvl <= tab.lvl) break

      // Remove folded tabs
      if (
        this.state.rmChildTabs === 'folded' && tab.folded ||
        this.state.rmChildTabs === 'all'
      ) {
        if (!this.state.removingTabs.includes(t.id)) toRemove.push(t.id)
      }

      // Down level
      if (t.parentId === tab.id) t.parentId = tab.parentId
    }

    // Remove child tabs
    if (this.state.rmChildTabs !== 'none' && toRemove.length) {
      this.actions.removeTabs(toRemove)
    }
  }

  // Update last active tab if needed
  if (tab.active && panel && panel.lastActiveTab >= 0) {
    panel.lastActiveTab = -1
  }

  // Shift tabs after removed one. (NOT detected by vue)
  for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
    this.state.tabs[i].index--
  }
  this.state.tabsMap[tabId] = undefined
  this.state.tabs.splice(tab.index, 1)

  // Remove tab from panel
  if (panel && panel.tabs) {
    if (!tab.pinned) panel.tabs.splice(tab.index - panel.startIndex, 1)
    this.actions.updatePanelsRanges()
  }

  // Remove updated flag
  if (panel && panel.tabs) {
    let i = panel.updated.indexOf(tabId)
    panel.updated.splice(i, 1)
  }

  if (!this.state.removingTabs.length) this.actions.recalcPanelScroll()

  // Update tree
  if (this.state.tabsTree && !this.state.removingTabs.length) {
    const startIndex = panel ? panel.startIndex : 0
    const endIndex = panel ? panel.endIndex + 1 : -1
    this.actions.updateTabsTree(startIndex, endIndex)
    this.actions.saveTabsTree()
  }

  // Update succession
  if (!this.state.removingTabs.length && this.state.activateAfterClosing !== 'none') {
    const activeTab = this.state.tabsMap[this.state.activeTabId]
    if (activeTab && activeTab.active) {
      const target = Utils.findSuccessorTab(this.state, activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  // Remove isOpen flag from bookmark
  if (this.state.highlightOpenBookmarks && this.state.bookmarksUrlMap && this.state.bookmarksUrlMap[tab.url]) {
    for (let t of this.state.tabs) {
      if (t.url === tab.url) return
    }
    for (let b of this.state.bookmarksUrlMap[tab.url]) {
      b.isOpen = false
    }
  }

  const groupTab = this.actions.getGroupTab(tab)
  if (groupTab && !groupTab.discarded) {
    browser.tabs.sendMessage(groupTab.id, { name: 'remove', id: tab.id})
      .catch(() => {/** itsokay **/})
  }
}

/**
 * tabs.onMoved
 */
function onTabMoved(id, info) {
  if (info.windowId !== this.state.windowId) return
  if (this.state.ignoreMovingTabs) return

  if (!this.state.movingTabs) this.state.movingTabs = []
  else this.state.movingTabs.splice(this.state.movingTabs.indexOf(id), 1)

  if (!this.state.movingTabs.length) {
    this.actions.closeCtxMenu()
    this.actions.resetSelection()
  }

  // Move tab in tabs array
  let movedTab = this.state.tabs.splice(info.fromIndex, 1)[0]
  if (!movedTab) {
    const i = this.state.tabs.findIndex(t => t.id === id)
    movedTab = this.state.tabs.splice(i, 1)[0]
  }
  if (!movedTab) return

  this.state.tabs.splice(info.toIndex, 0, movedTab)
  this.actions.recalcPanelScroll()

  // Update tabs indexes.
  const minIndex = Math.min(info.fromIndex, info.toIndex)
  const maxIndex = Math.max(info.fromIndex, info.toIndex)
  for (let i = minIndex; i <= maxIndex; i++) {
    if (this.state.tabs[i]) this.state.tabs[i].index = i
  }

  // Move tab in panel
  if (!this.state.tabsMap[id].pinned) {
    const panel = this.state.panelsMap[movedTab.cookieStoreId]
    if (panel && panel.tabs) {
      let t = panel.tabs[info.fromIndex - panel.startIndex]
      if (t && t.id === movedTab.id) {
        panel.tabs.splice(info.fromIndex - panel.startIndex, 1)
      }
      panel.tabs.splice(info.toIndex - panel.startIndex, 0, movedTab)
      this.actions.updatePanelsRanges()
    }
  }

  // Calc tree levels
  if (this.state.tabsTree && !this.state.movingTabs.length) {
    const panel = this.state.panels[this.state.panelIndex]
    const panelOk = panel && panel.tabs
    const startIndex = panelOk ? panel.startIndex : 0
    const endIndex = panelOk ? panel.endIndex + 1 : -1
    this.actions.updateTabsTree(startIndex, endIndex)
    this.actions.saveTabsTree()
  }

  // Update succession
  if (!this.state.movingTabs.length && this.state.activateAfterClosing !== 'none') {
    const activeTab = this.state.tabsMap[this.state.activeTabId]
    if (activeTab && activeTab.active) {
      const target = Utils.findSuccessorTab(this.state, activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }
}

/**
 * tabs.onDetached
 */
function onTabDetached(id, info) {
  if (info.oldWindowId !== this.state.windowId) return
  const tab = this.state.tabsMap[id]
  if (tab) tab.folded = false
  this.handlers.onTabRemoved(id, { windowId: this.state.windowId })
}

/**
 * tabs.onAttached
 */
async function onTabAttached(id, info) {
  if (info.newWindowId !== this.state.windowId) return

  if (!this.state.attachingTabs) this.state.attachingTabs = []
  const ai = this.state.attachingTabs.findIndex(t => t.id === id)

  let tab
  if (ai > -1) {
    tab = this.state.attachingTabs.splice(ai, 1)[0]
  } else {
    tab = await browser.tabs.get(id)
  }

  tab.windowId = this.state.windowId
  tab.index = info.newPosition

  this.handlers.onTabCreated(tab)

  if (tab.active) browser.tabs.update(tab.id, { active: true })
}

/**
 * tabs.onActivated
 */
function onTabActivated(info) {
  if (info.windowId !== this.state.windowId) return

  const currentPanel = this.state.panels[this.state.panelIndex]

  // Reset selection
  if (!this.state.dragNodes) this.actions.resetSelection()

  // Update previous active tab and store his id
  let prevActive = this.state.tabsMap[info.previousTabId]
  if (prevActive) {
    prevActive.active = false

    if (!this.state.actTabs) this.state.actTabs = []
    if (this.state.actTabs.length > 128) this.state.actTabs = this.state.actTabs.slice(32)
    this.state.actTabs.push(prevActive.id)
  }

  // Update tabs and find activated one
  let tab = this.state.tabsMap[info.tabId]
  if (!tab) return
  tab.active = true
  this.state.activeTabId = info.tabId

  // Remove updated flag
  tab.updated = false
  let panel = this.state.panelsMap[tab.cookieStoreId]
  if (panel) {
    let i = panel.updated.indexOf(tab.id)
    panel.updated.splice(i, 1)
  }

  // Find panel of activated tab
  if (tab.pinned && this.state.pinnedTabsPosition !== 'panel') return
  const tabPanel = this.state.panelsMap[tab.cookieStoreId]
  if (!tabPanel) return

  // Switch to activated tab's panel
  if (!currentPanel || !currentPanel.lockedPanel) {
    this.actions.setPanel(tabPanel.index)
  }

  // Reopen dashboard
  if (this.state.dashboardIsOpen) {
    if (this.state.dashboard.cookieStoreId !== this.state.panels[this.state.panelIndex].cookieStoreId) {
      this.actions.openDashboard(this.state.panelIndex)
    }
  }

  // Auto expand tabs group
  if (this.state.autoExpandTabs && tab.isParent && tab.folded && !this.dragMode) {
    let prevActiveChild
    for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
      if (this.state.tabs[i].lvl <= tab.lvl) break
      if (this.state.tabs[i].id === info.previousTabId) {
        prevActiveChild = true
        break
      }
    }
    if (!prevActiveChild) this.actions.expTabsBranch(tab.id)
  }
  if (tab.invisible) {
    this.actions.expTabsBranch(tab.parentId)
  }

  tabPanel.lastActiveTab = info.tabId
  if (!tab.pinned) this.eventBus.$emit('scrollToTab', tabPanel.index, info.tabId)

  // Update succession
  if (this.state.activateAfterClosing !== 'none') {
    const target = Utils.findSuccessorTab(this.state, tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (this.state.tabsTree && Utils.isGroupUrl(tab.url)) {
    this.actions.updateGroupTab(tab)
  } else {
    this.actions.resetUpdateGroupTabTimeout()
  }
}

/**
 * Setup listeners
 */
function setupTabsListeners() {
  browser.tabs.onCreated.addListener(this.handlers.onTabCreated)
  browser.tabs.onUpdated.addListener(this.handlers.onTabUpdated, {
    properties: [
      'audible',
      'discarded',
      'favIconUrl',
      'hidden',
      'mutedInfo',
      'pinned',
      'status',
      'title',
    ],
  })
  browser.tabs.onRemoved.addListener(this.handlers.onTabRemoved)
  browser.tabs.onMoved.addListener(this.handlers.onTabMoved)
  browser.tabs.onDetached.addListener(this.handlers.onTabDetached)
  browser.tabs.onAttached.addListener(this.handlers.onTabAttached)
  browser.tabs.onActivated.addListener(this.handlers.onTabActivated)
}

/**
 * Remove listeners
 */
function resetTabsListeners() {
  browser.tabs.onCreated.removeListener(this.handlers.onTabCreated)
  browser.tabs.onUpdated.removeListener(this.handlers.onTabUpdated)
  browser.tabs.onRemoved.removeListener(this.handlers.onTabRemoved)
  browser.tabs.onMoved.removeListener(this.handlers.onTabMoved)
  browser.tabs.onDetached.removeListener(this.handlers.onTabDetached)
  browser.tabs.onAttached.removeListener(this.handlers.onTabAttached)
  browser.tabs.onActivated.removeListener(this.handlers.onTabActivated)
}

export default {
  onTabCreated,
  onTabUpdated,
  onTabRemoved,
  onTabMoved,
  onTabAttached,
  onTabDetached,
  onTabActivated,
  setupTabsListeners,
  resetTabsListeners,
}