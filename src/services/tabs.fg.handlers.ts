import Utils from 'src/utils'
import { ReactiveTab, Tab, TabStatus } from 'src/types'
import { NOID, GROUP_URL, CONTAINER_ID, ADDON_HOST } from 'src/defaults'
import { Logs } from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Favicons } from 'src/services/favicons'
import { DnD } from 'src/services/drag-and-drop'
import { RemovedTabInfo, Tabs } from './tabs.fg'
import { IPC } from './ipc'

const EXT_HOST = browser.runtime.getURL('').slice(16)
const URL_HOST_PATH_RE = /^([a-z0-9-]{1,63}\.)+\w+(:\d+)?\/[A-Za-z0-9-._~:/?#[\]%@!$&'()*+,;=]*$/
const NEWTAB_URL = browser.extension.inIncognitoContext ? 'about:privatebrowsing' : 'about:newtab'

export function setupTabsListeners(): void {
  if (!Sidebar.hasTabs) return

  browser.tabs.onCreated.addListener(onTabCreated as (tab: browser.tabs.Tab) => void)
  browser.tabs.onUpdated.addListener(onTabUpdated, {
    // prettier-ignore
    properties: [
      'audible', 'discarded', 'favIconUrl', 'hidden',
      'mutedInfo', 'pinned', 'status', 'title', 'url',
    ],
  })
  browser.tabs.onRemoved.addListener(onTabRemoved)
  browser.tabs.onMoved.addListener(onTabMoved)
  browser.tabs.onDetached.addListener(onTabDetached)
  browser.tabs.onAttached.addListener(onTabAttached)
  browser.tabs.onActivated.addListener(onTabActivated)
}

export function resetTabsListeners(): void {
  browser.tabs.onCreated.removeListener(onTabCreated as (tab: browser.tabs.Tab) => void)
  browser.tabs.onUpdated.removeListener(onTabUpdated)
  browser.tabs.onRemoved.removeListener(onTabRemoved)
  browser.tabs.onMoved.removeListener(onTabMoved)
  browser.tabs.onDetached.removeListener(onTabDetached)
  browser.tabs.onAttached.removeListener(onTabAttached)
  browser.tabs.onActivated.removeListener(onTabActivated)
}

let waitForOtherReopenedTabsTimeout: number | undefined
let waitForOtherReopenedTabsBuffer: Tab[] | null = null
let waitForOtherReopenedTabsCheckLen = 0
let waitForOtherReopenedTabsBufferRelease = false
function waitForOtherReopenedTabs(tab: Tab): void {
  if (!waitForOtherReopenedTabsBuffer) waitForOtherReopenedTabsBuffer = []
  waitForOtherReopenedTabsBuffer.push(tab)
  waitForOtherReopenedTabsCheckLen++

  // Get session data of probably reopened tab
  // to check if it was actually reopened
  browser.sessions.getTabValue(tab.id, 'data').then(data => {
    tab.reopened = !!data
    if (!waitForOtherReopenedTabsBuffer) return
    waitForOtherReopenedTabsCheckLen--
    if (waitForOtherReopenedTabsCheckLen <= 0) {
      clearTimeout(waitForOtherReopenedTabsTimeout)
      releaseReopenedTabsBuffer()
    }
  })

  // Set the time limit for this waiting, because when re-opening lots of tabs
  // the browser.sessions.getTabValue getting too slow.
  clearTimeout(waitForOtherReopenedTabsTimeout)
  waitForOtherReopenedTabsTimeout = setTimeout(() => {
    releaseReopenedTabsBuffer()
  }, 80)
}
function releaseReopenedTabsBuffer(): void {
  if (!waitForOtherReopenedTabsBuffer) return
  waitForOtherReopenedTabsBufferRelease = true
  waitForOtherReopenedTabsBuffer.sort((a, b) => a.index - b.index)
  waitForOtherReopenedTabsBuffer.forEach(tab => onTabCreated(tab))
  waitForOtherReopenedTabsBuffer = null
  waitForOtherReopenedTabsBufferRelease = false
  waitForOtherReopenedTabsCheckLen = 0

  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []
}

function onTabCreated(tab: Tab): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabCreated(tab))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  if (Sidebar.reactive.hiddenPanelsBar) Sidebar.closeHiddenPanelsBar(true)

  if (Settings.state.highlightOpenBookmarks) Bookmarks.markOpenBookmarksDebounced(tab.url)

  Menu.close()
  Selection.resetSelection()

  let panel, index, reopenedTabInfo, reopenedTabPanel, createGroup, autoGroupTab
  let initialOpenerSpec = ''
  const initialOpener = Tabs.byId[tab.openerTabId ?? -1]

  // Check if opener tab is pinned
  if (
    Settings.state.pinnedAutoGroup &&
    initialOpener &&
    initialOpener.pinned &&
    Settings.state.tabsTree
  ) {
    initialOpenerSpec = encodeURIComponent(initialOpener.cookieStoreId + '::' + initialOpener.url)
    autoGroupTab = Tabs.list.find(t => {
      return t.url.startsWith(GROUP_URL) && t.url.lastIndexOf('pin=' + initialOpenerSpec) > -1
    })
    if (autoGroupTab) {
      tab.openerTabId = autoGroupTab.id
      tab.autoGroupped = true
    } else {
      createGroup = true
    }
  }

  // Check if tab is reopened
  if (Tabs.removedTabs.length && !tab.discarded && tab.reopened !== false) {
    const prevPosIndex = Tabs.removedTabs.findIndex(t => t.title === tab.title)
    reopenedTabInfo = Tabs.removedTabs[prevPosIndex]
    if (reopenedTabInfo) {
      if (!waitForOtherReopenedTabsBufferRelease) {
        waitForOtherReopenedTabs(tab)
        return
      }

      Tabs.removedTabs.splice(prevPosIndex, 1)
      reopenedTabPanel = Sidebar.reactive.panelsById[reopenedTabInfo.panelId]
    }
  }

  // Predefined position
  if (Tabs.newTabsPosition && Tabs.newTabsPosition[tab.index]) {
    const position = Tabs.newTabsPosition[tab.index]
    panel = Sidebar.reactive.panelsById[position.panel ?? -1]
    if (!panel) panel = Sidebar.reactive.panelsById[CONTAINER_ID]
    index = tab.index
    tab.openerTabId = position.parent
    delete Tabs.newTabsPosition[tab.index]
  }

  // Restore previous position of reopened tab
  else if (reopenedTabInfo && Utils.isTabsPanel(reopenedTabPanel)) {
    // Temporarily place new reopened tabs to the end of panel
    panel = reopenedTabPanel
    index = reopenedTabPanel.nextTabIndex

    for (const rmTab of Tabs.removedTabs) {
      if (rmTab.parentId === reopenedTabInfo.id) rmTab.parentId = tab.id
    }

    const parentTab = Tabs.byId[reopenedTabInfo.parentId]
    const nextTab = Tabs.list[tab.index]

    // Parent tab exists
    if (parentTab) {
      // Find the end index of branch
      let branchEndIndex = parentTab.index
      for (let i = parentTab.index + 1; i < Tabs.list.length; i++) {
        const tabInBranch = Tabs.list[i]
        if (tabInBranch.lvl <= parentTab.lvl) break
        branchEndIndex = i
      }
      branchEndIndex++

      // Old index is ok in branch
      if (
        parentTab.index < tab.index &&
        tab.index <= branchEndIndex &&
        (!nextTab || (nextTab.panelId === panel.id && nextTab.lvl <= parentTab.lvl + 1))
      ) {
        index = tab.index
      }

      // Move to the end of branch
      else {
        index = branchEndIndex
      }

      tab.openerTabId = reopenedTabInfo.parentId
    }

    // Parent tab doesn't exist
    else {
      // Old index is ok
      if (
        (!nextTab || (nextTab.panelId === panel.id && nextTab.lvl === 0)) &&
        tab.index >= panel.startTabIndex &&
        tab.index <= panel.nextTabIndex
      ) {
        index = tab.index
      }

      // or move as configured for new tabs
      else {
        index = Tabs.getIndexForNewTab(panel, tab)
      }
    }
  }

  // Find appropriate position using the current settings
  else {
    panel = Tabs.getPanelForNewTab(tab)
    if (!panel) return Logs.err('Cannot handle new tab: Cannot find target panel')
    index = Tabs.getIndexForNewTab(panel, tab)
    if (!autoGroupTab) {
      if (!Settings.state.groupOnOpen) tab.openerTabId = undefined
      else tab.openerTabId = Tabs.getParentForNewTab(panel, tab.openerTabId)
    }
  }

  // If new tab has wrong possition - move it
  if (panel && !tab.pinned && tab.index !== index) {
    tab.dstPanelId = panel.id
    Tabs.movingTabs.push(tab.id)
    browser.tabs.move(tab.id, { index })
  }

  // Update tabs indexses after inserted one.
  for (let i = index; i < Tabs.list.length; i++) {
    Tabs.list[i].index++
  }

  // Set custom props
  if (Settings.state.tabsUnreadMark && tab.unread === undefined && !tab.active) tab.unread = true
  if (panel) Tabs.normalizeTab(tab, panel.id)
  tab.internal = tab.url.startsWith(ADDON_HOST)
  if (tab.internal) tab.isGroup = tab.url.startsWith('gr', 58)
  tab.index = index
  tab.parentId = tab.openerTabId ?? -1
  if (!tab.favIconUrl && !tab.internal) tab.favIconUrl = Favicons.getFavicon(tab.url)

  // Put new tab in state
  Tabs.byId[tab.id] = tab
  Tabs.list.splice(index, 0, tab)
  Tabs.reactive.byId[tab.id] = Tabs.toReactive(tab)
  Sidebar.recalcTabsPanels()
  Tabs.updateUrlCounter(tab.url, 1)

  // Update tree
  if (Settings.state.tabsTree && !tab.pinned && Utils.isTabsPanel(panel)) {
    let treeHasChanged = false

    const rTab = Tabs.reactive.byId[tab.id]
    // Get parent id from the next tab and update tree props
    if (tab.openerTabId === undefined) {
      const nextTab = Tabs.list[tab.index + 1]
      if (nextTab && tab.panelId === nextTab.panelId) {
        tab.parentId = nextTab.parentId
        tab.lvl = nextTab.lvl
        if (rTab) rTab.lvl = nextTab.lvl
      }
    }

    // Find the parent tab, check if the new tab is correctly positioned
    // and update tree props
    else {
      const parent = Tabs.byId[tab.openerTabId]
      if (parent && parent.panelId === tab.panelId) {
        let insideBranch = false
        for (let t, i = parent.index + 1; i < Tabs.list.length; i++) {
          t = Tabs.list[i]
          insideBranch = t.id === tab.id
          if (insideBranch) break
          if (t.lvl <= parent.lvl) break
        }
        if (insideBranch) {
          tab.parentId = tab.openerTabId
          treeHasChanged = true
        } else {
          tab.parentId = -1
          browser.tabs.update(tab.id, { openerTabId: tab.id })
        }
      }
    }

    // Try to restore tree if tab was reopened and it had children
    if (reopenedTabInfo && Utils.isTabsPanel(panel) && reopenedTabInfo.children) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (t.lvl < tab.lvl || t.panelId !== panel.id) break
        if (reopenedTabInfo.children.includes(t.id)) {
          t.parentId = tab.id
          treeHasChanged = true
        } else {
          break
        }
      }
    }

    if (treeHasChanged) Tabs.updateTabsTree(panel.startTabIndex, panel.nextTabIndex)

    Tabs.saveTabData(tab.id)
    Tabs.cacheTabsData()

    const groupTab = Tabs.getGroupTab(tab)
    if (groupTab && !groupTab.discarded) {
      browser.tabs
        .sendMessage(groupTab.id, {
          name: 'create',
          id: tab.id,
          index: tab.index,
          lvl: tab.lvl - groupTab.lvl - 1,
          title: tab.title,
          url: tab.url,
          discarded: tab.discarded,
          favIconUrl: tab.favIconUrl,
        })
        .catch(() => {
          /** itsokay **/
        })
    }

    if (Settings.state.colorizeTabs) Tabs.colorizeTabDebounced(tab.id)
    if (Settings.state.colorizeTabsBranches && tab.lvl > 0) Tabs.setBranchColor(tab.id)
  }

  // Update succession
  if (Settings.state.activateAfterClosing !== 'none') {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab && activeTab.active) {
      const target = Tabs.findSuccessorTab(activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (createGroup && !tab.pinned && initialOpener) {
    Tabs.groupTabs([tab.id], {
      active: false,
      title: initialOpener.title,
      pin: initialOpenerSpec,
      pinnedTab: initialOpener,
    })
  }

  // Hide native tab if needed
  if (Settings.state.hideInact && !tab.active) {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab && activeTab.panelId !== panel.id) browser.tabs.hide?.(tab.id)
  }
}

