import * as Utils from 'src/utils'
import { NativeTab, Tab, TabStatus, TabsPanel, RemovedTabInfo, TabSessionData } from 'src/types'
import { NOID, GROUP_URL, ADDON_HOST, GROUP_INITIAL_TITLE } from 'src/defaults'
import { DEFAULT_CONTAINER_ID } from 'src/defaults'
import * as Logs from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import * as Selection from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import * as Favicons from 'src/services/favicons.fg'
import { DnD } from 'src/services/drag-and-drop'
import { Tabs } from './tabs.fg'
import * as IPC from './ipc'
import * as Preview from 'src/services/tabs.preview'
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

const DETECT_SESSION_RESTORE_MIN_TABS_COUNT = 3
const SR_GET_TAB_SESSION_DATA_THRESHOLD = DETECT_SESSION_RESTORE_MIN_TABS_COUNT - 1
let checkingIfSessionRestoringTimeout: number | undefined
let prevSRCheckTimestamp = 0
let suspectTabs = null as Tab[] | null
let suspectTabsDataQuerying = null as Promise<TabSessionData | undefined>[] | null
function checkIfSessionRestoring(newTab: Tab) {
  const srCheckTimestamp = performance.now()
  let srCheckTimeDif = 0
  if (prevSRCheckTimestamp !== 0) srCheckTimeDif = srCheckTimestamp - prevSRCheckTimestamp
  prevSRCheckTimestamp = srCheckTimestamp

  // Start getting tabs session data only if there are enough tabs
  if (
    !suspectTabsDataQuerying &&
    suspectTabs &&
    suspectTabs.length >= SR_GET_TAB_SESSION_DATA_THRESHOLD
  ) {
    suspectTabsDataQuerying = suspectTabs.map(t => {
      return browser.sessions
        .getTabValue<TabSessionData | undefined>(t.id, 'data')
        .catch(() => undefined)
    })
  }

  if (!suspectTabs) suspectTabs = [newTab]
  else suspectTabs.push(newTab)

  // Get tab session data
  if (suspectTabsDataQuerying) {
    const dataQuerying = browser.sessions.getTabValue<TabSessionData | undefined>(newTab.id, 'data')
    suspectTabsDataQuerying.push(dataQuerying.catch(() => undefined))
  }

  clearTimeout(checkingIfSessionRestoringTimeout)
  checkingIfSessionRestoringTimeout = setTimeout(async () => {
    if (
      suspectTabs &&
      suspectTabs.length >= DETECT_SESSION_RESTORE_MIN_TABS_COUNT &&
      suspectTabsDataQuerying
    ) {
      let tabsSessionData: (TabSessionData | undefined)[] | undefined
      try {
        tabsSessionData = (await Promise.all(suspectTabsDataQuerying)) ?? []
      } catch (err) {
        Logs.err('Tabs.checkIfSessionRestoring: Cannot get tabs data from session:', err)
        tabsSessionData = []
      }

      tryToRestoreTabsStateFromSessionData(suspectTabs, tabsSessionData)
    }

    suspectTabs = null
    prevSRCheckTimestamp = 0
    suspectTabsDataQuerying = null
  }, 250 + srCheckTimeDif)
}

