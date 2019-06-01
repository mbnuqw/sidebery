import Utils from '../../utils'
import Logs from '../../logs'
import Actions from '.'
import EventBus from '../../event-bus'

let TabsTreeSaveTimeout

/**
 * Load all tabs for current window
 */
async function loadTabs(state, getters) {
  const windowId = browser.windows.WINDOW_ID_CURRENT
  const tabs = await browser.tabs.query({ windowId })
  const activePanel = state.panels[state.panelIndex]
  let activeTab

  // Check order of tabs and get moves for normalizing
  const ctxs = [state.defaultCtxId].concat(
    state.panels.filter(c => c.type === 'ctx').map(c => c.cookieStoreId)
  )
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

  // Set tabs initial props and update stae
  state.tabsMap = []
  for (let t of tabs) {
    t.isParent = false
    t.folded = false
    t.parentId = -1
    t.invisible = false
    t.lvl = 0
    t.host = t.url.split('/')[2] || ''
    if (state.selOpenedBookmarks && state.bookmarksUrlMap && state.bookmarksUrlMap[t.url]) {
      for (let b of state.bookmarksUrlMap[t.url]) {
        b.opened = true
      }
    }
    state.tabsMap[t.id] = t
    if (!t.favIconUrl || t.favIconUrl.startsWith('chrome:')) t.favIconUrl = ''
    if (t.active) activeTab = t
  }
  state.tabs = tabs

  // Normalize order
  for (let move of moves) {
    await browser.tabs.move(move[0], { index: move[1] })
  }
  if (moves.length) Logs.push('[INFO] Tabs order was normalized')

  // Switch to panel with active tab
  const activePanelIsTabs = activePanel.panel === 'TabsPanel'
  const activePanelIsOk = activeTab.cookieStoreId === activePanel.cookieStoreId
  if (!activeTab.pinned && activePanelIsTabs && !activePanelIsOk) {
    const index = state.panels.findIndex(p => p.cookieStoreId === activeTab.cookieStoreId)
    if (index !== -1) state.panelIndex = index
  }

  // Restore tree levels
  if (state.tabsTree) {
    const ans = await browser.storage.local.get('tabsTreeState')
    if (ans.tabsTreeState) {
      const parents = []
      let offset = 0
      for (let i = 0; i < ans.tabsTreeState.length; i++) {
        // Saved nodes
        const savedTab = ans.tabsTreeState[i]

        // Current tab
        let tab = state.tabs[savedTab.index - offset]
        if (!tab) break

        const sameUrl = savedTab.url === tab.url
        const isGroup = Utils.isGroupUrl(savedTab.url)
        if (isGroup) {
          let nextUrlOk = true

          // Check if next non-group tab is ok
          for (let j = i + 1; j < ans.tabsTreeState.length; j++) {
            const nextTab = ans.tabsTreeState[j]
            if (!nextTab) break
            nextUrlOk = nextTab.url === tab.url
            if (!Utils.isGroupUrl(nextTab.url)) break
          }

          // Removed group
          if (!sameUrl && nextUrlOk) {
            const groupId = Utils.getGroupId(savedTab.url)
            const parent = parents[savedTab.parentId]
            const rTab = await browser.tabs.create({
              windowId: state.windowId,
              index: savedTab.index,
              url: browser.runtime.getURL('group/group.html') + `#${groupId}`,
              cookieStoreId: savedTab.ctx,
              active: false,
            })

            tab = state.tabsMap[rTab.id]
            tab.isParent = savedTab.isParent
            tab.folded = savedTab.folded
            if (savedTab.isParent) parents[savedTab.id] = tab
            if (parent) tab.parentId = parent.id
            continue
          }
        }

        // Check if this is actual target tab
        if (!sameUrl && tab.status === 'complete') break
        if (tab.cookieStoreId !== savedTab.ctx) break

        tab.isParent = savedTab.isParent
        tab.folded = savedTab.folded
        if (savedTab.isParent) parents[savedTab.id] = tab
        if (parents[savedTab.parentId]) {
          tab.parentId = parents[savedTab.parentId].id
        }
      }
    }
    Utils.updateTabsTree(state)

    Logs.push('[INFO] Tabs tree restored')
  }

  // Update succession
  if (state.activateAfterClosing !== 'none' && activeTab) {
    const target = Utils.findSuccessorTab(state, activeTab)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  // Update panels
  Utils.updatePanelsTabs(state, getters)

  Logs.push('[INFO] Tabs loaded')
}

/**
 * Save tabs tree
 */
function saveTabsTree(state, delay = 1000) {
  if (TabsTreeSaveTimeout) clearTimeout(TabsTreeSaveTimeout)
  TabsTreeSaveTimeout = setTimeout(() => {
    const tabsTreeState = []
    for (let t of state.tabs) {
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
    browser.storage.local.set({ tabsTreeState })
    TabsTreeSaveTimeout = null
  }, delay)
}

/**
 * Scroll to active tab
 */
function scrollToActiveTab(state) {
  const activePanel = state.panels[state.panelIndex]
  if (activePanel && activePanel.tabs) {
    const activeTab = activePanel.tabs.find(t => t.active)
    if (activeTab) {
      EventBus.$emit('scrollToTab', state.panelIndex, activeTab.id)
    }
  }
}

/**
 * Create new tab in current window
 */
function createTab(state, ctxId) {
  if (!ctxId) return
  let p = state.panels.find(p => p.cookieStoreId === ctxId)
  if (!p || !p.tabs) return
  let index = p.tabs.length ? p.endIndex + 1 : p.startIndex
  browser.tabs.create({ index, cookieStoreId: ctxId, windowId: state.windowId })
}

/**
 * Remove tabs
 */
async function removeTabs(state, tabIds) {
  if (!tabIds || !tabIds.length) return
  if (!state.tabsMap[tabIds[0]]) return
  const ctxId = state.tabsMap[tabIds[0]].cookieStoreId
  const panel = state.panels.find(p => p.cookieStoreId === ctxId)
  if (!panel) return

  let tabsMap = {}
  for (let id of tabIds) {
    let tab = state.tabsMap[id]
    if (!tab) continue
    if (tab.cookieStoreId !== ctxId) continue
    if (panel.lockedTabs && !tab.url.startsWith('about')) continue

    tabsMap[id] = tab
    tab.invisible = true

    if (state.rmFoldedTabs && tab.folded) {
      for (let i = tab.index + 1; i < state.tabs.length; i++) {
        if (state.tabs[i].lvl <= tab.lvl) break
        tabsMap[state.tabs[i].id] = state.tabs[i]
      }
    }
  }

  // Set tabs to be removed
  const tabs = Object.values(tabsMap).sort((a, b) => a.index - b.index)
  const toRemove = tabs.map(t => t.id)
  if (state.removingTabs && state.removingTabs.length) {
    state.removingTabs = [...state.removingTabs, ...toRemove]
  } else {
    state.removingTabs = [...toRemove]
  }

  // No-empty panels
  if (tabs.length === panel.tabs.length && panel.noEmpty) {
    await browser.tabs.create({
      windowId: state.windowId,
      index: panel.startIndex,
      cookieStoreId: ctxId,
    })
  }

  // Update successorTabId if there are active tab
  if (tabs.length < panel.tabs.length) {
    const activeTab = tabs.find(t => t.active)
    if (activeTab) {
      const target = Utils.findSuccessorTab(state, activeTab, tabs.map(t => t.id))
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  browser.tabs.remove(toRemove)
}

/**
 * Activate tab relatively current active tab.
 */
function switchTab(state, getters, globaly, cycle, step, pinned) {
  if (state.switchTabPause) return
  state.switchTabPause = setTimeout(() => {
    clearTimeout(state.switchTabPause)
    state.switchTabPause = null
  }, 50)

  const panel = state.panels[state.panelIndex]
  let tabs
  if (state.pinnedTabsPosition === 'panel') {
    if (globaly) {
      tabs = []
      for (let p of state.panels) {
        if (!p.cookieStoreId) continue
        for (let t of state.tabs) {
          if (t.cookieStoreId === p.cookieStoreId) tabs.push(t)
        }
      }
    } else {
      tabs = state.tabs.filter(t => t.cookieStoreId === panel.cookieStoreId)
    }
  } else {
    if (pinned) tabs = getters.pinnedTabs
    else tabs = globaly ? state.tabs : panel.tabs
  }
  if (!tabs || !tabs.length) return
  if (state.scrollThroughVisibleTabs) tabs = tabs.filter(t => !t.invisible)

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
function reloadTabs(state, tabIds = []) {
  for (let tabId of tabIds) {
    const tab = state.tabsMap[tabId]
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
function activateLastActiveTabOf(state, panelIndex) {
  const p = state.panels[panelIndex]
  if (!p || !p.tabs || !p.tabs.length) return
  const tab = state.tabsMap[p.lastActiveTab]
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
function pinTabs(state, tabIds) {
  for (let tabId of tabIds) {
    let tab = state.tabsMap[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < state.tabs.length; i++) {
      const child = state.tabs[i]
      if (child.lvl <= tab.lvl) break
      if (child.parentId === tab.id) child.parentId = tab.parentId
    }
    browser.tabs.update(tabId, { pinned: true })
  }
}
function unpinTabs(tabIds) {
  for (let tabId of tabIds) browser.tabs.update(tabId, { pinned: false })
}
function repinTabs(state, tabIds) {
  for (let tabId of tabIds) {
    let tab = state.tabsMap[tabId]
    if (!tab) continue
    for (let i = tab.index + 1; i < state.tabs.length; i++) {
      const child = state.tabs[i]
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
function remuteTabs(state, tabIds) {
  for (let tabId of tabIds) {
    let tab = state.tabsMap[tabId]
    if (!tab) continue
    browser.tabs.update(tabId, { muted: !tab.mutedInfo.muted })
  }
}

/**
 * Duplicate tabs
 */
async function duplicateTabs(state, tabIds) {
  for (let tabId of tabIds) {
    let tab = state.tabsMap[tabId]
    if (!tab) continue
    await browser.tabs.create({
      windowId: state.windowId,
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
async function bookmarkTabs(state, tabIds) {
  EventBus.$emit('panelLoadingStart', 0)
  for (let tabId of tabIds) {
    let tab = state.tabsMap[tabId]
    if (!tab) continue
    await browser.bookmarks.create({ title: tab.title, url: tab.url })
  }
  EventBus.$emit('panelLoadingOk', 0)
}

/**
 * Clear all cookies of tab urls
 */
async function clearTabsCookies(state, tabIds) {
  if (!state.permAllUrls) {
    const url = browser.runtime.getURL('permissions/all-urls.html')
    browser.tabs.create({ url, windowId: state.windowId })
    return
  }

  for (let tabId of tabIds) {
    let tab = state.tabsMap[tabId]
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
async function moveTabsToNewWin(state, tabIds, incognito) {
  const first = tabIds.shift()
  const firstTab = state.tabsMap[first]
  if (!firstTab) return
  const rest = [...tabIds]
  const restTabs = rest.map(id => {
    const tab = state.tabsMap[id]
    return {
      id: tab.id,
      url: tab.url,
      parentId: tab.parentId,
      folded: tab.folded,
    }
  })

  let win

  if (state.private === !!incognito) {
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

  if (state.tabsTree) {
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
function restoreTabsTree(state, tabs) {
  if (!state.tabsTree) return

  for (let info of tabs) {
    const tab = state.tabsMap[info.id]
    if (!tab) return
    tab.parentId = info.parentId
    tab.folded = info.folded
  }

  Utils.updateTabsTree(state)
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(state, tabIds, window) {
  const ids = [...tabIds]
  const windowId = window ? window.id : await Actions.chooseWin()
  const win = (await Actions.getAllWindows()).find(w => w.id === windowId)
  const tabs = []
  for (let id of ids) {
    const tab = state.tabsMap[id]
    if (!tab) continue
    tabs.push({
      id: tab.id,
      url: tab.url,
      parentId: tab.parentId,
      folded: tab.folded,
    })
  }

  if (state.private === win.incognito) {
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

  if (state.tabsTree) {
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
async function moveTabsToCtx(state, tabIds, ctxId) {
  const ids = [...tabIds]
  const oldNewMap = {}
  const tabs = []
  for (let id of ids) {
    const tab = state.tabsMap[id]
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
      windowId: state.windowId,
      cookieStoreId: ctxId,
      url: tab.url.indexOf('http') ? null : tab.url,
    })
    await browser.tabs.remove(tab.id)

    // Update values
    oldNewMap[tab.id] = newTab.id
    if (tab.parentId > -1) {
      state.tabsMap[newTab.id].parentId = oldNewMap[tab.parentId]
    }
  }

  if (state.tabsTree) {
    Utils.updateTabsTree(state)
  }
}

/**
 * Show all tabs
 */
async function showAllTabs(state) {
  const tabsToShow = state.tabs.filter(t => t.hidden).map(t => t.id)
  if (!tabsToShow.length) return null
  return browser.tabs.show(tabsToShow)
}

/**
 * Update tabs visability
 */
function updateTabsVisability(state) {
  const hideFolded = state.hideFoldedTabs
  const hideInact = state.hideInact
  const actPanelIndex = state.panelIndex < 0 ? state.lastPanelIndex : state.panelIndex
  const actPanel = state.panels[actPanelIndex]
  if (!actPanel || !actPanel.tabs) return
  const actCtx = actPanel.cookieStoreId

  const toShow = []
  const toHide = []
  for (let tab of state.tabs) {
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
function foldTabsBranch(state, tabId) {
  const toHide = []
  const tab = state.tabsMap[tabId]
  if (!tab) return
  tab.folded = true
  for (let i = tab.index + 1; i < state.tabs.length; i++) {
    const t = state.tabs[i]
    if (t.lvl <= tab.lvl) break
    if (t.active) browser.tabs.update(tabId, { active: true })
    if (!t.invisible) {
      t.invisible = true
      toHide.push(t.id)
    }
  }

  // Update succession
  if (tab.active) {
    const target = Utils.findSuccessorTab(state, tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (state.hideFoldedTabs && toHide.length) {
    browser.tabs.hide(toHide)
  }
  saveTabsTree(state)
}

/**
 * Show children of tab
 */
function expTabsBranch(state, tabId) {
  const toShow = []
  const preserve = []
  const tab = state.tabsMap[tabId]
  if (!tab) return
  if (tab.invisible) expTabsBranch(state, tab.parentId)
  for (let t of state.tabs) {
    if (state.autoFoldTabs && t.id !== tabId && t.isParent && !t.folded && tab.lvl === t.lvl) {
      foldTabsBranch(state, t.id)
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
    const target = Utils.findSuccessorTab(state, tab)
    if (target) browser.tabs.moveInSuccession([tab.id], target.id)
  }

  if (state.hideFoldedTabs && toShow.length) {
    browser.tabs.show(toShow)
  }
  saveTabsTree(state)
}

/**
 * Toggle tabs branch visability (fold/expand)
 */
async function toggleBranch(state, tabId) {
  const rootTab = state.tabsMap[tabId]
  if (!rootTab) return
  if (rootTab.folded) expTabsBranch(state, tabId)
  else foldTabsBranch(state, tabId)
}

/**
 * Drop to tabs panel
 */
async function dropToTabs(state, event, dropIndex, dropParent, nodes, pin) {
  const currentPanel = state.panels[state.panelIndex]
  const destCtx = currentPanel.cookieStoreId
  const parent = state.tabsMap[dropParent]
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
      if (nodes[0].windowId !== state.windowId) {
        state.attachingTabs = [...nodes]
        for (let i = 0; i < nodes.length; i++) {
          const index = dropIndex + i
          await browser.tabs.move(nodes[i].id, { windowId: state.windowId, index })
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
        let tab = state.tabsMap[n.id]
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
        state.movingTabs = tabs.map(t => t.id)
        browser.tabs.move([...state.movingTabs], { windowId: state.windowId, index: dropIndex })
      }

      // Update tabs tree
      if (state.tabsTree) {
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
            if (state.hideFoldedTabs && !tab.hidden) toHide.push(tab.id)
          } else if (tab.parentId === parentId) {
            if (state.hideFoldedTabs && tab.hidden) toShow.push(tab.id)
          }
        }

        // If there are no moving, just update tabs tree
        if (!moveIndexOk) {
          Utils.updateTabsTree(state, currentPanel.startIndex, currentPanel.endIndex + 1)
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
        if (!state.tabsTree && node.type === 'folder') continue
        if (state.tabsTreeLimit > 0 && node.type === 'folder') continue

        if (oldNewMap[node.parentId] >= 0) opener = oldNewMap[node.parentId]
        const info = await browser.tabs.create({
          active: !(parent && parent.folded),
          cookieStoreId: destCtx,
          index: dropIndex + i,
          openerTabId: opener,
          url: node.url ? node.url : Utils.getGroupUrl(node.title),
          windowId: state.windowId,
          pinned: pin,
        })
        oldNewMap[node.id] = info.id
        if (state.tabsMap[info.id] && opener) {
          state.tabsMap[info.id].parentId = opener
        }
      }

      // Remove source tabs
      if (nodes[0].type === 'tab' && !event.ctrlKey) {
        const toRemove = nodes.map(n => n.id)
        state.removingTabs = [...toRemove]
        await browser.tabs.remove(toRemove)
      }

      // Update tabs tree if there are no tabs was deleted
      if (nodes[0].type !== 'tab' || event.ctrlKey) {
        Utils.updateTabsTree(state, dropIndex - 1, dropIndex + nodes.length)
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
        windowId: state.windowId,
        pinned: pin,
      })
    }
  }
}

/**
 * Flatten tabs tree
 */
function flattenTabs(state, tabIds) {
  // Gather children
  let minLvlTab = { lvl: 999 }
  const toFlat = [...tabIds]
  const ttf = tabIds.map(id => state.tabsMap[id])
  for (let tab of state.tabs) {
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

  Utils.updateTabsTree(state, ttf[0].index - 1, ttf[ttf.length - 1].index + 1)
  saveTabsTree(state, 250)
}

/**
 * Group tabs
 */
async function groupTabs(state, tabIds) {
  // Get tabs
  const tabs = []
  for (let t of state.tabs) {
    if (tabIds.includes(t.id)) tabs.push(t)
    else if (tabIds.includes(t.parentId)) {
      tabIds.push(t.id)
      tabs.push(t)
    }
  }

  if (!tabs.length) return
  if (tabs[0].lvl >= state.tabsTreeLimit) return

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
    windowId: state.windowId,
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
  Utils.updateTabsTree(state, tabs[0].index - 2, tabs[tabs.length - 1].index + 1)
  saveTabsTree(state, 250)
}

/**
 * Get grouped tabs (for group page)
 */
async function getGroupInfo(state, groupId) {
  await Utils.sleep(128)

  const idData = groupId.split(':id:')
  const title = idData[0]
  const id = idData[1]
  const groupTab = state.tabs.find(t => {
    if (id) return t.url.endsWith(id)
    else return t.title === title && t.url.startsWith('moz')
  })
  if (!groupTab) return {}

  const out = {
    id: groupTab.id,
    tabs: [],
  }

  for (let i = groupTab.index + 1; i < state.tabs.length; i++) {
    const tab = state.tabs[i]
    if (tab.lvl <= groupTab.lvl) break
    out.tabs.push({
      id: tab.id,
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
function createTabAfter(state, tabId) {
  // Get target tab
  const targetTab = state.tabsMap[tabId]
  if (!targetTab) return

  // Get index and parentId for new tab
  let parentId
  let index = targetTab.index + 1
  if (targetTab.isParent && !targetTab.folded) {
    parentId = targetTab.id
  } else {
    parentId = targetTab.parentId
    while (state.tabs[index] && state.tabs[index].lvl > targetTab.lvl) {
      index++
    }
  }
  if (parentId < 0) parentId = undefined

  browser.tabs.create({
    index,
    cookieStoreId: targetTab.cookieStoreId,
    windowId: state.windowId,
    openerTabId: parentId,
  })
}

export default {
  loadTabs,
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
  restoreTabsTree,
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
}