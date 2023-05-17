import * as Utils from 'src/utils'
import { DstPlaceInfo, HistoryItem, ItemInfo, Panel, SubPanelType } from 'src/types'
import { History } from 'src/services/history'
import { Favicons } from 'src/services/favicons'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from './tabs.fg'
import { Windows } from './windows'
import { Permissions } from './permissions'
import { Containers } from './containers'
import { PRE_SCROLL } from 'src/defaults'
import * as Logs from 'src/services/logs'

const UNLIMITED = 1234567
const INITIAL_COUNT = 100
const LOAD_RANGE = 432_000_000 // 1000*60*60*24*5 - 5 days

let lastItemTime = 0

export async function load(): Promise<void> {
  if (!browser.history) return
  History.ready = false
  History.reactive.ready = false

  const endTime = Date.now()
  const startTime = endTime - LOAD_RANGE
  const result = await browser.history.search({
    text: '',
    endTime,
    startTime,
    maxResults: INITIAL_COUNT,
  })

  const lastItemVisitTime = result[result.length - 1]?.lastVisitTime
  History.reactive.list = await normalizeHistory(result, true, lastItemVisitTime)
  lastItemTime = getLastItemTime() - 1

  if (!History.reactive.list.length) await loadMore()

  History.setupListeners()

  const historyPanel = Sidebar.panelsById.history
  if (historyPanel) historyPanel.reactive.ready = historyPanel.ready = true
  History.ready = true
  History.reactive.ready = true
}

export function unload(): void {
  History.ready = false
  History.reactive.ready = false
  History.reactive.list = []

  const historyPanel = Sidebar.panelsById.history
  if (historyPanel) historyPanel.reactive.ready = historyPanel.ready = false
  History.resetListeners()
  cachedVisits = {}
}

let unloadAfterTimeout: number | undefined
export function unloadAfter(delay: number): void {
  clearTimeout(unloadAfterTimeout)
  unloadAfterTimeout = setTimeout(() => {
    const historyPanel = Sidebar.panelsById.history
    if (historyPanel && Sidebar.reactive.activePanelId === historyPanel.id) return
    if (historyPanel && !historyPanel.ready) return
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.History) return

    History.unload()
  }, delay)
}

let cachedVisits: Record<string, browser.history.VisitItem[]> = {}
export async function normalizeHistory(
  items: browser.history.HistoryItem[],
  allVisits: boolean,
  after?: number,
  before?: number
): Promise<HistoryItem[]> {
  const normalized: HistoryItem[] = []

  for (const item of items) {
    // Skip untitled visits
    if (!item.title) continue

    normalizeHistoryItem(item)
    if (allVisits && item.visitCount !== undefined && item.visitCount > 1 && item.url) {
      let visits: browser.history.VisitItem[] | undefined = cachedVisits[item.url]
      if (!visits) {
        visits = await browser.history.getVisits({ url: item.url })
        cachedVisits[item.url] = visits
      }
      for (const visit of visits) {
        if (visit.visitTime === undefined) continue
        if (after !== undefined && visit.visitTime < after) continue
        if (before !== undefined && visit.visitTime > before) continue

        const hItem = visit as HistoryItem
        hItem.id += visit.visitTime.toString(36)
        hItem.lastVisitTime = visit.visitTime
        hItem.url = item.url
        hItem.title = item.title
        hItem.visitCount = item.visitCount
        normalizeHistoryItem(hItem)
        normalized.push(hItem)
      }
    } else {
      normalized.push(item)
    }
  }

  normalized.sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0))

  return normalized
}

export async function loadMore(): Promise<void> {
  if (History.allLoaded) return

  const before = lastItemTime
  const after = lastItemTime - LOAD_RANGE

  let result = await browser.history.search({
    text: '',
    maxResults: UNLIMITED,
    startTime: after,
    endTime: before,
  })

  // First check
  if (result.length) {
    const newItems = await normalizeHistory(result, true, after, before)
    if (newItems.length) {
      History.reactive.list.push(...newItems)
      lastItemTime = getLastItemTime() - 1
      return
    }
  }

  // If got nothing, try to get next 100 items
  result = await browser.history.search({
    text: '',
    maxResults: 100,
    startTime: 0,
    endTime: before,
  })

  // Second check
  if (result.length) {
    const newItems = await normalizeHistory(result, true, after, before)
    if (newItems.length) {
      History.reactive.list.push(...newItems)
      lastItemTime = getLastItemTime() - 1
      return
    }
  }

  // Okay...
  History.allLoaded = true
}

