import Utils from 'src/utils'
import { DstPlaceInfo, HistoryItem, ItemInfo, Panel } from 'src/types'
import { History } from 'src/services/history'
import { Favicons } from 'src/services/favicons'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from './tabs.fg'
import { Windows } from './windows'

const UNLIMITED = 1234567
const LOAD_RANGE = 432_000_000 // 1000*60*60*24*5 - 5 days
const INIT_LOAD_END_TIME = Date.now()
const INIT_LOAD_START_TIME = INIT_LOAD_END_TIME - LOAD_RANGE

let lastItemTime = 0

export async function load(): Promise<void> {
  if (!browser.history) return

  const result = await browser.history.search({
    text: '',
    endTime: INIT_LOAD_END_TIME,
    startTime: INIT_LOAD_START_TIME,
    maxResults: UNLIMITED,
  })

  History.reactive.list = await normalizeHistory(result, INIT_LOAD_START_TIME)
  lastItemTime = getLastItemTime() - 1

  if (!History.reactive.list.length) await loadMore()

  History.setupListeners()

  if (Sidebar.reactive.panelsById.history) Sidebar.reactive.panelsById.history.ready = true
}

export function unload(): void {
  History.reactive.list = []
  if (Sidebar.reactive.panelsById.history) Sidebar.reactive.panelsById.history.ready = false
  History.resetListeners()
}

const cachedVisits: Record<string, browser.history.VisitItem[]> = {}
export async function normalizeHistory(
  items: browser.history.HistoryItem[],
  after?: number,
  before?: number
): Promise<HistoryItem[]> {
  const normalized: HistoryItem[] = []

  for (const item of items) {
    // Skip untitled visits (probably redirections)
    if (!item.title) continue

    normalizeHistoryItem(item)
    if (item.visitCount !== undefined && item.visitCount > 1 && item.url) {
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
    const newItems = await normalizeHistory(result, after, before)
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
    const newItems = await normalizeHistory(result, after, before)
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

let loadedList: HistoryItem[] | undefined
export async function search(query: string): Promise<void> {
  if (!loadedList) loadedList = History.reactive.list

  const panel = Sidebar.reactive.panelsById.history
  if (!panel) return
  else panel.ready = false

  if (query) {
    try {
      const result = await browser.history.search({
        text: query,
        maxResults: UNLIMITED,
        startTime: 0,
      })
      History.reactive.list = await normalizeHistory(result)
    } catch (err) {
      History.reactive.list = loadedList
      loadedList = undefined
    }
  } else {
    History.reactive.list = loadedList
    loadedList = undefined
  }

  panel.ready = true
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

export function scrollToHistoryItem(id: string): void {
  const elId = 'history' + id
  const el = document.getElementById(elId)

  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

export async function openTab(item: HistoryItem): Promise<void> {
  let panel: Panel | undefined = Sidebar.reactive.panelsById[Sidebar.lastTabsPanelId]
  if (!Utils.isTabsPanel(panel)) {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab) panel = Sidebar.reactive.panelsById[activeTab.panelId]
    else panel = Sidebar.reactive.panels.find(p => Utils.isTabsPanel(p))
  }

  const tabInfo: ItemInfo = { id: 0, url: item.url, title: item.title, active: true }
  const dstInfo: DstPlaceInfo = { windowId: Windows.id, discarded: false }
  if (panel) dstInfo.panelId = panel.id

  await Tabs.open([tabInfo], dstInfo)
}