/**
 * Tabs.onUpdated
 */
function onTabUpdated(tabId: ID, change: browser.tabs.ChangeInfo, tab: browser.tabs.Tab): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0 || waitForOtherReopenedTabsBuffer) {
    Tabs.deferredEventHandling.push(() => onTabUpdated(tabId, change, tab))
    return
  }

  const localTab = Tabs.byId[tabId]
  const rLocalTab = Tabs.reactive.byId[tabId]
  if (!localTab || !rLocalTab) return Logs.err(`Tabs.onTabUpdated: Cannot find local tab: ${tabId}`)

  // Discarded
  if (change.discarded !== undefined && change.discarded) {
    if (localTab.status === 'loading') {
      localTab.status = 'complete'
      rLocalTab.status = TabStatus.Complete
    }
    if (localTab.loading) localTab.loading = false
    if (localTab.audible) {
      localTab.audible = false
      rLocalTab.mediaAudible = false
    }
    if (localTab.mediaPaused) {
      localTab.mediaPaused = false
      rLocalTab.mediaPaused = false
    }
    const groupTab = Tabs.getGroupTab(localTab)
    if (groupTab && !groupTab.discarded) Tabs.updateGroupChild(groupTab.id, tab.id)
  }

  // Status change
  if (change.status !== undefined) {
    if (change.status === 'complete' && tab.url[0] !== 'a') {
      if (Settings.state.animations && change.status !== localTab.status) {
        Tabs.triggerFlashAnimation(rLocalTab)
      }
      reloadTabFaviconDebounced(localTab, rLocalTab)
    }
    if (change.url && localTab.mediaPaused) {
      localTab.mediaPaused = false
      rLocalTab.mediaPaused = false
    }
  }

  // Url
  let branchColorizationNeeded = false
  if (change.url !== undefined && change.url !== localTab.url) {
    const isInternal = change.url.startsWith(ADDON_HOST)
    if (isInternal !== localTab.internal) {
      localTab.isGroup = isInternal && change.url.startsWith('gr', 58)
      rLocalTab.isGroup = localTab.isGroup
    }
    localTab.internal = isInternal
    Tabs.cacheTabsData()
    if (!change.url.startsWith(localTab.url.slice(0, 16))) {
      localTab.favIconUrl = ''
      rLocalTab.favIconUrl = ''
    }
    // if (
    //   Sidebar.urlRules?.length &&
    //   !localTab.pinned &&
    //   localTab.panelId &&
    //   change.url !== 'about:blank'
    // ) {
    //   Tabs.applyUrlRules(change.url, localTab)
    // }
    if (localTab.pinned && localTab.relGroupId !== undefined) {
      const groupTab = Tabs.byId[localTab.relGroupId]
      if (groupTab) {
        const oldUrl = encodeURIComponent(localTab.url)
        const newUrl = encodeURIComponent(change.url)
        const groupUrl = groupTab.url.replace(oldUrl, newUrl)
        browser.tabs.update(groupTab.id, { url: groupUrl })
      }
    }
    if (localTab.mediaPaused) {
      localTab.mediaPaused = false
      rLocalTab.mediaPaused = false
    }
    if (Settings.state.colorizeTabs) {
      Tabs.colorizeTabDebounced(tabId, !rLocalTab?.color ? 0 : 500)
    }
    if (Settings.state.colorizeTabsBranches) {
      branchColorizationNeeded = localTab.isParent && localTab.lvl === 0
      if (localTab.lvl === 0) rLocalTab.branchColor = null
    }

    // Update url counter
    const oldUrlCount = Tabs.updateUrlCounter(localTab.url, -1)
    Tabs.updateUrlCounter(change.url, 1)

    // Mark/Unmark open bookmarks
    if (Settings.state.highlightOpenBookmarks) {
      if (!oldUrlCount) Bookmarks.unmarkOpenBookmarksDebounced(localTab.url)
      Bookmarks.markOpenBookmarksDebounced(change.url)
    }
  }

  // Handle favicon change
  if (change.favIconUrl) {
    if (change.favIconUrl.startsWith('chrome:')) {
      if (change.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
        localTab.warn = true
        rLocalTab.warn = true
      }
      change.favIconUrl = ''
    }
  }

  // Handle title change
  if (change.title !== undefined) {
    if (change.title.startsWith(EXT_HOST)) change.title = localTab.title

    // Mark tab with updated title
    if (
      Settings.state.tabsUpdateMark === 'all' ||
      (Settings.state.tabsUpdateMark === 'pin' && localTab.pinned) ||
      (Settings.state.tabsUpdateMark === 'norm' && !localTab.pinned)
    ) {
      const inact = Date.now() - tab.lastAccessed
      if (!tab.active && inact > 5000) {
        // If prev url starts with 'http' and current url same as prev
        if (localTab.url.startsWith('http') && localTab.url === tab.url) {
          // and if title doesn't look like url
          if (!URL_HOST_PATH_RE.test(localTab.title) && !URL_HOST_PATH_RE.test(tab.title)) {
            const panel = Sidebar.reactive.panelsById[localTab.panelId]
            localTab.updated = true
            rLocalTab.updated = true
            if (
              Utils.isTabsPanel(panel) &&
              (!tab.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
              panel.updatedTabs &&
              !panel.updatedTabs.includes(tabId)
            ) {
              panel.updatedTabs.push(tabId)
            }
          }
        }
      }
    }
  }

  // Handle audible change
  if (change.audible !== undefined && change.audible) {
    if (localTab.mediaPaused) {
      localTab.mediaPaused = false
      rLocalTab.mediaPaused = false
    }
  }

  // Update tab object
  Object.assign(localTab, change)
  if (change.audible !== undefined) rLocalTab.mediaAudible = change.audible
  if (change.discarded !== undefined) rLocalTab.discarded = change.discarded
  if (change.favIconUrl !== undefined) {
    if (localTab.internal) rLocalTab.favIconUrl = undefined
    else rLocalTab.favIconUrl = change.favIconUrl
  }
  if (change.mutedInfo?.muted !== undefined) rLocalTab.mediaMuted = change.mutedInfo.muted
  if (change.pinned !== undefined) rLocalTab.pinned = change.pinned
  if (change.status !== undefined) rLocalTab.status = Tabs.getStatus(localTab)
  if (change.title !== undefined) rLocalTab.title = change.title
  if (change.url !== undefined) rLocalTab.url = change.url

  // Handle unpinned tab
  if (change.pinned !== undefined && !change.pinned) {
    const panel = Sidebar.reactive.panelsById[localTab.panelId]
    if (Utils.isTabsPanel(panel)) {
      if (!localTab.unpinning && panel.startTabIndex !== undefined) {
        const startIndex = panel.startTabIndex
        localTab.dstPanelId = localTab.panelId
        Tabs.list.splice(localTab.index, 1)
        Tabs.list.splice(startIndex - 1, 0, localTab)
        Tabs.updateTabsIndexes()
        Sidebar.recalcTabsPanels()

        const relGroupTab = Tabs.byId[localTab.relGroupId]
        if (relGroupTab) Tabs.replaceRelGroupWithPinnedTab(relGroupTab, localTab)
        else browser.tabs.move(tabId, { index: startIndex - 1 })
      }
      if (tab.active) Sidebar.activatePanel(panel.id)
    }
  }

  // Handle pinned tab
  if (change.pinned !== undefined && change.pinned) {
    let panel = Sidebar.reactive.panelsById[localTab.panelId]

    if (localTab.prevPanelId && localTab.moveTime && localTab.moveTime + 1000 > Date.now()) {
      localTab.panelId = localTab.prevPanelId
      panel = Sidebar.reactive.panelsById[localTab.panelId]
      Tabs.saveTabData(localTab.id)

      if (localTab.active && localTab.panelId !== Sidebar.reactive.activePanelId) {
        Sidebar.activatePanel(localTab.panelId)
      }
    }

    Sidebar.recalcTabsPanels()
    Tabs.updateTabsTree()

    if (Utils.isTabsPanel(panel) && !panel.len) {
      if (panel.noEmpty) {
        Tabs.createTabInPanel(panel)
      } else if (Settings.state.pinnedTabsPosition !== 'panel') {
        Sidebar.switchToNeighbourPanel()
      }
    }
  }

  // Colorize branch
  if (branchColorizationNeeded) Tabs.colorizeBranch(localTab.id)
}