async function tryToRestoreTabsStateFromSessionData(
  tabs: Tab[],
  sData: (TabSessionData | undefined)[]
) {
  Logs.info('Tabs.tryToRestoreTabsStateFromSessionData', tabs.length)

  const idsMap: Record<ID, ID> = {}

  for (let data, tab, i = 0; i < tabs.length; i++) {
    tab = tabs[i]
    data = sData[i]
    if (!tab || !data) continue

    // Check if tab was auto-reopened
    if (tab.reopening && tab.reopening.id !== NOID) {
      const newTab = Tabs.byId[tab.reopening.id]
      if (newTab) tab = newTab
    }

    if (Sidebar.panelsById[data.panelId]) tab.panelId = data.panelId
    const actualParentId = idsMap[data.parentId]
    if (actualParentId !== undefined) tab.parentId = actualParentId
    tab.reactive.folded = tab.folded = !!data.folded
    tab.reactive.unread = tab.unread = false
    if (data.customTitle) {
      tab.customTitle = data.customTitle
      Tabs.renderTitle(tab)
    }
    if (data.customColor) tab.reactive.customColor = tab.customColor = data.customColor

    idsMap[data.id] = tab.id
  }

  // Sort tabs by panels
  let nonPinnedIndex = Tabs.list.findIndex(t => !t.pinned)
  if (nonPinnedIndex === -1) nonPinnedIndex = 0

  const sortedTabs: Tab[] = Tabs.list.slice(0, nonPinnedIndex)

  for (const panel of Sidebar.panels) {
    if (!Utils.isTabsPanel(panel)) continue
    for (let tab, i = nonPinnedIndex; i < Tabs.list.length; i++) {
      tab = Tabs.list[i]
      if (tab?.panelId === panel.id) sortedTabs.push(tab)
    }
  }
  for (let tab, i = 0; i < sortedTabs.length; i++) {
    tab = sortedTabs[i]
    if (tab) tab.index = i
  }

  // Recalc local state
  Tabs.list = sortedTabs
  Sidebar.recalcTabsPanels()
  if (Settings.state.tabsTree) Tabs.updateTabsTree()
  Sidebar.recalcVisibleTabs()

  // Move native tabs
  const ids = sortedTabs.map(t => {
    t.moving = true
    return t.id
  })
  await Utils.GLOBAL_QUEUE.add(browser.tabs.move, ids, { index: nonPinnedIndex }).catch(e => {
    Logs.err('Tabs.tryToRestoreTabsStateFromSessionData: Move:', e)
  })
  sortedTabs.forEach(t => (t.moving = false))

  Tabs.cacheTabsData(640)
  tabs.forEach(t => Tabs.saveTabData(t.id))
}

