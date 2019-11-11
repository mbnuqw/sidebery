import Utils from '../../utils'
import Logs from '../../logs'
import EventBus from '../../event-bus'
import { DEFAULT_CTX_ID } from '../../defaults'
import Actions from '../actions'

const URL_WITHOUT_PROTOCOL_RE = /^(.+\.)\/?(.+\/)?\w+/

let TabsTreeSaveTimeout, updateGroupTabTimeouit, urlRuleHistory = {}

/**
 * Load all tabs for current window
 */
async function loadTabs(fresh = true) {
  let windowId = browser.windows.WINDOW_ID_CURRENT
  let [ tabs, storage ] = await Promise.all([
    browser.tabs.query({ windowId }),
    browser.storage.local.get({ tabsData: [] }),
  ])

  let activePanel = this.state.panels[this.state.panelIndex] || this.state.panels[1]
  let tabsData = storage ? storage.tabsData : []
  let activeTab

  // Set tabs initial props and update state
  this.state.tabsMap = []
  for (let t of tabs) {
    Utils.normalizeTab(t, DEFAULT_CTX_ID)
    if (this.state.highlightOpenBookmarks && this.state.bookmarksUrlMap && this.state.bookmarksUrlMap[t.url]) {
      for (let b of this.state.bookmarksUrlMap[t.url]) {
        b.isOpen = true
      }
    }
    this.state.tabsMap[t.id] = t
    if (t.active) activeTab = t
    if (t.active) this.state.activeTabId = t.id
  }

  tabsData = Utils.findDataForTabs(tabs, tabsData)
  if (!tabsData.length) {
    let storage = await browser.storage.local.get({ prevTabsTrees: [] } )
    tabsData = Utils.findDataForTabs(tabs, storage.prevTabsTrees)
  }

  let idsMap = {}
  for (let tab, tabData, i = 0; i < tabsData.length; i++) {
    tabData = tabsData[i]
    if (!tabData || tabData.index === undefined) continue

    // Recreate group tab (e.g. after addon was disabled-enabled)
    if (!tab && tabData.isMissedGroup) {
      let groupId = Utils.getGroupId(tabData.url)
      let url = browser.runtime.getURL('group/group.html') + `#${groupId}`
      let restoredTab = await browser.tabs.create({
        windowId: this.state.windowId,
        index: tabData.index,
        url,
        cookieStoreId: tabData.ctx,
        active: false,
      })
      Utils.normalizeTab(restoredTab)
      tabs.splice(tabData.index, 0, restoredTab)
      this.state.tabsMap[restoredTab.id] = restoredTab
      for (let i = tabData.index + 1; i < tabs.length; i++) {
        tabs[i].index = i
      }
    }

    tab = tabs[tabData.index]
    if (!tab) break

    tab.panelId = tabData.panelId || DEFAULT_CTX_ID
    if (idsMap[tabData.parentId] >= 0) tab.parentId = idsMap[tabData.parentId]
    tab.folded = tabData.folded
    idsMap[tabData.id] = tab.id
  }

  this.state.tabs = tabs
  Actions.updateTabsTree()

  // Switch to panel with active tab
  if (fresh) {
    const activePanelIsTabs = activePanel.panel === 'TabsPanel'
    const activePanelIsOk = activeTab.cookieStoreId === activePanel.cookieStoreId
    if (!activeTab.pinned && activePanelIsTabs && !activePanelIsOk) {
      const panel = this.state.panelsMap[activeTab.cookieStoreId]
      if (panel) {
        this.state.panelIndex = panel.index
        this.state.lastPanelIndex = panel.index
      }
    }
  }

  // Update succession
  if (this.state.activateAfterClosing !== 'none' && activeTab) {
    const target = Utils.findSuccessorTab(this.state, activeTab)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  // Update panels
  Actions.updatePanelsTabs()

  Logs.push('[INFO] Tabs loaded')
}

/**
 * Check order of tabs and get moves for normalizing
 */
function getOrderNormMoves(tabs, tabsPanelIds) {
  let moves = []
  let tabsPanels = []
  let index = tabs.filter(t => t.pinned).length
  let offset = 0
  let type, panelId
  for (let panel of this.state.panels) {
    type = panel.type
    if (type === 'bookmarks') continue

    for (let tab, j = 0; j < tabs.length; j++) {
      tab = tabs[j]
      panelId = tabsPanelIds[tab.index]
      if (tab.pinned) continue
      if (type === 'ctx' && tab.cookieStoreId !== panel.cookieStoreId) continue
      if (type === 'default' || type === 'tabs') {
        if (!panelId) tabsPanelIds[tab.index] = panel.id
        if (this.state.panelsMap[panelId] && panelId !== panel.id) continue
      }

      if (type === 'ctx' && panelId !== panel.id) {
        tabsPanels.push([tab.id, panel.id])
      }
      if (index !== tab.index + offset) {
        moves.push([tab.id, index])
        offset++
      }
      index++
    }
  }
  return [moves, tabsPanels]
}

/**
 * Normalize order of tabs
 */
async function normalizeTabsOrder(moves) {
  this.state.ignoreMovingTabs = true
  for (let move of moves) {
    await browser.tabs.move(move[0], { index: move[1] })
  }
  if (moves.length) Logs.push('[INFO] Tabs order was normalized')
  this.state.ignoreMovingTabs = false
}

/**
 * Find start index of tree tabs branch in provided array of tabs.
 */
function findBranchStartIndex(array, subArray, startIndex) {
  for (let t of subArray) {
    t.isGroup = Utils.isGroupUrl(t.url)
  }

  for (let i = startIndex; i < array.length; i++) {
    let similarity = 0
    let startOffset = 0, innerOffset = 0
    for (let j = 0; j < subArray.length; j++) {
      let a = array[i+j-innerOffset]
      let s = subArray[j]
      if (!a) return -1
      if (a.url === s.url && a.cookieStoreId === s.ctx) {
        similarity++
      } else if (s.isGroup) {
        similarity++
        if (!similarity) startOffset++
        else innerOffset++
      } else if (a.active && a.url === 'about:blank') {
        similarity++
      }
    }
    if (similarity === subArray.length) return i + startOffset
  }
  return -1
}

/**
 * Create new group tab with provided props
 */
async function restoreGroupTab(tabInfo, index, parents) {
  let groupId = Utils.getGroupId(tabInfo.url)
  let url = browser.runtime.getURL('group/group.html') + `#${groupId}`
  let restoredTab = await browser.tabs.create({
    windowId: this.state.windowId,
    index,
    url,
    cookieStoreId: tabInfo.ctx,
    active: false,
  })

  restoredTab.url = url
  if (tabInfo.isParent) parents[tabInfo.id] = restoredTab.id
  restoredTab.isParent = tabInfo.isParent
  restoredTab.parentId = parents[tabInfo.parentId] || -1
  restoredTab.folded = tabInfo.folded
  restoredTab.lvl = 0
  restoredTab.invisible = false
  restoredTab.sel = false
  restoredTab.updated = false
  restoredTab.loading = false
  restoredTab.warn = false

  this.state.tabs.splice(index, 0, restoredTab)
  this.state.tabsMap[restoredTab.id] = restoredTab

  for (let k = index + 1; k < this.state.tabs.length; k++) {
    this.state.tabs[k].index++
  }
}

/**
 * Restore tabs tree
 */
async function restoreTabsTree() {
  let { tabsTrees, prevTabsTrees } = await browser.storage.local.get({
    tabsTrees: [],
    prevTabsTrees: [],
  })
  tabsTrees = tabsTrees.concat(prevTabsTrees)

  let pinnedTabsCount = 0
  for (; pinnedTabsCount < this.state.tabs.length; pinnedTabsCount++) {
    if (!this.state.tabs[pinnedTabsCount].pinned) break
  }

  for (let tab of this.state.tabs) {
    if (tab.openerTabId > -1) tab.parentId = tab.openerTabId
  }

  perTree:
  for (let tree of tabsTrees) {
    let parents = []
    let tabIndex = pinnedTabsCount

    // Separate tree into branches
    let branches = tree.reduce((a, v) => {
      if (v.parentId === -1) a.push([v])
      else if (a[a.length - 1]) a[a.length - 1].push(v)
      return a
    }, [])

    for (let branch of branches) {
      if (branch.length <= 1) continue perTree

      let branchIndex = findBranchStartIndex(this.state.tabs, branch, tabIndex)
      if (branchIndex === -1) continue perTree
      else tabIndex = branchIndex

      for (let treeTab of branch) {
        let tab = this.state.tabs[tabIndex]
        if (tab.url === treeTab.url || (tab.active && tab.url === 'about:blank')) {
          if (treeTab.isParent) parents[treeTab.id] = tab.id
          tab.isParent = treeTab.isParent
          tab.parentId = parents[treeTab.parentId] || -1
          tab.folded = treeTab.folded
        } else {
          await Actions.restoreGroupTab(treeTab, tabIndex, parents)
        }
        tabIndex++
      }
    }
    break
  }
  Actions.updateTabsTree()
}

/**
 * Save tabs data
 */
function saveTabsData(delay = 300) {
  if (this._saveTabsDataTimeout) clearTimeout(this._saveTabsDataTimeout)
  this._saveTabsDataTimeout = setTimeout(() => {
    let data = []
    for (let tab of this.state.tabs) {
      data.push({
        id: tab.id,
        panelId: tab.panelId,
        parentId: tab.parentId,
        folded: tab.folded,
        url: tab.url,
        ctx: tab.cookieStoreId,
      })
    }

    if (this.state.bg && !this.state.bg.error) {
      this.state.bg.postMessage({
        action: 'saveTabsData',
        args: [this.state.windowId, data],
      })
    } else {
      browser.runtime.sendMessage({
        instanceType: 'bg',
        action: 'saveTabsData',
        args: [this.state.windowId, data],
      })
    }
  }, delay)
}

/**
 * Save tabs tree
 */
function saveTabsTree(delay = 300) {
  if (TabsTreeSaveTimeout) clearTimeout(TabsTreeSaveTimeout)
  TabsTreeSaveTimeout = setTimeout(() => {
    const tabsTreeState = []
    for (let t of this.state.tabs) {
      if (t.isParent || t.parentId > -1) {
        tabsTreeState.push({
          id: t.id,
          index: t.index,
          url: t.url,
          ctx: t.cookieStoreId,
          isParent: t.isParent,
          folded: t.folded,
          parentId: t.parentId,
        })
      }
    }

    if (this.state.bg && !this.state.bg.error) {
      this.state.bg.postMessage({
        action: 'saveTabsTree',
        args: [this.state.windowId, tabsTreeState],
      })
    } else {
      browser.runtime.sendMessage({
        instanceType: 'bg',
        action: 'saveTabsTree',
        args: [this.state.windowId, tabsTreeState],
      })
    }
    TabsTreeSaveTimeout = null
  }, delay)
}

/**
 * Scroll to active tab
 */
function scrollToActiveTab() {
  const activePanel = this.state.panels[this.state.panelIndex]
  if (activePanel && activePanel.tabs) {
    const activeTab = activePanel.tabs.find(t => t.active)
    if (activeTab) {
      EventBus.$emit('scrollToTab', this.state.panelIndex, activeTab.id)
    }
  }
}

/**
 * Create new tab in current window
 */
function createTab(ctxId) {
  if (!ctxId) return
  let p = this.state.panelsMap[ctxId]
  if (!p || !p.tabs) return
  let index = p.tabs.length ? p.endIndex + 1 : p.startIndex
  browser.tabs.create({ index, cookieStoreId: ctxId, windowId: this.state.windowId })
}

/**
 * Remove tabs
 */
async function removeTabs(tabIds) {
  if (!tabIds || !tabIds.length) return
  if (!this.state.tabsMap[tabIds[0]]) return
  let panelId = this.state.tabsMap[tabIds[0]].panelId
  let panel = this.state.panelsMap[panelId]
  // const ctxId = this.state.tabsMap[tabIds[0]].cookieStoreId
  // const panel = this.actions.getTabPanel(tabIds[0])
  if (!panel) return

  let tabsMap = {}
  let hasInvisibleTab = false
  for (let id of tabIds) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue
    if (tab.panelId !== panelId) continue
    if (panel.lockedTabs && !tab.url.startsWith('about')) continue

    tabsMap[id] = tab
    if (tab.invisible) hasInvisibleTab = true

    if (
      this.state.rmChildTabs === 'folded' && tab.folded ||
      this.state.rmChildTabs === 'all'
    ) {
      for (let t, i = tab.index + 1; i < this.state.tabs.length; i++) {
        t = this.state.tabs[i]
        if (t.lvl <= tab.lvl) break
        if (t.invisible) hasInvisibleTab = true
        tabsMap[t.id] = t
      }
    }
  }

  let count = Object.keys(tabsMap).length
  let warn = this.state.warnOnMultiTabClose === 'any' ||
    (hasInvisibleTab && this.state.warnOnMultiTabClose === 'collapsed')
  if (warn && count > 1) {
    let ok = await this.actions.confirm(`Are you sure you want to close ${count} tabs?`)
    if (!ok) return
  }

  // Set tabs to be removed
  const tabs = Object.values(tabsMap).sort((a, b) => a.index - b.index)
  const toRemove = tabs.map(t => {
    t.invisible = true
    return t.id
  })
  if (this.state.removingTabs && this.state.removingTabs.length) {
    this.state.removingTabs = [...this.state.removingTabs, ...toRemove]
  } else {
    this.state.removingTabs = [...toRemove]
  }

  // No-empty panels
  if (tabs.length === panel.tabs.length && panel.noEmpty) {
    let conf = { windowId: this.state.windowId, index: panel.startIndex }
    if (panel.type === 'ctx') conf.cookieStoreId = panel.cookieStoreId
    await browser.tabs.create(conf)
  }

  // Update successorTabId if there are active tab
  let activeTab = tabs.find(t => t.active)
  if (activeTab) {
    let target = Utils.findSuccessorTab(this.state, activeTab, tabs.map(t => t.id))
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  browser.tabs.remove(toRemove)

  this.actions.checkRemovedTabs()
}

/**
 * Helper function for checking if some of tabs
 * wasn't removed (e.g. tabs with onbeforeunload)
 */
function checkRemovedTabs() {
  if (this._checkRemovedTabsTimeout) clearTimeout(this._checkRemovedTabsTimeout)
  this._checkRemovedTabsTimeout = setTimeout(() => {
    this._checkRemovedTabsTimeout = null

    if (!this.state.removingTabs || !this.state.removingTabs.length) return
    for (let tabId of this.state.removingTabs) {
      if (this.state.tabsMap[tabId]) this.state.tabsMap[tabId].invisible = false
    }
  }, 500)
}

/**
 * Activate tab relatively current active tab.
 */
function switchTab(globaly, cycle, step, pinned) {
  if (this.state.switchTabPause) return
  this.state.switchTabPause = setTimeout(() => {
    clearTimeout(this.state.switchTabPause)
    this.state.switchTabPause = null
  }, 50)

  const panel = this.state.panels[this.state.panelIndex]
  let tabs
  if (this.state.pinnedTabsPosition === 'panel') {
    if (globaly) {
      tabs = []
      for (let p of this.state.panels) {
        if (!p.tabs) continue
        for (let t of this.state.tabs) {
          if (t.panelId === p.id) tabs.push(t)
        }
      }
    } else {
      tabs = this.state.tabs.filter(t => t.panelId === panel.id)
    }
  } else {
    if (pinned) tabs = this.getters.pinnedTabs
    else tabs = globaly ? this.state.tabs : panel.tabs
  }
  if (!tabs || !tabs.length) return

  let visibleOnly = this.state.scrollThroughVisibleTabs
  let skipDiscarded = this.state.scrollThroughTabsSkipDiscarded
  if (visibleOnly || skipDiscarded) {
    tabs = tabs.filter(t => {
      if (visibleOnly && t.invisible) return false
      if (skipDiscarded && t.discarded) return false
      return true
    })
  }

  let index = tabs.findIndex(t => t.active)
  if (step > 0) {
    index += step
    if (index >= tabs.length) {
      if (cycle) index = 0
      else return
    }
  }
  if (step < 0) {
    if (index < 0) index = tabs.length
    index += step
    if (index < 0) {
      if (cycle) index = tabs.length - 1
      else return
    }
  }

  browser.tabs.update(tabs[index].id, { active: true })
}

/**
 * Reload tabs
 */
function reloadTabs(tabIds = []) {
  for (let tabId of tabIds) {
    const tab = this.state.tabsMap[tabId]
    if (!tab) continue
    if (tab.url === 'about:blank' && URL_WITHOUT_PROTOCOL_RE.test(tab.title)) {
      browser.tabs.update(tabId, { url: 'https://' + tab.title })
      continue
    }
    if (tab.url.startsWith('about:') && tab.status === 'loading') continue
    browser.tabs.reload(tabId)
  }
}

/**
 * Discard tabs
 */
function discardTabs(tabIds = []) {
  browser.tabs.discard(tabIds)
}

/**
 * Try to activate last active tab on the panel
 */
function activateLastActiveTabOf(panelIndex) {
  const p = this.state.panels[panelIndex]
  if (!p || !p.tabs || !p.tabs.length) return
  const tab = this.state.tabsMap[p.lastActiveTab]
  if (tab && tab.cookieStoreId === p.cookieStoreId) {
    browser.tabs.update(tab.id, { active: true })
  } else {
    let lastTab = p.tabs[p.tabs.length - 1]
    for (let i = p.tabs.length; i-- && lastTab.invisible; ) {
      lastTab = p.tabs[i]
    }
    if (lastTab) browser.tabs.update(lastTab.id, { active: true })
  }
}

/**
 * (un)Pin tabs
 */
function pinTabs(tabIds) {
  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
      const child = this.state.tabs[i]
      if (child.lvl <= tab.lvl) break
      if (child.parentId === tab.id) child.parentId = tab.parentId
    }
    browser.tabs.update(tabId, { pinned: true })
  }
}
function unpinTabs(tabIds) {
  for (let tabId of tabIds) browser.tabs.update(tabId, { pinned: false })
}
function repinTabs(tabIds) {
  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
      const child = this.state.tabs[i]
      if (child.lvl <= tab.lvl) break
      if (child.parentId === tab.id) child.parentId = tab.parentId
    }
    browser.tabs.update(tabId, { pinned: !tab.pinned })
  }
}