const reloadTabFaviconTimeout: Record<ID, number> = {}
function reloadTabFaviconDebounced(localTab: Tab, rLocalTab: ReactiveTab, delay = 500): void {
  clearTimeout(reloadTabFaviconTimeout[localTab.id])
  reloadTabFaviconTimeout[localTab.id] = setTimeout(() => {
    delete reloadTabFaviconTimeout[localTab.id]

    if (localTab.internal) {
      localTab.favIconUrl = undefined
      rLocalTab.favIconUrl = undefined
      return
    }

    browser.tabs
      .get(localTab.id)
      .then(tabInfo => {
        if (tabInfo.favIconUrl && !tabInfo.favIconUrl.startsWith('chrome:')) {
          localTab.favIconUrl = tabInfo.favIconUrl
          rLocalTab.favIconUrl = tabInfo.favIconUrl
        } else {
          if (tabInfo.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
            localTab.warn = true
            rLocalTab.warn = true
          } else if (localTab.warn) {
            localTab.warn = false
            rLocalTab.warn = false
          }
          localTab.favIconUrl = ''
          rLocalTab.favIconUrl = ''
        }

        const groupTab = Tabs.getGroupTab(localTab)
        if (groupTab && !groupTab.discarded) Tabs.updateGroupChild(groupTab.id, localTab.id)
      })
      .catch(() => {
        // If I close containered tab opened from bg script
        // I'll get 'updated' event with 'status': 'complete'
        // and since tab is in 'removing' state I'll get this
        // error.
      })
  }, delay)
}