function getLastItemTime(): number {
  let i = History.reactive.list.length - 1
  let lastItem = History.reactive.list[i]
  if (!lastItem) return Date.now()
  while (lastItem?.lastVisitTime === undefined && i > 0) {
    lastItem = History.reactive.list[--i]
  }
  return lastItem.lastVisitTime ?? Date.now()
}

// ???
function normalizeHistoryItem(item: HistoryItem): void {
  if (item.url) {
    const domain = Utils.getDomainOf(item.url)
    item.favicon = Favicons.reactive.list[Favicons.reactive.domains[domain]]
  }
}

function onVisit(item: HistoryItem): void {
  normalizeHistoryItem(item)
  History.reactive.list.unshift(item)
}

function onRemoved(info: browser.history.RemoveDetails): void {
  if (info.allHistory) History.reactive.list = []
  else {
    for (const url of info.urls) {
      const index = History.reactive.list.findIndex(i => i.url === url)
      if (index !== -1) History.reactive.list.splice(index, 1)
    }
  }
}

function onTitleChange(info: browser.history.TitleChangeDetails): void {
  const item = History.reactive.list.find(i => i.url === info.url)
  if (item) item.title = info.title
}

export function setupListeners(): void {
  if (!browser.history) return
  browser.history.onVisited.addListener(onVisit)
  browser.history.onVisitRemoved.addListener(onRemoved)
  browser.history.onTitleChanged.addListener(onTitleChange)
}

export function resetListeners(): void {
  if (!browser.history) return
  browser.history.onVisited.removeListener(onVisit)
  browser.history.onVisitRemoved.removeListener(onRemoved)
  browser.history.onTitleChanged.removeListener(onTitleChange)
}

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
export function scrollToHistoryItem(id: string): void {
  const elId = 'history' + id
  const el = document.getElementById(elId)
  if (!el) return

  let scrollEl
  if (Sidebar.subPanelActive) scrollEl = History.subPanelScrollEl
  else scrollEl = History.panelScrollEl
  if (!scrollEl) return

  const sR = scrollEl.getBoundingClientRect()
  const bR = el.getBoundingClientRect()
  const pH = scrollEl.offsetHeight
  const pS = scrollEl.scrollTop
  const bH = el.offsetHeight
  const bY = bR.top - sR.top + pS

  if (bY < pS + PRE_SCROLL) {
    if (pS > 0) {
      let y = bY - PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      scrollEl.scroll(scrollConf)
    }
  } else if (bY + bH > pS + pH - PRE_SCROLL) {
    scrollConf.top = bY + bH - pH + PRE_SCROLL
    scrollEl.scroll(scrollConf)
  }
}

export async function openTab(item: HistoryItem, activate?: boolean): Promise<void> {
  let panel: Panel | undefined = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel)) {
    panel = Sidebar.panelsById[Sidebar.lastTabsPanelId]
  }
  if (!Utils.isTabsPanel(panel)) {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab) panel = Sidebar.panelsById[activeTab.panelId]
    else panel = Sidebar.panels.find(p => Utils.isTabsPanel(p))
  }

  const tabInfo: ItemInfo = { id: 0, url: item.url, title: item.title, active: activate }
  const dstInfo: DstPlaceInfo = { windowId: Windows.id, discarded: false }
  if (Utils.isTabsPanel(panel)) {
    dstInfo.panelId = panel.id

    if (item.url) {
      dstInfo.containerId = Containers.getContainerFor(item.url)
      if (!dstInfo.containerId && Containers.reactive.byId[panel.newTabCtx]) {
        dstInfo.containerId = panel.newTabCtx
      }
    }
  }

  await Tabs.open([tabInfo], dstInfo)
}

export async function copyUrls(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let urls = ''
  for (const id of ids) {
    const item = History.reactive.list.find(i => i.id === id)
    if (item && item.url) urls += '\n' + item.url
  }

  const resultString = urls.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export async function copyTitles(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let titles = ''
  for (const id of ids) {
    const item = History.reactive.list.find(i => i.id === id)
    if (item && item.title) titles += '\n' + item.title
  }

  const resultString = titles.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}