/**
 * (un)Mute tabs
 */
function muteTabs(tabIds) {
  for (let tabId of tabIds) browser.tabs.update(tabId, { muted: true })
}
function unmuteTabs(tabIds) {
  for (let tabId of tabIds) browser.tabs.update(tabId, { muted: false })
}
function remuteTabs(tabIds) {
  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab) continue
    browser.tabs.update(tabId, { muted: !tab.mutedInfo.muted })
  }
}

/**
 * Duplicate tabs
 */
async function duplicateTabs(tabIds) {
  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab) continue

    let index = tab.index + 1
    for (let t; index < this.state.tabs.length; index++) {
      t = this.state.tabs[index]
      if (t.lvl <= tab.lvl) break
    }

    if (!this.state.newTabsPosition) this.state.newTabsPosition = {}
    this.state.newTabsPosition[index] = {
      panel: tab.panelId,
      parent: tab.parentId,
    }

    await browser.tabs.create({
      windowId: this.state.windowId,
      index,
      cookieStoreId: tab.cookieStoreId,
      url: Utils.normalizeUrl(tab.url),
    })
  }
}

/**
 * Close tabs duplicates
 */
function dedupTabs(tabIds) {
  if (!tabIds || !tabIds.length) return

  let urls = []
  let toRemove = []
  for (let id of tabIds) {
    let tab = this.state.tabsMap[id]
    if (!tab) return

    if (urls.includes(tab.url)) toRemove.push(tab.id)
    else urls.push(tab.url)
  }

  this.actions.removeTabs(toRemove)
}

