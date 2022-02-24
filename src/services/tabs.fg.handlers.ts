import Utils from 'src/utils'
import { Tab, TabStatus } from 'src/types'
import { NOID, GROUP_URL, CONTAINER_ID } from 'src/defaults'
import { Logs } from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Favicons } from 'src/services/favicons'
import { DnD } from 'src/services/drag-and-drop'
import { Tabs } from './tabs.fg'

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

function onTabCreated(tab: Tab): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabCreated(tab))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsNormalizing) return Tabs.normalizeTabs()

  if (Sidebar.reactive.hiddenPanelsBar) Sidebar.reactive.hiddenPanelsBar = false

  if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()

  Menu.close()
  Selection.resetSelection()

  let panel, index, prevPos, prevPosPanel, createGroup, autoGroupTab
  let initialOpenerSpec = ''
  const initialOpener = Tabs.byId[tab.openerTabId ?? -1]

  // Check if opener tab is pinned
  if (
    Settings.reactive.pinnedAutoGroup &&
    initialOpener &&
    initialOpener.pinned &&
    Settings.reactive.tabsTree
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

  // Get previous position
  if (Tabs.removedTabs) {
    prevPos = Tabs.removedTabs.pop()
    if (prevPos) prevPosPanel = Sidebar.reactive.panelsById[prevPos.panelId]
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
  else if (prevPos && prevPosPanel && prevPos.index === tab.index && prevPos.title === tab.title) {
    panel = prevPosPanel
    index = tab.index

    for (const rmTab of Tabs.removedTabs) {
      if (rmTab.parentId === prevPos.id) rmTab.parentId = tab.id
    }

    const parentTab = Tabs.byId[prevPos.parentId]
    if (parentTab && parentTab.index < tab.index) tab.openerTabId = prevPos.parentId
  }

  // Find appropriate position using the current settings
  else {
    panel = Tabs.getPanelForNewTab(tab)
    if (!panel) return Logs.err('Cannot handle new tab: Cannot find target panel')
    index = Tabs.getIndexForNewTab(panel, tab)
    if (!autoGroupTab) {
      if (!Settings.reactive.groupOnOpen) tab.openerTabId = undefined
      else tab.openerTabId = Tabs.getParentForNewTab(panel, tab.openerTabId)
    }
  }

  // If new tab has wrong possition - move it
  if (panel && !tab.pinned && tab.index !== index) {
    tab.dstPanelId = panel.id
    browser.tabs.move(tab.id, { index })
  }

  // Update tabs indexses after inserted one.
  for (let i = index; i < Tabs.list.length; i++) {
    Tabs.list[i].index++
  }

  // Set custom props
  if (Settings.reactive.tabsUnreadMark && tab.unread === undefined && !tab.active) tab.unread = true
  if (panel) Tabs.normalizeTab(tab, panel.id)
  tab.index = index
  tab.parentId = tab.openerTabId ?? -1
  if (!tab.favIconUrl) tab.favIconUrl = Favicons.getFavicon(tab.url)

  // Put new tab in state
  Tabs.byId[tab.id] = tab
  Tabs.list.splice(index, 0, tab)
  Tabs.reactive.byId[tab.id] = Tabs.toReactive(tab)
  Sidebar.recalcTabsPanels()

  // Update tree
  if (Settings.reactive.tabsTree && !tab.pinned) {
    const rTab = Tabs.reactive.byId[tab.id]
    if (tab.openerTabId === undefined) {
      // Set tab tree level
      const nextTab = Tabs.list[tab.index + 1]
      if (nextTab && tab.panelId === nextTab.panelId) {
        tab.parentId = nextTab.parentId
        tab.lvl = nextTab.lvl
        if (rTab) rTab.lvl = nextTab.lvl
      }
    } else {
      const parent = Tabs.byId[tab.openerTabId]
      if (parent && parent.panelId === tab.panelId) {
        let insideBranch = false
        for (let t, i = parent.index + 1; i < Tabs.list.length; i++) {
          t = Tabs.list[i]
          insideBranch = t.id === tab.id
          if (insideBranch) break
          if (t.lvl <= parent.lvl) break
        }
        if (insideBranch && Utils.isTabsPanel(panel)) {
          tab.parentId = tab.openerTabId
          const start = panel.startTabIndex
          Tabs.updateTabsTree(start, tab.index + 1)
          if (Settings.reactive.autoFoldTabs && !parent.folded) {
            Tabs.expTabsBranch(tab.parentId)
          }
        } else {
          tab.parentId = -1
          browser.tabs.update(tab.id, { openerTabId: tab.id })
        }
      }
    }

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

    Logs.info(
      `Tab created: n${tab.index} #${tab.id} panelId:${tab.panelId} lvl:${tab.lvl} parentId:${tab.parentId}`
    )
  }

  // Update succession
  if (Settings.reactive.activateAfterClosing !== 'none') {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab && activeTab.active) {
      const target = Tabs.findSuccessorTab(activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (tab.url.startsWith(GROUP_URL)) Tabs.saveGroups()

  if (createGroup && !tab.pinned && initialOpener) {
    Tabs.groupTabs([tab.id], {
      active: false,
      title: initialOpener.title,
      pin: initialOpenerSpec,
      pinnedTab: initialOpener,
    })
  }
}

/**
 * Tabs.onUpdated
 */
function onTabUpdated(tabId: ID, change: browser.tabs.ChangeInfo, tab: browser.tabs.Tab): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabUpdated(tabId, change, tab))
    return
  }

  const localTab = Tabs.byId[tabId]
  const rLocalTab = Tabs.reactive.byId[tabId]
  if (!localTab || !rLocalTab) return Logs.err('Tabs.onTabUpdated: Cannot find local tab')

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
          if (groupTab && !groupTab.discarded) Tabs.updateGroupChild(groupTab.id, tab.id)
        })
        .catch(() => {
          // If I close containered tab opened from bg script
          // I'll get 'updated' event with 'status': 'complete'
          // and since tab is in 'removing' state I'll get this
          // error.
        })
    }
    if (change.url && localTab.mediaPaused) {
      localTab.mediaPaused = false
      rLocalTab.mediaPaused = false
    }
  }

  // Url
  if (change.url !== undefined && change.url !== localTab.url) {
    Tabs.cacheTabsData()
    if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()
    if (!change.url.startsWith(localTab.url.slice(0, 16))) {
      localTab.favIconUrl = ''
      rLocalTab.favIconUrl = ''
    }
    if (change.url.startsWith(GROUP_URL)) Tabs.saveGroups()
    if (
      Sidebar.urlRules?.length &&
      !localTab.pinned &&
      localTab.panelId &&
      change.url !== 'about:blank'
    ) {
      Tabs.checkUrlRules(change.url, localTab)
    }
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

    const inact = Date.now() - tab.lastAccessed
    if (!tab.active && inact > 5000) {
      // If prev url starts with 'http' and current url same as prev
      if (localTab.url.startsWith('http') && localTab.url === tab.url) {
        // and if title doesn't looks like url
        if (!URL_HOST_PATH_RE.test(localTab.title) && !URL_HOST_PATH_RE.test(tab.title)) {
          const panel = Sidebar.reactive.panelsById[localTab.panelId]
          localTab.updated = true
          rLocalTab.updated = true
          if (
            Utils.isTabsPanel(panel) &&
            (!tab.pinned || Settings.reactive.pinnedTabsPosition === 'panel') &&
            panel.updatedTabs &&
            !panel.updatedTabs.includes(tabId)
          ) {
            panel.updatedTabs.push(tabId)
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
  if (change.favIconUrl !== undefined) rLocalTab.favIconUrl = change.favIconUrl
  if (change.hidden !== undefined) rLocalTab.invisible = change.hidden
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
      } else if (Settings.reactive.pinnedTabsPosition !== 'panel') {
        Sidebar.switchToNeighbourPanel()
      }
    }
  }
}

/**
 * Tabs.onRemoved
 */
function onTabRemoved(tabId: ID, info: browser.tabs.RemoveInfo, childfree?: boolean): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabRemoved(tabId, info, childfree))
    return
  }
  if (info.isWindowClosing) return
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsNormalizing) return Tabs.normalizeTabs()

  if (!Tabs.removingTabs) Tabs.removingTabs = []
  else Tabs.removingTabs.splice(Tabs.removingTabs.indexOf(tabId), 1)

  if (!Tabs.removingTabs.length) {
    Menu.close()
    Selection.resetSelection()
  }

  // Try to get removed tab and its panel
  const tab = Tabs.byId[tabId]
  const rTab = Tabs.reactive.byId[tabId]
  if (!tab || !rTab) {
    Logs.warn(`Tabs.onTabRemoved: Cannot find tab: ${tabId}`)
    return Tabs.normalizeTabs()
  }
  let creatingNewTab
  const panel = Sidebar.reactive.panelsById[tab.panelId]

  // Update temp list of removed tabs for restoring reopened tabs state
  if (tab.url !== NEWTAB_URL && tab.url !== 'about:blank') {
    if (!Tabs.removedTabs) Tabs.removedTabs = []
    Tabs.removedTabs.push({
      id: tab.id,
      index: tab.index,
      title: tab.title,
      parentId: tab.parentId,
      panelId: tab.panelId,
    } as Tab)
    if (Tabs.removedTabs.length > 50) {
      Tabs.removedTabs = Tabs.removedTabs.slice(25)
    }
  }

  // Recreate locked tab
  if (!tab.pinned && Utils.isTabsPanel(panel) && panel.lockedTabs && tab.url.startsWith('http')) {
    Tabs.setNewTabPosition(tab.index, tab.parentId, panel.id)
    browser.tabs.create({
      windowId: Windows.id,
      index: tab.index,
      url: tab.url,
      openerTabId: tab.parentId > -1 ? tab.parentId : undefined,
      cookieStoreId: tab.cookieStoreId,
    })
    creatingNewTab = true
  }

  // Handle child tabs
  if (Settings.reactive.tabsTree && tab.isParent && !childfree) {
    const toRemove = []
    const outdentOnlyFirstChild = Settings.reactive.treeRmOutdent === 'first_child'
    let firstChild
    for (let i = tab.index + 1, t; i < Tabs.list.length; i++) {
      t = Tabs.list[i]
      if (t.lvl <= tab.lvl) break

      // Remove folded tabs
      if (
        (Settings.reactive.rmChildTabs === 'folded' && tab.folded) ||
        Settings.reactive.rmChildTabs === 'all'
      ) {
        if (!Tabs.removingTabs.includes(t.id)) toRemove.push(t.id)
      }

      // Down level
      if (t.parentId === tab.id) {
        if (outdentOnlyFirstChild) {
          if (!firstChild) t.parentId = tab.parentId
          else t.parentId = firstChild.id
        } else {
          t.parentId = tab.parentId
        }
      }

      if (!firstChild && t.lvl > tab.lvl) firstChild = t
    }

    // Remove child tabs
    if (Settings.reactive.rmChildTabs !== 'none' && toRemove.length) {
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

  // No-empty
  if (!tab.pinned && Utils.isTabsPanel(panel) && panel.noEmpty && !panel.len && !creatingNewTab) {
    Tabs.createTabInPanel(panel, { active: false })
  }

  // Remove updated flag
  if (Utils.isTabsPanel(panel) && panel.updatedTabs) {
    Utils.rmFromArray(panel.updatedTabs, tabId)
  }

  // On removing the last tab
  if (!Tabs.removingTabs.length) {
    // Update tree
    if (Settings.reactive.tabsTree && Utils.isTabsPanel(panel) && panel.len) {
      Tabs.updateTabsTree()
    }

    // Save new tabs state
    Tabs.saveGroups()
    Tabs.cacheTabsData()

    // Update succession
    if (Settings.reactive.activateAfterClosing !== 'none') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && activeTab.active) {
        const target = Tabs.findSuccessorTab(activeTab)
        if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
      }
    }

    // Switch to another panel if current is hidden
    if (
      Settings.reactive.hideEmptyPanels &&
      Utils.isTabsPanel(panel) &&
      Sidebar.reactive.activePanelId === panel.id &&
      !panel.tabs.length
    ) {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned) Sidebar.activatePanel(activeTab.panelId)
      else Sidebar.switchToNeighbourPanel()
    }
  }

  // Update bookmarks marks
  if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()

  // Reload related group for pinned tab
  const pinGroupTab = Tabs.byId[tab.relGroupId]
  if (tab.pinned && pinGroupTab) {
    const groupUrl = new URL(pinGroupTab.url)
    groupUrl.searchParams.delete('pin')
    browser.tabs.update(tab.relGroupId, { url: groupUrl.href })
  }

  const groupTab = Tabs.getGroupTab(tab)
  if (groupTab && !groupTab.discarded) {
    browser.tabs.sendMessage(groupTab.id, { name: 'remove', id: tab.id }).catch(() => {
      /** itsokay **/
    })
  }

  Logs.info(`Tab removed: n${tab.index} #${tab.id} p-${tab.panelId}`)
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
  if (Tabs.tabsNormalizing) return Tabs.normalizeTabs()

  const tab = Tabs.byId[id]
  if (!tab) {
    const msg = `Tab cannot be moved: #${id} ${info.fromIndex} > ${info.toIndex} (not found)`
    Logs.err(msg)
    return Tabs.normalizeTabs()
  }

  Tabs.movingTabs.splice(Tabs.movingTabs.indexOf(id), 1)
  const mvLen = Tabs.movingTabs.length

  if (!mvLen) {
    Menu.close()
    Selection.resetSelection()
  }

  Logs.info(`Tab moving: #${id} ${info.fromIndex} > ${info.toIndex}`)

  // Check if target tab already placed
  let toIndex = info.toIndex
  if (info.toIndex > info.fromIndex) toIndex = toIndex - mvLen
  const tabAtTargetPlace = Tabs.list[toIndex]
  if (tabAtTargetPlace && tabAtTargetPlace.id === id) {
    Tabs.saveTabData(id)
    if (!Tabs.movingTabs.length) Tabs.cacheTabsData()
    tab.dstPanelId = -1
    Sidebar.recalcTabsPanels()
    if (Settings.reactive.activateAfterClosing !== 'none' && tab.active) {
      const target = Tabs.findSuccessorTab(tab)
      if (target) browser.tabs.moveInSuccession([tab.id], target.id)
    }
    Logs.info(`Tab moved: #${id} ${info.fromIndex} > ${info.toIndex} (predefined)`)
    return
  }

  if (tab.unpinning) return

  // Move tab in tabs array
  const toTab = Tabs.list[info.toIndex]
  const movedTab = Tabs.list[info.fromIndex]
  if (movedTab && movedTab.id === id) {
    Tabs.list.splice(info.fromIndex, 1)
  } else {
    Logs.err(`Tab cannot be moved: #${id} ${info.fromIndex} > ${info.toIndex} (not found)`)
    return Tabs.normalizeTabs()
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

  // Calc tree levels
  if (Settings.reactive.tabsTree && !Tabs.movingTabs.length) Tabs.updateTabsTree()

  if (movedTab.panelId !== Sidebar.reactive.activePanelId && movedTab.active) {
    Sidebar.activatePanel(movedTab.panelId)
  }

  if (!Tabs.movingTabs.length) Tabs.cacheTabsData()
  Tabs.saveTabData(movedTab.id)

  // Update succession
  if (!Tabs.movingTabs.length && Settings.reactive.activateAfterClosing !== 'none') {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab && activeTab.active) {
      const target = Tabs.findSuccessorTab(activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  Logs.info(
    `Tab moved: #${id} ${info.fromIndex} > ${info.toIndex} panelId:${movedTab.panelId} lvl:${movedTab.lvl} parentId:${movedTab.parentId}`
  )
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
  if (Tabs.tabsNormalizing) return Tabs.normalizeTabs()
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
  if (Tabs.tabsNormalizing) return Tabs.normalizeTabs()

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

/**
 * Tabs.onActivated
 */
function onTabActivated(info: browser.tabs.ActiveInfo): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onTabActivated(info))
    return
  }
  if (Tabs.ignoreTabsEvents) return
  if (Tabs.tabsNormalizing) return Tabs.normalizeTabs()

  // Reset selection
  if (!DnD.reactive.isStarted) Selection.resetSelection()

  // Get new active tab
  const tab = Tabs.byId[info.tabId]
  const rTab = Tabs.reactive.byId[info.tabId]
  if (!tab || !rTab) {
    Logs.err('Tabs.onTabActivated: Cannot get target tab')
    return Tabs.normalizeTabs()
  }

  // Update previous active tab and store his id
  const prevActive = Tabs.byId[info.previousTabId]
  const rPrevActive = Tabs.reactive.byId[info.previousTabId]
  if (prevActive && rPrevActive) {
    prevActive.active = false
    rPrevActive.active = false
    Tabs.writeActiveTabsHistory(prevActive, tab)
  }

  tab.active = true
  rTab.active = true
  tab.updated = false
  rTab.updated = false
  if (Settings.reactive.tabsUnreadMark) {
    tab.unread = false
    rTab.unread = false
  }
  tab.lastAccessed = Date.now()
  Tabs.activeId = info.tabId

  const panel = Sidebar.reactive.panelsById[tab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (panel.updatedTabs) Utils.rmFromArray(panel.updatedTabs, tab.id)

  // Switch to activated tab's panel
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (
    (!tab.pinned || Settings.reactive.pinnedTabsPosition === 'panel') &&
    !activePanel?.lockedPanel
  ) {
    Sidebar.activatePanel(panel.id)
  }

  // Propagate access time to parent tabs for autoFolding feature
  if (
    Settings.reactive.tabsTree &&
    tab.parentId > -1 &&
    Settings.reactive.autoFoldTabs &&
    Settings.reactive.autoFoldTabsExcept > 0
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
  if (Settings.reactive.autoExpandTabs && tab.isParent && tab.folded && !DnD.reactive.isStarted) {
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
  if (Settings.reactive.activateAfterClosing !== 'none') {
    const target = Tabs.findSuccessorTab(tab)
    if (target && tab.successorTabId !== target.id) {
      browser.tabs.moveInSuccession([tab.id], target.id)
    }
  }

  if (Settings.reactive.tabsTree && Utils.isGroupUrl(tab.url)) {
    Tabs.updateGroupTab(tab)
  } else {
    Tabs.resetUpdateGroupTabTimeout()
  }
}
