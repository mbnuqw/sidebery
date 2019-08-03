import Utils from '../../utils'
import Logs from '../../logs'
import EventBus from '../../event-bus'
import Actions from '.'

let TabsTreeSaveTimeout, updateGroupTabTimeouit

/**
 * Load all tabs for current window
 */
async function loadTabs(fresh = true) {
  let windowId = browser.windows.WINDOW_ID_CURRENT
  let tabs = await browser.tabs.query({ windowId })
  let activePanel = this.state.panels[this.state.panelIndex] || this.state.panels[1]
  let activeTab

  let normOrderMoves = Actions.getOrderNormMoves(tabs)
  await Actions.normalizeTabsOrder(normOrderMoves)

  if (normOrderMoves.length) {
    tabs = await browser.tabs.query({ windowId })
  }

  // Set tabs initial props and update state
  this.state.tabsMap = []
  for (let t of tabs) {
    t.isParent = false
    t.folded = false
    t.parentId = -1
    t.invisible = false
    t.lvl = 0
    t.host = t.url.split('/')[2] || ''
    if (this.state.highlightOpenBookmarks && this.state.bookmarksUrlMap && this.state.bookmarksUrlMap[t.url]) {
      for (let b of this.state.bookmarksUrlMap[t.url]) {
        b.isOpen = true
      }
    }
    this.state.tabsMap[t.id] = t
    if (!t.favIconUrl || t.favIconUrl.startsWith('chrome:')) t.favIconUrl = ''
    if (t.active) activeTab = t
  }
  this.state.tabs = tabs

  // Switch to panel with active tab
  if (fresh) {
    const activePanelIsTabs = activePanel.panel === 'TabsPanel'
    const activePanelIsOk = activeTab.cookieStoreId === activePanel.cookieStoreId
    if (!activeTab.pinned && activePanelIsTabs && !activePanelIsOk) {
      const panel = this.state.panelsMap[activeTab.cookieStoreId]
      if (panel) this.state.panelIndex = panel.index
    }
  }

  // Restore tree levels
  if (this.state.tabsTree) {
    await Actions.restoreTabsTree()
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
function getOrderNormMoves(tabs) {
  // Check order of tabs and get moves for normalizing
  const ctxs = this.state.panels
    .filter(c => c.type === 'default' || c.type === 'ctx')
    .map(c => c.cookieStoreId)
  const moves = []
  let index = tabs.filter(t => t.pinned).length
  let offset = 0
  for (let i = 0; i < ctxs.length; i++) {
    const ctx = ctxs[i]
    for (let j = 0; j < tabs.length; j++) {
      const tab = tabs[j]
      if (tab.pinned) continue
      if (tab.cookieStoreId !== ctx) continue

      if (index !== tab.index + offset) {
        moves.push([tab.id, index])
        offset++
      }
      index++
    }
  }
  return moves
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
 * Restore tabs tree
 */
async function restoreTabsTree() {
  const { tabsTrees } = await browser.storage.local.get({ tabsTrees: [] })

  perTree:
  for (let tree of tabsTrees) {
    const parents = []
    let offset = 0

    perTab:
    for (let i = 0; i < tree.length; i++) {
      // Saved nodes
      const savedTab = tree[i]

      // Current tab
      let tab = this.state.tabs[savedTab.index - offset]
      if (!tab) continue perTree

      const sameUrl = savedTab.url === tab.url
      const isGroup = Utils.isGroupUrl(savedTab.url)
      if (isGroup) {
        let nextUrlOk = true

        // Check if next non-group tab is ok
        for (let j = i + 1; j < tree.length; j++) {
          const nextTab = tree[j]
          if (!nextTab) continue perTree
          nextUrlOk = nextTab.url === tab.url
          if (!Utils.isGroupUrl(nextTab.url)) continue perTree
        }

        // Removed group
        if (!sameUrl && nextUrlOk) {
          const groupId = Utils.getGroupId(savedTab.url)
          const parent = parents[savedTab.parentId]
          const rTab = await browser.tabs.create({
            windowId: this.state.windowId,
            index: savedTab.index,
            url: browser.runtime.getURL('group/group.html') + `#${groupId}`,
            cookieStoreId: savedTab.ctx,
            active: false,
          })

          tab = this.state.tabsMap[rTab.id]
          tab.isParent = savedTab.isParent
          tab.folded = savedTab.folded
          if (savedTab.isParent) parents[savedTab.id] = tab
          if (parent) tab.parentId = parent.id
          continue perTab
        }
      }

      // Check if this is actual target tab
      if (!sameUrl && tab.status === 'complete') continue perTree
      if (tab.cookieStoreId !== savedTab.ctx) continue perTree

      tab.isParent = savedTab.isParent
      tab.folded = savedTab.folded
      if (savedTab.isParent) parents[savedTab.id] = tab
      if (parents[savedTab.parentId]) {
        tab.parentId = parents[savedTab.parentId].id
      }
    }

    break
  }
  Actions.updateTabsTree()

  Logs.push('[INFO] Tabs tree restored')
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

    this.state.bg.postMessage({
      action: 'saveTabsTree',
      args: [this.state.windowId, tabsTreeState],
    })
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
  const ctxId = this.state.tabsMap[tabIds[0]].cookieStoreId
  const panel = this.state.panelsMap[ctxId]
  if (!panel) return

  let tabsMap = {}
  for (let id of tabIds) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue
    if (tab.cookieStoreId !== ctxId) continue
    if (panel.lockedTabs && !tab.url.startsWith('about')) continue

    tabsMap[id] = tab
    tab.invisible = true

    if (this.state.rmFoldedTabs && tab.folded) {
      for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
        if (this.state.tabs[i].lvl <= tab.lvl) break
        tabsMap[this.state.tabs[i].id] = this.state.tabs[i]
      }
    }
  }

  // Set tabs to be removed
  const tabs = Object.values(tabsMap).sort((a, b) => a.index - b.index)
  const toRemove = tabs.map(t => t.id)
  if (this.state.removingTabs && this.state.removingTabs.length) {
    this.state.removingTabs = [...this.state.removingTabs, ...toRemove]
  } else {
    this.state.removingTabs = [...toRemove]
  }

  // No-empty panels
  if (tabs.length === panel.tabs.length && panel.noEmpty) {
    await browser.tabs.create({
      windowId: this.state.windowId,
      index: panel.startIndex,
      cookieStoreId: ctxId,
    })
  }

  // Update successorTabId if there are active tab
  if (tabs.length < panel.tabs.length) {
    const activeTab = tabs.find(t => t.active)
    if (activeTab) {
      const target = Utils.findSuccessorTab(this.state, activeTab, tabs.map(t => t.id))
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  browser.tabs.remove(toRemove)
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
        if (!p.cookieStoreId) continue
        for (let t of this.state.tabs) {
          if (t.cookieStoreId === p.cookieStoreId) tabs.push(t)
        }
      }
    } else {
      tabs = this.state.tabs.filter(t => t.cookieStoreId === panel.cookieStoreId)
    }
  } else {
    if (pinned) tabs = this.getters.pinnedTabs
    else tabs = globaly ? this.state.tabs : panel.tabs
  }
  if (!tabs || !tabs.length) return
  if (this.state.scrollThroughVisibleTabs) tabs = tabs.filter(t => !t.invisible)

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
    // if tab loading and haven't yet url
    if (tab.url === 'about:blank' && tab.status === 'loading') continue
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
    await browser.tabs.create({
      windowId: this.state.windowId,
      index: tab.index + 1,
      cookieStoreId: tab.cookieStoreId,
      url: tab.url,
      openerTabId: tabId,
    })
  }
}