/**
 * Create bookmarks from tabs
 */
async function bookmarkTabs(tabIds) {
  EventBus.$emit('panelLoadingStart', 0)

  let dirId = 'unfiled_____'

  if (this.state.askNewBookmarkPlace) {
    dirId = await this.actions.askNewBookmarkFolder(dirId)
    if (!dirId) return
  }

  let sorted = tabIds.sort((a, b) => {
    let aTab = this.state.tabsMap[a]
    let bTab = this.state.tabsMap[b]
    if (!aTab || !bTab) return 0
    return aTab.index - bTab.index
  })

  if (this.state.tabsTreeBookmarks) {
    let folders = {}
    for (let tabId of sorted) {
      let tab = this.state.tabsMap[tabId]
      if (!tab) continue
      if (tab.isParent) folders[tab.id] = []
      if (tab.parentId && folders[tab.parentId]) folders[tab.parentId].push(tab)
    }
    for (let tabId of sorted) {
      let tab = this.state.tabsMap[tabId]
      if (!tab) continue

      let parent = folders[tab.parentId]
      if (!parent && tab.parentId >= 0) {
        let parentTab = this.state.tabsMap[tab.parentId]
        while (parentTab) {
          parent = folders[parentTab.id]
          if (parent) break
          parentTab = this.state.tabsMap[parentTab.parentId]
        }
      }
      let parentId = parent && parent.id ? parent.id : dirId

      if (folders[tab.id] && folders[tab.id].length) {
        let folder = await browser.bookmarks.create({
          title: tab.title,
          type: 'folder',
          parentId,
        })
        folders[tab.id] = folder
        if (tab.url.startsWith('moz-extension')) continue
        await browser.bookmarks.create({
          title: tab.title,
          url: tab.url,
          parentId: folder.id,
        })
        continue
      }

      await browser.bookmarks.create({
        title: tab.title,
        url: tab.url,
        parentId,
      })
    }
  } else {
    for (let tabId of sorted) {
      let tab = this.state.tabsMap[tabId]
      if (!tab) continue
      await browser.bookmarks.create({
        title: tab.title,
        url: tab.url,
        parentId: dirId,
      })
    }
  }
  EventBus.$emit('panelLoadingOk', 0)
}