let recentlyRemovedChildParentMap: Record<ID, ID> | null = null
let rememberChildTabsTimeout: number | undefined
function rememberChildTabs(childId: ID, parentId: ID): void {
  if (!recentlyRemovedChildParentMap) recentlyRemovedChildParentMap = {}
  recentlyRemovedChildParentMap[childId] = parentId

  clearTimeout(rememberChildTabsTimeout)
  rememberChildTabsTimeout = setTimeout(() => {
    recentlyRemovedChildParentMap = null
  }, 100)
}

/**
 * Tabs.onRemoved
 */
function onTabRemoved(tabId: ID, info: browser.tabs.RemoveInfo, ignoreChildren?: boolean): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0 || waitForOtherReopenedTabsBuffer) {
    Tabs.deferredEventHandling.push(() => onTabRemoved(tabId, info, ignoreChildren))
    return
  }
  if (info.isWindowClosing) return
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  if (Tabs.removingTabs.length > 0) {
    Tabs.checkRemovedTabs()

    const rmIndex = Tabs.removingTabs.indexOf(tabId)
    if (rmIndex !== -1) Tabs.removingTabs.splice(rmIndex, 1)
  }

  if (!Tabs.removingTabs.length) {
    Menu.close()
    Selection.resetSelection()
  }

  // Try to get removed tab and its panel
  const tab = Tabs.byId[tabId]
  const rTab = Tabs.reactive.byId[tabId]
  if (!tab || !rTab) {
    Logs.warn(`Tabs.onTabRemoved: Cannot find tab: ${tabId}`)
    return Tabs.reinitTabs()
  }

  const removedExternally = !Tabs.removingTabs || !Tabs.removingTabs.length
  const nextTab = Tabs.list[tab.index + 1]
  const hasChildren =
    Settings.state.tabsTree &&
    tab.isParent &&
    !ignoreChildren &&
    nextTab &&
    nextTab.parentId === tab.id &&
    nextTab.panelId === tab.panelId
  let removedTabInfo: RemovedTabInfo | undefined

  // Update temp list of removed tabs for restoring reopened tabs state
  if (
    tab.url !== NEWTAB_URL && // Ignore new tabs
    tab.url !== 'about:blank' && // Ignore new tabs
    (tab.isParent || !tab.url.startsWith('m')) // and non-parent addon pages
  ) {
    removedTabInfo = {
      id: tab.id,
      index: tab.index,
      title: tab.title,
      parentId: recentlyRemovedChildParentMap?.[tab.id] ?? tab.parentId,
      panelId: tab.panelId,
    }
    Tabs.removedTabs.unshift(removedTabInfo)
    if (Tabs.removedTabs.length > 50) {
      Tabs.removedTabs = Tabs.removedTabs.slice(5)
    }
  }

  // Handle child tabs
  if (hasChildren) {
    const toRemove = []
    const outdentOnlyFirstChild = Settings.state.treeRmOutdent === 'first_child'
    const firstChild = nextTab
    for (let i = tab.index + 1, t; i < Tabs.list.length; i++) {
      t = Tabs.list[i]
      if (t.lvl <= tab.lvl) break
      const rt = Tabs.reactive.byId[t.id]

      if (t.parentId === tab.id) {
        rememberChildTabs(t.id, tab.id)
        if (removedTabInfo?.children) removedTabInfo.children.push(t.id)
        else if (removedTabInfo) removedTabInfo.children = [t.id]
      }

      // Remove folded tabs
      if (
        (Settings.state.rmChildTabs === 'folded' && tab.folded) ||
        Settings.state.rmChildTabs === 'all'
      ) {
        if (!Tabs.removingTabs.includes(t.id)) toRemove.push(t.id)
      } else if (t.invisible && tab.folded) {
        t.invisible = false
        if (rt) rt.invisible = false
      }

      // Decrease indent level of tabs in branch
      // First child
      if (firstChild.id === t.id) {
        t.parentId = tab.parentId
        t.lvl = tab.lvl
        if (rt) rt.lvl = tab.lvl
      }
      // Other tabs in branch
      else {
        // Direct descendant
        if (t.parentId === tab.id) {
          // Set the first child tab as new parent tab (preserve indent)
          if (outdentOnlyFirstChild) {
            t.parentId = firstChild.id
            if (!firstChild.isParent) {
              firstChild.isParent = true
              const rFirstTab = Tabs.reactive.byId[firstChild.id]
              if (rFirstTab) rFirstTab.isParent = true
            }
          }
          // Outdent
          else {
            t.parentId = tab.parentId
            t.lvl = tab.lvl
            if (rt) rt.lvl = tab.lvl
          }
        }
        // Other descendants
        else {
          const parentTab = Tabs.byId[t.parentId]
          if (parentTab) {
            t.lvl = parentTab.lvl + 1
            if (rt) rt.lvl = t.lvl
          }
        }
      }
    }

    // Remove child tabs
    if (Settings.state.rmChildTabs !== 'none' && toRemove.length) {
      Tabs.removeTabs(toRemove)
    }
  }

  // Shift tabs after removed one
  for (let i = tab.index + 1; i < Tabs.list.length; i++) {
    Tabs.list[i].index--
  }
  delete Tabs.byId[tabId]
  Tabs.list.splice(tab.index, 1)
  delete Tabs.reactive.byId[tabId]
  Sidebar.recalcTabsPanels()

  // Update url counter
  const urlCount = Tabs.updateUrlCounter(tab.url, -1)

  // Get panel of removed tab
  const panel = Sidebar.reactive.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) {
    Logs.err('Tabs.onTabRemoved: Wrong panel')
    return
  }

  // No-empty
  if (!tab.pinned && panel.noEmpty && !panel.len) {
    Tabs.createTabInPanel(panel, { active: false })
  }

  // Remove updated flag
  if (panel.updatedTabs.length) {
    Utils.rmFromArray(panel.updatedTabs, tabId)
  }

  // On removing the last tab
  if (!Tabs.removingTabs.length) {
    // Update parent tab state
    if (Settings.state.tabsTree && tab.parentId !== NOID) {
      const parentTab = Tabs.byId[tab.parentId]
      const rParentTab = Tabs.reactive.byId[tab.parentId]
      if (parentTab && rParentTab) {
        // Update branch length
        if (removedExternally) rParentTab.branchLen--

        // Parent tab is not parent anymore
        const nextTab = Tabs.list[parentTab.index + 1]
        if (!nextTab || nextTab?.parentId !== tab.parentId) {
          parentTab.isParent = false
          parentTab.folded = false
          if (rParentTab) {
            rParentTab.isParent = false
            rParentTab.folded = false
          }
        }
      }
    }

    // Save new tabs state
    Tabs.cacheTabsData()

    // Update succession
    let tabSuccessor: Tab | undefined
    if (Settings.state.activateAfterClosing !== 'none') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && activeTab.active) {
        tabSuccessor = Tabs.findSuccessorTab(activeTab)
        if (tabSuccessor) browser.tabs.moveInSuccession([activeTab.id], tabSuccessor.id)
      }
    }

    // Switch to another panel if current is hidden
    if (
      Settings.state.hideEmptyPanels &&
      Sidebar.reactive.activePanelId === panel.id &&
      !panel.tabs.length &&
      !panel.pinnedTabs.length
    ) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned) Sidebar.activatePanel(activeTab.panelId)
      else if (tabSuccessor) Sidebar.activatePanel(tabSuccessor.panelId)
      else Sidebar.switchToNeighbourPanel()
    }
  }

  // Update bookmarks marks
  if (Settings.state.highlightOpenBookmarks && !urlCount) {
    Bookmarks.unmarkOpenBookmarksDebounced(tab.url)
  }

  // Reload related group for pinned tab
  const pinGroupTab = Tabs.byId[tab.relGroupId]
  if (tab.pinned && pinGroupTab) {
    const groupUrl = new URL(pinGroupTab.url)
    groupUrl.searchParams.delete('pin')
    browser.tabs.update(tab.relGroupId, { url: groupUrl.href })
  }

  const groupTab = Tabs.getGroupTab(tab)
  if (groupTab && !groupTab.discarded) {
    IPC.groupPage(groupTab.id, { name: 'remove', id: tab.id })
  }
}

