import * as Utils from 'src/utils'
import { NativeTab, Tab, TabStatus, TabsPanel, RemovedTabInfo } from 'src/types'
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
import { Tabs } from './tabs.fg'
import * as IPC from './ipc'
import { Search } from './search'
import { Containers } from './containers'
import { Mouse } from './mouse'

const EXT_HOST = browser.runtime.getURL('').slice(16)
const URL_HOST_PATH_RE = /^([a-z0-9-]{1,63}\.)+\w+(:\d+)?\/[A-Za-z0-9-._~:/?#[\]%@!$&'()*+,;=]*$/
const NEWTAB_URL = browser.extension.inIncognitoContext ? 'about:privatebrowsing' : 'about:newtab'

export function setupTabsListeners(): void {
  if (!Sidebar.hasTabs) return

  browser.tabs.onCreated.addListener(onTabCreated)
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
  browser.tabs.onCreated.removeListener(onTabCreated)
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

function onTabCreated(nativeTab: NativeTab, attached?: boolean): void {
  if (nativeTab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabCreated(nativeTab))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.closeHiddenPanelsPopup(true)

  if (Settings.state.highlightOpenBookmarks) Bookmarks.markOpenBookmarksDebounced(nativeTab.url)

  Menu.close()
  Selection.resetSelection()

  let panel, index, reopenedTabInfo, reopenedTabPanel, createGroup, autoGroupTab
  let initialOpenerSpec = ''
  const initialOpener = Tabs.byId[nativeTab.openerTabId ?? -1]
  const tab = Tabs.mutateNativeTabToSideberyTab(nativeTab)

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
  if (Tabs.newTabsPosition[tab.index]) {
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
    const parent = Tabs.byId[tab.openerTabId ?? NOID]
    if (!attached && parent?.folded && Settings.state.ignoreFoldedParent) {
      tab.openerTabId = parent.parentId
    }

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
    tab.moving = true
    browser.tabs
      .move(tab.id, { index })
      .then(() => {
        tab.moving = undefined
      })
      .catch(err => {
        Logs.err('Tabs.onTabCreated: Cannot move the tab to the correct position:', err)
        tab.moving = undefined
      })
  }

  // Update tabs indexses after inserted one.
  for (let i = index; i < Tabs.list.length; i++) {
    Tabs.list[i].index++
  }

  // Set custom props
  if (Settings.state.tabsUnreadMark && tab.unread === undefined && !tab.active) {
    tab.reactive.unread = tab.unread = true
  }
  if (panel) tab.panelId = panel.id
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
  Tabs.reactivateTab(tab)
  Sidebar.recalcTabsPanels()
  Sidebar.addToVisibleTabs(panel.id, tab)
  Tabs.updateUrlCounter(tab.url, 1)

  // Update tree
  if (Settings.state.tabsTree && !tab.pinned && panel) {
    let treeHasChanged = false

    // Get parent id from the next tab and update tree props
    if (tab.openerTabId === undefined) {
      const nextTab = Tabs.list[tab.index + 1]
      if (nextTab && tab.panelId === nextTab.panelId) {
        tab.parentId = nextTab.parentId
        tab.lvl = nextTab.lvl
        tab.reactive.lvl = nextTab.lvl
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
            Tabs.triggerFlashAnimation(parent)
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
          index: groupTab.index,
          createdTab: {
            id: tab.id,
            index: tab.index,
            lvl: tab.lvl - groupTab.lvl - 1,
            title: tab.title,
            url: tab.url,
            discarded: !!tab.discarded,
            favIconUrl: tab.favIconUrl,
          },
        })
      }
    }

    if (Settings.state.colorizeTabs) Tabs.colorizeTabDebounced(tab.id, 120)
    if (Settings.state.colorizeTabsBranches && tab.lvl > 0) Tabs.setBranchColor(tab.id)

    // Inherit custom color from parent
    if (tab.openerTabId !== undefined && Settings.state.inheritCustomColor) {
      const parent = Tabs.byId[tab.openerTabId]
      if (parent?.customColor) {
        tab.reactive.customColor = tab.customColor = parent.customColor
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
    Tabs.scrollToTabDebounced(120, tab.id, true)
  }

  // Re-run activation event (if the tab was attached externally)
  if (tab.active && deferredActivationHandling.id === tab.id && deferredActivationHandling.cb) {
    deferredActivationHandling.cb()
    deferredActivationHandling.cb = null
  }

  if (panel) Tabs.decrementScrollRetainer(panel)

  if (attached && (tab.audible || tab.mediaPaused || tab.mutedInfo?.muted)) {
    Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
  }
}

/**
 * Tabs.onUpdated
 */
function onTabUpdated(tabId: ID, change: browser.tabs.ChangeInfo, nativeTab: NativeTab): void {
  if (nativeTab.windowId !== Windows.id) return
  if (Tabs.list.length === 0 || waitForOtherReopenedTabsBuffer) {
    Tabs.deferredEventHandling.push(() => onTabUpdated(tabId, change, nativeTab))
    return
  }

  const tab = Tabs.byId[tabId]
  if (!tab) {
    return Logs.warn(`Tabs.onTabUpdated: Cannot find local tab: ${tabId}`)
  }

  // Discarded
  if (change.discarded !== undefined) {
    if (change.discarded) {
      // Update successor tab for active tab
      Tabs.updateSuccessionDebounced(15)

      if (tab.status === 'loading') {
        tab.status = 'complete'
        tab.reactive.status = TabStatus.Complete
      }
      if (tab.loading) tab.loading = false
      let mediaStateChanged = false
      if (tab.audible) {
        mediaStateChanged = true
        tab.audible = false
        tab.reactive.mediaAudible = false
      }
      if (tab.mediaPaused) {
        mediaStateChanged = true
        tab.mediaPaused = false
        tab.reactive.mediaPaused = false
      }
      if (mediaStateChanged) {
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      }
      const groupTab = Tabs.getGroupTab(tab)
      if (groupTab && !groupTab.discarded) Tabs.updateGroupChild(groupTab.id, nativeTab.id)

      if (!tab.favIconUrl) {
        tab.favIconUrl = Favicons.getFavicon(tab.url)
        tab.reactive.favIconUrl = tab.favIconUrl
      }
    }

    Sidebar.checkDiscardedTabsInPanelDebounced(tab.panelId, 120)
  }

  // Status change
  if (change.status !== undefined) {
    if (change.status === 'complete' && nativeTab.url[0] !== 'a') {
      if (Settings.state.animations && change.status !== tab.status) {
        Tabs.triggerFlashAnimation(tab)
      }
      reloadTabFaviconDebounced(tab)
    }
    if (change.url && tab.mediaPaused) {
      tab.mediaPaused = false
      tab.reactive.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
    }
  }

  // Url
  let branchColorizationNeeded = false
  if (change.url !== undefined && change.url !== tab.url) {
    const isInternal = change.url.startsWith(ADDON_HOST)
    if (isInternal !== tab.internal) {
      tab.isGroup = isInternal && Utils.isGroupUrl(change.url)
      tab.reactive.isGroup = tab.isGroup
    }
    tab.internal = isInternal
    Tabs.cacheTabsData()
    if (!change.url.startsWith(tab.url.slice(0, 16))) {
      tab.favIconUrl = ''
      tab.reactive.favIconUrl = ''
    }

    // Update URL of the linked group page (for pinned tab)
    if (tab.pinned && tab.relGroupId !== undefined) {
      const groupTab = Tabs.byId[tab.relGroupId]
      if (groupTab) {
        const oldUrl = encodeURIComponent(tab.url)
        const newUrl = encodeURIComponent(change.url)
        const groupUrl = groupTab.url.replace(oldUrl, newUrl)
        browser.tabs.update(groupTab.id, { url: groupUrl }).catch(err => {
          Logs.err('Tabs.onTabUpdated: Cannot reload related group page:', err)
        })
      }
    }

    // Reset pause state
    if (tab.mediaPaused) {
      tab.mediaPaused = false
      tab.reactive.mediaPaused = false
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
    }

    // Re-color tab
    if (Settings.state.colorizeTabs) {
      Tabs.colorizeTabDebounced(tabId, 120)
    }

    // Check if branch re-colorization is needed
    if (Settings.state.colorizeTabsBranches) {
      branchColorizationNeeded = tab.isParent && tab.lvl === 0
      if (tab.lvl === 0) tab.reactive.branchColor = null
    }

    // Check if tab should be moved to another panel
    if (Tabs.moveRules.length && !tab.pinned && change.url !== 'about:blank') {
      Tabs.moveByRule(tabId, 120)
    }

    // Update url counter
    const oldUrlCount = Tabs.updateUrlCounter(tab.url, -1)
    Tabs.updateUrlCounter(change.url, 1)

    // Mark/Unmark open bookmarks
    if (Settings.state.highlightOpenBookmarks) {
      if (!oldUrlCount) Bookmarks.unmarkOpenBookmarksDebounced(tab.url)
      Bookmarks.markOpenBookmarksDebounced(change.url)
    }

    Tabs.updateTooltipDebounced(tabId, 1000)

    // Update filtered results
    if (Search.reactive.rawValue) Search.searchDebounced(500, undefined, true)
  }

  // Handle favicon change
  if (change.favIconUrl) {
    if (change.favIconUrl.startsWith('chrome:')) {
      if (change.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
        tab.warn = true
        tab.reactive.warn = true
      }
      change.favIconUrl = ''
    }
  }

  // Handle title change
  if (change.title !== undefined) {
    if (change.title.startsWith(EXT_HOST)) change.title = tab.title

    // Mark tab with updated title
    if (
      Settings.state.tabsUpdateMark === 'all' ||
      (Settings.state.tabsUpdateMark === 'pin' && tab.pinned) ||
      (Settings.state.tabsUpdateMark === 'norm' && !tab.pinned)
    ) {
      if (!nativeTab.active && !tab.internal && Date.now() - nativeTab.lastAccessed > 5000) {
        // If current url is the same as previous
        if (tab.url === nativeTab.url) {
          // Check if this title update is the first for current URL
          const ok = Settings.state.tabsUpdateMarkFirst
            ? !URL_HOST_PATH_RE.test(nativeTab.title)
            : !URL_HOST_PATH_RE.test(tab.title) && !URL_HOST_PATH_RE.test(nativeTab.title)
          if (ok) {
            const panel = Sidebar.panelsById[tab.panelId]
            tab.updated = true
            tab.reactive.updated = true
            if (
              Utils.isTabsPanel(panel) &&
              (!nativeTab.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
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
    if (tab.isGroup && tab.active && change.title !== GROUP_INITIAL_TITLE) {
      if (tab.reactive.customTitle) {
        tab.customTitle = undefined
        tab.reactive.customTitle = null
      }
    }

    Tabs.updateTooltipDebounced(tabId, 1000)

    // Update filtered results
    if (Search.reactive.rawValue) Search.searchDebounced(500, undefined, true)
  }

  // Reset mediaPaused flag
  if (change.audible !== undefined && change.audible && tab.mediaPaused) {
    tab.mediaPaused = false
    tab.reactive.mediaPaused = false
  }

  // Update tab object
  Object.assign(tab, change)
  if (change.audible !== undefined) tab.reactive.mediaAudible = change.audible
  if (change.discarded !== undefined) tab.reactive.discarded = change.discarded
  if (change.favIconUrl !== undefined) {
    if (tab.internal) tab.reactive.favIconUrl = undefined
    else tab.reactive.favIconUrl = change.favIconUrl
  }
  if (change.mutedInfo?.muted !== undefined) tab.reactive.mediaMuted = change.mutedInfo.muted
  if (change.pinned !== undefined) tab.reactive.pinned = change.pinned
  if (change.status !== undefined) tab.reactive.status = Tabs.getStatus(tab)
  if (change.title !== undefined) tab.reactive.title = change.title
  if (change.url !== undefined) tab.reactive.url = change.url

  // Handle media state change
  if (change.audible !== undefined || change.mutedInfo?.muted !== undefined) {
    Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
  }

  // Handle unpinned tab
  if (change.pinned !== undefined && !change.pinned) {
    const panel = Sidebar.panelsById[tab.panelId]
    if (Utils.isTabsPanel(panel)) {
      if (!tab.unpinning && panel.startTabIndex !== undefined) {
        const startIndex = panel.startTabIndex
        tab.dstPanelId = tab.panelId
        Tabs.list.splice(tab.index, 1)
        Tabs.list.splice(startIndex - 1, 0, tab)
        Tabs.updateTabsIndexes()
        Sidebar.recalcTabsPanels()
        Sidebar.recalcVisibleTabs(tab.panelId)

        const relGroupTab = Tabs.byId[tab.relGroupId]
        if (relGroupTab) {
          Tabs.replaceRelGroupWithPinnedTab(relGroupTab, tab)
        } else {
          browser.tabs.move(tabId, { index: startIndex - 1 }).catch(err => {
            Logs.err('Tabs.onTabUpdated: Cannot move unpinned tab:', err)
          })
        }
      }
      if (nativeTab.active) Sidebar.activatePanel(panel.id)
    }
    if (tab.audible || tab.mediaPaused || tab.mutedInfo?.muted) {
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
    }
  }

  // Handle pinned tab
  if (change.pinned !== undefined && change.pinned) {
    let panel = Sidebar.panelsById[tab.panelId]

    if (tab.prevPanelId && tab.moveTime && tab.moveTime + 1000 > Date.now()) {
      tab.panelId = tab.prevPanelId
      panel = Sidebar.panelsById[tab.panelId]
      Tabs.saveTabData(tab.id)

      if (tab.active && tab.panelId !== Sidebar.reactive.activePanelId) {
        Sidebar.activatePanel(tab.panelId)
      }
    }

    Sidebar.recalcTabsPanels()
    Tabs.updateTabsTree()
    Sidebar.recalcVisibleTabs(panel.id)

    if (Utils.isTabsPanel(panel) && !panel.reactive.len) {
      if (panel.noEmpty) {
        Tabs.createTabInPanel(panel)
      } else if (Settings.state.pinnedTabsPosition !== 'panel') {
        Sidebar.switchToNeighbourPanel()
      }
    }
  }

  // Colorize branch
  if (branchColorizationNeeded) Tabs.colorizeBranch(tab.id)
}

const reloadTabFaviconTimeout: Record<ID, number> = {}
function reloadTabFaviconDebounced(tab: Tab, delay = 500): void {
  clearTimeout(reloadTabFaviconTimeout[tab.id])
  reloadTabFaviconTimeout[tab.id] = setTimeout(() => {
    delete reloadTabFaviconTimeout[tab.id]

    if (tab.internal) {
      tab.favIconUrl = undefined
      tab.reactive.favIconUrl = undefined
      return
    }

    browser.tabs
      .get(tab.id)
      .then(tabInfo => {
        if (tabInfo.favIconUrl && !tabInfo.favIconUrl.startsWith('chrome:')) {
          tab.favIconUrl = tabInfo.favIconUrl
          tab.reactive.favIconUrl = tabInfo.favIconUrl
        } else {
          if (tabInfo.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
            tab.warn = true
            tab.reactive.warn = true
          } else if (tab.warn) {
            tab.warn = false
            tab.reactive.warn = false
          }
          tab.favIconUrl = ''
          tab.reactive.favIconUrl = ''
        }

        const groupTab = Tabs.getGroupTab(tab)
        if (groupTab && !groupTab.discarded) Tabs.updateGroupChild(groupTab.id, tab.id)
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
  if (!tab) {
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
      // New tab is already created
      if (newTab) {
        newTab.folded = tab.folded
        newTab.reactive.folded = tab.folded
        newTab.isParent = tab.isParent
        newTab.reactive.isParent = tab.isParent
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
        t.reactive.invisible = t.invisible = false
        if (t.hidden) toShow.push(t.id)
      }

      // Decrease indent level of tabs in branch
      // First child
      if (firstChild.id === t.id) {
        t.parentId = tab.parentId
        t.reactive.lvl = t.lvl = tab.lvl
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
              firstChild.reactive.isParent = true
            }
          }
          // Outdent
          else {
            t.parentId = tab.parentId
            t.reactive.lvl = t.lvl = tab.lvl
          }
        }
        // Other descendants
        else {
          const parentTab = Tabs.byId[t.parentId]
          if (parentTab) {
            t.reactive.lvl = t.lvl = parentTab.lvl + 1
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
  Sidebar.recalcTabsPanels()

  // Update url counter
  const urlCount = Tabs.updateUrlCounter(tab.url, -1)

  // Get panel of removed tab
  const panel = Sidebar.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) {
    Logs.err('Tabs.onTabRemoved: Wrong panel')
    return
  }

  Sidebar.removeFromVisibleTabs(panel.id, tabId)

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
      if (parentTab) {
        // Update branch length
        if (removedExternally) parentTab.reactive.branchLen--

        // Parent tab is not parent anymore
        const nextTab = Tabs.list[parentTab.index + 1]
        if (!nextTab || nextTab?.parentId !== tab.parentId) {
          parentTab.isParent = false
          parentTab.folded = false
          parentTab.reactive.isParent = false
          parentTab.reactive.folded = false
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

    // Update media badges
    if (tab.audible || tab.mediaPaused || tab.mutedInfo?.muted) {
      Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId)
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
    browser.tabs.update(tab.relGroupId, { url: groupUrl.href }).catch(err => {
      Logs.err('Tabs.onTabRemoved: Cannot reload related group page:', err)
    })
  }

  const groupTab = Tabs.getGroupTab(tab)
  if (groupTab && !groupTab.discarded) {
    IPC.groupPage(groupTab.id, { removedTab: tab.id })
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
  if (tab.moving !== undefined) {
    Tabs.saveTabData(id)
    if (!mvLen) Tabs.cacheTabsData()
    tab.dstPanelId = NOID
    // TODO: if tab is already placed, maybe I can skip recalcing this shit?
    Sidebar.recalcTabsPanels()
    // Sidebar.recalcVisibleTabs(tab.panelId)
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
    Logs.err(`Tabs.onTabMoved: #${id} ${info.fromIndex} > ${info.toIndex}: Not found by index`)
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
  let srcPanel
  let dstPanel
  if (!movedTab.pinned) {
    srcPanel = Sidebar.panelsById[movedTab.panelId]
    dstPanel = Sidebar.panelsById[movedTab.dstPanelId]
    movedTab.dstPanelId = NOID

    const outOfPanel =
      Utils.isTabsPanel(dstPanel) &&
      dstPanel.startTabIndex > -1 &&
      dstPanel.endTabIndex > -1 &&
      (dstPanel.startTabIndex > info.toIndex || dstPanel.endTabIndex + 1 < info.toIndex)

    if (!dstPanel || outOfPanel) {
      dstPanel = Sidebar.panelsById[toTab.panelId]
    }

    if (Utils.isTabsPanel(srcPanel) && Utils.isTabsPanel(dstPanel)) {
      movedTab.panelId = dstPanel.id
      Sidebar.updateMediaStateOfPanelDebounced(100, movedTab.panelId, movedTab)
    }
  }

  Sidebar.recalcTabsPanels()

  // Calc tree levels and colorize branch
  if (Settings.state.tabsTree) {
    if (!mvLen) Tabs.updateTabsTree()

    if (Settings.state.colorizeTabsBranches && tab.lvl > 0) {
      Tabs.setBranchColor(tab.id)
    }
  }

  if (srcPanel) Sidebar.recalcVisibleTabs(srcPanel.id)
  if (dstPanel) Sidebar.recalcVisibleTabs(dstPanel.id)

  if (movedTab.panelId !== Sidebar.reactive.activePanelId && movedTab.active) {
    Sidebar.activatePanel(movedTab.panelId)
  }

  if (!mvLen) Tabs.cacheTabsData()
  Tabs.saveTabData(movedTab.id)

  // Update succession
  if (!mvLen) Tabs.updateSuccessionDebounced(0)
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
  if (tab) {
    tab.folded = false
    tab.reactive.folded = false
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
  if (ai > -1) {
    tab = Tabs.attachingTabs.splice(ai, 1)[0]
    Tabs.reactivateTab(tab)
  } else {
    deferredActivationHandling.id = id
    const nativeTab = await browser.tabs.get(id)
    tab = Tabs.mutateNativeTabToSideberyTab(nativeTab)
    Tabs.reactivateTab(tab)
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
  if (!tab) {
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
  if (prevActive) {
    prevActive.reactive.active = prevActive.active = false
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

  tab.reactive.active = tab.active = true
  if (Settings.state.tabsUpdateMark !== 'none') {
    tab.reactive.updated = tab.updated = false
  }
  if (Settings.state.tabsUnreadMark) {
    tab.reactive.unread = tab.unread = false
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
    if (Settings.state.switchPanelAfterSwitchingTab === 'mouseleave' && Mouse.mouseIn) {
      if (activePanel.id !== tab.panelId) Sidebar.switchOnMouseLeave = true
    } else if (!Sidebar.subPanelActive) {
      Sidebar.activatePanel(panel.id)
    }
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

  if (!tab.pinned) Tabs.scrollToTabDebounced(3, tab.id, true)

  // Update succession
  Tabs.updateSuccessionDebounced(10)
}