/**
 * Clear all cookies of tab urls
 */
async function clearTabsCookies(tabIds) {
  if (!this.state.permAllUrls) return Actions.openSettings('all-urls')

  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab) continue

    tab.loading = true

    let url = new URL(tab.url)
    let domain = url.hostname
      .split('.')
      .slice(-2)
      .join('.')

    if (!domain) {
      tab.loading = 'err'
      setTimeout(() => { tab.loading = false }, 2000)
      continue
    }

    let cookies = await browser.cookies.getAll({
      domain: domain,
      storeId: tab.cookieStoreId,
    })
    let fpcookies = await browser.cookies.getAll({
      firstPartyDomain: domain,
      storeId: tab.cookieStoreId,
    })

    const clearing = cookies.concat(fpcookies).map(c => {
      return browser.cookies.remove({
        storeId: tab.cookieStoreId,
        url: tab.url,
        name: c.name,
      })
    })

    Promise.all(clearing)
      .then(() => {
        setTimeout(() => { tab.loading = 'ok' }, 250)
        setTimeout(() => { tab.loading = false }, 2000)
      })
      .catch(() => {
        setTimeout(() => { tab.loading = 'err' }, 250)
        setTimeout(() => { tab.loading = false }, 2000)
      })
  }
}

/**
 * Create new window with first tab
 * and then move other tabs.
 */
async function moveTabsToNewWin(tabIds, incognito) {
  let tabs = []
  for (let id of tabIds) {
    const tab = this.state.tabsMap[id]
    if (!tab) continue
    tabs.push(Utils.cloneObject(tab))
    if (tab.folded) {
      for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
        let childTab = this.state.tabs[i]
        if (childTab.lvl <= tab.lvl) break
        tabs.push(Utils.cloneObject(childTab))
      }
    }
  }

  let win = await browser.windows.create({ incognito })
  let firstTab = win.tabs[0]

  await browser.runtime.sendMessage({
    instanceType: 'bg',
    action: 'moveTabsToWin',
    args: [win.id, tabs, this.state.private, firstTab.id],
  })

  this.actions.saveTabsData()
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(tabIds, window) {
  let windowId = window ? window.id : await Actions.chooseWin()

  let tabs = []
  for (let id of tabIds) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue
    tabs.push(Utils.cloneObject(tab))
    if (tab.folded) {
      for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
        let childTab = this.state.tabs[i]
        if (childTab.lvl <= tab.lvl) break
        tabs.push(Utils.cloneObject(childTab))
      }
    }
  }

  await browser.runtime.sendMessage({
    windowId: windowId,
    instanceType: 'sidebar',
    action: 'moveTabsToThisWin',
    args: [tabs, this.state.private],
  })

  this.actions.saveTabsData()
}

/**
 * Move (or reopen) provided tabs in current window.
 */
async function moveTabsToThisWin(tabs, fromPrivate) {
  if (this.state.private === fromPrivate) {
    if (!this.state.attachingTabs) this.state.attachingTabs = [...tabs]
    else this.state.attachingTabs.push(...tabs)

    let containerId = tabs[0].cookieStoreId
    let panel = this.state.panelsMap[containerId]
    let index = panel ? panel.endIndex : -1
    if (panel && !panel.tabs.length) index--

    for (let tab of tabs) {
      if (index > -1) index++
      let [t] = await browser.tabs.move(tab.id, {
        windowId: this.state.windowId,
        index: tab.pinned ? 0 : index,
      })
      if (t) tab.discarded = !!t.discarded
    }
  } else {
    const oldNewMap = {}
    for (let tab of tabs) {
      let conf = { url: tab.url, windowId: this.state.windowId }

      if (oldNewMap[tab.parentId]) conf.openerTabId = oldNewMap[tab.parentId]

      let newTab = await browser.tabs.create(conf)
      browser.tabs.remove(tab.id)

      oldNewMap[tab.id] = newTab.id
    }
  }

  return true
}

/**
 * Move tabs (reopen url) in provided context.
 */
async function moveTabsToCtx(tabIds, ctxId) {
  let ids = [...tabIds]
  let oldNewMap = {}
  let ctxPanel = this.state.panels.find(p => {
    return p.type === 'ctx' && p.cookieStoreId === ctxId
  })
  let index = ctxPanel ? ctxPanel.endIndex + 1 : -1
  for (let id of ids) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue

    let createConf = {
      active: tab.active,
      windowId: this.state.windowId,
      cookieStoreId: ctxId,
      url: Utils.normalizeUrl(tab.url),
    }

    if (index === -1) createConf.index = tab.index
    else createConf.index = index++

    if (oldNewMap[tab.parentId] >= 0) {
      createConf.openerTabId = oldNewMap[tab.parentId]
    }

    let newTab = await browser.tabs.create(createConf)

    oldNewMap[tab.id] = newTab.id
  }

  this.state.removingTabs = [...ids]
  await browser.tabs.remove(ids)

  if (this.state.tabsTree) {
    Actions.updateTabsTree()
  }
}

// /**
//  * Move tabs to panel
//  */
// function moveTabsToPanel(tabIds, panelId) {
//   let ids = [...tabIds]
//   let panel = this.state.panelsMap[panelId]
//   if (!panel) return

//   let index = this.actions.

//   this.state.movingTabs = []
//   for (let tabId of tabIds) {
//     let tab = this.state.tabsMap[tabId]
//     if (!tab) continue
//     tab.destPanelId = panelId
//     this.state.movingTabs.push(tab.id)
//   }
//   browser.tabs.move([...this.state.movingTabs], { windowId: this.state.windowId, index: dropIndex })
// }

/**
 * Show all tabs
 */
