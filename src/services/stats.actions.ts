import Utils from 'src/utils'
import { Stored, DomainsStats, InstanceType } from 'src/types'
import { NOID, LINUX_HOME_RE } from 'src/defaults'
import { Stats } from 'src/services/stats'
import { Store } from 'src/services/storage'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Msg } from 'src/services/msg'
import { Info } from 'src/services/info'
import { Logs } from './logs'

interface DomainStatsInfo {
  lastIn: number
  lastOut: number
  passed: number
}

const DAY_OFFSET = 0
const IDLE_SEC = 60

let domains: Record<string, DomainStatsInfo> = {}
let chunkDate = 0

export async function load(): Promise<void> {
  const storage = await browser.storage.local.get<Stored>('stats')
  const statsList = storage?.stats || []
  const lastStats = statsList[statsList.length - 1]
  const now = Date.now()
  chunkDate = now

  let lastStatsTime = 0

  // Remove zeros from the last stats
  if (lastStats) {
    for (const domain of Object.keys(lastStats.domains)) {
      if (lastStats.domains[domain] === 0) delete lastStats.domains[domain]
      else lastStatsTime += lastStats.domains[domain]
    }
  }

  // Use last empty stats or create new stats object
  if (lastStats && lastStatsTime === 0) {
    lastStats.date = now
    Stats.lastStats = lastStats
  } else {
    const stats = { date: now, domains: {} }
    Stats.lastStats = stats
    statsList.push(stats)
    saveDebounced()
  }

  Stats.reactive.list = statsList

  if (browser.idle) {
    Stats.idle = await browser.idle.queryState(IDLE_SEC)
    browser.idle.setDetectionInterval(IDLE_SEC)
  }
  setupListeners()

  Stats.ready = true
}

export async function loadFromBg(): Promise<void> {
  const allStats = await Msg.req(InstanceType.bg, 'getStats')

  for (const dayStats of allStats) {
    dayStats.passed = Object.values(dayStats.domains).reduce((a, v) => a + v, 0)
    if (dayStats.passed >= 86400000) Logs.warn('Stats: Abnormal big value at', dayStats.date)
  }

  Stats.reactive.list = allStats
  if (Stats.readyCB) Stats.readyCB()

  Stats.ready = true

  setupListeners()

  if (Sidebar.reactive.panelsById.stats) Sidebar.reactive.panelsById.stats.ready = true
}

export function unload(): void {
  Stats.reactive.list = []
  resetListeners()
  if (Info.isBg) {
    Stats.ready = false
    Stats.lastStats = undefined
  } else {
    Stats.ready = false
    if (Sidebar.reactive.panelsById.stats) Sidebar.reactive.panelsById.stats.ready = false
  }
}

export async function save(): Promise<void> {
  const now = Date.now()
  const chunkDateStr = Utils.uDate(chunkDate + DAY_OFFSET)
  const currentDate = Utils.uDate(now + DAY_OFFSET)

  if (chunkDateStr !== currentDate) {
    let lastStatsTime

    // Remove zeros from last chunk
    if (Stats.lastStats) {
      lastStatsTime = 0

      for (const domain of Object.keys(Stats.lastStats.domains)) {
        if (Stats.lastStats.domains[domain] === 0) {
          delete Stats.lastStats.domains[domain]
        } else {
          lastStatsTime += Stats.lastStats.domains[domain]
        }
      }
    }

    // Create new chunk
    const stats: DomainsStats = { date: now, domains: {} }
    Stats.lastStats = stats
    chunkDate = now
    domains = {}

    // Last chunk is empty
    if (lastStatsTime === 0) Stats.reactive.list.pop()

    Stats.reactive.list.push(stats)
  }

  await Store.set({ stats: Stats.reactive.list })
}
let saveTimeout: number | undefined
export function saveDebounced(delay = 5000): void {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => save(), delay)
}

export function getStats(): DomainsStats[] {
  return Stats.reactive.list
}

export function update(prevUrl?: string, newUrl?: string): void {
  if (!Stats.lastStats) return
  const now = Date.now()

  if (prevUrl && !prevUrl.startsWith('ab') && !prevUrl.startsWith('mo')) {
    let prevDomain: string
    if (prevUrl.startsWith('fi')) prevDomain = prevUrl.slice(7)?.replace(LINUX_HOME_RE, '~/')
    else if (prevUrl.startsWith('vi')) prevDomain = Utils.getDomainOf(prevUrl.slice(12))
    else prevDomain = Utils.getDomainOf(prevUrl)

    if (prevDomain) {
      prevDomain = decodeURI(prevDomain)
      let prevUrlStats = domains[prevDomain]
      if (!prevUrlStats) {
        prevUrlStats = { lastIn: now, lastOut: now, passed: 0 }
        domains[prevDomain] = prevUrlStats
        Stats.lastStats.domains[prevDomain] = 0
      } else {
        let activeTime = now - prevUrlStats.lastIn
        if (activeTime < 0) activeTime = 0
        if (activeTime > 7200000) activeTime = 7200000

        prevUrlStats.lastOut = now
        if (activeTime > 1000) prevUrlStats.passed += activeTime
        Stats.lastStats.domains[prevDomain] = prevUrlStats.passed
      }
      saveDebounced()
    }
  }

  if (newUrl && !newUrl.startsWith('ab') && !newUrl.startsWith('mo')) {
    let newDomain: string
    if (newUrl.startsWith('fi')) newDomain = newUrl.slice(7)?.replace(LINUX_HOME_RE, '~/')
    else if (newUrl.startsWith('vi')) newDomain = Utils.getDomainOf(newUrl.slice(12))
    else newDomain = Utils.getDomainOf(newUrl)

    if (newDomain) {
      newDomain = decodeURI(newDomain)
      let newUrlStats = domains[newDomain]
      if (!newUrlStats) {
        newUrlStats = { lastIn: now, lastOut: now, passed: 0 }
        domains[newDomain] = newUrlStats
        Stats.lastStats.domains[newDomain] = 0
      } else {
        newUrlStats.lastIn = now
        newUrlStats.lastOut = now
      }
    }
  }
}

function updateFg(list?: DomainsStats[] | null): void {
  if (!list) return
  for (const dayStats of list) {
    dayStats.passed = Object.values(dayStats.domains).reduce((a, v) => a + v, 0)
  }

  Stats.reactive.list = list
}

function onIdleStateChange(state: browser.idle.IdleState): void {
  Stats.idle = state

  if (Sidebar.hasStats) {
    const window = Windows.byId[Windows.lastFocusedWinId ?? NOID]
    if (!window || window.incognito) return
    if (!window.focused) return

    const activeTab = window.tabs?.find(t => t.active)
    if (!activeTab) return

    if (state === 'active') Stats.update(undefined, activeTab.url)
    else Stats.update(activeTab.url)
  }
}

export function setupListeners(): void {
  if (Info.isBg) {
    if (!browser.idle) return
    browser.idle.onStateChanged.addListener(onIdleStateChange)
  } else {
    Store.onKeyChange('stats', updateFg)
  }
}

export function resetListeners(): void {
  if (Info.isBg) {
    if (!browser.idle) return
    browser.idle.onStateChanged.removeListener(onIdleStateChange)
  } else {
    Store.offKeyChange('stats', updateFg)
  }
}

export function onReady(cb: () => void): void {
  if (!Stats.ready) Stats.readyCB = cb
  else cb()
}