/**
 * Create bookmarks from tabs
 */
async function bookmarkTabs(tabIds) {
  EventBus.$emit('panelLoadingStart', 0)
  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab) continue
    await browser.bookmarks.create({ title: tab.title, url: tab.url })
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

    EventBus.$emit('tabLoadingStart', tab.id)

    let url = new URL(tab.url)
    let domain = url.hostname
      .split('.')
      .slice(-2)
      .join('.')

    if (!domain) {
      EventBus.$emit('tabLoadingErr', tab.id)
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
      .then(() => setTimeout(() => EventBus.$emit('tabLoadingOk', tab.id), 250))
      .catch(() => setTimeout(() => EventBus.$emit('tabLoadingErr', tab.id), 250))
  }
}

/**
 * Create new window with first tab
 * and then move other tabs.
 */
async function moveTabsToNewWin(tabIds, incognito) {
  const first = tabIds.shift()
  const firstTab = this.state.tabsMap[first]
  if (!firstTab) return
  const rest = [...tabIds]
  const restTabs = rest.map(id => {
    const tab = this.state.tabsMap[id]
    return {
      id: tab.id,
      url: tab.url,
      parentId: tab.parentId,
      folded: tab.folded,
    }
  })

  let win

  if (this.state.private === !!incognito) {
    win = await browser.windows.create({ tabId: first, incognito })
    for (let id of rest) {
      await browser.tabs.move(id, { windowId: win.id, index: -1 })
    }
  } else {
    win = await browser.windows.create({ url: firstTab.url, incognito })
    const firstNewTab = win.tabs[0]
    const oldNewMap = { [firstTab.id]: firstNewTab.id }

    browser.tabs.remove(first)
    for (let tab of restTabs) {
      // Create / remove
      const newTab = await browser.tabs.create({ windowId: win.id, url: tab.url })
      browser.tabs.remove(tab.id)

      // Update values
      oldNewMap[tab.id] = newTab.id
      tab.id = oldNewMap[tab.id]
      if (tab.parentId > -1) {
        tab.parentId = oldNewMap[tab.parentId] || -1
      }
    }
  }

  if (this.state.tabsTree) {
    // Ok, this is just tmp solution
    // with timeout...
    // ~~~~~~~ REWRITE THIS ~~~~~~~~
    await Utils.sleep(1000)
    browser.runtime.sendMessage({
      windowId: win.id,
      action: 'restoreTabsTree',
      arg: restTabs,
    })
    // ~~~~~~~ REWRITE THIS ~~~~~~~~
  }
}