async function showAllTabs() {
  const tabsToShow = this.state.tabs.filter(t => t.hidden).map(t => t.id)
  if (!tabsToShow.length) return null
  return browser.tabs.show(tabsToShow)
}

/**
 * Update tabs visability
 */
function updateTabsVisability() {
  const hideFolded = this.state.hideFoldedTabs
  const hideInact = this.state.hideInact
  const actPanelIndex = this.state.panelIndex < 0 ? this.state.lastPanelIndex : this.state.panelIndex
  const actPanel = this.state.panels[actPanelIndex]
  if (!actPanel || !actPanel.tabs) return
  const actCtx = actPanel.cookieStoreId

  const toShow = []
  const toHide = []
  for (let tab of this.state.tabs) {
    if (tab.pinned) continue

    if (hideFolded && tab.invisible) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (hideInact && tab.cookieStoreId !== actCtx) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (tab.hidden) toShow.push(tab.id)
  }

  if (toShow.length) browser.tabs.show(toShow)
  if (toHide.length) browser.tabs.hide(toHide)
}

/**
 * Hide children of tab
 */
function foldTabsBranch(tabId) {
  const toHide = []
  const tab = this.state.tabsMap[tabId]
  if (!tab) return
  tab.folded = true
  for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
    const t = this.state.tabs[i]
    if (t.lvl <= tab.lvl) break
    if (t.active) browser.tabs.update(tabId, { active: true })
    if (!t.invisible) {
      t.invisible = true
      toHide.push(t.id)
    }
  }

  // Update succession
  if (tab.active) {
    const target = Utils.findSuccessorTab(this.state, tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (this.state.discardFolded) {
    if (this.state.discardFoldedDelay === 0) {
      toHide.map(id => browser.tabs.discard(id))
    } else {
      let delayMS = this.state.discardFoldedDelay
      if (this.state.discardFoldedDelayUnit === 'sec') delayMS *= 1000
      if (this.state.discardFoldedDelayUnit === 'min') delayMS *= 60000
      setTimeout(() => {
        let stillValid = toHide.every(id => {
          return this.state.tabsMap[id] && this.state.tabsMap[id].invisible
        })
        if (stillValid) browser.tabs.discard(toHide)
      }, delayMS)
    }
  }

  if (this.state.hideFoldedTabs && toHide.length) {
    browser.tabs.hide(toHide)
  }
  Actions.saveTabsData()
}

/**
 * Show children of tab
 */
function expTabsBranch(tabId) {
  const toShow = []
  const preserve = []
  const tab = this.state.tabsMap[tabId]
  if (!tab) return
  if (tab.invisible) Actions.expTabsBranch(tab.parentId)
  for (let t of this.state.tabs) {
    if (this.state.autoFoldTabs && t.id !== tabId && t.isParent && !t.folded && tab.lvl === t.lvl) {
      Actions.foldTabsBranch(t.id)
    }
    if (t.id === tabId) t.folded = false
    if (t.id !== tabId && t.folded) preserve.push(t.id)
    if (t.parentId === tabId || toShow.includes(t.parentId)) {
      if (t.invisible && (t.parentId === tabId || !preserve.includes(t.parentId))) {
        toShow.push(t.id)
        t.invisible = false
      }
    }
  }

  // Update succession
  if (tab.active) {
    const target = Utils.findSuccessorTab(this.state, tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (this.state.hideFoldedTabs && toShow.length) {
    browser.tabs.show(toShow)
  }
  Actions.saveTabsData()
}

/**
 * Toggle tabs branch visability (fold/expand)
 */
async function toggleBranch(tabId) {
  const rootTab = this.state.tabsMap[tabId]
  if (!rootTab) return
  if (rootTab.folded) Actions.expTabsBranch(tabId)
  else Actions.foldTabsBranch(tabId)
}

/**
 * Collaplse all inactive branches.
 */
function foldAllInactiveBranches(tabs = []) {
  let toFold = []
  let activeTab
  let actParentId

  for (let tab of tabs) {
    if (tab.active && (tab.lvl > 0 || tab.isParent)) {
      activeTab = tab
      actParentId = tab.parentId
      continue
    }

    if (tab.isParent && !tab.folded) {
      if (activeTab) {
        if (tab.lvl > activeTab.lvl) continue
        else activeTab = null
      }
      toFold.push(tab)
    }
  }

  for (let tab, i = toFold.length; i--; ) {
    tab = toFold[i]
    if (tab.id === actParentId) {
      actParentId = tab.parentId
      continue
    }
    this.actions.foldTabsBranch(tab.id)
  }
}

/**
 * Drop to tabs panel
 */
async function dropToTabs(event, dropIndex, dropParent, nodes, pin) {
  let currentPanel = this.state.panels[this.state.panelIndex]
  let destCtx = currentPanel.cookieStoreId
  if (dropIndex === -1) dropIndex = currentPanel.endIndex + 1

  // Tabs or Bookmarks
  if (nodes && nodes.length) {
    let globalPin = pin && currentPanel.panel !== 'TabsPanel'
    let ctxChange = currentPanel.type === 'ctx' &&
      nodes[0].cookieStoreId !== currentPanel.cookieStoreId
    let sameContainer = ctxChange ? nodes[0].ctx === destCtx : true

    // Move tabs
    if (nodes[0].type === 'tab' && (sameContainer || globalPin) && !event.ctrlKey) {
      this.actions.moveDroppedNodes(dropIndex, dropParent, nodes, pin, currentPanel)
    } else {
      this.actions.recreateDroppedNodes(event, dropIndex, dropParent, nodes, pin, destCtx)
    }
  }

  // Native event
  if (!nodes) {
    this.actions.dropToTabsNative(event, dropIndex, dropParent, destCtx, pin)
  }
}

/**
 * Move dropped tabs in current panel / pinned dock
 */
async function moveDroppedNodes(dropIndex, dropParent, nodes, pin, currentPanel) {
  let parent = this.state.tabsMap[dropParent]
  let parentId = parent ? parent.id : -1
  let toHide = []
  let toShow = []
  let sameWindow = nodes[0].windowId === this.state.windowId

  // Move to different window
  if (!sameWindow) {
    let firstNode = nodes[0]
    for (let node of nodes) {
      if (node.lvl <= firstNode.lvl) node.parentId = parentId
    }
    this.state.attachingTabs = [...nodes]
    for (let i = 0; i < nodes.length; i++) {
      let index = dropIndex + i
      if (nodes[i].pinned && !pin) {
        await browser.tabs.update(nodes[i].id, { pinned: false })
        nodes[i].pinned = false
      }
      if (!nodes[i].pinned && pin) {
        await browser.tabs.update(nodes[i].id, { pinned: true })
        nodes[i].pinned = true
      }
      let [t] = await browser.tabs.move(nodes[i].id, {
        windowId: this.state.windowId,
        index,
      })
      nodes[i].discarded = !!t.discarded
    }
    return
  }

  // Check if tabs was dropped to same place
  const inside = dropIndex > nodes[0].index && dropIndex <= nodes[nodes.length - 1].index
  const inFirst = nodes[0].id === dropParent
  const inLast = nodes[nodes.length - 1].id === dropParent
  if (inside || inFirst || inLast) return

  // Normalize dropIndex for tabs droped to the same panel
  // If dropIndex is greater that first tab index - decrease it by 1
  dropIndex = dropIndex <= nodes[0].index ? dropIndex : dropIndex - 1

  // Get dragged tabs
  const tabs = []
  for (let n of nodes) {
    let tab = this.state.tabsMap[n.id]
    if (!tab) return
    tab.destPanelId = currentPanel.id
    tabs.push(tab)
  }

  let pinTab = pin && !tabs[0].pinned
  let unpinTab = !pin && tabs[0].pinned

  // Unpin tab
  if (unpinTab) {
    for (let t of tabs) {
      await browser.tabs.update(t.id, { pinned: false })
    }
  }

  // Pin tab
  if (pinTab) {
    for (let t of tabs) {
      t.lvl = 0
      t.parentId = -1
      await browser.tabs.update(t.id, { pinned: true })
    }
  }

  // Move if target index is different or pinned state changed
  const moveIndexOk = tabs[0].index !== dropIndex && tabs[tabs.length - 1].index !== dropIndex
  if (moveIndexOk || pinTab || unpinTab) {
    this.state.movingTabs = []
    for (let tab of tabs) {
      tab.destPanelId = currentPanel.id
      this.state.movingTabs.push(tab.id)
    }
    browser.tabs.move([...this.state.movingTabs], { windowId: this.state.windowId, index: dropIndex })
  }

  if (tabs[0].panelId !== currentPanel.id) {
    for (let tab of tabs) {
      tab.panelId = currentPanel.id
    }
    this.actions.updatePanelsTabs()
  }

  // Update tabs tree
  if (this.state.tabsTree) {
    // Set first tab parentId and other parameters
    tabs[0].parentId = parentId

    // Get level offset for gragged branch
    let minLvl = tabs[0].lvl
    
    if (parent && parent.folded) {
      let activeDroppedTab = tabs.find(t => t.active)
      if (activeDroppedTab) browser.tabs.update(parentId, { active: true })
    }

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]

      // Flat nodes below first node's level
      if (tabs[i].lvl <= minLvl) {
        tab.parentId = parentId
      }

      // Update invisibility of tabs
      if (parent && parent.folded) {
        if (this.state.hideFoldedTabs && !tab.hidden) toHide.push(tab.id)
      } else if (tab.parentId === parentId) {
        if (this.state.hideFoldedTabs && tab.hidden) toShow.push(tab.id)
      }
    }

    // If there are no moving, just update tabs tree
    if (!moveIndexOk) {
      Actions.updateTabsTree(currentPanel.startIndex, currentPanel.endIndex + 1)
      Actions.saveTabsData()
    }
  }

  // Hide/Show tabs
  if (toHide.length) browser.tabs.hide(toHide)
  if (toShow.length) browser.tabs.show(toShow)
}

/**
 * Recreate dropped nodes
 */
async function recreateDroppedNodes(event, dropIndex, dropParent, nodes, pin, destCtx) {
  // Create new tabs
  const oldNewMap = []
  let opener = dropParent < 0 ? undefined : dropParent
  let firstNode = nodes[0]

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i]

    if (node.type === 'separator') continue
    if (!this.state.tabsTree && node.type === 'folder') continue
    if (this.state.tabsTreeLimit > 0 && node.type === 'folder') continue

    let createConf = {
      cookieStoreId: destCtx,
      index: dropIndex + i,
      url: node.url ? Utils.normalizeUrl(node.url) : Utils.createGroupUrl(node.title),
      windowId: this.state.windowId,
      pinned: pin,
    }

    if (firstNode.type === 'tab') createConf.active = node.active
    else createConf.active = firstNode.id === node.id

    if (oldNewMap[node.parentId] >= 0) {
      createConf.openerTabId = oldNewMap[node.parentId]
    } else {
      createConf.openerTabId = opener
    }

    const info = await browser.tabs.create(createConf)
    oldNewMap[node.id] = info.id
  }

  // Remove source tabs
  if (firstNode.type === 'tab' && !event.ctrlKey) {
    const toRemove = nodes.map(n => n.id)
    this.state.removingTabs = [...toRemove]
    await browser.tabs.remove(toRemove)
  }

  // Update tabs tree if there are no tabs was deleted
  if (firstNode.type !== 'tab' || event.ctrlKey) {
    Actions.updateTabsTree(dropIndex - 1, dropIndex + nodes.length)
  }
}

