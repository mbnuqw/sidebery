import * as Logs from 'src/services/logs'
import * as Tabs from 'src/services/tabs.fg'
import * as Windows from 'src/services/windows.fg'
import * as Links from 'src/services/links'

export let shadowList: browser.tabs.Tab[] = []
export let shadowById: Partial<Record<ID, browser.tabs.Tab>> = {}
export let shadowMode = false
export let shadowReady = false

export async function loadInShadowMode(): Promise<void> {
  setupShadowListeners()
  shadowMode = true
  const tabs = await browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT })

  shadowList = tabs
  for (const tab of tabs) {
    shadowById[tab.id] = tab
    Links.addTab(tab)
  }

  shadowReady = true

  // Call deferred event handlers
  if (Tabs.deferredEventHandling.length) {
    Logs.warn('Tabs: Deferred event handlers:', Tabs.deferredEventHandling.length)
  }
  Tabs.deferredEventHandling.forEach(cb => cb())
  Tabs.clearDeferredEventHandling()
}

export function unloadShadowed(): void {
  Tabs.resetShadowListeners()

  shadowById = {}
  shadowList = []
  shadowMode = false
  shadowReady = false

  Links.rmAllTabs()
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
  browser.tabs.onCreated.removeListener(onShadowTabCreated)
  browser.tabs.onUpdated.removeListener(onShadowTabUpdated)
  browser.tabs.onRemoved.removeListener(onShadowTabRemoved)
  browser.tabs.onMoved.removeListener(onShadowTabMoved)
  browser.tabs.onDetached.removeListener(onShadowTabDetached)
  browser.tabs.onAttached.removeListener(onShadowTabAttached)
  browser.tabs.onActivated.removeListener(onShadowTabActivated)
}

function onShadowTabCreated(tab: browser.tabs.Tab): void {
  if (tab.windowId !== Windows.id) return
  if (!Tabs.shadowReady) {
    Tabs.deferredEventHandling.push(() => onShadowTabCreated(tab))
    return
  }
  shadowById[tab.id] = tab
  shadowList.splice(tab.index, 0, tab)
  const len = shadowList.length
  for (let i = tab.index; i < len; i++) {
    shadowList[i].index = i
  }

  Links.addTab(tab)
}

function onShadowTabUpdated(
  tabId: ID,
  change: browser.tabs.ChangeInfo,
  tab: browser.tabs.Tab
): void {
  if (tab.windowId !== Windows.id) return
  if (!Tabs.shadowReady) {
    Tabs.deferredEventHandling.push(() => onShadowTabUpdated(tabId, change, tab))
    return
  }
  const targetTab = shadowById[tabId]
  if (!targetTab) return

  if (change.url !== undefined && targetTab.url !== change.url) {
    Links.updTab(targetTab, change.url)
  }

  Object.assign(targetTab, change)
}

function onShadowTabRemoved(tabId: ID, info: browser.tabs.RemoveInfo): void {
  if (info.windowId !== Windows.id) return
  if (!Tabs.shadowReady) {
    Tabs.deferredEventHandling.push(() => onShadowTabRemoved(tabId, info))
    return
  }
  const targetTab = shadowById[tabId]
  if (!targetTab) return

  let index = targetTab.index
  if (targetTab !== shadowList[index]) index = shadowList.findIndex(t => t.id === tabId)
  if (index !== -1) {
    shadowList.splice(index, 1)
    const len = shadowList.length
    for (let i = index; i < len; i++) {
      shadowList[i].index = i
    }
  }

  delete shadowById[tabId]

  Links.rmTab(targetTab)
}

function onShadowTabMoved(id: ID, info: browser.tabs.MoveInfo): void {
  if (info.windowId !== Windows.id) return
  if (!Tabs.shadowReady) {
    Tabs.deferredEventHandling.push(() => onShadowTabMoved(id, info))
    return
  }

  const movedTab = shadowList.splice(info.fromIndex, 1)[0]
  shadowList.splice(info.toIndex, 0, movedTab)

  for (let i = shadowList.length; i--; ) {
    shadowList[i].index = i
  }
}

function onShadowTabDetached(tabId: ID, info: browser.tabs.DetachInfo): void {
  if (info.oldWindowId !== Windows.id) return
  if (!Tabs.shadowReady) {
    Tabs.deferredEventHandling.push(() => onShadowTabDetached(tabId, info))
    return
  }
  onShadowTabRemoved(tabId, { windowId: info.oldWindowId, isWindowClosing: false })
}

async function onShadowTabAttached(tabId: ID, info: browser.tabs.AttachInfo): Promise<void> {
  if (info.newWindowId !== Windows.id) return
  if (!Tabs.shadowReady) {
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
  if (!Tabs.shadowReady) {
    Tabs.deferredEventHandling.push(() => onShadowTabActivated(info))
    return
  }

  const prevTab = shadowById[info.previousTabId]
  const targetTab = shadowById[info.tabId]
  if (prevTab) prevTab.active = false
  if (targetTab) targetTab.active = true
}