function onTabCreated(nativeTab: NativeTab, attached?: boolean): void {
  if (nativeTab.windowId !== Windows.id) return
  if (!Tabs.ready || Tabs.sorting) {
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
  const initialOpenerId = nativeTab.openerTabId
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

      // Restore some props
      tab.customColor = oldTab.customColor
      tab.reactive.customColor = oldTab.customColor ?? null
      tab.customTitle = oldTab.customTitle
      Tabs.renderTitle(tab)
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

    // It's probably a session restore
    if (
      !attached &&
      ((tab.discarded && tab.url !== 'about:blank') || (tab.active && Tabs.activeId === tab.id))
    ) {
      checkIfSessionRestoring(tab)
      index = tab.index
    }

    // Not a session restore, getting tab position...
    else {
      const parent = Tabs.byId[tab.openerTabId ?? NOID]
      if (!attached && parent?.folded && Settings.state.ignoreFoldedParent) {
        tab.openerTabId = parent.parentId
      }

      index = Tabs.getIndexForNewTab(panel, tab)
      if (!autoGroupTab) {
        if (!Settings.state.groupOnOpen) tab.openerTabId = undefined
        else tab.openerTabId = Tabs.getParentForNewTab(panel, tab.openerTabId)
      }
    }
  }

  // If new tab has wrong possition - move it
  if (panel && !tab.pinned && tab.index !== index) {
    tab.dstPanelId = panel.id
    Tabs.movingTabs.push(tab.id)
    tab.moving = true
    Utils.GLOBAL_QUEUE.add(browser.tabs.move, tab.id, { index })
      .catch(err => {
        Logs.err('Tabs.onTabCreated: Cannot move the tab to the correct position:', err)
      })
      .finally(() => {
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
  tab.parentId = Settings.state.tabsTree ? (tab.openerTabId ?? NOID) : NOID
  if (!tab.favIconUrl && !tab.internal && !tab.url.startsWith('a')) {
    tab.favIconUrl = Favicons.getFavicon(tab.url)
    Tabs.renderFavicon(tab)
  }
  if (!attached && !Settings.state.autoExpandTabsOnNew && Tabs.byId[tab.parentId]?.folded) {
    tab.invisible = true
  }

  // Check if tab should be reopened in different container
  if (
    !attached &&
    !reopenedTabInfo &&
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
  if (!tab.invisible) Sidebar.addToVisibleTabs(panel.id, tab)
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
          tab.openerTabId = undefined
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
          Tabs.saveTabData(t.id, false, 250)
        } else if (t.lvl > tab.lvl) {
          continue
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

  Tabs.saveTabData(tab.id, false, 250)
  Tabs.cacheTabsData()

  // Update openerTabId
  if (initialOpenerId !== tab.openerTabId) {
    let newOpenerTabId
    if (tab.openerTabId === undefined || tab.openerTabId === -1) newOpenerTabId = tab.id
    else newOpenerTabId = tab.openerTabId

    browser.tabs.update(tab.id, { openerTabId: newOpenerTabId }).catch(err => {
      Logs.err('Tabs.onTabCreated: Cannot update openerTabId', err)
    })
  }

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
    tab.panelId === Sidebar.activePanelId &&
    Settings.state.autoScrollToNewTab
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
  if (!Tabs.ready || waitForOtherReopenedTabsBuffer || Tabs.sorting) {
    Tabs.deferredEventHandling.push(() => onTabUpdated(tabId, change, nativeTab))
    return
  }
  if (Tabs.detachingTabIds.has(tabId)) return

  const tab = Tabs.byId[tabId]
  if (!tab) {
    return Logs.warn(`Tabs.onTabUpdated: Cannot find local tab: ${tabId}`, Object.keys(change))
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
      if (tab.updated) {
        tab.reactive.updated = tab.updated = false
        const panel = Sidebar.panelsById[tab.panelId]
        if (Utils.isTabsPanel(panel) && panel.updatedTabs.length) {
          Utils.rmFromArray(panel.updatedTabs, tab.id)
          panel.reactive.updated = panel.updatedTabs.length > 0
        }
      }
      const groupTab = Tabs.getGroupTab(tab)
      if (groupTab && !groupTab.discarded) Tabs.updateGroupChild(groupTab.id, nativeTab.id)

      if (!tab.favIconUrl && change.favIconUrl === undefined) {
        change.favIconUrl = Favicons.getFavicon(tab.url)
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
      if (tab.internal) Tabs.renderFavicon(tab)
    }
    if (change.url && tab.mediaPaused) {
      Tabs.checkPausedMedia(tabId).then(stillPaused => {
        if (stillPaused === null || stillPaused) return
        tab.mediaPaused = false
        tab.reactive.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      })
    }
  }

  // Url
  let branchColorizationNeeded = false
  if (change.url !== undefined && change.url !== tab.url) {
    const isInternal = change.url.startsWith(ADDON_HOST)
    const isGroup = isInternal && Utils.isGroupUrl(change.url)
    if (tab.isGroup !== isGroup) {
      tab.reactive.isGroup = tab.isGroup = isGroup
    }
    tab.internal = isInternal
    Tabs.cacheTabsData()

    // Reset favicon
    if (!change.url.startsWith(tab.url.slice(0, 16)) || tab.internal) {
      change.favIconUrl = ''
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
      Tabs.checkPausedMedia(tabId).then(stillPaused => {
        if (stillPaused === null || stillPaused) return
        tab.mediaPaused = false
        tab.reactive.mediaPaused = false
        Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
      })
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

    // Update filtered results
    if (Search.rawValue && Sidebar.activePanelId === tab.panelId && !Sidebar.subPanelActive) {
      Search.searchDebounced(500, undefined, true)
    }
  }

  // Handle Firefox internal favicon
  if (change.favIconUrl?.startsWith('chrome:')) {
    if (change.favIconUrl === 'chrome://global/skin/icons/warning.svg') {
      tab.warn = true
      tab.reactive.warn = true
    }
    change.favIconUrl = ''
  }

  // Handle title change
  if (change.title !== undefined) {
    if (change.title.startsWith(EXT_HOST)) change.title = tab.title

    // Mark tab with updated title
    if (
      !tab.updated && // Tab is not updated
      !nativeTab.active && // Tab is inactive
      !tab.internal && //  Tab is not internal
      !tab.discarded && // Tab is loaded
      // Check settings
      (Settings.tabsUpdateMarkAll ||
        (Settings.tabsUpdateMarkPin && tab.pinned) ||
        (Settings.tabsUpdateMarkNorm && !tab.pinned)) &&
      // Tab is inactive for more than 5s
      Date.now() - nativeTab.lastAccessed > 5000 &&
      // Current url is the same as previous
      tab.url === nativeTab.url
    ) {
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
          panel.reactive.updated = true
        }
      }
    }

    // Reset custom title
    if (tab.isGroup && tab.active && change.title !== GROUP_INITIAL_TITLE) {
      if (tab.customTitle) {
        tab.customTitle = undefined
        Tabs.renderTitle(tab)
      }
    }

    // Update filtered results
    if (Search.rawValue && Sidebar.activePanelId === tab.panelId && !Sidebar.subPanelActive) {
      Search.searchDebounced(500, undefined, true)
    }
  }

  // Reset mediaPaused flag
  if (change.audible !== undefined && change.audible && tab.mediaPaused) {
    tab.mediaPaused = false
    tab.reactive.mediaPaused = false
  }

  // Update tab object
  Object.assign(tab, change)

  // Handle media state change
  if (change.audible !== undefined || change.mutedInfo?.muted !== undefined) {
    Sidebar.updateMediaStateOfPanelDebounced(100, tab.panelId, tab)
  }

  // Handle unpinned tab
  if (change.pinned !== undefined && !change.pinned) {
    Tabs.cacheTabsData(640)

    let panel
    if (Settings.state.pinnedTabsPosition === 'panel') {
      panel = Sidebar.panelsById[tab.panelId]
    } else {
      panel = Sidebar.panelsById[Sidebar.activePanelId]
      if (!Utils.isTabsPanel(panel)) panel = Sidebar.panelsById[Sidebar.lastTabsPanelId]
    }
    if (!Utils.isTabsPanel(panel)) panel = Sidebar.panels.find(Utils.isTabsPanel)

    if (Utils.isTabsPanel(panel)) {
      // Tab unpinning wasn't handled, do it here
      if (!tab.unpinning) {
        const startIndex = panel.startTabIndex
        tab.dstPanelId = tab.panelId = panel.id
        Tabs.list.splice(tab.index, 1)
        Tabs.list.splice(startIndex - 1, 0, tab)
        Tabs.updateTabsIndexes()
        Sidebar.recalcTabsPanels()
        Sidebar.recalcVisibleTabs(tab.panelId)

        const relGroupTab = Tabs.byId[tab.relGroupId]
        if (relGroupTab) {
          Tabs.replaceRelGroupWithPinnedTab(relGroupTab, tab)
        } else {
          tab.moving = true
          browser.tabs
            .move(tabId, { index: startIndex - 1 })
            .catch(err => {
              Logs.err('Tabs.onTabUpdated: Cannot move unpinned tab:', err)
            })
            .finally(() => {
              tab.moving = undefined
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
    Tabs.cacheTabsData(640)

    const prevPanelId = tab.prevPanelId
    const panelId = tab.panelId

    const prevPanel = Sidebar.panelsById[prevPanelId]
    const panel = Sidebar.panelsById[panelId]

    // The tab was moved to another panel during the pinning
    // process so I need to restore the previous one.
    if (prevPanel && tab.moveTime && tab.moveTime + 1000 > Date.now()) {
      tab.panelId = prevPanelId
      Tabs.saveTabData(tab.id)

      // Switch back to the actual panel
      if (
        tab.active &&
        panelId === Sidebar.activePanelId &&
        prevPanelId !== Sidebar.activePanelId
      ) {
        Sidebar.activatePanel(tab.panelId)
      }
    }

    Sidebar.recalcTabsPanels()
    Tabs.updateTabsTree()
    if (panel) Sidebar.recalcVisibleTabs(panelId)
    if (prevPanel && panelId !== prevPanelId) Sidebar.recalcVisibleTabs(prevPanelId)

    const actualPanel = Sidebar.panelsById[tab.panelId]

    if (Utils.isTabsPanel(actualPanel) && !actualPanel.reactive.len) {
      if (actualPanel.noEmpty) {
        Tabs.createTabInPanel(actualPanel)
      }
    }
  }

  // Colorize branch
  if (branchColorizationNeeded) Tabs.colorizeBranch(tab.id)

  accumulateChangesForBatchUpdate(tab, change)
}

let changeLock = false
const changesBuf = new Map<Tab, browser.tabs.ChangeInfo>()
function accumulateChangesForBatchUpdate(tab: Tab, change: browser.tabs.ChangeInfo) {
  if (changeLock) {
    let bufferedChange = changesBuf.get(tab)
    if (bufferedChange) Object.assign(bufferedChange, change)
    else bufferedChange = change
    changesBuf.set(tab, bufferedChange)
    return
  }

  updTabReactiveProps(change, tab)

  changeLock = true
  setTimeout(() => {
    changeLock = false
    updTabsReactiveProps()
  }, Settings.state.tabUpdDelay)
}

function updTabsReactiveProps() {
  if (!changesBuf.size) return
  changesBuf.forEach(updTabReactiveProps)
  changesBuf.clear()
}

function updTabReactiveProps(change: browser.tabs.ChangeInfo, tab: Tab) {
  if (change.audible !== undefined) tab.reactive.mediaAudible = change.audible
  if (change.discarded !== undefined) tab.reactive.discarded = change.discarded
  if (change.favIconUrl !== undefined) {
    if (tab.internal) tab.favIconUrl = undefined
    Tabs.renderFavicon(tab)
  }
  if (change.mutedInfo?.muted !== undefined) tab.reactive.mediaMuted = change.mutedInfo.muted
  if (change.pinned !== undefined) tab.reactive.pinned = change.pinned
  if (change.status !== undefined) tab.reactive.status = Tabs.getStatus(tab)
  if (change.title !== undefined) Tabs.renderTitle(tab)
  if (change.url !== undefined) tab.reactive.url = change.url
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
  if (!Tabs.ready || waitForOtherReopenedTabsBuffer || Tabs.sorting) {
    Tabs.deferredEventHandling.push(() => onTabRemoved(tabId, info, detached))
    return
  }
  if (info.isWindowClosing) return
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  // Logs.info('Tabs.onTabRemoved', tabId)

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

  const autoGroup =
    !tab.isGroup &&
    !tab.folded &&
    hasChildren &&
    Settings.state.autoGroupOnClose &&
    !Settings.state.autoGroupOnCloseMouseOnly &&
    (tab.lvl === 0 || !Settings.state.autoGroupOnClose0Lvl)

  // Handle child tabs
  let fullVisTabsRecalcNeeded = false
  handling_descendants: if (hasChildren) {
    const toRemove = []
    const outdentOnlyFirstChild = !autoGroup && Settings.state.treeRmOutdent === 'first_child'
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
          if (t.parentId === tab.id) {
            t.parentId = newTab.id
            Tabs.saveTabData(t.id)
          }
        })
        break handling_descendants
      }
    }

    for (let i = tab.index + 1, t; i < Tabs.list.length; i++) {
      t = Tabs.list[i]
      if (t.lvl <= tab.lvl) break

      // Tab will be detached, so skip handling it
      if (detached && Tabs.detachingTabIds.has(t.id)) continue

      if (t.parentId === tab.id && !detached) {
        rememberChildTabs(t.id, tab.id)
        if (removedTabInfo?.children) removedTabInfo.children.push(t.id)
        else if (removedTabInfo) removedTabInfo.children = [t.id]
      }

      const willBeRemoved = t.removing
      if (!willBeRemoved) {
        const shouldBeRemoved =
          (Settings.state.rmChildTabs === 'folded' && tab.folded && !detached && !tab.reopening) ||
          (Settings.state.rmChildTabs === 'all' && !detached && !tab.reopening)
        // Remove folded tabs
        if (shouldBeRemoved) {
          toRemove.push(t.id)
          continue
        }
        // Or just make them visible, but only if this child tab is a direct
        // descendant OR its branch is not folded
        else if (t.invisible && (t.parentId === tabId || !Tabs.findAncestor(t, p => p.folded))) {
          t.invisible = false
          fullVisTabsRecalcNeeded = true
          if (t.hidden) toShow.push(t.id)
        }
      }

      // Auto grouping
      if (autoGroup && t.parentId === tabId) {
        Tabs.groupOnClosing(tab.id, tab.title, tab.active, t.id)
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

      // Save updated child tabs
      if (!willBeRemoved) Tabs.saveTabData(t.id)
    }

    // Remove child tabs
    if (Settings.state.rmChildTabs !== 'none' && toRemove.length) {
      Tabs.removeTabs(toRemove, false, tab)
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

  if (fullVisTabsRecalcNeeded && !Tabs.removingTabs.length) Sidebar.recalcVisibleTabs(panel.id)
  else Sidebar.removeFromVisibleTabs(panel.id, tabId)

  // No-empty
  if (!tab.pinned && panel.noEmpty && !panel.reactive.len) {
    Tabs.createTabInPanel(panel, { active: false })
  }

  // Remove updated flag
  if (panel.updatedTabs.length) {
    Utils.rmFromArray(panel.updatedTabs, tabId)
    panel.reactive.updated = panel.updatedTabs.length > 0
  }

  // Update media badges
  if (tab.audible || tab.mediaPaused || tab.mutedInfo?.muted) {
    Sidebar.updateMediaStateOfPanelDebounced(120, tab.panelId)
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
      Sidebar.activePanelId === panel.id &&
      !Sidebar.switchingLock
    ) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned) Sidebar.activatePanel(activeTab.panelId)
      else if (tabSuccessor) Sidebar.activatePanel(tabSuccessor.panelId)
      else Sidebar.switchToNeighbourPanel()
    }

    // Update filtered results
    if (Search.rawValue) Search.search()
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

  // Update group page info
  const groupTab = Tabs.getGroupTab(tab)
  if (groupTab && !groupTab.discarded) {
    IPC.groupPage(groupTab.id, { removedTab: tab.id })
  }

  if (Preview.state.status === Preview.Status.Open && Preview.state.targetTabId === tabId) {
    Preview.resetTargetTab(tabId)
  }
}

/**
 * Tabs.onMoved
 */
function onTabMoved(id: ID, info: browser.tabs.MoveInfo): void {
  if (info.windowId !== Windows.id) return
  if (!Tabs.ready) {
    Tabs.deferredEventHandling.push(() => onTabMoved(id, info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()
  if (Tabs.detachingTabIds.has(id)) return

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

  // Logs.info('Tabs.onTabMove', id, info.fromIndex, info.toIndex)

  // Check if tab moved by Sidebery so no additional handling is needed
  if (tab.moving !== undefined) {
    tab.dstPanelId = NOID
    Tabs.saveTabData(id)
    Tabs.cacheTabsData(640)
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

    if (Utils.isTabsPanel(srcPanel) && Utils.isTabsPanel(dstPanel) && srcPanel.id !== dstPanel.id) {
      movedTab.panelId = dstPanel.id
      Sidebar.updateMediaStateOfPanelDebounced(100, movedTab.panelId, movedTab)
    }
  }

  Sidebar.recalcTabsPanels()

  let nativeTabsVisibilityUpdateNeeded = false

  // Calc tree levels and colorize branch
  if (Settings.state.tabsTree) {
    const toTabFolded = toTab.folded
    if (!mvLen) Tabs.updateTabsTree()

    if (toTabFolded !== toTab.folded && Settings.state.hideFoldedTabs) {
      nativeTabsVisibilityUpdateNeeded = true
    }

    if (Settings.state.colorizeTabsBranches && tab.lvl > 0) {
      Tabs.setBranchColor(tab.id)
    }

    // Update custom color
    if (Settings.state.inheritCustomColor && tab.lvl > 0) {
      const parentTab = Tabs.byId[tab.parentId]
      if (parentTab && parentTab.customColor && parentTab.customColor !== tab.customColor) {
        tab.reactive.customColor = tab.customColor = parentTab.customColor
      }
    }
  }

  if (srcPanel) Sidebar.recalcVisibleTabs(srcPanel.id)
  if (dstPanel && dstPanel !== srcPanel) Sidebar.recalcVisibleTabs(dstPanel.id)

  if (movedTab.panelId !== Sidebar.activePanelId && movedTab.active) {
    Sidebar.activatePanel(movedTab.panelId)
    if (Settings.state.hideInact) nativeTabsVisibilityUpdateNeeded = true
  }

  if (!mvLen) Tabs.cacheTabsData()
  Tabs.saveTabData(movedTab.id)

  // Update succession
  if (!mvLen) Tabs.updateSuccessionDebounced(0)

  if (nativeTabsVisibilityUpdateNeeded) Tabs.updateNativeTabsVisibility()
}

/**
 * Tabs.onDetached
 */
function onTabDetached(id: ID, info: browser.tabs.DetachInfo): void {
  if (info.oldWindowId !== Windows.id) return
  if (!Tabs.ready || Tabs.sorting) {
    Tabs.deferredEventHandling.push(() => onTabDetached(id, info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  // Ignore this event if the tab is in `Tabs.detachingTabIds`
  // because it's already handled by Sidebery
  if (Tabs.detachingTabIds.has(id)) {
    Tabs.detachingTabIds.delete(id)
    return
  }

  const tab = Tabs.byId[id]
  if (tab) {
    tab.folded = false
    tab.reactive.folded = false
  }

  onTabRemoved(id, { windowId: Windows.id, isWindowClosing: false }, true)
}

/**
 * Tabs.onAttached
 */
const deferredActivationHandling = { id: NOID, cb: null as (() => void) | null }
async function onTabAttached(id: ID, info: browser.tabs.AttachInfo): Promise<void> {
  if (info.newWindowId !== Windows.id) return
  if (!Tabs.ready || Tabs.sorting) {
    Tabs.deferredEventHandling.push(() => onTabAttached(id, info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  // Ignore this event if the tab is in `Tabs.attachingTabs`
  // because it's already handled by Sidebery
  const ai = Tabs.attachingTabs.findIndex(t => t.id === id)
  if (ai > -1) {
    Tabs.attachingTabs.splice(ai, 1)
    return
  }

  deferredActivationHandling.id = id
  const nativeTab = await browser.tabs.get(id)
  const tab = Tabs.mutateNativeTabToSideberyTab(nativeTab)

  tab.windowId = Windows.id
  tab.index = info.newPosition
  tab.panelId = NOID
  tab.reactive.sel = tab.sel = false

  Tabs.reactivateTab(tab)

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
  if (!Tabs.ready || waitForOtherReopenedTabsBuffer) {
    if (bufTabActivatedEventIndex !== -1) {
      Tabs.deferredEventHandling.splice(bufTabActivatedEventIndex, 1)
    }
    bufTabActivatedEventIndex = Tabs.deferredEventHandling.push(() => onTabActivated(info)) - 1
    return
  }
  bufTabActivatedEventIndex = -1
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsReinitializing) return Tabs.reinitTabs()

  // Logs.info('Tabs.onTabActivated', info.tabId)

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

    Tabs.activeId = info.tabId
    return
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

  // Update succession
  Tabs.updateSuccessionDebounced(0)

  if (panel.updatedTabs.length) {
    Utils.rmFromArray(panel.updatedTabs, tab.id)
    panel.reactive.updated = panel.updatedTabs.length > 0
  }

  // Switch to activated tab's panel
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
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

  if (Settings.state.scrollPanelAfterSwitchingTab !== 'no' && !tab.pinned) {
    if (Settings.state.scrollPanelAfterSwitchingTab === 'mouseleave' && Mouse.mouseIn) {
      Sidebar.scrollOnMouseLeave = true
    } else Tabs.scrollToTabDebounced(3, tab.id, true)
  }

  // Reset fallback preview mode
  if (Settings.state.previewTabs && Preview.state.modeFallback) {
    Preview.resetMode()
  }
}