/**
 * Try to restore tree for listed tabs
 */
// function restoreTabsTree(tabs) {
//   if (!this.state.tabsTree) return

//   for (let info of tabs) {
//     const tab = this.state.tabsMap[info.id]
//     if (!tab) return
//     tab.parentId = info.parentId
//     tab.folded = info.folded
//   }

//   Actions.updateTabsTree()
// }

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(tabIds, window) {
  const ids = [...tabIds]
  const windowId = window ? window.id : await Actions.chooseWin()
  const win = (await Actions.getAllWindows()).find(w => w.id === windowId)
  const tabs = []
  for (let id of ids) {
    const tab = this.state.tabsMap[id]
    if (!tab) continue
    tabs.push({
      id: tab.id,
      url: tab.url,
      parentId: tab.parentId,
      folded: tab.folded,
    })
  }

  if (this.state.private === win.incognito) {
    for (let tab of tabs) {
      await browser.tabs.move(tab.id, { windowId, index: -1 })
    }
  } else {
    const oldNewMap = {}
    for (let tab of tabs) {
      // Create / remove
      const newTab = await browser.tabs.create({ url: tab.url, windowId })
      browser.tabs.remove(tab.id)

      // Update values
      oldNewMap[tab.id] = newTab.id
      tab.id = oldNewMap[tab.id]
      if (tab.parentId > -1) {
        tab.parentId = oldNewMap[tab.parentId] || -1
      }
    }
  }

  if (this.state.tabsTree) {
    // Ok, this is just tmp solution
    // with timeout...
    // ~~~~~~~ REWRITE THIS ~~~~~~~~
    await Utils.sleep(1000)
    browser.runtime.sendMessage({
      windowId: win.id,
      action: 'restoreTabsTree',
      arg: tabs,
    })
    // ~~~~~~~ REWRITE THIS ~~~~~~~~
  }
}

/**
 * Move tabs (reopen url) in provided context.
 */
