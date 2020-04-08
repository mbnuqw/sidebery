import EventBus from '../../event-bus'
import { translate } from '../../../addon/locales/dict'
import { DEFAULT_CTX_ID, DEFAULT_CTX, PRIVATE_CTX, GROUP_URL } from '../../../addon/defaults'

const URL_WITHOUT_PROTOCOL_RE = /^(.+\.)\/?(.+\/)?\w+/

let updateGroupTabTimeouit
let urlRuleHistory = {}

/**
 * Load tabs using global storage
 */
async function loadTabsFromGlobalStorage() {
  let windowId = browser.windows.WINDOW_ID_CURRENT
  let [tabs, storage] = await Promise.all([
    browser.tabs.query({ windowId }),
    browser.storage.local.get({ tabsData_v4: null }),
  ])

  // Check if there is blank tab with inlined info about tabs
  let dataTabIndex = tabs.findIndex(t => t.url.startsWith('about:blank#tabsdata'))
  if (dataTabIndex !== -1) {
    return await this.actions.loadTabsFromInlineData(tabs, dataTabIndex)
  }

  let activePanel = this.state.panels[this.state.panelIndex] || this.state.panels[1]
  let tabsData = storage.tabsData_v4 ? storage.tabsData_v4 : []
  let lastPanel = this.state.panels.find(p => p.tabs)
  let idsMap = {}
  let activeTab

  // Find most appropriate data-set to restoring prev tabs state
  tabsData = Utils.findDataForTabs(tabs, tabsData)
  if (!tabsData.length) {
    let storage = await browser.storage.local.get({ prevTabsData_v4: [] })
    tabsData = Utils.findDataForTabs(tabs, storage.prevTabsData_v4)
  }

  // Select missed group tabs
  let groups = {}
  for (let tabData of tabsData) {
    if (tabData.isMissedGroup) groups[tabData.id] = tabData
  }

  // Zip tabs with sidebery data
  let tabsWithData = tabs.map(t => [t, tabsData.find(d => d.index === t.index)])

  // Go through tabs and restore sidebery props
  this.state.tabsMap = []
  for (let [tab, data] of tabsWithData) {
    // Normalize tab
    let defaultPanel = tab.pinned ? DEFAULT_CTX_ID : null
    Utils.normalizeTab(tab, defaultPanel)

    // Highlight bookmarks with that url
    this.actions.highlightBookmarks(tab.url)

    if (data) {
      // If parent tab is missed try to find it in groups
      if (data.parentId > -1 && idsMap[data.parentId] === undefined) {
        let group = groups[data.parentId]

        if (group) {
          let toRestore = [group]

          while (group.parentId > -1 && idsMap[group.parentId] === undefined) {
            group = groups[group.parentId]
            if (!group) break
            toRestore.unshift(group)
          }

          await this.actions.recreateParentGroups(tabs, toRestore, idsMap, tab.index)
          for (let k = tab.index + 1; k < tabs.length; k++) {
            tabs[k].index = k
          }
        }
      }

      // Restore props
      tab.panelId = data.panelId || lastPanel.id
      if (idsMap[data.parentId] >= 0) tab.parentId = idsMap[data.parentId]
      tab.folded = !!data.folded
      idsMap[data.id] = tab.id

      if (tab.url.startsWith(GROUP_URL)) this.actions.linkGroupWithPinnedTab(tab, tabs)

      // Normalize panelId
      let panel = this.state.panelsMap[tab.panelId]
      if (!panel) {
        if (tab.pinned) tab.panelId = DEFAULT_CTX_ID
        else tab.panelId = lastPanel.id
      } else {
        if (!tab.pinned) {
          // Check order of panels
          if (panel.index < lastPanel.index) tab.panelId = lastPanel.id
          else lastPanel = panel
        }
      }
    }

    // Use openerTabId as fallback for parentId
    if (tab.parentId === -1 && this.state.tabsMap[tab.openerTabId]) tab.parentId = tab.openerTabId

    this.state.tabsMap[tab.id] = tab

    // Find active tab
    if (tab.active) activeTab = tab
  }

  this.state.tabs = tabs
  this.actions.updatePanelsTabs()
  this.actions.updateTabsTree()

  // Switch to panel with active tab
  let activePanelIsTabs = activePanel.type === 'tabs' || activePanel.type === 'default'
  let activePanelIsOk = activeTab.panelId === activePanel.id
  if (activePanelIsOk) activePanel.lastActiveTab = activeTab.id
  if (!activeTab.pinned && activePanelIsTabs && !activePanelIsOk) {
    let panel = this.state.panelsMap[activeTab.panelId]
    if (panel) {
      this.state.panelIndex = panel.index
      this.state.lastPanelIndex = panel.index
      panel.lastActiveTab = activeTab.id
    }
  }

  // Set active tab id
  this.state.activeTabId = activeTab.id

  // Update succession
  if (this.state.activateAfterClosing !== 'none' && activeTab) {
    let target = Utils.findSuccessorTab(this.state, activeTab)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }
}

/**
 * Load tabs using session storage
 */
