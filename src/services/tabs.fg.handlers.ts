import * as Utils from 'src/utils'
import { ReactiveTab, Tab, TabStatus, TabsPanel } from 'src/types'
import { NOID, GROUP_URL, ADDON_HOST, GROUP_INITIAL_TITLE } from 'src/defaults'
import { DEFAULT_CONTAINER_ID } from 'src/defaults'
import * as Logs from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Favicons } from 'src/services/favicons'
import { DnD } from 'src/services/drag-and-drop'
import { RemovedTabInfo, Tabs } from './tabs.fg'
import * as IPC from './ipc'
import { Search } from './search'
import { Containers } from './containers'

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
  browser.sessions
    .getTabValue(tab.id, 'data')
    .then(data => {
      tab.reopened = !!data
      if (!waitForOtherReopenedTabsBuffer) return
      waitForOtherReopenedTabsCheckLen--
      if (waitForOtherReopenedTabsCheckLen <= 0) {
        clearTimeout(waitForOtherReopenedTabsTimeout)
        releaseReopenedTabsBuffer()
      }
    })
    .catch(err => {
      Logs.err('Tabs.waitForOtherReopenedTabs: Cannot get tab data from session:', err)
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

function onTabCreated(tab: Tab, attached?: boolean): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabCreated(tab))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup(true)

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
  if (Tabs.removedTabs.length && !tab.discarded && tab.reopened !== false && !attached) {
    const prevPosIndex = Tabs.removedTabs.findIndex(t => t.title === tab.title)
    reopenedTabInfo = Tabs.removedTabs[prevPosIndex]
    if (reopenedTabInfo) {
      // And here attouched tabs...
      if (!waitForOtherReopenedTabsBufferRelease) {
        waitForOtherReopenedTabs(tab)
        return
      }

      Tabs.removedTabs.splice(prevPosIndex, 1)
      reopenedTabPanel = Sidebar.panelsById[reopenedTabInfo.panelId]
    }
  }

  // Predefined position
  if (Tabs.newTabsPosition && Tabs.newTabsPosition[tab.index]) {
    const position = Tabs.newTabsPosition[tab.index]
    panel = Sidebar.panelsById[position.panel]
    if (!Utils.isTabsPanel(panel)) {
      const prevTab = Tabs.list[tab.index - 1]
      if (prevTab && !prevTab.pinned && prevTab.panelId !== NOID) {
        panel = Sidebar.panelsById[prevTab.panelId] as TabsPanel
      } else {
        panel = Sidebar.panels.find(p => Utils.isTabsPanel(p)) as TabsPanel
      }
    }
    index = tab.index
    tab.openerTabId = position.parent
    if (position.unread !== undefined) tab.unread = position.unread
    delete Tabs.newTabsPosition[tab.index]

    // Handle tab reopening
    const oldTab = Tabs.list[tab.index]
    if (oldTab?.reopening) {
      oldTab.reopening.id = tab.id
    }
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
    browser.tabs.move(tab.id, { index }).catch(err => {
      Logs.err('Tabs.onTabCreated: Cannot move the tab to the correct position:', err)
    })
  }

  // Update tabs indexses after inserted one.
  for (let i = index; i < Tabs.list.length; i++) {
    Tabs.list[i].index++
  }

  // Set custom props
  if (Settings.state.tabsUnreadMark && tab.unread === undefined && !tab.active) tab.unread = true
  if (panel) Tabs.normalizeTab(tab, panel.id)
  tab.internal = tab.url.startsWith(ADDON_HOST)
  if (tab.internal) tab.isGroup = Utils.isGroupUrl(tab.url)
  tab.index = index
  tab.parentId = Settings.state.tabsTree ? tab.openerTabId ?? NOID : NOID
  if (!tab.favIconUrl && !tab.internal && !tab.url.startsWith('a')) {
    tab.favIconUrl = Favicons.getFavicon(tab.url)
  }

  // Check if tab should be reopened in different container
  if (
    !attached &&
    tab.cookieStoreId === DEFAULT_CONTAINER_ID &&
    panel &&
    panel.newTabCtx !== 'none'
  ) {
    const container = Containers.reactive.byId[panel.newTabCtx]
    if (container) tab.reopenInContainer = container.id
  }

  // Put new tab in state
  Tabs.byId[tab.id] = tab
  Tabs.list.splice(index, 0, tab)
  Tabs.reactive.byId[tab.id] = Tabs.toReactive(tab)
  Sidebar.recalcTabsPanels()
  Tabs.updateUrlCounter(tab.url, 1)

  // Update tree
  if (Settings.state.tabsTree && !tab.pinned && panel) {
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
        // If parent tab is folded
        if (parent.folded && !attached) {
          // Expand branch
          if (Settings.state.autoExpandTabsOnNew) {
            Tabs.expTabsBranch(parent.id)
          }
          // or trigger the flash animation
          else {
            const rParent = Tabs.reactive.byId[parent.id]
            if (rParent) Tabs.triggerFlashAnimation(rParent)
          }
        }

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
          browser.tabs.update(tab.id, { openerTabId: tab.id }).catch(err => {
            Logs.err('Tabs.onTabCreated: Cannot set openerTabId:', err)
          })
        }
      }
    }

    // Try to restore tree if tab was reopened and it had children
    if (reopenedTabInfo && reopenedTabInfo.children) {
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

    if (!attached) {
      const groupTab = Tabs.getGroupTab(tab)
      if (groupTab && !groupTab.discarded) {
        IPC.groupPage(groupTab.id, {
          name: 'create',
          id: tab.id,
          index: tab.index,
          lvl: tab.lvl - groupTab.lvl - 1,
          title: tab.title,
          url: tab.url,
          discarded: tab.discarded,
          favIconUrl: tab.favIconUrl,
        })
      }
    }

    if (Settings.state.colorizeTabs) Tabs.colorizeTabDebounced(tab.id, 120)
    if (Settings.state.colorizeTabsBranches && tab.lvl > 0) Tabs.setBranchColor(tab.id)

    // Inherit custom color from parent
    if (tab.openerTabId !== undefined && Settings.state.inheritCustomColor) {
      const parent = Tabs.byId[tab.openerTabId]
      if (parent?.customColor) {
        tab.customColor = parent.customColor
        if (rTab) rTab.customColor = parent.customColor
      }
    }
  }

  Tabs.saveTabData(tab.id)
  Tabs.cacheTabsData()

  // Update succession
  Tabs.updateSuccessionDebounced(100)

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
    if (activeTab && activeTab.panelId !== panel.id) {
      browser.tabs.hide?.(tab.id).catch(err => {
        Logs.err('Tabs.onTabCreated: Cannot hide tab:', err)
      })
    }
  }

  // Scroll to new inactive tab
  if (
    !tab.pinned &&
    !tab.active &&
    !tab.invisible &&
    tab.panelId === Sidebar.reactive.activePanelId
  ) {
    Tabs.scrollToTabDebounced(120, tab.id)
  }

  // Re-run activation event (if the tab was attached externally)
  if (tab.active && deferredActivationHandling.id === tab.id && deferredActivationHandling.cb) {
    deferredActivationHandling.cb()
    deferredActivationHandling.cb = null
  }

  if (panel) Tabs.decrementScrollRetainer(panel)
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
  if (!localTab || !rLocalTab) {
    return Logs.warn(`Tabs.onTabUpdated: Cannot find local tab: ${tabId}`)
  }

  // Discarded
  if (change.discarded !== undefined) {
    if (change.discarded) {
      // Update successor tab for active tab
      Tabs.updateSuccessionDebounced(15)

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

      if (!localTab.favIconUrl) {
        localTab.favIconUrl = Favicons.getFavicon(localTab.url)
        rLocalTab.favIconUrl = localTab.favIconUrl
      }
    }

    Sidebar.checkDiscardedTabsInPanelDebounced(localTab.panelId, 120)
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
      localTab.isGroup = isInternal && Utils.isGroupUrl(change.url)
      rLocalTab.isGroup = localTab.isGroup
    }
    localTab.internal = isInternal
    Tabs.cacheTabsData()
    if (!change.url.startsWith(localTab.url.slice(0, 16))) {
      localTab.favIconUrl = ''
      rLocalTab.favIconUrl = ''
    }

    // Update URL of the linked group page (for pinned tab)
    if (localTab.pinned && localTab.relGroupId !== undefined) {
      const groupTab = Tabs.byId[localTab.relGroupId]
      if (groupTab) {
        const oldUrl = encodeURIComponent(localTab.url)
        const newUrl = encodeURIComponent(change.url)
        const groupUrl = groupTab.url.replace(oldUrl, newUrl)
        browser.tabs.update(groupTab.id, { url: groupUrl }).catch(err => {
          Logs.err('Tabs.onTabUpdated: Cannot reload related group page:', err)
        })
      }
    }

    // Reset pause state
    if (localTab.mediaPaused) {
      localTab.mediaPaused = false
      rLocalTab.mediaPaused = false
    }

    // Re-color tab
    if (Settings.state.colorizeTabs) {
      Tabs.colorizeTabDebounced(tabId, 120)
    }

    // Check if branch re-colorization is needed
    if (Settings.state.colorizeTabsBranches) {
      branchColorizationNeeded = localTab.isParent && localTab.lvl === 0
      if (localTab.lvl === 0) rLocalTab.branchColor = null
    }

    // Check if tab should be moved to another panel
    if (Tabs.moveRules.length && !localTab.pinned && change.url !== 'about:blank') {
      Tabs.moveByRule(tabId, 120)
    }

    // Update url counter
    const oldUrlCount = Tabs.updateUrlCounter(localTab.url, -1)
    Tabs.updateUrlCounter(change.url, 1)

    // Mark/Unmark open bookmarks
    if (Settings.state.highlightOpenBookmarks) {
      if (!oldUrlCount) Bookmarks.unmarkOpenBookmarksDebounced(localTab.url)
      Bookmarks.markOpenBookmarksDebounced(change.url)
    }

    Tabs.updateTooltipDebounced(tabId, 1000)

    // Update filtered results
    if (Search.reactive.rawValue) Search.searchDebounced(500)
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
      if (!tab.active && !localTab.internal && Date.now() - tab.lastAccessed > 5000) {
        // If current url is the same as previous
        if (localTab.url === tab.url) {
          // Check if this title update is the first for current URL
          const ok = Settings.state.tabsUpdateMarkFirst
            ? !URL_HOST_PATH_RE.test(tab.title)
            : !URL_HOST_PATH_RE.test(localTab.title) && !URL_HOST_PATH_RE.test(tab.title)
          if (ok) {
            const panel = Sidebar.panelsById[localTab.panelId]
            localTab.updated = true
            rLocalTab.updated = true
            if (
              Utils.isTabsPanel(panel) &&
              (!tab.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
              panel.updatedTabs &&
              !panel.updatedTabs.includes(tabId)
            ) {
              panel.updatedTabs.push(tabId)
              panel.reactive.updated = panel.updatedTabs.length > 0
            }
          }
        }
      }
    }

    // Reset custom title
    if (localTab.isGroup && localTab.active && change.title !== GROUP_INITIAL_TITLE) {
      if (rLocalTab.customTitle) {
        localTab.customTitle = undefined
        rLocalTab.customTitle = null
      }
    }

    Tabs.updateTooltipDebounced(tabId, 1000)

    // Update filtered results
    if (Search.reactive.rawValue) Search.searchDebounced(500)
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
    const panel = Sidebar.panelsById[localTab.panelId]
    if (Utils.isTabsPanel(panel)) {
      if (!localTab.unpinning && panel.startTabIndex !== undefined) {
        const startIndex = panel.startTabIndex
        localTab.dstPanelId = localTab.panelId
        Tabs.list.splice(localTab.index, 1)
        Tabs.list.splice(startIndex - 1, 0, localTab)
        Tabs.updateTabsIndexes()
        Sidebar.recalcTabsPanels()

        const relGroupTab = Tabs.byId[localTab.relGroupId]
        if (relGroupTab) {
          Tabs.replaceRelGroupWithPinnedTab(relGroupTab, localTab)
        } else {
          browser.tabs.move(tabId, { index: startIndex - 1 }).catch(err => {
            Logs.err('Tabs.onTabUpdated: Cannot move unpinned tab:', err)
          })
        }
      }
      if (tab.active) Sidebar.activatePanel(panel.id)
    }
  }

  // Handle pinned tab
  if (change.pinned !== undefined && change.pinned) {
    let panel = Sidebar.panelsById[localTab.panelId]

    if (localTab.prevPanelId && localTab.moveTime && localTab.moveTime + 1000 > Date.now()) {
      localTab.panelId = localTab.prevPanelId
      panel = Sidebar.panelsById[localTab.panelId]
      Tabs.saveTabData(localTab.id)

      if (localTab.active && localTab.panelId !== Sidebar.reactive.activePanelId) {
        Sidebar.activatePanel(localTab.panelId)
      }
    }

    Sidebar.recalcTabsPanels()
    Tabs.updateTabsTree()

    if (Utils.isTabsPanel(panel) && !panel.reactive.len) {
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
function onTabRemoved(tabId: ID, info: browser.tabs.RemoveInfo, detached?: boolean): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0 || waitForOtherReopenedTabsBuffer) {
    Tabs.deferredEventHandling.push(() => onTabRemoved(tabId, info, detached))
    return
  }
  if (info.isWindowClosing) return
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  const removedExternally = !Tabs.removingTabs || !Tabs.removingTabs.length
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

  const toShow: ID[] = []
  const nextTab = Tabs.list[tab.index + 1]
  const hasChildren =
    Settings.state.tabsTree &&
    tab.isParent &&
    nextTab &&
    nextTab.parentId === tab.id &&
    nextTab.panelId === tab.panelId
  let removedTabInfo: RemovedTabInfo | undefined

  // Update temp list of removed tabs for restoring reopened tabs state
  if (
    !detached &&
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
    if (Tabs.removedTabs.length > 64) {
      Tabs.removedTabs = Tabs.removedTabs.slice(0, 50)
    }
  }

  // Remember removed tab
  if (removedExternally && !detached) {
    Tabs.rememberRemoved([tab])
  }

  // Handle child tabs
  handling_descendants: if (hasChildren) {
    const toRemove = []
    const outdentOnlyFirstChild = Settings.state.treeRmOutdent === 'first_child'
    const firstChild = nextTab

    // Handle reopening tab in different container
    if (tab.reopening && tab.reopening.id !== NOID) {
      const newTab = Tabs.byId[tab.reopening.id]
      const rNewTab = Tabs.reactive.byId[tab.reopening.id]
      // New tab is already created
      if (newTab && rNewTab) {
        newTab.folded = tab.folded
        rNewTab.folded = tab.folded
        newTab.isParent = tab.isParent
        rNewTab.isParent = tab.isParent
        Tabs.forEachDescendant(tab, t => {
          if (t.parentId === tab.id) t.parentId = newTab.id
        })
        break handling_descendants
      }
    }

    for (let i = tab.index + 1, t; i < Tabs.list.length; i++) {
      t = Tabs.list[i]
      if (t.lvl <= tab.lvl) break

      // Tab will be detached, so skip handling it
      if (detached && Tabs.detachingTabIds.indexOf(t.id) !== -1) continue

      const rt = Tabs.reactive.byId[t.id]

      if (t.parentId === tab.id && !detached) {
        rememberChildTabs(t.id, tab.id)
        if (removedTabInfo?.children) removedTabInfo.children.push(t.id)
        else if (removedTabInfo) removedTabInfo.children = [t.id]
      }

      // Remove folded tabs
      if (
        (Settings.state.rmChildTabs === 'folded' && tab.folded && !detached && !tab.reopening) ||
        (Settings.state.rmChildTabs === 'all' && !detached && !tab.reopening)
      ) {
        if (!Tabs.removingTabs.includes(t.id)) {
          toRemove.push(t.id)
          continue
        }
      }
      // Or just make them visible
      else if (t.invisible && !Tabs.removingTabs.includes(t.id)) {
        t.invisible = false
        if (rt) rt.invisible = false
        if (t.hidden) toShow.push(t.id)
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

    // Show hidden native tabs
    if (toShow.length) {
      browser.tabs.show?.(toShow).catch(() => {
        Logs.warn('Tabs.onTabRemoved: Cannot show native tabs')
      })
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
  const panel = Sidebar.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) {
    Logs.err('Tabs.onTabRemoved: Wrong panel')
    return
  }

  // No-empty
  if (!tab.pinned && panel.noEmpty && !panel.reactive.len) {
    Tabs.createTabInPanel(panel, { active: false })
  }

  // Remove updated flag
  if (panel.updatedTabs.length) {
    Utils.rmFromArray(panel.updatedTabs, tabId)
    panel.reactive.updated = panel.updatedTabs.length > 0
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
    const tabSuccessor = Tabs.updateSuccessionDebounced(0)

    // Switch to another panel if current is hidden
    if (
      Settings.state.hideEmptyPanels &&
      !panel.tabs.length &&
      Tabs.activeId !== tabId && // <- b/c panel will be switched in onTabActivated
      !panel.pinnedTabs.length &&
      Sidebar.reactive.activePanelId === panel.id &&
      !Sidebar.switchingLock
    ) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned) Sidebar.activatePanel(activeTab.panelId)
      else if (tabSuccessor) Sidebar.activatePanel(tabSuccessor.panelId)
      else Sidebar.switchToNeighbourPanel()
    }

    // Update filtered results
    if (Search.reactive.rawValue) Search.search()
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
    browser.tabs.update(tab.relGroupId, { url: groupUrl.href }).catch(err => {
      Logs.err('Tabs.onTabRemoved: Cannot reload related group page:', err)
    })
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
    Logs.warn(msg)
    return
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
    if (tab.active) Tabs.updateSuccessionDebounced(0)
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
    const srcPanel = Sidebar.panelsById[movedTab.panelId]
    let dstPanel = Sidebar.panelsById[movedTab.dstPanelId]
    movedTab.dstPanelId = NOID

    if (!dstPanel) {
      dstPanel = Sidebar.panelsById[toTab.panelId]
    } else if (
      Utils.isTabsPanel(dstPanel) &&
      dstPanel.startTabIndex > -1 &&
      dstPanel.endTabIndex > -1 &&
      (dstPanel.startTabIndex > info.toIndex || dstPanel.endTabIndex + 1 < info.toIndex)
    ) {
      dstPanel = Sidebar.panelsById[toTab.panelId]
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
  if (!Tabs.movingTabs.length) Tabs.updateSuccessionDebounced(0)
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

  const di = Tabs.detachingTabIds.indexOf(id)
  if (di !== -1) Tabs.detachingTabIds.splice(di, 1)

  onTabRemoved(id, { windowId: Windows.id, isWindowClosing: false }, true)

  if (Tabs.detachingTabIds.length === 0 && Settings.state.hideFoldedTabs) {
    Tabs.updateNativeTabsVisibility()
  }
}

/**
 * Tabs.onAttached
 */
const deferredActivationHandling = { id: NOID, cb: null as (() => void) | null }
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
  else {
    deferredActivationHandling.id = id
    tab = (await browser.tabs.get(id)) as Tab
  }

  tab.windowId = Windows.id
  tab.index = info.newPosition
  tab.panelId = NOID
  tab.sel = false

  onTabCreated(tab, true)

  if (tab.active) {
    browser.tabs.update(tab.id, { active: true }).catch(err => {
      Logs.err('Tabs.onTabAttached: Cannot activate tab', err)
    })
  }

  if (Tabs.attachingTabs.length === 0 && Settings.state.hideFoldedTabs) {
    Tabs.updateNativeTabsVisibility()
  }

  deferredActivationHandling.id = NOID
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
    // Defer handling of this event
    if (deferredActivationHandling.id === info.tabId) {
      deferredActivationHandling.cb = () => onTabActivated(info)
      return
    }

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

    // Hide previously active tab if needed
    const hideFolded = Settings.state.hideFoldedTabs
    const hideFoldedParent = hideFolded && Settings.state.hideFoldedParent === 'any'
    const hideFoldedGroup = hideFolded && Settings.state.hideFoldedParent === 'group'
    if (prevActive?.folded && (hideFoldedParent || (hideFoldedGroup && prevActive.isGroup))) {
      browser.tabs.hide?.(prevActive.id).catch(err => {
        Logs.err('Tabs.onTabActivated: Cannot hide prev active tab', err)
      })
    }
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

  const panel = Sidebar.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (panel.updatedTabs.length) {
    Utils.rmFromArray(panel.updatedTabs, tab.id)
    panel.reactive.updated = panel.updatedTabs.length > 0
  }

  // Switch to activated tab's panel
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  const switchPanel = Settings.state.switchPanelAfterSwitchingTab !== 'no'
  if (
    switchPanel &&
    (!tab.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
    !activePanel?.lockedPanel &&
    !Sidebar.switchingLock
  ) {
    const switchOnMouseLeave = Settings.state.switchPanelAfterSwitchingTab === 'mouseleave'
    if (switchOnMouseLeave) Sidebar.switchOnMouseLeave = true
    else if (!Sidebar.subPanelActive) Sidebar.activatePanel(panel.id)
  }
  if ((!prevActive || prevActive.panelId !== tab.panelId) && Settings.state.hideInact) {
    Tabs.updateNativeTabsVisibility()
  }

  // Propagate access time to parent tabs for autoFolding feature
  if (
    Settings.state.tabsTree &&
    tab.parentId !== -1 &&
    Settings.state.autoFoldTabs &&
    Settings.state.autoFoldTabsExcept !== 'none'
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

  if (!tab.pinned) Tabs.scrollToTabDebounced(3, tab.id)

  // Update succession
  Tabs.updateSuccessionDebounced(10)
}