async function moveTabsToCtx(tabIds, ctxId) {
  const ids = [...tabIds]
  const oldNewMap = {}
  const tabs = []
  for (let id of ids) {
    const tab = this.state.tabsMap[id]
    if (!tab) continue
    tabs.push({
      id: tab.id,
      url: tab.url,
      parentId: tab.parentId,
      folded: tab.folded,
    })
  }

  for (let tab of tabs) {
    // Create / remove
    const newTab = await browser.tabs.create({
      windowId: this.state.windowId,
      cookieStoreId: ctxId,
      url: tab.url.indexOf('http') ? null : tab.url,
    })
    await browser.tabs.remove(tab.id)

    // Update values
    oldNewMap[tab.id] = newTab.id
    if (tab.parentId > -1) {
      this.state.tabsMap[newTab.id].parentId = oldNewMap[tab.parentId]
    }
  }

  if (this.state.tabsTree) {
    Actions.updateTabsTree()
  }
}

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
  Actions.saveTabsTree()
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
  Actions.saveTabsTree()
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
 * Drop to tabs panel
 */
async function dropToTabs(event, dropIndex, dropParent, nodes, pin) {
  const currentPanel = this.state.panels[this.state.panelIndex]
  const destCtx = currentPanel.cookieStoreId
  const parent = this.state.tabsMap[dropParent]
  const toHide = []
  const toShow = []
  if (dropIndex === -1) dropIndex = currentPanel.endIndex + 1

  // Tabs or Bookmarks
  if (nodes && nodes.length) {
    let samePanel = nodes[0].ctx === currentPanel.id
    if (pin && currentPanel.panel !== 'TabsPanel') samePanel = true

    // Move tabs
    if (nodes[0].type === 'tab' && samePanel && !event.ctrlKey) {
      // Move to different window
      if (nodes[0].windowId !== this.state.windowId) {
        this.state.attachingTabs = [...nodes]
        for (let i = 0; i < nodes.length; i++) {
          const index = dropIndex + i
          await browser.tabs.move(nodes[i].id, { windowId: this.state.windowId, index })
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
          // Skip group tab
          if (t.url.startsWith('moz-extension')) continue
          // Flatten
          t.lvl = 0
          t.parentId = -1
          // Pin tab
          await browser.tabs.update(t.id, { pinned: true })
        }
      }

      // Move if target index is different or pinned state changed
      const moveIndexOk = tabs[0].index !== dropIndex && tabs[tabs.length - 1].index !== dropIndex
      if (moveIndexOk || pinTab || unpinTab) {
        this.state.movingTabs = tabs.map(t => t.id)
        browser.tabs.move([...this.state.movingTabs], { windowId: this.state.windowId, index: dropIndex })
      }

      // Update tabs tree
      if (this.state.tabsTree) {
        // Get parent tab parameters
        let parentId = parent ? parent.id : -1

        // Set first tab parentId and other parameters
        tabs[0].parentId = parentId

        // Get level offset for gragged branch
        let lvlOffset = tabs[0].lvl

        for (let i = 1; i < tabs.length; i++) {
          // const prevTab = tabs[i - 1]
          const tab = tabs[i]

          // Flat nodes below first node's level
          if (tabs[i].lvl <= lvlOffset) {
            tab.parentId = parentId
            tab.folded = false
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
        }
      }

      // If first tab is not invisible, activate it
      if (!tabs[0].invisible) browser.tabs.update(tabs[0].id, { active: true })

      // Hide/Show tabs
      if (toHide.length) browser.tabs.hide(toHide)
      if (toShow.length) browser.tabs.show(toShow)
    } else {
      // Create new tabs
      const oldNewMap = []
      let opener = dropParent < 0 ? undefined : dropParent
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.type === 'separator') continue
        if (!this.state.tabsTree && node.type === 'folder') continue
        if (this.state.tabsTreeLimit > 0 && node.type === 'folder') continue

        if (oldNewMap[node.parentId] >= 0) opener = oldNewMap[node.parentId]
        const info = await browser.tabs.create({
          active: !(parent && parent.folded),
          cookieStoreId: destCtx,
          index: dropIndex + i,
          openerTabId: opener,
          url: node.url ? node.url : Utils.getGroupUrl(node.title),
          windowId: this.state.windowId,
          pinned: pin,
        })
        oldNewMap[node.id] = info.id
        if (this.state.tabsMap[info.id] && opener) {
          this.state.tabsMap[info.id].parentId = opener
        }
      }

      // Remove source tabs
      if (nodes[0].type === 'tab' && !event.ctrlKey) {
        const toRemove = nodes.map(n => n.id)
        this.state.removingTabs = [...toRemove]
        await browser.tabs.remove(toRemove)
      }

      // Update tabs tree if there are no tabs was deleted
      if (nodes[0].type !== 'tab' || event.ctrlKey) {
        Actions.updateTabsTree(dropIndex - 1, dropIndex + nodes.length)
      }
    }
  }

  // Native event
  if (!nodes) {
    const url = await Utils.getUrlFromDragEvent(event)

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
  Actions.saveTabsTree()
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
  const groupTab = await browser.tabs.create({
    active: !(parent && parent.folded),
    cookieStoreId: tabs[0].cookieStoreId,
    index: tabs[0].index,
    openerTabId: tabs[0].parentId < 0 ? undefined : tabs[0].parentId,
    url: Utils.getGroupUrl(groupTitle),
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
  Actions.saveTabsTree()
}

/**
 * Get grouped tabs (for group page)
 */
async function getGroupInfo(groupId) {
  const idData = groupId.split(':id:')
  const title = idData[0]
  const id = idData[1]
  const groupTab = this.state.tabs.find(t => {
    if (id) return t.url.endsWith(id)
    else return t.title === title && t.url.startsWith('moz')
  })
  if (!groupTab) return {}

  const out = {
    id: groupTab.id,
    index: groupTab.index,
    len: 0,
    tabs: [],
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
  let parentId
  let index = targetTab.index + 1
  if (targetTab.isParent && !targetTab.folded) {
    parentId = targetTab.id
  } else {
    parentId = targetTab.parentId
    while (this.state.tabs[index] && this.state.tabs[index].lvl > targetTab.lvl) {
      index++
    }
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
 * Normalize tree levels
 */
function updateTabsTree(startIndex = 0, endIndex = -1) {
  if (!this.state.tabsTree) return
  if (!this.state.tabs || !this.state.tabs.length) return
  if (startIndex < 0) startIndex = 0
  if (endIndex === -1) endIndex = this.state.tabs.length
  const maxLvl = typeof this.state.tabsTreeLimit === 'number' ? this.state.tabsTreeLimit : 123

  // Reset parent-flags of the last tab
  this.state.tabs[this.state.tabs.length - 1].isParent = false
  this.state.tabs[this.state.tabs.length - 1].folded = false

  for (let i = startIndex; i < endIndex; i++) {
    const t = this.state.tabs[i]
    if (!t) return
    if (t.pinned) {
      t.parentId = -1
      t.lvl = 0
      t.invisible = false
      t.isParent = false
      t.folded = false
      continue
    }
    const pt = this.state.tabs[i - 1]

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

    browser.tabs.sendMessage(groupTab.id, {
      name: 'update',
      id: groupTab.id,
      index: groupTab.index,
      len,
      tabs,
    })

    updateGroupTabTimeouit = null
  }, 256)
}

function resetUpdateGroupTabTimeout() {
  if (updateGroupTabTimeouit) clearTimeout(updateGroupTabTimeouit)
}

export default {
  loadTabs,
  getOrderNormMoves,
  normalizeTabsOrder,
  restoreTabsTree,
  saveTabsTree,
  scrollToActiveTab,
  createTab,
  removeTabs,
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
  bookmarkTabs,
  clearTabsCookies,
  moveTabsToNewWin,
  moveTabsToWin,
  moveTabsToCtx,
  showAllTabs,
  updateTabsVisability,
  foldTabsBranch,
  expTabsBranch,
  toggleBranch,
  dropToTabs,
  flattenTabs,
  groupTabs,
  getGroupInfo,
  createTabAfter,
  updateTabsTree,
  queryTab,
  getTabsTree,
  getGroupTab,
  updateGroupTab,
  resetUpdateGroupTabTimeout,
}