async function loadTabsFromSessionStorage() {
  let windowId = browser.windows.WINDOW_ID_CURRENT
  let [tabs, groups] = await Promise.all([
    browser.tabs.query({ windowId }),
    browser.sessions.getWindowValue(this.state.windowId, 'groups'),
  ])
  if (!groups) groups = {}

  // Check if there is blank tab with inlined info about tabs
  let dataTabIndex = tabs.findIndex(t => t.url.startsWith('about:blank#tabsdata'))
  if (dataTabIndex !== -1) {
    return await this.actions.loadTabsFromInlineData(tabs, dataTabIndex)
  }

  // Get previuos state of tabs
  let tabsData = await Promise.all(tabs.map(t => browser.sessions.getTabValue(t.id, 'data')))

  let activePanel = this.state.panels[this.state.panelIndex] || this.state.panels[1]
  let lastPanel = this.state.panels.find(p => p.tabs).id
  let offset = 0
  let activeTab
  let idsMap = {}

  // Set tabs initial props and update state
  this.state.tabsMap = []
  for (let data, tab, i = 0; i < tabs.length; i++) {
    tab = tabs[i]
    data = tabsData[i - offset]

    let defaultPanel = tab.pinned ? DEFAULT_CTX_ID : null
    Utils.normalizeTab(tab, defaultPanel)

    // Highlight bookmarks with that url
    this.actions.highlightBookmarks(tab.url)

    if (data) {
      // Check if parent tab is missing and it group page
      if (data.parentId > -1 && idsMap[data.parentId] === undefined && groups[data.parentId]) {
        let group = groups[data.parentId]

        let toRestore = [group]
        while (idsMap[group.parentId] === undefined && groups[group.parentId]) {
          group = groups[group.parentId]
          toRestore.unshift(group)
        }

        await this.actions.recreateParentGroups(tabs, toRestore, idsMap, tab.index)
        i += toRestore.length
        offset += toRestore.length
        for (let k = tab.index + 1; k < tabs.length; k++) {
          tabs[k].index = k
        }
      }

      // Restore props
      tab.panelId = data.panelId || lastPanel.id
      if (idsMap[data.parentId] >= 0) tab.parentId = idsMap[data.parentId]
      tab.folded = !!data.folded
      idsMap[data.id] = tab.id

      if (tab.url.startsWith(GROUP_URL)) this.actions.linkGroupWithPinnedTab(tab, tabs)

      // Normalize panelId
      let panel = this.state.panelsMap[tab.panelId]
      if (!panel) {
        if (tab.pinned) tab.panelId = DEFAULT_CTX_ID
        else tab.panelId = lastPanel.id
      } else {
        if (!tab.pinned) {
          // Check order of panels
          if (panel.index < lastPanel.index) tab.panelId = lastPanel.id
          else lastPanel = panel
        }
      }
    }

    // Use openerTabId as fallback for parentId
    if (tab.parentId === -1 && this.state.tabsMap[tab.openerTabId]) tab.parentId = tab.openerTabId

    this.state.tabsMap[tab.id] = tab

    // Find active tab
    if (tab.active) activeTab = tab
  }

  this.state.tabs = tabs
  this.actions.updatePanelsTabs()
  this.actions.updateTabsTree()

  // Switch to panel with active tab
  let activePanelIsTabs = activePanel.type === 'tabs' || activePanel.type === 'default'
  let activePanelIsOk = activeTab.panelId === activePanel.id
  if (activePanelIsOk) activePanel.lastActiveTab = activeTab.id
  if (!activeTab.pinned && activePanelIsTabs && !activePanelIsOk) {
    let panel = this.state.panelsMap[activeTab.panelId]
    if (panel) {
      this.state.panelIndex = panel.index
      this.state.lastPanelIndex = panel.index
      panel.lastActiveTab = activeTab.id
    }
  }

  // Set active tab id
  this.state.activeTabId = activeTab.id

  // Update succession
  if (this.state.activateAfterClosing !== 'none' && activeTab) {
    let target = Utils.findSuccessorTab(this.state, activeTab)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  this.state.tabs.forEach(t => this.actions.saveTabData(t))
}

/**
 * Recreate group tabs
 */
async function recreateParentGroups(tabs, groups, idsMap, index) {
  for (let group, j = 0; j < groups.length; j++) {
    group = groups[j]
    let groupId = Utils.getGroupId(group.url)
    let rawTitle = groupId.slice(0, -16)
    let groupRawParams = Utils.getGroupRawParams(group.url)
    let url = browser.runtime.getURL('group/group.html') + groupRawParams + `#${groupId}`
    let discarded = group.ctx === DEFAULT_CTX_ID || !group.ctx
    let groupTab = await browser.tabs.create({
      windowId: this.state.windowId,
      index: index + j,
      url,
      cookieStoreId: group.ctx,
      active: false,
      discarded,
      title: discarded ? decodeURI(rawTitle) : undefined,
    })
    groupTab.url = url

    if (url.startsWith(GROUP_URL)) this.actions.linkGroupWithPinnedTab(groupTab, tabs)

    Utils.normalizeTab(groupTab, null)

    tabs.splice(index + j, 0, groupTab)
    groupTab.panelId = group.panelId || DEFAULT_CTX_ID
    if (idsMap[group.parentId] >= 0) groupTab.parentId = idsMap[group.parentId]
    groupTab.folded = !!group.folded
    idsMap[group.id] = groupTab.id

    this.state.tabsMap[groupTab.id] = groupTab
    this.actions.saveTabData(groupTab)
  }
}

/**
 * Set relGroupId and relPinId props in related pinned and group tabs
 */
function linkGroupWithPinnedTab(groupTab, tabs) {
  let info = new URL(groupTab.url)
  let pin = info.searchParams.get('pin')
  if (!pin) return

  let [ctx, url] = pin.split('::')
  let pinnedTab = tabs.find(t => t.pinned && t.cookieStoreId === ctx && t.url === url)
  if (!pinnedTab) {
    info.searchParams.delete('pin')
    groupTab.url = info.href
    browser.tabs.update(groupTab.id, { url: info.href })
    return
  }

  pinnedTab.relGroupId = groupTab.id
  groupTab.relPinId = pinnedTab.id
}

/**
 * ...
 */
async function replaceRelGroupWithPinnedTab(groupTab, pinnedTab) {
  await browser.tabs.move(pinnedTab.id, { index: groupTab.index - 1 })
  Utils.sleep(120)

  groupTab.parentId = pinnedTab.id
  this.actions.updateTabsTree()

  await browser.tabs.remove(groupTab.id)
}

/**
 * Load tabs using info from the first tab (e.g. for snapshots)
 */
async function loadTabsFromInlineData(tabs, dataTabIndex) {
  // let firstTab = tabs[0]
  let dataTab = tabs[dataTabIndex]
  if (!dataTab) return this.actions.updatePanelsTabs()

  let tabsInfoStr = dataTab.url.slice(20)
  let tabsInfo = JSON.parse(decodeURIComponent(tabsInfoStr))
  let activePanel = this.state.panels[this.state.panelIndex] || this.state.panels[1]

  // Wait for all tabs
  if (tabsInfo.length !== tabs.length - 1) {
    let polling
    await new Promise(res => {
      setTimeout(() => {
        clearInterval(polling)
        res()
      }, 10000)

      polling = setInterval(async () => {
        tabs = await browser.tabs.query({ windowId: this.state.windowId })
        if (tabsInfo.length === tabs.length - 1) {
          clearInterval(polling)
          res()
        }
      }, 1234)
    })
  }

  let secondTab = tabs[dataTabIndex + 1]
  if (!secondTab) secondTab = tabs[dataTabIndex - 1]
  if (!secondTab) return this.actions.updatePanelsTabs()

  await browser.tabs.update(secondTab.id, { active: true })
  secondTab.active = true
  secondTab.discarded = false
  await browser.tabs.remove(dataTab.id)
  tabs.splice(dataTabIndex, 1)

  let parents = []
  let activeTab
  for (let prevTab, tab, info, i = 0; i < tabsInfo.length; i++) {
    info = tabsInfo[i]
    prevTab = tabs[i - 1]
    tab = tabs[i]
    if (!tab) return this.actions.updatePanelsTabs()

    tab.index = i
    tab.loading = false

    Utils.normalizeTab(tab, DEFAULT_CTX_ID)

    if (
      this.state.highlightOpenBookmarks &&
      this.state.bookmarksUrlMap &&
      this.state.bookmarksUrlMap[tab.url]
    ) {
      for (let b of this.state.bookmarksUrlMap[tab.url]) {
        b.isOpen = true
      }
    }

    tab.lvl = info.lvl
    tab.panelId = info.panelId

    if (prevTab) {
      if (prevTab.lvl < tab.lvl) {
        tab.parentId = prevTab.id
        parents[tab.lvl] = prevTab.id
      } else if (prevTab.lvl === tab.lvl) {
        tab.parentId = prevTab.parentId
      } else if (prevTab.lvl > tab.lvl) {
        if (tab.lvl > 0) tab.parentId = parents[tab.lvl]
      }
    }

    this.state.tabsMap[tab.id] = tab

    if (tab.active) {
      activeTab = tab
      this.state.activeTabId = tab.id
    }
  }

  this.state.tabs = tabs
  this.actions.updatePanelsTabs()
  this.actions.updateTabsTree()

  // Switch to panel with active tab
  let activePanelIsTabs = activePanel.type === 'tabs' || activePanel.type === 'default'
  let activePanelIsOk = activeTab.panelId === activePanel.id
  if (!activeTab.pinned && activePanelIsTabs && !activePanelIsOk) {
    let panel = this.state.panelsMap[activeTab.panelId]
    if (panel) {
      this.state.panelIndex = panel.index
      this.state.lastPanelIndex = panel.index
    }
  }

  // Update succession
  if (this.state.activateAfterClosing !== 'none' && activeTab) {
    let target = Utils.findSuccessorTab(this.state, activeTab)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    this.state.tabs.forEach(t => this.actions.saveTabData(t))
    this.actions.saveGroups()
  }
}

/**
 * Save tabs data
 */
function saveTabsData(delay = 300) {
  if (this._saveTabsDataTimeout) clearTimeout(this._saveTabsDataTimeout)
  this._saveTabsDataTimeout = setTimeout(() => {
    let data = []
    let pinnedLen = 0
    for (let tab of this.state.tabs) {
      if (tab.pinned) pinnedLen++
      let info = { id: tab.id, url: tab.url }
      if (tab.parentId > -1) info.parentId = tab.parentId
      if (tab.panelId !== DEFAULT_CTX_ID) info.panelId = tab.panelId
      if (tab.folded) info.folded = tab.folded
      if (tab.cookieStoreId !== DEFAULT_CTX_ID) info.ctx = tab.cookieStoreId
      data.push(info)
    }

    // Check tabs and panels ordering
    if (this.state.tabsCheck && this.actions.checkTabsPositioning(pinnedLen)) {
      if (this.state.tabsFix === 'notify') {
        this.actions.notify({
          title: translate('notif.tabs_err'),
          lvl: 'err',
          ctrl: translate('notif.tabs_err_fix'),
          callback: async () => this.actions.normalizeTabs(120),
        })
      }
      if (this.state.tabsFix === 'reinit') this.actions.normalizeTabs(500)
      return
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
 * Save tab data to its session storage
 */
function saveTabData(tabOrId) {
  if (tabOrId.id === undefined) tabOrId = this.state.tabsMap[tabOrId]
  if (!tabOrId) return

  browser.sessions.setTabValue(tabOrId.id, 'data', {
    id: tabOrId.id,
    panelId: tabOrId.panelId,
    parentId: tabOrId.parentId,
    folded: tabOrId.folded,
    lvl: tabOrId.lvl,
  })
}

function saveGroups(delay = 300) {
  if (this._saveGroupsTimeout) clearTimeout(this._saveGroupsTimeout)
  this._saveGroupsTimeout = setTimeout(() => {
    this._saveGroupsTimeout = null
    let groups = {}

    for (let tab of this.state.tabs) {
      if (!Utils.isGroupUrl(tab.url)) continue
      let prevTab = this.state.tabs[tab.index - 1]
      let nextTab = this.state.tabs[tab.index + 1]
      let groupInfo = {
        id: tab.id,
        index: tab.index,
        ctx: tab.cookieStoreId,
        panelId: tab.panelId,
        parentId: tab.parentId,
        folded: tab.folded,
        url: tab.url,
      }
      if (prevTab) groupInfo.prevTab = prevTab.id
      if (nextTab) groupInfo.nextTab = nextTab.id
      groups[tab.id] = groupInfo
    }

    browser.sessions.setWindowValue(this.state.windowId, 'groups', groups)
  }, delay)
}

/**
 * Check the tabs positioning
 */
function checkTabsPositioning(startIndex) {
  let err = false
  let index = startIndex
  perPanels: for (let panel of this.state.panels) {
    if (!panel.tabs || !panel.tabs.length) continue
    for (let panelTab of panel.tabs) {
      let globalTab = this.state.tabs[index]
      if (globalTab.index !== panelTab.index || globalTab.id !== panelTab.id) {
        err = true
        break perPanels
      }
      index++
    }
  }
  if (index !== this.state.tabs.length) err = true
  return err
}

/**
 * Load tabs and normalize order.
 */
function normalizeTabs(delay = 500) {
  if (this._normTabsTimeout) clearTimeout(this._normTabsTimeout)
  this._normTabsTimeout = setTimeout(async () => {
    this._normTabsTimeout = null
    this.state.tabsNormalizing = true

    let panels = []
    for (let panel of this.state.panels) {
      if (panel.tabs) panels.push({ id: panel.id, index: -1 })
    }

    let normTabs = []
    let nativeTabs = await browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT })
    let moves = []
    let panelId
    let index = 0
    let panelIndex = 0
    for (let nativeTab of nativeTabs) {
      let tab = this.state.tabs.find(t => t.id === nativeTab.id)
      if (tab) {
        tab.index = index++
        tab.status = 'complete'

        if (!tab.pinned) {
          if (panels[panelIndex].id !== tab.panelId) {
            let pi = panels.findIndex(p => {
              if (p.index === -1) p.index = index - 1
              return p.id === tab.panelId
            })
            if (pi > panelIndex) {
              panelIndex = pi
              panels[panelIndex].index = index
            } else {
              moves.push([tab.id, panels[pi].index])
              for (let i = pi; i < panels.length; i++) {
                panels[i].index++
              }
            }
          } else {
            panels[panelIndex].index = index
          }
        }

        normTabs.push(tab)
        panelId = tab.panelId
      } else {
        Utils.normalizeTab(nativeTab, panelId)
        normTabs.push(nativeTab)
      }
    }

    if (moves.length && !this._normTabsMoving) {
      this._normTabsMoving = true
      let moving = moves.map(m => browser.tabs.move(m[0], { index: m[1] }))
      await Promise.all(moving)
      this.actions.normalizeTabs(0)
      return
    }

    this.state.tabs = normTabs
    this.actions.updatePanelsTabs()
    this.actions.updateTabsTree()

    this.state.tabsNormalizing = false

    if (this.state.stateStorage === 'global') this.actions.saveTabsData()
    if (this.state.stateStorage === 'session') this.actions.saveGroups()

    this._normTabsMoving = false
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
 * Remove tabs descendants
 */
async function removeTabsDescendants(tabIds) {
  if (!tabIds || !tabIds.length) return

  let toRm = []
  for (let tabId of tabIds) {
    let tab = this.state.tabsMap[tabId]
    if (!tab || tabIds.includes(tab.parentId)) continue
    for (let i = tab.index + 1, t; i < this.state.tabs.length; i++) {
      t = this.state.tabs[i]
      if (t.lvl <= tab.lvl) break
      if (!toRm.includes(t.id)) toRm.push(t.id)
    }
  }

  this.actions.removeTabs(toRm)
}

/**
 * Remove tabs
 */
async function removeTabs(tabIds) {
  if (!tabIds || !tabIds.length) return
  if (!this.state.tabsMap[tabIds[0]]) return
  let panelId = this.state.tabsMap[tabIds[0]].panelId
  let panel = this.state.panelsMap[panelId]
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

    if ((this.state.rmChildTabs === 'folded' && tab.folded) || this.state.rmChildTabs === 'all') {
      for (let t, i = tab.index + 1; i < this.state.tabs.length; i++) {
        t = this.state.tabs[i]
        if (t.lvl <= tab.lvl) break
        if (t.invisible) hasInvisibleTab = true
        tabsMap[t.id] = t
      }
    }
  }

  let count = Object.keys(tabsMap).length
  let warn =
    this.state.warnOnMultiTabClose === 'any' ||
    (hasInvisibleTab && this.state.warnOnMultiTabClose === 'collapsed')
  if (warn && count > 1) {
    let pre = translate('confirm.tabs_close_pre', count)
    let post = translate('confirm.tabs_close_post', count)
    let ok = await this.actions.confirm(pre + count + post)
    if (!ok) return
  }

  // Set tabs to be removed
  let parents = {}
  let tabs = Object.values(tabsMap).sort((a, b) => a.index - b.index)
  let toRemove = tabs.map(t => {
    parents[t.id] = t.parentId
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
    this.actions.createTabInPanel(panel)
  }

  // Update successorTabId if there are active tab
  let activeTab = tabs.find(t => t.active)
  if (activeTab) {
    let target = Utils.findSuccessorTab(
      this.state,
      activeTab,
      tabs.map(t => t.id)
    )
    if (target && activeTab.successorTabId !== target.id) {
      browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (tabs.length > 1 && this.state.tabsRmUndoNote && !warn) {
    this.actions.notify({
      title: tabs.length + translate('notif.tabs_rm_post', tabs.length),
      ctrl: translate('notif.undo_ctrl'),
      callback: async () => {
        let oldNewIds = {}
        for (let i = 0; i < tabs.length; i++) {
          let tab = tabs[i]
          let panel = this.state.panelsMap[tab.panelId]
          if (!panel) continue

          let index = tab.index + i
          let parentId = oldNewIds[parents[tab.id]]
          if (parentId === undefined && this.state.tabsMap[parents[tab.id]]) {
            let parent = this.state.tabsMap[parents[tab.id]]
            if (parent.index < tab.index) parentId = parent.id
          }

          this.actions.setNewTabPosition(index, parentId, panel.id)

          let conf = {
            windowId: this.state.windowId,
            index,
            url: Utils.normalizeUrl(tab.url),
            cookieStoreId: tab.cookieStoreId,
            active: false,
          }
          if (conf.cookieStoreId === DEFAULT_CTX_ID && conf.url) {
            conf.discarded = true
            conf.title = tab.title
          }
          let newTab = await browser.tabs.create(conf)
          oldNewIds[tab.id] = newTab.id
        }
      },
    })
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

  let pinnedAndPanel = this.state.pinnedTabsPosition === 'panel' || (globaly && cycle)
  let visibleOnly = this.state.scrollThroughVisibleTabs
  let skipDiscarded = this.state.scrollThroughTabsSkipDiscarded

  let activeTab = this.state.tabsMap[this.state.activeTabId]
  if (!activeTab) activeTab = this.state.tabs.findIndex(t => t.active)
  if (!activeTab) return

  let activePanel = this.state.panels[this.state.panelIndex]
  if (!activePanel || !activePanel.tabs) return

  let tab
  let index = activeTab.index
  let t = true
  let cycled = false

  if (
    (!pinned && !globaly && activeTab.panelId !== activePanel.id) ||
    (!pinned && !pinnedAndPanel && activeTab.pinned)
  ) {
    if (step > 0) tab = activePanel.tabs[0]
    if (step < 0) tab = activePanel.tabs[activePanel.tabs.length - 1]
    if (tab) browser.tabs.update(tab.id, { active: true })
    return
  }

  for (let i = index + step; t; i += step) {
    t = this.state.tabs[i]
    if (!t) {
      if (cycle && !cycled) {
        if (step > 0) i = -1
        else i = this.state.tabs.length
        cycled = t = true
        continue
      } else {
        break
      }
    }

    if (visibleOnly && t.invisible) continue
    if (skipDiscarded && t.discarded) continue
    if (pinned && !t.pinned) continue
    if (!pinned && !globaly && t.panelId !== activeTab.panelId) continue
    if (!pinned && !pinnedAndPanel && t.pinned) continue
    tab = t
    break
  }

  if (tab && tab !== activeTab) browser.tabs.update(tab.id, { active: true })
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
  let p = this.state.panels[panelIndex]
  if (!p || !p.tabs || !p.tabs.length) return

  let activeTab = this.state.tabsMap[this.state.activeTabId]
  if (activeTab && activeTab.panelId === p.id) return

  let tab
  if (p.actTabs && p.actTabs.length) {
    let tabId = p.actTabs[p.actTabs.length - 1]
    tab = this.state.tabsMap[tabId]
  }
  if (!tab || tab.panelId !== p.id) tab = p.tabs[0]
  if (tab && tab.discarded) tab = p.tabs.find(t => !t.discarded)
  if (tab) browser.tabs.update(tab.id, { active: true })
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

    this.actions.setNewTabPosition(index, tab.parentId, tab.panelId)

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
  if (!this.state.permAllUrls) return this.actions.openSettings('all-urls')

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
      setTimeout(() => {
        tab.loading = false
      }, 2000)
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
        setTimeout(() => {
          tab.loading = 'ok'
        }, 250)
        setTimeout(() => {
          tab.loading = false
        }, 2000)
      })
      .catch(() => {
        setTimeout(() => {
          tab.loading = 'err'
        }, 250)
        setTimeout(() => {
          tab.loading = false
        }, 2000)
      })
  }
}

/**
 * Move tabs to new window
 */
async function moveTabsToNewWin(tabIds, incognito = false) {
  let tabs = []
  let toMove = []
  let tabsInfo = []
  let activeTab

  // Sort
  tabIds.sort((a, b) => {
    return this.state.tabsMap[a].index - this.state.tabsMap[b].index
  })

  // Calc and normalize tabs data
  for (let id of tabIds) {
    const tab = this.state.tabsMap[id]
    if (!tab) continue
    if (toMove.includes(id)) continue
    tabs.push(tab)
    toMove.push(id)
    let info = { lvl: tab.lvl, panelId: tab.panelId }
    if (tab.pinned) info.pinned = true
    tabsInfo.push(info)
    if (tab.active) activeTab = tab
    if (tab.folded) {
      for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
        let childTab = this.state.tabs[i]
        if (childTab.lvl <= tab.lvl) break
        tabs.push(childTab)
        toMove.push(childTab.id)
        tabsInfo.push({ lvl: childTab.lvl, panelId: childTab.panelId })
        if (childTab.active) activeTab = childTab
      }
    }
  }

  // Update succession
  if (activeTab) {
    const target = Utils.findSuccessorTab(this.state, activeTab, toMove)
    if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  // Open new window with tabs data in url of the first tab
  let tabsInfoStr = encodeURIComponent(JSON.stringify(tabsInfo))
  let win = await browser.windows.create({
    incognito,
    url: 'about:blank#tabsdata' + tabsInfoStr,
  })

  let moving = []
  let index = 1
  for (let tab of tabs) {
    if (incognito === this.state.private) {
      let conf = { windowId: win.id }
      conf.index = tab.pinned ? 0 : index++
      moving.push(browser.tabs.move(tab.id, conf))
    } else {
      let conf = {
        windowId: win.id,
        index: index++,
        url: tab.url,
        active: false,
      }
      if (incognito) conf.cookieStoreId = PRIVATE_CTX
      else conf.cookieStoreId = DEFAULT_CTX
      if (tab.cookieStoreId === DEFAULT_CTX_ID) {
        conf.discarded = true
        conf.title = tab.title
      }
      moving.push(browser.tabs.create(conf))
      moving.push(browser.tabs.remove(tab.id))
    }
  }

  await Promise.all(moving)

  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
}

/**
 *  Move tabs to window if provided,
 * otherwise show window-choosing menu.
 */
async function moveTabsToWin(tabIds, window) {
  let windowId = window ? window.id : await this.actions.chooseWin()

  // Sort
  tabIds.sort((a, b) => {
    return this.state.tabsMap[a].index - this.state.tabsMap[b].index
  })

  // Check if there is active tab and update successor id for it
  let activeTabId = tabIds.find(id => this.state.tabsMap[id].active)
  let activeTab = this.state.tabsMap[activeTabId]
  if (activeTab) {
    let target = Utils.findSuccessorTab(this.state, activeTab, tabIds)
    if (target) await browser.tabs.moveInSuccession([activeTab.id], target.id)
  }

  let tabs = []
  for (let id of tabIds) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue
    if (tab.parentId > -1 && !tabIds.includes(tab.parentId)) {
      tab.lvl = 0
      tab.parentId = -1
    }
    tabs.push(Utils.cloneObject(tab))
    if (tab.folded) {
      for (let i = tab.index + 1; i < this.state.tabs.length; i++) {
        let childTab = this.state.tabs[i]
        if (childTab.lvl <= tab.lvl) break
        tabs.push(Utils.cloneObject(childTab))
      }
    }
  }

  let ans = await browser.runtime.sendMessage({
    windowId: windowId,
    instanceType: 'sidebar',
    action: 'moveTabsToThisWin',
    args: [tabs, this.state.private],
  })
  if (!ans) {
    await browser.tabs.move(
      tabs.map(t => t.id),
      { windowId, index: -1 }
    )
  }

  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
}

/**
 * Move (or reopen) provided tabs in current window.
 */
async function moveTabsToThisWin(tabs, fromPrivate) {
  if (this.state.private === fromPrivate) {
    if (!this.state.attachingTabs) this.state.attachingTabs = [...tabs]
    else this.state.attachingTabs.push(...tabs)

    let panel = this.state.panelsMap[tabs[0].panelId]
    let index = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex

    for (let tab of tabs) {
      if (!tab.pinned) this.actions.setNewTabPosition(index, tab.parentId, tab.panelId)
      browser.tabs.move(tab.id, {
        windowId: this.state.windowId,
        index: tab.pinned ? 0 : index,
      })
      index++
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
 * Reopen tabs in provided container.
 */
async function reopenTabsInCtx(tabIds, ctxId) {
  let idsMap = {}
  let panel = this.state.panels.find(p => p.moveTabCtx === ctxId)
  let index = panel ? panel.endIndex : -1
  if (panel && panel.tabs.length) index += 1
  if (!panel) panel = this.state.panels[this.state.panelIndex]

  let tabs = []
  for (let id of tabIds) {
    let tab = this.state.tabsMap[id]
    tabs.push({
      id: tab.id,
      index: tab.index,
      url: Utils.normalizeUrl(tab.url),
      title: tab.title,
      parentId: tab.parentId,
      active: tab.active,
    })
  }
  tabs.sort((a, b) => a.index - b.index)
  let ids = tabs.map(t => t.id)

  for (let tab of tabs) {
    let createConf = {
      active: tab.active,
      windowId: this.state.windowId,
      cookieStoreId: ctxId,
      url: tab.url,
    }

    if (ctxId === DEFAULT_CTX_ID && !tab.active) {
      createConf.title = tab.title
      createConf.discarded = true
    }

    if (index === -1) createConf.index = tab.index
    else createConf.index = index++

    this.actions.setNewTabPosition(createConf.index, tab.parentId, panel.id)
    if (idsMap[tab.parentId] >= 0) {
      createConf.openerTabId = idsMap[tab.parentId]
      this.state.newTabsPosition[createConf.index].parent = idsMap[tab.parentId]
    }

    let newTab = await browser.tabs.create(createConf)

    idsMap[tab.id] = newTab.id
    tab.newId = newTab.id
  }

  if (this.state.tabsTree) {
    this.actions.updateTabsTree()
  }

  this.state.removingTabs = [...ids]
  await browser.tabs.remove(ids)
}

/**
 * Move tabs to panel
 */
async function moveTabsToPanel(tabIds, panelId) {
  let activePanel = this.state.panels[this.state.panelIndex]
  if (!activePanel || !activePanel.tabs) return

  let tabs = tabIds.map(id => this.state.tabsMap[id])
  let targetPanel = this.state.panelsMap[panelId]
  if (!targetPanel) return

  let index = targetPanel.endIndex
  if (targetPanel.tabs.length > 0) index += 1

  await this.actions.moveDroppedNodes(index, -1, tabs, tabs[0].pinned, targetPanel)
  if (this.state.tabsTree && activePanel.tabs.length > 0) {
    this.actions.updateTabsTree(activePanel.startIndex, activePanel.endIndex + 1)
  }
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    tabs.forEach(t => this.actions.saveTabData(t))
  }
}

/**
 * Show all tabs
 */
async function showAllTabs() {
  let tabsToShow = this.state.tabs.filter(t => t.hidden).map(t => t.id)
  if (!tabsToShow.length) return null
  return browser.tabs.show(tabsToShow)
}

/**
 * Update tabs visability
 */
function updateTabsVisability() {
  let hideFolded = this.state.hideFoldedTabs
  let hideInact = this.state.hideInact
  let actPanelIndex = this.state.panelIndex < 0 ? this.state.lastPanelIndex : this.state.panelIndex

  let actPanel = this.state.panels[actPanelIndex]
  if (!actPanel || !actPanel.tabs) return

  let toShow = []
  let toHide = []
  for (let tab of this.state.tabs) {
    if (tab.pinned) continue

    if (hideFolded && tab.invisible) {
      if (!tab.hidden) toHide.push(tab.id)
      continue
    }

    if (hideInact && tab.panelId !== actPanel.id) {
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
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') this.actions.saveTabData(tabId)
}

/**
 * Show children of tab
 */
function expTabsBranch(tabId) {
  const toShow = []
  const preserve = []
  let autoFold = []

  const tab = this.state.tabsMap[tabId]
  if (!tab) return

  const panel = this.state.panelsMap[tab.panelId]
  if (!panel) return

  tab.lastAccessed = Date.now()
  if (tab.invisible) this.actions.expTabsBranch(tab.parentId)
  for (let t of panel.tabs) {
    if (this.state.autoFoldTabs && t.id !== tabId && t.isParent && !t.folded && tab.lvl === t.lvl) {
      autoFold.push(t)
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

  // Auto fold
  if (this.state.autoFoldTabs) {
    autoFold.sort((a, b) => {
      let aMax = a.lastAccessed
      let bMax = b.lastAccessed
      if (a.childLastAccessed) aMax = Math.max(a.lastAccessed, a.childLastAccessed)
      if (b.childLastAccessed) bMax = Math.max(b.lastAccessed, b.childLastAccessed)
      return aMax - bMax
    })

    if (this.state.autoFoldTabsExcept > 0) {
      autoFold = autoFold.slice(0, -this.state.autoFoldTabsExcept)
    }
    for (let t of autoFold) {
      this.actions.foldTabsBranch(t.id)
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
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') this.actions.saveTabData(tabId)
}

/**
 * Toggle tabs branch visability (fold/expand)
 */
async function toggleBranch(tabId) {
  const rootTab = this.state.tabsMap[tabId]
  if (!rootTab) return
  if (rootTab.folded) this.actions.expTabsBranch(tabId)
  else this.actions.foldTabsBranch(tabId)
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
async function dropToTabs(event, dropIndex, dropParent, nodes, pin, isInside) {
  let activePanel = this.state.panels[this.state.panelIndex]
  let destCtx = DEFAULT_CTX_ID
  if (activePanel.newTabCtx !== 'none') destCtx = activePanel.newTabCtx
  if (dropIndex === -1) dropIndex = activePanel.endIndex + 1

  // Tabs or Bookmarks
  if (nodes && nodes.length) {
    let globalPin = pin && activePanel.panel !== 'TabsPanel'
    let ctxChange =
      activePanel.newTabCtx !== 'none' && nodes[0].cookieStoreId !== activePanel.newTabCtx
    let sameContainer = ctxChange ? nodes[0].ctx === destCtx : true

    // Move tabs
    if (nodes[0].type === 'tab' && (sameContainer || globalPin) && !event.ctrlKey) {
      this.actions.moveDroppedNodes(dropIndex, dropParent, nodes, pin, activePanel)
    } else {
      this.actions.recreateDroppedNodes(event, dropIndex, dropParent, nodes, pin, destCtx)
    }
  }

  // Native event
  if (!nodes) {
    this.actions.dropToTabsNative(event, dropIndex, dropParent, destCtx, pin, isInside)
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
      let parentId = nodes[i].parentId > -1 ? nodes[i].parentId : dropParent
      this.actions.setNewTabPosition(index, parentId, currentPanel.id)
      nodes[i].sel = false
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
  let actualDropIndex = dropIndex
  dropIndex = dropIndex <= nodes[0].index ? dropIndex : dropIndex - 1

  // Get dragged tabs
  const tabs = []
  for (let n of nodes) {
    let tab = this.state.tabsMap[n.id]
    if (!tab) return
    tab.destPanelId = currentPanel.id
    tabs.push(tab)
  }
  tabs.sort((a, b) => a.index - b.index)

  let pinTab = pin && !tabs[0].pinned
  let unpinTab = !pin && tabs[0].pinned

  // Unpin tab
  if (unpinTab) {
    for (let t of tabs) {
      t.unpinning = true
      await browser.tabs.update(t.id, { pinned: false })
      t.unpinning = false
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

  let differentPanel = tabs[0].panelId !== currentPanel.id

  // Move if target index is different or pinned state changed
  let lastTab = tabs[tabs.length - 1]
  let moveNeeded = tabs[0].index !== dropIndex && lastTab.index !== dropIndex
  if (!moveNeeded) moveNeeded = lastTab.index - tabs[0].index + 1 !== tabs.length
  if (moveNeeded || pinTab || unpinTab) {
    this.state.movingTabs = []
    let index = 0
    for (let tab of tabs) {
      index = this.state.tabs.indexOf(tab, index)
      this.state.tabs.splice(index, 1)
      this.state.movingTabs.push(tab.id)
    }
    let targetIndex = actualDropIndex
    if (tabs[0].index < actualDropIndex) targetIndex = actualDropIndex - tabs.length
    this.state.tabs.splice(targetIndex, 0, ...tabs)
    for (let i = 0; i < this.state.tabs.length; i++) {
      this.state.tabs[i].index = i
    }
    browser.tabs.move([...this.state.movingTabs], {
      windowId: this.state.windowId,
      index: dropIndex,
    })
  }

  if (differentPanel) {
    for (let tab of tabs) {
      tab.panelId = currentPanel.id
    }
  }
  this.actions.updatePanelsTabs()

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
    this.actions.updateTabsTree(currentPanel.startIndex, currentPanel.endIndex + 1)
    if (this.state.stateStorage === 'global') this.actions.saveTabsData()
    if (this.state.stateStorage === 'session') {
      tabs.forEach(t => this.actions.saveTabData(t))
    }
  }

  // Hide/Show tabs
  if (toHide.length) browser.tabs.hide(toHide)
  if (toShow.length) browser.tabs.show(toShow)
}

/**
 * Recreate dropped nodes
 */
async function recreateDroppedNodes(event, dropIndex, dropParent, nodes, pin, destCtx, panel) {
  // Create new tabs
  const oldNewMap = []
  let opener = dropParent < 0 ? undefined : dropParent
  let firstNode = nodes[0]

  if (!panel) panel = this.state.panels[this.state.panelIndex]
  if (!destCtx) destCtx = DEFAULT_CTX_ID

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

    if (createConf.cookieStoreId === DEFAULT_CTX_ID) {
      createConf.discarded = true
      createConf.title = node.title
      createConf.active = false
    }

    if (oldNewMap[node.parentId] >= 0) {
      createConf.openerTabId = oldNewMap[node.parentId]
    } else {
      createConf.openerTabId = opener
    }

    this.actions.setNewTabPosition(dropIndex + i, createConf.openerTabId, panel.id)

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
    this.actions.updateTabsTree(dropIndex - 1, dropIndex + nodes.length)
  }
}

/**
 * Parse native drop event and create tab
 */
async function dropToTabsNative(event, dropIndex, dropParent, destCtx, pin, isInside) {
  let url = await Utils.getUrlFromDragEvent(event)
  let panel = this.state.panels[this.state.panelIndex]

  if (!url) {
    let query = await Utils.getDataFromDragEvent(event, ['text/plain'])
    if (query) {
      let urls = Utils.findUrls(query)
      if (urls.length) {
        let offset = 0
        for (let url of urls) {
          await browser.tabs.create({
            url,
            index: dropIndex + offset++,
            openerTabId: dropParent < 0 ? undefined : dropParent,
            cookieStoreId: destCtx,
            windowId: this.state.windowId,
            pinned: pin,
          })
        }
        return
      }

      let tabId
      if (!isInside) {
        this.actions.setNewTabPosition(dropIndex, dropParent, panel.id)
        let searchTab = await browser.tabs.create({
          index: dropIndex,
          openerTabId: dropParent < 0 ? undefined : dropParent,
          cookieStoreId: destCtx,
          windowId: this.state.windowId,
          pinned: pin,
        })
        tabId = searchTab.id
      } else if (dropParent > -1) {
        tabId = dropParent
      }
      return browser.search.search({ query, tabId })
    }
  }

  let prevTab = this.state.tabs[dropIndex - 1]
  if (prevTab && prevTab.folded) {
    for (let tab; dropIndex < this.state.tabs.length; dropIndex++) {
      tab = this.state.tabs[dropIndex]
      if (tab.lvl <= prevTab.lvl) break
    }
  }

  if (url && destCtx) {
    if (panel && panel.tabs) this.actions.setNewTabPosition(dropIndex, dropParent, panel.id)

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
    if (tab.parentId === -1) browser.tabs.update(tab.id, { openerTabId: tab.id })
  }

  this.actions.updateTabsTree(ttf[0].index - 1, ttf[ttf.length - 1].index + 1)
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    ttf.forEach(t => this.actions.saveTabData(t))
  }
}

/**
 * Group tabs
 */
async function groupTabs(tabIds, conf = {}) {
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
  let groupTitle
  if (conf.title) {
    groupTitle = conf.title
  } else {
    const titles = tabs.map(t => t.title)
    let commonPart = Utils.commonSubStr(titles)
    let isOk = commonPart ? commonPart[0] === commonPart[0].toUpperCase() : false
    groupTitle = commonPart
      .replace(/^(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+/g, ' ')
      .replace(/(\s|\.|_|-|—|–|\(|\)|\/|=|;|:)+$/g, ' ')
      .trim()

    if (!isOk || groupTitle.length < 4) {
      const hosts = tabs.filter(t => !t.url.startsWith('about:')).map(t => t.url.split('/')[2])
      groupTitle = Utils.commonSubStr(hosts)
      if (groupTitle.startsWith('.')) groupTitle = groupTitle.slice(1)
      groupTitle = groupTitle.replace(/^www\./, '')
    }

    if (!isOk || groupTitle.length < 4) groupTitle = tabs[0].title
  }

  // Find index and create group tab
  this.actions.setNewTabPosition(tabs[0].index, tabs[0].parentId, tabs[0].panelId)
  const groupTab = await browser.tabs.create({
    active: !!conf.active,
    cookieStoreId: tabs[0].cookieStoreId,
    index: tabs[0].index,
    openerTabId: tabs[0].parentId < 0 ? undefined : tabs[0].parentId,
    url: Utils.createGroupUrl(groupTitle, conf),
    windowId: this.state.windowId,
  })

  // Set link between group and pinned tabs
  if (conf.pinnedTab) {
    conf.pinnedTab.relGroupId = groupTab.id
    setTimeout(() => {
      let localTab = this.state.tabsMap[groupTab.id]
      if (localTab) localTab.relPinId = conf.pinnedTab.id
    }, 500)
  }

  // Update parent of selected tabs
  tabs[0].parentId = groupTab.id
  for (let i = 1; i < tabs.length; i++) {
    let tab = tabs[i]

    if (tab.lvl <= tabs[0].lvl) {
      tab.parentId = groupTab.id
      tab.folded = false
    }
  }
  this.actions.updateTabsTree(tabs[0].index - 2, tabs[tabs.length - 1].index + 1)
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    tabs.forEach(t => this.actions.saveTabData(t))
  }
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

  if (groupTab.url.includes('pin=')) {
    let urlInfo = new URL(groupTab.url)
    let pin = urlInfo.searchParams.get('pin')
    let [ctr, url] = pin.split('::')
    let pinnedTab = this.state.tabs.find(t => t.pinned && t.cookieStoreId === ctr && t.url === url)
    if (pinnedTab) {
      out.pin = {
        id: pinnedTab.id,
        title: pinnedTab.title,
        url: pinnedTab.url,
        favIconUrl: pinnedTab.favIconUrl,
      }
    }
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

  this.actions.setNewTabPosition(index, parentId, targetTab.panelId)

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
 * Create new tab in panel
 */
function createTabInPanel(panel, url) {
  let tabShell = {}
  let index = this.actions.getIndexForNewTab(panel, tabShell)
  let parentId = this.actions.getParentForNewTab(panel)
  if (index === undefined) {
    if (!panel.tabs.length) index = panel.endIndex
    else index = panel.endIndex + 1
  }

  let config = { index, windowId: this.state.windowId }

  if (url) config.url = url
  if (index !== undefined) this.actions.setNewTabPosition(index, parentId, panel.id)

  if (panel.newTabCtx !== 'none') {
    config.cookieStoreId = panel.newTabCtx
  }

  browser.tabs.create(config)
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
    if (parent && !parent.pinned && parent.panelId === t.panelId) {
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
          if (this.state.tabs[j].panelId !== t.panelId) break
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
    tree[tab.id] = { lvl: tab.lvl, panel: tab.panelId }
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

    browser.tabs.sendMessage(groupTab.id, msg).catch(() => {
      /** itsokay **/
    })

    updateGroupTabTimeouit = null
  }, 256)
}

function resetUpdateGroupTabTimeout() {
  if (updateGroupTabTimeouit) clearTimeout(updateGroupTabTimeouit)
}

function updateActiveGroupPage() {
  let activeTab = this.state.tabsMap[this.state.activeTabId]
  if (!activeTab) activeTab = this.state.tabs.find(t => t.active)
  if (!activeTab) return
  if (Utils.isGroupUrl(activeTab.url)) {
    this.actions.updateGroupTab(activeTab)
  }
}

/**
 * Find the nearest panel
 */
function findNearestPanel(tabIndex) {
  let nearestPanel
  let prevTab = this.state.tabs[tabIndex - 1]
  let nextTab = this.state.tabs[tabIndex + 1]

  if (prevTab && !prevTab.pinned) nearestPanel = this.state.panelsMap[prevTab.panelId]
  if (!nearestPanel && nextTab) nearestPanel = this.state.panelsMap[nextTab.panelId]
  if (!nearestPanel) nearestPanel = this.state.panels.find(p => p.tabs)

  return nearestPanel
}

function getPanelForNewTab(tab) {
  let parentTab = this.state.tabsMap[tab ? tab.openerTabId : null]
  let activePanel = this.state.panels[this.state.panelIndex]
  if (!activePanel.tabs) activePanel = null

  // Find panel with matched moveTabCtx rule
  let panel = this.state.panels.find(p => p.moveTabCtx === tab.cookieStoreId)
  let isChildTab = parentTab && !parentTab.pinned
  if (panel && (!panel.moveTabCtxNoChild || !isChildTab)) return panel

  // Find panel for tab opened from pinned tab
  if (parentTab && parentTab.pinned) {
    if (this.state.moveNewTabPin === 'start' || this.state.moveNewTabPin === 'end') {
      return activePanel || this.actions.findNearestPanel(tab.index)
    }
  }

  // Find panel for tab opened from another tab
  if (parentTab && !parentTab.pinned) {
    let panelOfParent = this.state.panelsMap[parentTab.panelId]
    if (!this.state.moveNewTabParentActPanel || panelOfParent === activePanel) return panelOfParent
  }

  // Find panel in other cases
  if (this.state.moveNewTab === 'start' || this.state.moveNewTab === 'end') {
    return activePanel || this.actions.findNearestPanel(tab.index)
  }
  if (
    this.state.moveNewTab === 'before' ||
    this.state.moveNewTab === 'after' ||
    this.state.moveNewTab === 'first_child' ||
    this.state.moveNewTab === 'last_child'
  ) {
    let activeTab = this.state.tabsMap[this.state.activeTabId]
    let panelOfActiveTab = this.state.panelsMap[activeTab.panelId]

    if (!activeTab.pinned && panelOfActiveTab) return panelOfActiveTab
    else return activePanel || this.actions.findNearestPanel(tab.index)
  }

  return this.actions.findNearestPanel(tab.index)
}

/**
 * Find and return index for new tab.
 * Side effect: tab.openerTabId
 *
 * @param {Object} panel
 * @param {Object} [tab]
 */
function getIndexForNewTab(panel, tab) {
  let parent = this.state.tabsMap[tab ? tab.openerTabId : null]
  let endIndex = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
  let activeTab = this.state.tabsMap[this.state.activeTabId]

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) {
    if (this.state.moveNewTabPin === 'start') return panel.startIndex
    if (this.state.moveNewTabPin === 'end') return endIndex
  }

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (this.state.moveNewTabParent === 'before' && !tab.autoGroupped) return parent.index
    if (this.state.moveNewTabParent === 'first_child') return parent.index + 1
    if (
      this.state.moveNewTabParent === 'sibling' ||
      this.state.moveNewTabParent === 'last_child' ||
      tab.autoGroupped
    ) {
      let t
      let index = parent.index + 1
      for (; index < this.state.tabs.length; index++) {
        t = this.state.tabs[index]
        if (t.lvl <= parent.lvl) break
      }
      return index
    }
    if (this.state.moveNewTabParent === 'start' && !tab.autoGroupped) return panel.startIndex
    if (this.state.moveNewTabParent === 'end' && !tab.autoGroupped) return endIndex
  }

  // Place new tab (for the other cases)
  if (this.state.moveNewTab === 'start') return panel.startIndex
  if (this.state.moveNewTab === 'end') return endIndex
  if (this.state.moveNewTab === 'before') {
    if (!activeTab || activeTab.panelId !== panel.id) return endIndex
    else if (activeTab.pinned) return panel.startIndex
    else return activeTab.index
  }
  if (this.state.moveNewTab === 'after') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return endIndex
    } else if (activeTab.pinned) {
      return panel.startIndex
    } else {
      let index = activeTab.index + 1
      for (let t; index < this.state.tabs.length; index++) {
        t = this.state.tabs[index]
        if (t.lvl <= activeTab.lvl) break
      }
      return index
    }
  }
  if (this.state.moveNewTab === 'first_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return endIndex
    } else if (activeTab.pinned) {
      return panel.startIndex
    } else {
      return activeTab.index + 1
    }
  }
  if (this.state.moveNewTab === 'last_child') {
    if (!activeTab || activeTab.panelId !== panel.id) {
      return endIndex
    } else if (activeTab.pinned) {
      return panel.startIndex
    } else {
      let index = activeTab.index + 1
      for (let t; index < this.state.tabs.length; index++) {
        t = this.state.tabs[index]
        if (t.lvl <= activeTab.lvl) break
      }
      return index
    }
  }

  // Check tab is out of range of panel with moveTabCtx rule
  if (panel.moveTabCtx === tab.cookieStoreId) {
    if (panel.startIndex > tab.index || endIndex < tab.index) return endIndex
  }

  return tab.index
}

/**
 * Find and return parent id
 */
function getParentForNewTab(panel, openerTabId) {
  let activeTab = this.state.tabsMap[this.state.activeTabId]
  let parent = this.state.tabsMap[openerTabId]

  // Place new tab opened from pinned tab
  if (parent && parent.pinned) return

  // Place new tab opened from another tab
  if (parent && !parent.pinned && parent.panelId === panel.id) {
    if (this.state.moveNewTabParent === 'before') return parent.parentId
    if (this.state.moveNewTabParent === 'sibling') return parent.parentId
    if (this.state.moveNewTabParent === 'first_child') return openerTabId
    if (this.state.moveNewTabParent === 'last_child') return openerTabId
    if (this.state.moveNewTabParent === 'start') return
    if (this.state.moveNewTabParent === 'end') return
    if (this.state.moveNewTabParent === 'none') return openerTabId
  }

  // Place new tab (for the other cases)
  if (this.state.moveNewTab === 'start') return
  if (this.state.moveNewTab === 'end') return
  if (activeTab && activeTab.panelId === panel.id && !activeTab.pinned) {
    if (this.state.moveNewTab === 'before') return activeTab.parentId
    else if (this.state.moveNewTab === 'after') return activeTab.parentId
    else if (this.state.moveNewTab === 'first_child') return activeTab.id
    else if (this.state.moveNewTab === 'last_child') return activeTab.id
  }

  return openerTabId
}

/**
 * Find most appropriate panel id for given url
 */
function findPanelForUrl(url, excludedPanelId) {
  if (!this.state.urlRules) return
  for (let rule of this.state.urlRules) {
    if (excludedPanelId === rule.panelId) continue

    let ok
    if (rule.value.test) ok = rule.value.test(url)
    else ok = url.indexOf(rule.value) !== -1

    if (ok) return rule.panelId
  }
}

/**
 * Check url rules of panels and move tab if needed
 */
async function checkUrlRules(url, tab) {
  let panelId = this.actions.findPanelForUrl(url, tab.panelId)
  let panel = this.state.panelsMap[panelId]
  if (!panel) return
  let index = this.actions.getIndexForNewTab(panel, tab)

  if (index === undefined) {
    index = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
  }

  if (panel.newTabCtx !== 'none' && tab.cookieStoreId !== panel.newTabCtx) {
    await browser.tabs.remove(tab.id)
    this.actions.createTabInPanel(panel, tab.url)
    return
  }

  if (index > tab.index) index--
  if (index !== tab.index) {
    tab.destPanelId = panelId
    browser.tabs.move(tab.id, { windowId: this.state.windowId, index })
  } else {
    tab.panelId = panel.id
    this.actions.updatePanelsTabs()
  }
  urlRuleHistory[panelId] = url

  if (tab.active) this.actions.switchToPanel(panel.index, true)
}

function updateHighlightedTabs(delay = 250) {
  if (this._updateHighlightedTabsTimeout) {
    clearTimeout(this._updateHighlightedTabsTimeout)
  }
  this._updateHighlightedTabsTimeout = setTimeout(() => {
    this._updateHighlightedTabsTimeout = null
    let conf = { windowId: this.state.windowId, populate: false, tabs: [] }
    let activeTab = this.state.tabsMap[this.state.activeTabId]
    if (activeTab) conf.tabs.push(activeTab.index)

    for (let tabId of this.state.selected) {
      let tab = this.state.tabsMap[tabId]
      conf.tabs.push(tab.index)
    }

    browser.tabs.highlight(conf)
  }, delay)
}

function handleReopening(tabId, newCtx) {
  let targetTab = this.state.tabsMap[tabId]
  if (!targetTab) return

  let parent = -1
  let panel = this.state.panels.find(p => p.moveTabCtx === newCtx)
  let panelId
  let index
  if (panel) {
    index = this.actions.getIndexForNewTab(panel, {})
    if (index === undefined) index = panel.endIndex
    if (panel.tabs.length) index += 1
    panelId = panel.id
  } else {
    parent = targetTab.parentId
    panelId = targetTab.panelId
  }
  if (index === undefined) index = targetTab.index

  this.actions.setNewTabPosition(index, parent, panelId)

  return index
}

/**
 * Update indexes of tabs
 */
function updateTabsIndexes(fromIndex = 0, toIndex = -1) {
  let tabs = this.state.tabs
  if (toIndex === -1) toIndex = tabs.length
  for (let t, i = fromIndex; i < toIndex; i++) {
    t = tabs[i]
    if (t && t.index !== i) t.index = i
  }
}

/**
 * Set expected position (parent/panel) of new tab by its index
 */
function setNewTabPosition(index, parentId, panelId) {
  if (!this.state.newTabsPosition) this.state.newTabsPosition = {}
  this.state.newTabsPosition[index] = {
    parent: parentId < 0 ? undefined : parentId,
    panel: panelId,
  }
}

export default {
  recreateParentGroups,
  loadTabsFromGlobalStorage,
  loadTabsFromSessionStorage,
  loadTabsFromInlineData,
  saveTabsData,
  saveTabData,
  saveGroups,
  checkTabsPositioning,
  normalizeTabs,
  linkGroupWithPinnedTab,
  replaceRelGroupWithPinnedTab,

  scrollToActiveTab,
  createTab,
  removeTabsDescendants,
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
  reopenTabsInCtx,
  moveTabsToPanel,

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
  createTabInPanel,

  updateTabsTree,
  queryTab,
  getTabsTree,

  findNearestPanel,
  getPanelForNewTab,
  getIndexForNewTab,
  getParentForNewTab,

  findPanelForUrl,
  checkUrlRules,
  updateHighlightedTabs,
  handleReopening,
  updateTabsIndexes,
  setNewTabPosition,
}