/**
 * Parse native drop event and create tab
 */
async function dropToTabsNative(event, dropIndex, dropParent, destCtx, pin) {
  let url = await Utils.getUrlFromDragEvent(event)

  let prevTab = this.state.tabs[dropIndex - 1]
  if (prevTab && prevTab.folded) {
    for (let tab; dropIndex < this.state.tabs.length; dropIndex++) {
      tab = this.state.tabs[dropIndex]
      if (tab.lvl <= prevTab.lvl) break
    }
  }

  if (url && destCtx) {
    browser.tabs.create({
      active: true,
      url,
      index: dropIndex,
      openerTabId: dropParent < 0 ? undefined : dropParent,
      cookieStoreId: destCtx,
      windowId: this.state.windowId,
      pinned: pin,
    })
  }
}

/**
 * Flatten tabs tree
 */
function flattenTabs(tabIds) {
  // Gather children
  let minLvlTab = { lvl: 999 }
  const toFlat = [...tabIds]
  const ttf = tabIds.map(id => this.state.tabsMap[id])
  for (let tab of this.state.tabs) {
    if (tab.hidden) continue
    if (toFlat.includes(tab.id) && tab.lvl < minLvlTab.lvl) minLvlTab = tab
    if (toFlat.includes(tab.parentId)) {
      if (!toFlat.includes(tab.id)) {
        toFlat.push(tab.id)
        ttf.push(tab)
      }
      if (tab.lvl < minLvlTab.lvl) minLvlTab = tab
    }
  }

  if (!minLvlTab.parentId) return
  for (let tab of ttf) {
    tab.lvl = minLvlTab.lvl
    tab.parentId = minLvlTab.parentId
  }

  Actions.updateTabsTree(ttf[0].index - 1, ttf[ttf.length - 1].index + 1)
  Actions.saveTabsData()
}

/**
 * Group tabs
 */
