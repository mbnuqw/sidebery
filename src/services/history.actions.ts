import * as Utils from 'src/utils'
import { DstPlaceInfo, ItemInfo, NativeHistoryItem, NativeVisit, SubPanelType } from 'src/types'
import { Visit, HistoryDay } from 'src/types'
import { History } from 'src/services/history'
import { Favicons } from 'src/services/favicons'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from './tabs.fg'
import { Windows } from './windows'
import { Permissions } from './permissions'
import { Containers } from './containers'
import { NOID, PRE_SCROLL, SITE_URL_RE } from 'src/defaults'
import * as Logs from 'src/services/logs'
import { Notifications } from './notifications'
import { translate } from 'src/dict'
import { Settings } from './settings'

const UNLIMITED = 1234567
const INITIAL_COUNT = 100
const LOAD_RANGE = 432_000_000 // 1000*60*60*24*5 - 5 days

let lastItemTime = 0

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initHistory(react: (rObj: object) => object) {
  reactFn = react as <T extends object>(rObj: T) => T
  History.reactive = reactFn(History.reactive)
}

export function createVisit(
  nItem: NativeHistoryItem,
  nVisit?: NativeVisit,
  itemDomain?: string,
  itemDecodedUrl?: string
): Visit | undefined {
  if (!nItem.url) return
  if (nItem.lastVisitTime === undefined) return
  if (nVisit && nVisit.visitTime === undefined) return

  const time = nVisit?.visitTime ?? nItem.lastVisitTime
  const dt = new Date(time)
  const dtday = `${dt.getDate()}`.padStart(2, '0')
  const dtmth = `${dt.getMonth() + 1}`.padStart(2, '0')
  const dayId = `${dt.getFullYear()}.${dtmth}.${dtday}`
  const h = dt.getHours().toString()
  const m = dt.getMinutes().toString()
  const timeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`

  let domain
  if (itemDomain) domain = itemDomain
  else domain = Utils.getDomainOf(nItem.url)

  let decodedUrl
  if (itemDecodedUrl) decodedUrl = itemDecodedUrl
  else {
    try {
      decodedUrl = decodeURI(nItem.url)
    } catch {
      decodedUrl = nItem.url
    }
  }

  const title = nItem.title || domain
  const tooltip = title + '\n---\n' + decodedUrl

  const id = (nVisit?.visitId ?? nItem.id) + time.toString(36)

  const visit: Visit = {
    id,
    dayId,
    url: nItem.url,
    decodedUrl,
    domain,
    title,
    noTitle: !nItem.title,
    time,
    timeStr,
    tooltip,

    reactive: {
      title,
      tooltip,
      sel: false,
    },
  }

  if (reactFn) visit.reactive = reactFn(visit.reactive)

  return visit
}

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
  const visits = await normalizeHistory(result, true, lastItemVisitTime)
  lastItemTime = getLastVisitTime(visits) - 1

  if (!visits.length) await loadMore()
  else History.visits = visits

  History.reactive.days = History.recalcDays()
  History.setupListeners()

  const historyPanel = Sidebar.panelsById.history
  if (historyPanel) historyPanel.reactive.ready = historyPanel.ready = true
  History.ready = true
  History.reactive.ready = true
}

export function unload(): void {
  History.reactive.ready = false
  History.reactive.days = []

  History.ready = false
  History.allLoaded = false
  History.visits = []
  History.byId = {}

  const historyPanel = Sidebar.panelsById.history
  if (historyPanel) historyPanel.reactive.ready = historyPanel.ready = false

  History.resetListeners()

  cachedVisits = {}
}

function getDayTitle(time?: number, dayStartTime?: number): string {
  if (time === undefined) return '???'
  if (!dayStartTime) dayStartTime = Utils.getDayStartMS()
  return Utils.uDate(time, '.', dayStartTime)
}

export function recalcDays() {
  const days: HistoryDay[] = []
  const dayStart = Utils.getDayStartMS()
  let day: HistoryDay | undefined
  let lastDayId = ''
  let prevVisit: Visit | undefined

  const visits = History.filtered ?? History.visits

  for (const visit of visits) {
    // Ignore visits without title
    if (visit.noTitle) continue

    // Create new day
    if (lastDayId !== visit.dayId || !day) {
      lastDayId = visit.dayId
      day = { id: lastDayId, title: getDayTitle(visit.time, dayStart), visits: [] }
      days.push(day)
      prevVisit = undefined
    }

    visit.reactive.moreVisits = undefined

    const vTitle = visit.title
    const pvTitle = prevVisit?.title
    if (prevVisit && pvTitle && vTitle.length === pvTitle.length && vTitle === pvTitle) {
      if (!prevVisit.reactive.moreVisits) prevVisit.reactive.moreVisits = [visit.id]
      else prevVisit.reactive.moreVisits.push(visit.id)
      continue
    }

    prevVisit = visit
    day.visits.push(visit.id)
  }

  return days
}

function recalcToday() {
  const days: HistoryDay[] = []
  const dayStart = Utils.getDayStartMS()
  let day: HistoryDay | undefined
  let lastDayId = ''
  let prevVisit: Visit | undefined

  const visits = History.filtered ?? History.visits

  for (const visit of visits) {
    // Ignore visits without title
    if (visit.noTitle) continue

    // Create new day
    if (!day) {
      lastDayId = visit.dayId
      day = { id: lastDayId, title: getDayTitle(visit.time, dayStart), visits: [] }
      days.push(day)
      prevVisit = undefined
    } else if (lastDayId !== visit.dayId) {
      break
    }

    visit.reactive.moreVisits = undefined

    const vTitle = visit.title
    const pvTitle = prevVisit?.title
    if (prevVisit && pvTitle && vTitle.length === pvTitle.length && vTitle === pvTitle) {
      if (!prevVisit.reactive.moreVisits) prevVisit.reactive.moreVisits = [visit.id]
      else prevVisit.reactive.moreVisits.push(visit.id)
      continue
    }

    prevVisit = visit
    day.visits.push(visit.id)
  }

  if (day) History.reactive.days[0] = day
}

let unloadAfterTimeout: number | undefined
export function unloadAfter(delay: number): void {
  clearTimeout(unloadAfterTimeout)
  unloadAfterTimeout = setTimeout(() => {
    const historyPanel = Sidebar.panelsById.history
    if (historyPanel && Sidebar.activePanelId === historyPanel.id) return
    if (historyPanel && !historyPanel.ready) return
    if (Sidebar.subPanelActive && Sidebar.subPanelType === SubPanelType.History) return

    History.unload()
  }, delay)
}

let cachedVisits: Record<string, NativeVisit[]> = {}
export async function normalizeHistory(
  items: browser.history.HistoryItem[],
  allVisits: boolean,
  after?: number,
  before?: number,
  noTitleless?: boolean
): Promise<Visit[]> {
  const normalized: Visit[] = []

  for (const item of items) {
    if (!item.url) continue

    const iVisit = createVisit(item)
    const domain = iVisit?.domain
    const decodedUrl = iVisit?.decodedUrl

    if (allVisits && item.visitCount !== undefined && item.visitCount > 1 && item.url) {
      let visits: browser.history.VisitItem[] | undefined = cachedVisits[item.url]
      if (!visits) {
        visits = await browser.history.getVisits({ url: item.url })
        cachedVisits[item.url] = visits
      }
      for (const visit of visits) {
        const vVisit = createVisit(item, visit, domain, decodedUrl)
        if (!vVisit) continue
        if (noTitleless && vVisit.noTitle) continue
        if (after !== undefined && vVisit.time < after) continue
        if (before !== undefined && vVisit.time > before) continue
        normalized.push(vVisit)
        History.byId[vVisit.id] = vVisit
      }
    } else {
      if (!iVisit) continue
      if (noTitleless && iVisit.noTitle) continue
      if (after !== undefined && iVisit.time < after) continue
      if (before !== undefined && iVisit.time > before) continue
      normalized.push(iVisit)
      History.byId[iVisit.id] = iVisit
    }
  }

  normalized.sort((a, b) => b.time - a.time)

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
    const newVisits = await normalizeHistory(result, true, after, before)
    if (newVisits.length) {
      History.visits.push(...newVisits)
      History.reactive.days = History.recalcDays()
      lastItemTime = getLastVisitTime() - 1
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
    // Find lowest time
    const oldestTime = result[result.length - 1]?.lastVisitTime ?? 0
    const newVisits = await normalizeHistory(result, true, oldestTime, before)
    if (newVisits.length) {
      History.visits.push(...newVisits)
      History.reactive.days = History.recalcDays()
      lastItemTime = getLastVisitTime() - 1
      return
    }
  }

  // Okay...
  History.allLoaded = true
}

function getLastVisitTime(list?: Visit[]): number {
  if (!list) list = History.visits

  const lastVisit = list[list.length - 1]
  if (!lastVisit) return Date.now()
  else return lastVisit.time
}

function onVisit(item: NativeHistoryItem): void {
  const visit = createVisit(item)
  if (!visit) return

  const firstVisit = History.visits[0]
  const sortNeeded = !!firstVisit && firstVisit.time > visit.time

  History.visits.unshift(visit)
  History.byId[visit.id] = visit

  if (sortNeeded) {
    History.visits.sort((a, b) => b.time - a.time)
  }

  if (visit.noTitle) return

  if (sortNeeded) {
    History.reactive.days = History.recalcDays()
  } else {
    const day = History.reactive.days.find(day => day.id === visit.dayId)
    if (day) day.visits.unshift(visit.id)
    else History.reactive.days = History.recalcDays()
  }
}

function onRemoved(info: browser.history.RemoveDetails): void {
  if (info.allHistory) {
    History.visits = []
    cachedVisits = {}
  } else {
    for (const url of info.urls) {
      History.visits = History.visits.filter(v => v.url !== url)
      cachedVisits[url] = []
    }
  }
  History.reactive.days = History.recalcDays()
}

function onTitleChange(info: browser.history.TitleChangeDetails): void {
  const visit = History.visits.find(v => v.id.startsWith(info.id))
  if (visit) {
    visit.reactive.title = visit.title = info.title
    visit.reactive.tooltip = visit.tooltip = visit.title + '\n---\n' + visit.decodedUrl
    if (visit.noTitle) {
      visit.noTitle = false
      recalcToday()
    }
  }
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
  const bodyEl = el?.firstElementChild as HTMLElement | null | undefined
  if (!el || !bodyEl) return

  let scrollEl
  if (Sidebar.subPanelActive) scrollEl = History.subPanelScrollEl
  else scrollEl = History.panelScrollEl
  if (!scrollEl) return

  const sR = scrollEl.getBoundingClientRect()
  const bR = el.getBoundingClientRect()
  const pH = scrollEl.offsetHeight
  const pS = scrollEl.scrollTop
  const bH = bodyEl.offsetHeight
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
export const scrollToHistoryItemDebounced = Utils.debounce(scrollToHistoryItem)

export async function open(
  visit: Visit,
  dst: DstPlaceInfo,
  useActiveTab?: boolean,
  activateFirstTab?: boolean
): Promise<void> {
  if (!visit.url) return

  if (useActiveTab) {
    browser.tabs.update({ url: Utils.normalizeUrl(visit.url, visit.title) })
    return
  }

  const tabInfo: ItemInfo = { id: 0, url: visit.url, title: visit.title, active: activateFirstTab }
  const dstInfo: DstPlaceInfo = { windowId: Windows.id, discarded: false, panelId: dst.panelId }
  const panel = Sidebar.panelsById[dstInfo.panelId ?? NOID]
  if (!Utils.isTabsPanel(panel)) return

  dstInfo.panelId = panel.id
  dstInfo.containerId = Containers.getContainerFor(visit.url)

  if (!dstInfo.containerId && Containers.reactive.byId[panel.newTabCtx]) {
    dstInfo.containerId = panel.newTabCtx
  }

  if (dst.index !== undefined) dstInfo.index = dst.index

  await Tabs.open([tabInfo], dstInfo)
}

export async function copyUrls(ids: ID[]): Promise<void> {
  if (!Permissions.reactive.clipboardWrite) {
    const result = await Permissions.request('clipboardWrite')
    if (!result) return
  }

  let urls = ''
  for (const id of ids) {
    const visit = History.visits.find(i => i.id === id)
    if (visit && visit.url) urls += '\n' + visit.url
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
    const visit = History.visits.find(i => i.id === id)
    if (visit && visit.title) titles += '\n' + visit.title
  }

  const resultString = titles.trim()
  if (resultString) navigator.clipboard.writeText(resultString)
}

export function deleteVisits(ids: ID[]) {
  for (const id of ids) {
    const list = History.filtered ?? History.visits
    const vIndex = list.findIndex(i => i.id === id)
    const visit = list[vIndex]
    if (!visit) continue
    if (!visit.time) continue

    const ts = visit.time

    // Delete cached visit
    if (visit.url) {
      const cached = cachedVisits[visit.url]
      if (cached) {
        const index = cached.findIndex(ci => ci.visitTime === ts)
        if (index !== -1) cached.splice(index, 1)
      }
    }

    browser.history.deleteRange({ startTime: ts, endTime: ts + 1 })

    list.splice(vIndex, 1)
    delete History.byId[id]
  }
  History.reactive.days = History.recalcDays()
}

export async function deleteSites(ids: ID[]) {
  History.reactive.ready = false
  History.resetListeners()

  let stopDeletion = false
  const progressNotification = Notifications.progress({
    icon: '#icon_trash',
    title: translate('notif.history_del_sites'),
    progress: { percent: -1 },
    unconcealed: true,
    ctrl: translate('btn.stop'),
    callback: () => {
      stopDeletion = true
    },
  })

  const sites: Set<string> = new Set()

  for (const id of ids) {
    const list = History.filtered ?? History.visits
    const vIndex = list.findIndex(i => i.id === id)
    const visit = list[vIndex]
    if (!visit || !visit.url) continue

    const reResult = SITE_URL_RE.exec(visit.url)
    if (reResult?.[1]) sites.add(reResult[1])
  }

  const items = []
  for (const url of sites) {
    delete cachedVisits[url]

    try {
      const result = await browser.history.search({ text: url, maxResults: 999999, startTime: 0 })
      const filteredResults = result.filter(i => i.url?.startsWith(url))
      const visits = await History.normalizeHistory(filteredResults, false)
      items.push(...visits)
    } catch {
      Logs.warn('History.deleteSites: Cannot get visits to remove')
    }
  }

  if (items.length === 0) {
    Notifications.finishProgress(progressNotification, 0)
    Notifications.notify({
      icon: '#icon_clock',
      title: translate('notif.history_del_sites_nothing'),
    })
    History.reactive.ready = true
    return
  }

  const initialCount = items.length + 1
  let count = 1
  Notifications.updateProgress(progressNotification, count, initialCount)

  progressNotification.detailsList = []
  const detailsList = progressNotification.detailsList

  for (const item of items) {
    if (stopDeletion) break
    Notifications.updateProgress(progressNotification, ++count, initialCount)

    if (!item.url) continue

    detailsList[0] = item.url

    try {
      await browser.history.deleteUrl({ url: item.url })
    } catch {
      Logs.warn(`History.deleteSites: Cannot delete url: ${item.url}`)
      continue
    }
  }

  History.unload()
  await History.load()

  Notifications.finishProgress(progressNotification, 0)
}

export interface OpeningHistoryConfig {
  dst: DstPlaceInfo
  useActiveTab: boolean
  activateFirstTab: boolean
}

export function getMouseOpeningConf(button: number): OpeningHistoryConfig {
  const conf: OpeningHistoryConfig = {
    dst: {},
    useActiveTab: false,
    activateFirstTab: false,
  }

  // Left click
  if (button === 0) {
    const panelId = Sidebar.getRecentTabsPanelId()
    const panel = Sidebar.panelsById[panelId]
    conf.useActiveTab = Settings.state.historyLeftClickAction === 'open_in_act'
    conf.activateFirstTab = Settings.state.historyLeftClickActivate
    conf.dst.panelId = panelId
    if (!conf.useActiveTab && Settings.state.historyLeftClickPos === 'after') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === panelId) {
        conf.dst.index = activeTab.index + 1
        conf.dst.parentId = activeTab.parentId
      }
    } else if (Utils.isTabsPanel(panel)) {
      conf.dst.index = Tabs.getIndexForNewTab(panel)
    }
  }

  // Middle click
  else if (button === 1) {
    const panelId = Sidebar.getRecentTabsPanelId()
    const panel = Sidebar.panelsById[panelId]
    conf.activateFirstTab = Settings.state.historyMidClickActivate
    conf.dst.panelId = panelId
    if (Settings.state.historyMidClickPos === 'after') {
      const activeTab = Tabs.byId[Tabs.activeId]
      if (activeTab && !activeTab.pinned && activeTab.panelId === panelId) {
        conf.dst.index = activeTab.index + 1
        conf.dst.parentId = activeTab.parentId
      }
    } else if (Utils.isTabsPanel(panel)) {
      conf.dst.index = Tabs.getIndexForNewTab(panel)
    }
  }

  return conf
}
