import { Tab } from 'src/types'
import { Logs } from 'src/services/logs'
import { Tabs } from 'src/services/tabs.fg'
import { Bookmarks } from 'src/services/bookmarks'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'

export async function loadInShadowMode(): Promise<void> {
  Logs.info('Tabs.loadInShadowMode')
  setupShadowListeners()
  Tabs.shadowMode = true
  const tabs = (await browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT })) as Tab[]

  Tabs.list = tabs
  for (const tab of tabs) {
    Tabs.byId[tab.id] = tab
    Tabs.updateUrlCounter(tab.url, 1)
  }

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.deferredEventHandling = []

  Logs.info('Tabs: Loaded in shadow mode')
}

export function unloadShadowed(): void {
  Tabs.resetShadowListeners()

  Tabs.byId = {}
  Tabs.urlsInUse = {}
  Tabs.list = []
  Tabs.shadowMode = false
}

export function setupShadowListeners(): void {
  browser.tabs.onCreated.addListener(onShadowTabCreated)
  browser.tabs.onRemoved.addListener(onShadowTabRemoved)
  browser.tabs.onUpdated.addListener(onShadowTabUpdated, {
    properties: ['pinned', 'title', 'status', 'favIconUrl', 'url'],
  })
  browser.tabs.onActivated.addListener(onShadowTabActivated)
  browser.tabs.onMoved.addListener(onShadowTabMoved)
  browser.tabs.onAttached.addListener(onShadowTabAttached)
  browser.tabs.onDetached.addListener(onShadowTabDetached)
}

export function resetShadowListeners(): void {
  browser.tabs.onCreated.removeListener(onShadowTabCreated as (tab: browser.tabs.Tab) => void)
  browser.tabs.onUpdated.removeListener(onShadowTabUpdated)
  browser.tabs.onRemoved.removeListener(onShadowTabRemoved)
  browser.tabs.onMoved.removeListener(onShadowTabMoved)
  browser.tabs.onDetached.removeListener(onShadowTabDetached)
  browser.tabs.onAttached.removeListener(onShadowTabAttached)
  browser.tabs.onActivated.removeListener(onShadowTabActivated)
}

function onShadowTabCreated(tab: browser.tabs.Tab): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabCreated(tab))
    return
  }
  Tabs.byId[tab.id] = tab as Tab
  Tabs.list.splice(tab.index, 0, tab as Tab)
  const len = Tabs.list.length
  for (let i = tab.index; i < len; i++) {
    Tabs.list[i].index = i
  }

  Tabs.updateUrlCounter(tab.url, 1)

  if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenBookmarksDebounced(tab.url)
}

function onShadowTabUpdated(
  tabId: ID,
  change: browser.tabs.ChangeInfo,
  tab: browser.tabs.Tab
): void {
  if (tab.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabUpdated(tabId, change, tab))
    return
  }
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  if (change.url) {
    const oldUrlCount = Tabs.updateUrlCounter(targetTab.url, -1)
    Tabs.updateUrlCounter(change.url, 1)

    // Mark/Unmark open bookmarks
    if (Settings.reactive.highlightOpenBookmarks) {
      if (!oldUrlCount) Bookmarks.unmarkOpenBookmarksDebounced(targetTab.url)
      Bookmarks.markOpenBookmarksDebounced(change.url)
    }
  }

  Object.assign(targetTab, change)
}

function onShadowTabRemoved(tabId: ID, info: browser.tabs.RemoveInfo): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabRemoved(tabId, info))
    return
  }
  const targetTab = Tabs.byId[tabId]
  if (!targetTab) return

  let index = targetTab.index
  if (targetTab !== Tabs.list[index]) index = Tabs.list.findIndex(t => t.id === tabId)
  if (index !== -1) {
    Tabs.list.splice(index, 1)
    const len = Tabs.list.length
    for (let i = index; i < len; i++) {
      Tabs.list[i].index = i
    }
  }

  delete Tabs.byId[tabId]

  const urlCount = Tabs.updateUrlCounter(targetTab.url, -1)

  if (Settings.reactive.highlightOpenBookmarks && !urlCount) {
    Bookmarks.unmarkOpenBookmarksDebounced(targetTab.url)
  }
}

function onShadowTabMoved(id: ID, info: browser.tabs.MoveInfo): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabMoved(id, info))
    return
  }

  const movedTab = Tabs.list.splice(info.fromIndex, 1)[0]
  Tabs.list.splice(info.toIndex, 0, movedTab)

  for (let i = Tabs.list.length; i--; ) {
    Tabs.list[i].index = i
  }
}

function onShadowTabDetached(tabId: ID, info: browser.tabs.DetachInfo): void {
  if (info.oldWindowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabDetached(tabId, info))
    return
  }
  onShadowTabRemoved(tabId, { windowId: info.oldWindowId, isWindowClosing: false })
}

async function onShadowTabAttached(tabId: ID, info: browser.tabs.AttachInfo): Promise<void> {
  if (info.newWindowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabAttached(tabId, info))
    return
  }
  const tab = await browser.tabs.get(tabId)
  tab.windowId = Windows.id
  tab.index = info.newPosition
  onShadowTabCreated(tab)
}

function onShadowTabActivated(info: browser.tabs.ActiveInfo): void {
  if (info.windowId !== Windows.id) return
  if (Tabs.list.length === 0) {
    Tabs.deferredEventHandling.push(() => onShadowTabActivated(info))
    return
  }

  const prevTab = Tabs.byId[info.previousTabId]
  const targetTab = Tabs.byId[info.tabId]
  if (prevTab) prevTab.active = false
  if (targetTab) targetTab.active = true
}