async function groupTabs(tabIds) {
  // Get tabs
  const tabs = []
  for (let t of this.state.tabs) {
    if (tabIds.includes(t.id)) tabs.push(t)
    else if (tabIds.includes(t.parentId)) {
      tabIds.push(t.id)
      tabs.push(t)
    }
  }

  if (!tabs.length) return
  if (tabs[0].lvl >= this.state.tabsTreeLimit) return

  // Find title for group tab
  const titles = tabs.map(t => t.title)
  let commonPart = Utils.commonSubStr(titles)
  let isOk = commonPart ? commonPart[0] === commonPart[0].toUpperCase() : false
  let groupTitle = commonPart
    .replace(/^(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+/g, ' ')
    .replace(/(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+$/g, ' ')
    .trim()

  if (!isOk || groupTitle.length < 4) {
    const hosts = tabs.filter(t => !t.url.startsWith('about:')).map(t => t.url.split('/')[2])
    groupTitle = Utils.commonSubStr(hosts)
    if (groupTitle.startsWith('.')) groupTitle = groupTitle.slice(1)
    groupTitle = groupTitle.replace(/^www\./, '')
  }

  if (!isOk || groupTitle.length < 4) {
    groupTitle = tabs[0].title
  }

  // Find index and create group tab
  if (!this.state.newTabsPosition) this.state.newTabsPosition = {}
  this.state.newTabsPosition[tabs[0].index] = {
    panel: tabs[0].panelId,
    parent: tabs[0].parentId,
  }
  const groupTab = await browser.tabs.create({
    active: !(parent && parent.folded),
    cookieStoreId: tabs[0].cookieStoreId,
    index: tabs[0].index,
    openerTabId: tabs[0].parentId < 0 ? undefined : tabs[0].parentId,
    url: Utils.createGroupUrl(groupTitle),
    windowId: this.state.windowId,
  })

  // Update parent of selected tabs
  tabs[0].parentId = groupTab.id
  for (let i = 1; i < tabs.length; i++) {
    let tab = tabs[i]

    if (tab.lvl <= tabs[0].lvl) {
      tab.parentId = groupTab.id
      tab.folded = false
    }
  }
  Actions.updateTabsTree(tabs[0].index - 2, tabs[tabs.length - 1].index + 1)
  Actions.saveTabsData()
}

/**
 * Get grouped tabs (for group page)
 */
async function getGroupInfo(groupId) {
  let groupTab = this.state.tabsMap[groupId]
  if (!groupTab) return {}

  const out = {
    id: groupTab.id,
    index: groupTab.index,
    len: 0,
    tabs: [],
  }

  let parentTab = this.state.tabsMap[groupTab.parentId]
  if (parentTab && Utils.isGroupUrl(parentTab.url)) {
    out.parentId = parentTab.id
  }

  let subGroupLvl = null
  for (let i = groupTab.index + 1; i < this.state.tabs.length; i++) {
    const tab = this.state.tabs[i]
    if (tab.lvl <= groupTab.lvl) break
    out.len++

    if (subGroupLvl && tab.lvl > subGroupLvl) continue
    else subGroupLvl = null
    if (Utils.isGroupUrl(tab.url)) subGroupLvl = tab.lvl

    out.tabs.push({
      id: tab.id,
      index: tab.index,
      lvl: tab.lvl - groupTab.lvl - 1,
      title: tab.title,
      url: tab.url,
      discarded: tab.discarded,
      favIconUrl: tab.favIconUrl,
    })
  }

  return out
}

/**
 * Create tab after another tab
 */
function createTabAfter(tabId) {
  // Get target tab
  const targetTab = this.state.tabsMap[tabId]
  if (!targetTab) return

  // Get index and parentId for new tab
  let parentId = targetTab.parentId
  let index = targetTab.index + 1
  while (this.state.tabs[index] && this.state.tabs[index].lvl > targetTab.lvl) {
    index++
  }

  if (!this.state.newTabsPosition) this.state.newTabsPosition = {}
  this.state.newTabsPosition[index] = {
    panel: targetTab.panelId,
    parent: parentId,
  }

  if (parentId < 0) parentId = undefined
  browser.tabs.create({
    index,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: this.state.windowId,
    openerTabId: parentId,
  })
}

/**
 * Create child tab
 */
function createChildTab(tabId) {
  let targetTab = this.state.tabsMap[tabId]

  browser.tabs.create({
    index: targetTab.index + 1,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: this.state.windowId,
    openerTabId: targetTab.id,
  })
}

/**
 * Normalize tree levels
 */
function updateTabsTree(startIndex = 0, endIndex = -1) {
  if (!this.state.tabsTree) return
  if (!this.state.tabs || !this.state.tabs.length) return
  if (startIndex < 0) startIndex = 0
  if (endIndex === -1) endIndex = this.state.tabs.length
  const maxLvl = typeof this.state.tabsTreeLimit === 'number' ? this.state.tabsTreeLimit : 123

  // Reset parent-flags of the last tab
  if (this.state.tabs[endIndex - 1]) {
    this.state.tabs[endIndex - 1].isParent = false
    this.state.tabs[endIndex - 1].folded = false
  }

  for (let pt, t, i = startIndex; i < endIndex; i++) {
    t = this.state.tabs[i]
    if (!t) return
    if (t.pinned) {
      t.parentId = -1
      t.lvl = 0
      t.invisible = false
      t.isParent = false
      t.folded = false
      continue
    }
    pt = this.state.tabs[i - 1]

    let parent = this.state.tabsMap[t.parentId]
    if (parent && (parent.pinned || parent.index >= t.index)) parent = undefined

    // Parent is defined
    if (parent && !parent.pinned) {
      if (parent.lvl === maxLvl) {
        parent.isParent = false
        parent.folded = false
        t.parentId = parent.parentId
        t.lvl = parent.lvl
        t.invisible = parent.invisible
      } else {
        parent.isParent = true
        t.lvl = parent.lvl + 1
        t.invisible = parent.folded || parent.invisible
      }

      // if prev tab is not parent and with smaller lvl
      // go back and set lvl and parentId
      if (pt && pt.id !== t.parentId && pt.lvl < t.lvl) {
        for (let j = t.index; j--; ) {
          if (this.state.tabs[j].id === parent.id) break
          if (this.state.tabs[j].cookieStoreId !== t.cookieStoreId) break
          if (parent.lvl === maxLvl) {
            this.state.tabs[j].parentId = parent.parentId
            this.state.tabs[j].isParent = false
            this.state.tabs[j].folded = false
          } else {
            this.state.tabs[j].parentId = parent.id
          }
          this.state.tabs[j].lvl = t.lvl
          this.state.tabs[j].invisible = t.invisible
        }
      }
    } else {
      t.parentId = -1
      t.lvl = 0
      t.invisible = false
    }

    // Reset parent-flags of prev tab if current tab have same lvl
    if (pt && pt.lvl >= t.lvl) {
      pt.isParent = false
      pt.folded = false
    }
  }
}

/**
 * Find tab with given properties and return it
 */
function queryTab(props) {
  const tab = this.state.tabs.find(t => {
    return Object.keys(props).every(p => t[p] === props[p])
  })
  if (tab) return Utils.cloneObject(tab)
}

/**
 * getTabsTree
 */
function getTabsTree() {
  const tree = {}
  for (let tab of this.state.tabs) {
    if (tab.lvl > 0) tree[tab.id] = tab.lvl
  }
  return tree
}

function getGroupTab(tab) {
  if (!this.state.tabsTree && !tab.lvl) return

  let i = tab.lvl || 0
  while (i--) {
    tab = this.state.tabsMap[tab.parentId]
    if (!tab) return
    if (tab && Utils.isGroupUrl(tab.url)) return tab
  }
}

function updateGroupTab(groupTab) {
  if (updateGroupTabTimeouit) clearTimeout(updateGroupTabTimeouit)
  updateGroupTabTimeouit = setTimeout(() => {
    let tabsCount = this.state.tabs.length
    let tabs = []
    let subGroupLvl = null
    let len = 0

    for (let i = groupTab.index + 1; i < tabsCount; i++) {
      let tab = this.state.tabs[i]
      if (tab.lvl <= groupTab.lvl) break
      len++

      if (subGroupLvl && tab.lvl > subGroupLvl) continue
      else subGroupLvl = null
      if (Utils.isGroupUrl(tab.url)) subGroupLvl = tab.lvl

      tabs.push({
        id: tab.id,
        index: tab.index,
        lvl: tab.lvl - groupTab.lvl - 1,
        title: tab.title,
        url: tab.url,
        discarded: tab.discarded,
        favIconUrl: tab.favIconUrl,
      })
    }

    let msg = {
      name: 'update',
      id: groupTab.id,
      index: groupTab.index,
      len,
      tabs,
    }

    let parentTab = this.state.tabsMap[groupTab.parentId]
    if (parentTab && Utils.isGroupUrl(parentTab.url)) {
      msg.parentId = parentTab.id
    }

    browser.tabs.sendMessage(groupTab.id, msg)
      .catch(() => {/** itsokay **/})

    updateGroupTabTimeouit = null
  }, 256)
}

function resetUpdateGroupTabTimeout() {
  if (updateGroupTabTimeouit) clearTimeout(updateGroupTabTimeouit)
}

function updateActiveGroupPage() {
  let activeTab = this.state.tabs.find(t => t.active)
  if (Utils.isGroupUrl(activeTab.url)) {
    this.actions.updateGroupTab(activeTab)
  }
}

function getPanelForNewTab(tab) {
  let panel, parentTab = this.state.tabsMap[tab.openerTabId]

  if (tab.cookieStoreId !== DEFAULT_CTX_ID) {
    panel = this.state.panels.find(p => {
      return p.type === 'ctx' && p.cookieStoreId === tab.cookieStoreId
    })
  }

  if (!panel && parentTab) {
    panel = this.state.panelsMap[parentTab.panelId]
    let activePanel = this.state.panels[this.state.panelIndex]
    if (this.state.moveNewTabParentActPanel && panel !== activePanel) {
      panel = null
    }
  }

  if (!panel && !parentTab && this.state.moveNewTab === 'after') {
    let activeTab = this.state.tabsMap[this.state.activeTabId]
    panel = this.state.panelsMap[activeTab.panelId]
  }

  if (!panel) panel = this.state.panels[this.state.panelIndex]

  if (
    panel &&
    panel.type === 'ctx' &&
    panel.cookieStoreId !== tab.cookieStoreId
  ) panel = null

  if (!panel || !panel.tabs) panel = this.state.panelsMap[DEFAULT_CTX_ID]

  return panel
}

/**
 * Find and return index for new tab
 * 
 * @param {Object} panel
 * @param {Object} [tab]
 */
function getIndexForNewTab(panel, tab) {
  let parent = this.state.tabsMap[tab ? tab.openerTabId : null]
  let endIndex = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
  let activeTab = this.state.tabsMap[this.state.activeTabId]

  if (parent && parent.pinned) {
    if (this.state.moveNewTabPin === 'start') return panel.startIndex
    if (this.state.moveNewTabPin === 'end') return endIndex
  }

  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (
      this.state.moveNewTabParent === 'sibling' ||
      this.state.moveNewTabParent === 'last_child'
    ) {
      let tab, index = parent.index + 1
      for (; index < this.state.tabs.length; index++) {
        tab = this.state.tabs[index]
        if (tab.lvl <= parent.lvl) break
      }
      return index
    }
    if (this.state.moveNewTabParent === 'first_child') return parent.index + 1
    if (this.state.moveNewTabParent === 'start') return panel.startIndex
    if (this.state.moveNewTabParent === 'end') return endIndex
  }

  if (this.state.moveNewTab === 'start') return panel.startIndex
  if (this.state.moveNewTab === 'end') return endIndex
  if (this.state.moveNewTab === 'after') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return endIndex
    } else {
      let tab, index = activeTab.index + 1
      for (; index < this.state.tabs.length; index++) {
        tab = this.state.tabs[index]
        if (tab.lvl <= activeTab.lvl) break
      }
      return index
    }
  }
}