/**
 * Tabs.onMoved
 */
function onTabMoved(id: ID, info: browser.tabs.MoveInfo): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabMoved(id, info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  const tab = Tabs.byId[id]
  if (!tab) {
    const msg = `Tab cannot be moved: #${id} ${info.fromIndex} > ${info.toIndex} (not found by id)`
    Logs.err(msg)
    return Tabs.reinitTabs()
  }

  Tabs.movingTabs.splice(Tabs.movingTabs.indexOf(id), 1)
  const mvLen = Tabs.movingTabs.length

  if (!mvLen) {
    Menu.close()
    Selection.resetSelection()
  }

  // Check if target tab already placed
  let toIndex = info.toIndex
  if (info.toIndex > info.fromIndex) toIndex = toIndex - mvLen
  const tabAtTargetPlace = Tabs.list[toIndex]
  if (tabAtTargetPlace && tabAtTargetPlace.id === id) {
    Tabs.saveTabData(id)
    if (!Tabs.movingTabs.length) Tabs.cacheTabsData()
    tab.dstPanelId = -1
    Sidebar.recalcTabsPanels()
    if (Settings.state.activateAfterClosing !== 'none' && tab.active) {
      const target = Tabs.findSuccessorTab(tab)
      if (target) browser.tabs.moveInSuccession([tab.id], target.id)
    }
    return
  }

  if (tab.unpinning) return

  // Move tab in tabs array
  const toTab = Tabs.list[info.toIndex]
  const movedTab = Tabs.list[info.fromIndex]
  if (movedTab && movedTab.id === id) {
    Tabs.list.splice(info.fromIndex, 1)
  } else {
    Logs.err(`Tab cannot be moved: #${id} ${info.fromIndex} > ${info.toIndex} (not found by index)`)
    return Tabs.reinitTabs()
  }

  movedTab.moveTime = Date.now()
  movedTab.prevPanelId = movedTab.panelId

  Tabs.list.splice(info.toIndex, 0, movedTab)

  // Update tabs indexes.
  const minIndex = Math.min(info.fromIndex, info.toIndex)
  const maxIndex = Math.max(info.fromIndex, info.toIndex)
  Tabs.updateTabsIndexes(minIndex, maxIndex + 1)

  // Update tab's panel id
  if (!movedTab.pinned) {
    const srcPanel = Sidebar.reactive.panelsById[movedTab.panelId]
    let dstPanel = Sidebar.reactive.panelsById[movedTab.dstPanelId]
    movedTab.dstPanelId = NOID

    if (!dstPanel) {
      dstPanel = Sidebar.reactive.panelsById[toTab.panelId]
    } else if (
      Utils.isTabsPanel(dstPanel) &&
      dstPanel.startTabIndex > -1 &&
      dstPanel.endTabIndex > -1 &&
      (dstPanel.startTabIndex > info.toIndex || dstPanel.endTabIndex + 1 < info.toIndex)
    ) {
      dstPanel = Sidebar.reactive.panelsById[toTab.panelId]
    }

    if (Utils.isTabsPanel(srcPanel) && Utils.isTabsPanel(dstPanel)) {
      movedTab.panelId = dstPanel.id
    }
  }

  Sidebar.recalcTabsPanels()

  // Calc tree levels and colorize branch
  if (Settings.state.tabsTree) {
    if (!Tabs.movingTabs.length) Tabs.updateTabsTree()

    if (Settings.state.colorizeTabsBranches && tab.lvl > 0) {
      Tabs.setBranchColor(tab.id)
    }
  }

  if (movedTab.panelId !== Sidebar.reactive.activePanelId && movedTab.active) {
    Sidebar.activatePanel(movedTab.panelId)
  }

  if (!Tabs.movingTabs.length) Tabs.cacheTabsData()
  Tabs.saveTabData(movedTab.id)

  // Update succession
  if (!Tabs.movingTabs.length && Settings.state.activateAfterClosing !== 'none') {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab && activeTab.active) {
      const target = Tabs.findSuccessorTab(activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }
}

/**
 * Tabs.onDetached
 */
function onTabDetached(id: ID, info: browser.tabs.DetachInfo): void {
  if (info.oldWindowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabDetached(id, info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()
  const tab = Tabs.byId[id]
  const rTab = Tabs.reactive.byId[id]
  if (tab && rTab) {
    tab.folded = false
    rTab.folded = false
  }
  onTabRemoved(id, { windowId: Windows.id, isWindowClosing: false }, true)
}

/**
 * Tabs.onAttached
 */
async function onTabAttached(id: ID, info: browser.tabs.AttachInfo): Promise<void> {
  if (info.newWindowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabAttached(id, info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  const ai = Tabs.attachingTabs.findIndex(t => t.id === id)

  let tab
  if (ai > -1) tab = Tabs.attachingTabs.splice(ai, 1)[0]
  else tab = (await browser.tabs.get(id)) as Tab

  tab.windowId = Windows.id
  tab.index = info.newPosition
  tab.panelId = NOID
  tab.sel = false

  onTabCreated(tab)

  if (tab.active) browser.tabs.update(tab.id, { active: true })
}

let bufTabActivatedEventIndex = -1

/**
 * Tabs.onActivated
 */
function onTabActivated(info: browser.tabs.ActiveInfo): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0 || waitForOtherReopenedTabsBuffer) {
    if (bufTabActivatedEventIndex !== -1) {
      Tabs.deferredEventHandling.splice(bufTabActivatedEventIndex, 1)
    }
    bufTabActivatedEventIndex = Tabs.deferredEventHandling.push(() => onTabActivated(info)) - 1
    return
  }
  bufTabActivatedEventIndex = -1
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  // Reset selection
  if (!DnD.reactive.isStarted) Selection.resetSelection()

  // Get new active tab
  const tab = Tabs.byId[info.tabId]
  const rTab = Tabs.reactive.byId[info.tabId]
  if (!tab || !rTab) {
    Logs.err('Tabs.onTabActivated: Cannot get target tab', info.tabId)
    return Tabs.reinitTabs()
  }

  // Update previous active tab and store his id
  const prevActive = Tabs.byId[Tabs.activeId]
  const rPrevActive = Tabs.reactive.byId[Tabs.activeId]
  if (prevActive && rPrevActive) {
    prevActive.active = false
    rPrevActive.active = false
    Tabs.writeActiveTabsHistory(prevActive, tab)
  }

  tab.active = true
  rTab.active = true
  if (Settings.state.tabsUpdateMark !== 'none') {
    tab.updated = false
    rTab.updated = false
  }
  if (Settings.state.tabsUnreadMark) {
    tab.unread = false
    rTab.unread = false
  }
  tab.lastAccessed = Date.now()
  Tabs.activeId = info.tabId

  const panel = Sidebar.reactive.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (panel.updatedTabs.length) {
    Utils.rmFromArray(panel.updatedTabs, tab.id)
  }

  // Switch to activated tab's panel
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if ((!tab.pinned || Settings.state.pinnedTabsPosition === 'panel') && !activePanel?.lockedPanel) {
    Sidebar.activatePanel(panel.id)
  }
  if ((!prevActive || prevActive.panelId !== tab.panelId) && Settings.state.hideInact) {
    Tabs.updateNativeTabsVisibility()
  }

  // Propagate access time to parent tabs for autoFolding feature
  if (
    Settings.state.tabsTree &&
    tab.parentId > -1 &&
    Settings.state.autoFoldTabs &&
    Settings.state.autoFoldTabsExcept > 0
  ) {
    let parent = Tabs.byId[tab.parentId]
    if (parent) {
      parent.childLastAccessed = tab.lastAccessed
      while ((parent = Tabs.byId[parent.parentId])) {
        parent.childLastAccessed = tab.lastAccessed
      }
    }
  }

  // Auto expand tabs group
  if (Settings.state.autoExpandTabs && tab.isParent && tab.folded && !DnD.reactive.isStarted) {
    let prevActiveChild
    for (let i = tab.index + 1; i < Tabs.list.length; i++) {
      if (Tabs.list[i].lvl <= tab.lvl) break
      if (Tabs.list[i].id === info.previousTabId) {
        prevActiveChild = true
        break
      }
    }
    if (!prevActiveChild) Tabs.expTabsBranch(tab.id)
  }
  if (tab.invisible) {
    Tabs.expTabsBranch(tab.parentId)
  }

  if (!tab.pinned) Tabs.scrollToTab(tab.id)

  // Update succession
  if (Settings.state.activateAfterClosing !== 'none') {
    const target = Tabs.findSuccessorTab(tab)
    if (target && tab.successorTabId !== target.id) {
      browser.tabs.moveInSuccession([tab.id], target.id)
    }
  }

  if (Settings.state.tabsTree && tab.isGroup) {
    Tabs.updateGroupTab(tab)
  } else {
    Tabs.resetUpdateGroupTabTimeout()
  }
}