/**
 * Check url rules of panels and move tab if needed
 */
function checkUrlRules(url, tab) {
  for (let rule of this.state.urlRules) {
    if (tab.panelId === rule.panelId) continue

    let ok
    if (rule.value.test) ok = rule.value.test(url)
    else ok = url.indexOf(rule.value) !== -1

    if (ok) {
      if (urlRuleHistory[tab.panelId] === url) {
        urlRuleHistory[tab.panelId] = null
        break
      }

      let panel = this.state.panelsMap[rule.panelId]
      if (!panel) break
      let index = this.actions.getIndexForNewTab(panel, tab)
      if (index !== tab.index) {
        tab.destPanelId = rule.panelId
        browser.tabs.move(tab.id, { windowId: this.state.windowId, index })
      } else {
        tab.panelId = panel.id
        this.actions.updatePanelsTabs()
      }
      urlRuleHistory[rule.panelId] = url

      if (tab.active) this.actions.switchToPanel(panel.index, true)

      break
    }
  }
}

export default {
  loadTabs,
  getOrderNormMoves,
  normalizeTabsOrder,
  restoreGroupTab,
  restoreTabsTree,
  saveTabsTree,
  saveTabsData,
  scrollToActiveTab,
  createTab,
  removeTabs,
  checkRemovedTabs,
  switchTab,
  reloadTabs,
  discardTabs,
  activateLastActiveTabOf,
  pinTabs,
  unpinTabs,
  repinTabs,
  muteTabs,
  unmuteTabs,
  remuteTabs,
  duplicateTabs,
  dedupTabs,
  bookmarkTabs,
  clearTabsCookies,

  moveTabsToNewWin,
  moveTabsToWin,
  moveTabsToThisWin,
  moveTabsToCtx,
  // moveTabsToPanel,

  showAllTabs,
  updateTabsVisability,

  foldTabsBranch,
  expTabsBranch,
  toggleBranch,
  foldAllInactiveBranches,

  dropToTabs,
  moveDroppedNodes,
  recreateDroppedNodes,
  dropToTabsNative,

  flattenTabs,
  groupTabs,
  getGroupInfo,
  getGroupTab,
  updateGroupTab,
  resetUpdateGroupTabTimeout,
  updateActiveGroupPage,

  createTabAfter,
  createChildTab,

  updateTabsTree,
  queryTab,
  getTabsTree,

  getPanelForNewTab,
  getIndexForNewTab,

  checkUrlRules,
}