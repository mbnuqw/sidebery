import type * as T from 'src/types'
import { DEFAULT_CONTAINER_ID, NOID } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import * as Favicons from 'src/services/favicons.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Popups from 'src/services/popups.fg'
import * as Windows from 'src/services/windows.fg'
import * as Logs from 'src/services/logs'
import { ConfirmationType } from 'src/enums'
import { translate } from 'src/dict'

export interface DomainMatch {
  domainKey: string
  title: string
}

export interface DomainTreeLogEntry {
  timestamp: string
  timeMs: number
  level: 'INFO' | 'WARN' | 'ERROR' | 'ALERT'
  tag: string
  message: string
  details?: any
}

const LOG_STORAGE_KEY = 'domainTreesLogs'
const MAX_LOG_ENTRIES = 1000

let logEntries: DomainTreeLogEntry[] = []
let saveLogsTimeout: number | undefined

// Load persisted logs on startup
if (typeof browser !== 'undefined' && browser.storage?.local) {
  browser.storage.local
    .get<Record<string, DomainTreeLogEntry[]>>(LOG_STORAGE_KEY)
    .then(res => {
      const stored = res?.[LOG_STORAGE_KEY]
      if (Array.isArray(stored) && stored.length > 0) {
        logEntries = stored.slice(-MAX_LOG_ENTRIES)
      }
    })
    .catch(() => {})
}

function saveLogsDebounced(): void {
  if (typeof browser === 'undefined' || !browser.storage?.local) return
  clearTimeout(saveLogsTimeout)
  saveLogsTimeout = setTimeout(() => {
    browser.storage.local.set({ [LOG_STORAGE_KEY]: logEntries.slice(-500) }).catch(() => {})
  }, 1000) as unknown as number
}

export function log(
  level: 'INFO' | 'WARN' | 'ERROR' | 'ALERT',
  tag: string,
  message: string,
  details?: any
): void {
  const d = new Date()
  const timestamp = `${d.toTimeString().split(' ')[0]}.${d.getMilliseconds().toString().padStart(3, '0')}`
  const entry: DomainTreeLogEntry = {
    timestamp,
    timeMs: Date.now(),
    level,
    tag,
    message,
    details: details !== undefined ? Utils.clone(details) : undefined,
  }

  logEntries.push(entry)
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.shift()
  }

  const prefix = `[DomainTrees:${tag}]`
  if (level === 'ERROR' || level === 'ALERT') {
    if (details !== undefined) console.error(prefix, message, details)
    else console.error(prefix, message)
  } else if (level === 'WARN') {
    if (details !== undefined) console.warn(prefix, message, details)
    else console.warn(prefix, message)
  } else {
    if (details !== undefined) console.log(prefix, message, details)
    else console.log(prefix, message)
  }

  saveLogsDebounced()
}

export function getLogsFormatted(limit = 300): string {
  const entries = logEntries.slice(-limit)
  return entries
    .map(e => {
      const det = e.details !== undefined ? ` | ${JSON.stringify(e.details)}` : ''
      return `[${e.timestamp}] [${e.level}] [${e.tag}] ${e.message}${det}`
    })
    .join('\n')
}

export function getLogsArray(): DomainTreeLogEntry[] {
  return [...logEntries]
}

export async function clearLogs(): Promise<void> {
  logEntries = []
  if (typeof browser !== 'undefined' && browser.storage?.local?.remove) {
    await browser.storage.local.remove(LOG_STORAGE_KEY).catch(() => {})
  }
  log('INFO', 'Log', 'Logs cleared by user')
}

export async function copyLogsToClipboard(): Promise<boolean> {
  const text = getLogsFormatted(500)
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (err) {
    console.error('[DomainTrees:Log] Failed to copy logs to clipboard:', err)
  }
  return false
}

// Circuit breaker to prevent creation storms / infinite loops
const creationTimestamps: number[] = []
let circuitBreakerUntil = 0

function checkCircuitBreaker(): boolean {
  const now = Date.now()
  if (now < circuitBreakerUntil) {
    log(
      'ALERT',
      'CircuitBreaker',
      `Creation storm throttle ACTIVE until ${new Date(circuitBreakerUntil).toLocaleTimeString()}. Aborting placeholder creation.`
    )
    return false
  }

  const cutoff = now - 3000
  while (creationTimestamps.length > 0 && creationTimestamps[0] < cutoff) {
    creationTimestamps.shift()
  }

  if (creationTimestamps.length >= 6) {
    circuitBreakerUntil = now + 10000 // Throttle for 10 seconds
    log(
      'ALERT',
      'CircuitBreaker',
      `⚠️ CREATION STORM DETECTED (${creationTimestamps.length} placeholders in 3s)! Throttling placeholder creation for 10s to protect browser.`
    )
    return false
  }

  creationTimestamps.push(now)
  return true
}

// In-flight placeholder creation lock per domainKey to prevent duplicate creation
const creatingPlaceholder = new Map<string, Promise<T.Tab | undefined>>()

// Track pending placeholders being created to avoid cleaning them up early
const pendingPlaceholders = new Set<ID>()

export function isPendingPlaceholder(id: ID): boolean {
  return pendingPlaceholders.has(id)
}

// Map of placeholderId -> last active child tabId
export const lastActiveChildMap = new Map<ID, ID>()

export function recordActiveChild(tab: T.Tab): void {
  if (!tab || tab.parentId === NOID || isDomainTreeGroup(tab)) return
  let p: T.Tab | undefined = tab
  while (p && p.parentId !== NOID) {
    const parent: T.Tab | undefined = Tabs.byId[p.parentId]
    if (!parent) break
    p = parent
    if (isDomainTreeGroup(parent)) {
      lastActiveChildMap.set(parent.id, tab.id)
    }
  }
}

export function getLastActiveChild(placeholder?: T.Tab): T.Tab | undefined {
  if (!placeholder || !isDomainTreeGroup(placeholder)) return

  const children = Tabs.getBranch(placeholder, false).filter(
    t => t.id !== placeholder.id && !isDomainTreeGroup(t) && !Tabs.removingTabs?.includes(t.id)
  )
  if (!children.length) return

  // 1. Check if we have a recorded last active child that is still in the branch
  const recordedId = lastActiveChildMap.get(placeholder.id)
  if (recordedId !== undefined) {
    const recordedTab = children.find(t => t.id === recordedId)
    if (recordedTab) return recordedTab
  }

  // 2. Find child with the highest lastAccessed timestamp
  let bestChild: T.Tab | undefined
  let maxAccessed = -1
  for (const child of children) {
    const acc = child.lastAccessed ?? 0
    if (acc > maxAccessed) {
      maxAccessed = acc
      bestChild = child
    }
  }
  if (bestChild && maxAccessed > 0) return bestChild

  // 3. Fallback to the first child tab in the branch
  return children[0]
}

export function isDomainTreeGroup(tab?: T.Tab): boolean {
  if (!tab || !tab.url) return false
  return (tab.isGroup || tab.url.includes('/sidebery/group.html')) && tab.url.includes('?dt=')
}

export function getDomainTreeKey(tab?: T.Tab): string | undefined {
  if (!isDomainTreeGroup(tab)) return
  try {
    const url = new URL(tab!.url)
    return url.searchParams.get('dt') ?? undefined
  } catch {
    const match = tab!.url.match(/[?&]dt=([^&#]+)/)
    return match ? decodeURIComponent(match[1]) : undefined
  }
}

export function createDomainTreeUrl(domainKey: string, title: string): string {
  let url = browser.runtime.getURL('sidebery/group.html')
  url += '?dt=' + encodeURIComponent(domainKey)
  url += '#' + encodeURIComponent(title)
  return url
}

const KNOWN_CANONICAL_TARGETS = new Set([
  'youtube.com',
  'twitter.com',
  'facebook.com',
  'reddit.com',
  'spotify.com',
])

const KNOWN_CCTLD_SECOND_LEVELS = new Set(['co', 'com', 'org', 'net', 'edu', 'gov', 'ac'])

export function getRegisteredServiceName(hostname: string): string {
  const clean = hostname.toLowerCase().replace(/^www\./, '')
  const segments = clean.split('.').filter(Boolean)
  if (segments.length <= 1) return segments[0] || ''

  if (
    segments.length >= 3 &&
    KNOWN_CCTLD_SECOND_LEVELS.has(segments[segments.length - 2]) &&
    segments[segments.length - 1].length === 2
  ) {
    return segments[segments.length - 3]
  }
  return segments[segments.length - 2]
}

export function domainMatchesPattern(hostname: string, url: string, pattern: string): boolean {
  if (!pattern) return false
  const p = pattern.trim().toLowerCase()
  if (!p) return false

  const host = hostname.toLowerCase().replace(/^www\./, '')
  const baseDomain = (Utils.getDomain(host, true, 1) || host).toLowerCase()
  const canonical = getCanonicalDomain(host)
  const hostServiceName = getRegisteredServiceName(host)

  // Pattern with dot (e.g. "youtube.com", "youtu.be", "amazon.com", "wikipedia.org")
  if (p.includes('.')) {
    const cleanP = p.replace(/^www\./, '')
    const canonicalP = getCanonicalDomain(cleanP)

    if (host === cleanP || host.endsWith('.' + cleanP)) return true
    if (canonical === cleanP || canonical.endsWith('.' + cleanP)) return true
    if (
      KNOWN_CANONICAL_TARGETS.has(canonical) &&
      KNOWN_CANONICAL_TARGETS.has(canonicalP) &&
      canonical === canonicalP
    ) {
      return true
    }

    // Generic country-code TLD matching for 2-segment domain rules (e.g. "amazon.com" matches "amazon.co.uk", "amazon.de")
    const pServiceName = getRegisteredServiceName(cleanP)
    if (pServiceName && pServiceName.length >= 3 && hostServiceName === pServiceName) {
      return true
    }
  } else {
    // Pattern without dot (e.g. "youtube", "spotify", "wikipedia", "amazon")
    // Prefix does not matter: matches any subdomain or TLD for that service
    const baseDomainName = baseDomain.split('.')[0]
    const canonicalName = canonical.split('.')[0]
    if (baseDomainName === p || canonicalName === p || hostServiceName === p) return true
    if (host === p) return true
  }

  return false
}

export function matchCustomRule(url?: string): DomainMatch | null {
  if (!url || !Settings.state.domainTrees || !Settings.state.domainTreeRules?.length) return null
  if (
    url.startsWith('about:') ||
    url.startsWith('chrome:') ||
    url.startsWith('moz-extension:') ||
    url.startsWith('view-source:') ||
    url.startsWith('javascript:') ||
    url.startsWith('data:') ||
    url.includes('/sidebery/')
  ) {
    return null
  }

  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }
  if (!hostname) return null

  for (const rule of Settings.state.domainTreeRules) {
    if (!rule.active || !rule.url) continue

    let matched = false
    const trimmed = rule.url.trim()
    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
      const lastSlash = trimmed.lastIndexOf('/')
      const pattern = trimmed.slice(1, lastSlash)
      const flags = trimmed.slice(lastSlash + 1)
      try {
        const re = new RegExp(pattern, flags)
        if (re.test(url) || re.test(hostname)) matched = true
      } catch {
        // ignore invalid regex
      }
    } else {
      // Plain string or pipe/comma-separated domains e.g. "youtube.com|youtu.be" or "youtube"
      const parts = trimmed.split(/[|,]/).map(p => p.trim()).filter(Boolean)
      for (const part of parts) {
        if (domainMatchesPattern(hostname, url, part)) {
          matched = true
          break
        }
      }
    }

    if (matched) {
      const parts = trimmed.split(/[|,]/).map(p => p.trim()).filter(Boolean)
      const primaryDomain = parts[0] || trimmed
      const domainKey = (rule.name || primaryDomain).toLowerCase()
      const title = rule.name || formatTitle(hostname)
      return { domainKey, title }
    }
  }

  return null
}

export function matchUniversal(url?: string): DomainMatch | null {
  if (!url || !Settings.state.domainTrees || !Settings.state.domainTreesUniversal) return null
  if (
    url.startsWith('about:') ||
    url.startsWith('chrome:') ||
    url.startsWith('moz-extension:') ||
    url.startsWith('view-source:') ||
    url.startsWith('javascript:') ||
    url.startsWith('data:') ||
    url.includes('/sidebery/')
  ) {
    return null
  }

  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }
  if (!hostname) return null

  const domain = Utils.getDomain(hostname, true, 1) || hostname
  const title = formatTitle(domain)
  return { domainKey: domain.toLowerCase(), title }
}

export function matchDomain(url?: string): DomainMatch | null {
  return matchCustomRule(url) || matchUniversal(url)
}

export function hasDomainTreeRule(url?: string): boolean {
  return matchCustomRule(url) !== null
}

export function getCanonicalDomain(hostname: string): string {
  const norm = hostname.toLowerCase().replace(/^www\./, '')
  if (
    norm === 'youtu.be' ||
    norm === 'youtube.com' ||
    norm.endsWith('.youtube.com') ||
    norm.endsWith('.youtu.be')
  ) {
    return 'youtube.com'
  }
  if (
    norm === 'x.com' ||
    norm === 'twitter.com' ||
    norm.endsWith('.twitter.com') ||
    norm.endsWith('.x.com')
  ) {
    return 'twitter.com'
  }
  if (
    norm === 'fb.com' ||
    norm === 'facebook.com' ||
    norm.endsWith('.facebook.com') ||
    norm.endsWith('.fb.com')
  ) {
    return 'facebook.com'
  }
  if (
    norm === 'redd.it' ||
    norm === 'reddit.com' ||
    norm.endsWith('.reddit.com') ||
    norm.endsWith('.redd.it')
  ) {
    return 'reddit.com'
  }
  if (
    norm === 'spoti.fi' ||
    norm === 'spotify.com' ||
    norm.endsWith('.spotify.com') ||
    norm.endsWith('.spoti.fi')
  ) {
    return 'spotify.com'
  }
  return (Utils.getDomain(norm, true, 1) || norm).toLowerCase()
}

export function isCustomRuleDomainKey(domainKey?: string): boolean {
  if (!domainKey || !Settings.state.domainTrees || !Settings.state.domainTreeRules?.length) {
    return false
  }
  const key = domainKey.toLowerCase().replace(/^www\./, '')
  const keyName = key.split('.')[0]
  return Settings.state.domainTreeRules.some(rule => {
    if (!rule.active) return false
    if (rule.name && rule.name.toLowerCase() === key) return true

    const trimmed = (rule.url || '').trim()
    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
      return false
    }
    const parts = trimmed.split(/[|,]/).map(p => p.trim().toLowerCase()).filter(Boolean)
    const primaryDomain = (parts[0] || trimmed).toLowerCase().replace(/^www\./, '')
    return (
      primaryDomain === key ||
      parts.includes(key) ||
      primaryDomain.split('.')[0] === keyName ||
      parts.some(p => {
        const cleanP = p.replace(/^www\./, '')
        return cleanP === key || cleanP.split('.')[0] === keyName
      })
    )
  })
}

export function isCustomRulePlaceholder(placeholder: T.Tab, contentTabs?: T.Tab[]): boolean {
  const domainKey = getDomainTreeKey(placeholder)
  if (isCustomRuleDomainKey(domainKey)) return true
  if (contentTabs && contentTabs.length > 0) {
    return contentTabs.some(t => matchCustomRule(t.url) !== null)
  }
  return false
}

export function isNamedDomainRule(domainKey?: string): boolean {
  if (!domainKey || !Settings.state.domainTreeRules?.length) return false
  const normKey = domainKey.toLowerCase().trim()
  return Settings.state.domainTreeRules.some(r => {
    if (!r.active || !r.name) return false
    const normName = r.name.toLowerCase().trim()
    return normName === normKey || r.id === domainKey
  })
}

export function isNamedDomainTree(tab?: T.Tab): boolean {
  if (!tab || !isDomainTreeGroup(tab)) return false
  const key = getDomainTreeKey(tab)
  return isNamedDomainRule(key)
}

export function getNamedDomainTreeInsertionIndex(panelId: ID): number {
  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return 0

  let targetIndex = panel.startTabIndex
  for (let i = panel.startTabIndex; i < panel.nextTabIndex; i++) {
    const t = Tabs.list[i]
    if (!t) break
    if (t.parentId === NOID && isNamedDomainTree(t)) {
      const branchLen = Tabs.getBranchLen(t.id) ?? 0
      i += branchLen
      targetIndex = i + 1
    } else {
      break
    }
  }
  return targetIndex
}

export async function ensureNamedDomainTreesAtTop(panelId?: ID): Promise<void> {
  if (panelId === undefined) {
    for (const panel of Sidebar.panels) {
      if (Utils.isTabsPanel(panel)) await ensureNamedDomainTreesAtTop(panel.id)
    }
    return
  }

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  // Collect all top-level named domain trees in this panel in current order
  const namedTrees: T.Tab[] = []
  for (let i = panel.startTabIndex; i < panel.nextTabIndex; i++) {
    const t = Tabs.list[i]
    if (!t) continue
    if (t.parentId === NOID && isNamedDomainTree(t)) {
      namedTrees.push(t)
    }
  }

  if (!namedTrees.length) return

  let expectedIndex = panel.startTabIndex
  for (const tree of namedTrees) {
    const freshTree = Tabs.byId[tree.id] ?? tree
    if (freshTree.index !== expectedIndex) {
      const branch = Tabs.getBranch(freshTree, true)
      if (branch.length > 0) {
        await Tabs.move(branch, {}, { index: expectedIndex, panelId: panel.id, parentId: NOID })
      }
    }
    const freshAfter = Tabs.byId[tree.id] ?? tree
    const branchLen = Tabs.getBranchLen(freshAfter.id) ?? 0
    expectedIndex = freshAfter.index + branchLen + 1
  }
}

export function isIgnorablePrefix(prefix: string): boolean {
  const p = prefix.toLowerCase()
  if (
    [
      'www',
      'www2',
      'www3',
      'web',
      'm',
      'mobile',
      'wap',
      'touch',
      'open',
      'app',
      'apps',
      'my',
      'secure',
      'beta',
      'alpha',
      'preview',
      'test',
      'dev',
      'stage',
      'staging',
      'auth',
      'login',
      'signin',
      'sso',
      'cdn',
      'static',
      'assets',
    ].includes(p)
  ) {
    return true
  }
  // 2-letter or 3-letter language / country codes (e.g. br, pt, en, es, fr, de, it, ru, ja, etc.)
  if (/^[a-z]{2,3}$/i.test(p)) {
    return true
  }
  // Composite locale codes (e.g. pt-br, en-us, en-gb, pt_br, etc.)
  if (/^[a-z]{2,3}[-_][a-z]{2,3}$/i.test(p)) {
    return true
  }
  // Numbered server prefixes (e.g. www1, srv2, node3)
  if (/^(www|web|srv|server|node)\d+$/i.test(p)) {
    return true
  }
  return false
}

function formatTitle(domain: string): string {
  const lower = domain.toLowerCase()
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('github')) return 'GitHub'
  if (lower.includes('google')) return 'Google'
  if (lower.includes('reddit')) return 'Reddit'
  if (lower.includes('twitter') || lower === 'x' || lower.includes('x.com')) return 'X / Twitter'
  if (lower.includes('spotify')) return 'Spotify'
  if (lower.includes('bandcamp')) return 'Bandcamp'
  if (lower.includes('soundcloud')) return 'SoundCloud'
  if (lower.includes('twitch')) return 'Twitch'
  if (lower.includes('netflix')) return 'Netflix'
  if (lower.includes('wikipedia')) return 'Wikipedia'
  if (lower.includes('amazon')) return 'Amazon'
  if (lower.includes('facebook') || lower.includes('fb.com')) return 'Facebook'
  if (lower.includes('instagram')) return 'Instagram'
  if (lower.includes('linkedin')) return 'LinkedIn'

  // Generic formatting: clean prefix/TLD and capitalize
  let clean = (Utils.getDomain(domain, true, 1) || domain).toLowerCase().replace(/^www\./, '')
  const dotIndex = clean.indexOf('.')
  if (dotIndex > 0) {
    clean = clean.slice(0, dotIndex)
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export function getAncestorDomainTree(tab: T.Tab): T.Tab | undefined {
  if (!tab || tab.parentId === NOID) return
  let p: T.Tab | undefined = tab
  let topPlaceholder: T.Tab | undefined
  while (p && p.parentId !== NOID) {
    const parent: T.Tab | undefined = Tabs.byId[p.parentId]
    if (!parent) break
    if (isDomainTreeGroup(parent)) {
      topPlaceholder = parent
    }
    p = parent
  }
  return topPlaceholder
}

export function getImmediateDomainTree(tab: T.Tab): T.Tab | undefined {
  if (!tab || tab.parentId === NOID) return
  let p: T.Tab | undefined = tab
  while (p && p.parentId !== NOID) {
    const parent: T.Tab | undefined = Tabs.byId[p.parentId]
    if (!parent) break
    if (isDomainTreeGroup(parent)) {
      return parent
    }
    p = parent
  }
  return undefined
}

export function getSubDomainKey(
  url?: string,
  parentDomainKey?: string
): { subKey: string; title: string } | null {
  if (!url || !Settings.state.domainTrees) return null
  if (
    url.startsWith('about:') ||
    url.startsWith('chrome:') ||
    url.startsWith('moz-extension:') ||
    url.startsWith('view-source:') ||
    url.startsWith('javascript:') ||
    url.startsWith('data:') ||
    url.includes('/sidebery/')
  ) {
    return null
  }

  let hostname = ''
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
  if (!hostname) return null

  // Strip leading www.
  if (hostname.startsWith('www.')) hostname = hostname.slice(4)

  const baseDomain = (Utils.getDomain(hostname, true, 1) || hostname).toLowerCase()
  const canonical = getCanonicalDomain(hostname)

  if (parentDomainKey) {
    const normParent = parentDomainKey.toLowerCase().replace(/^www\./, '')
    const parentName = normParent.split('.')[0]
    const baseName = baseDomain.split('.')[0]
    const canonicalName = canonical.split('.')[0]

    const hostServiceName = getRegisteredServiceName(hostname)

    // 1. Is tab from the same domain as the parent domain tree?
    // Matches if baseDomain or canonical matches normParent, or base service name matches
    const isSameParentDomain =
      hostname === normParent ||
      baseDomain === normParent ||
      canonical === normParent ||
      (parentName.length > 2 &&
        (baseName === parentName || canonicalName === parentName || hostServiceName === parentName))

    if (isSameParentDomain) {
      // Find what prefix/subdomain is present before the base domain
      let subPart = ''
      if (hostname !== baseDomain && hostname.endsWith('.' + baseDomain)) {
        subPart = hostname.slice(0, -(baseDomain.length + 1))
      } else if (hostname !== normParent && hostname.endsWith('.' + normParent)) {
        subPart = hostname.slice(0, -(normParent.length + 1))
      }

      if (!subPart) return null

      // Check if all dot-separated segments in subPart are ignorable prefixes (e.g. br, pt, www, m)
      const segments = subPart.split('.').filter(Boolean)
      if (segments.every(isIgnorablePrefix)) {
        // e.g. "br.youtube.com", "pt.youtube.com", "www.youtube.com" -> belongs directly to parent!
        return null
      }

      // Filter out ignorable prefixes to find the meaningful sub-service name (e.g. "br.music" -> "music")
      const meaningful = segments.filter(s => !isIgnorablePrefix(s))
      if (!meaningful.length) return null

      const meaningfulKey = meaningful.join('.') + '.' + baseDomain
      const titleName = meaningful[0]
      return {
        subKey: meaningfulKey,
        title: formatTitle(titleName),
      }
    }

    // 2. External domain inside parent category tree (e.g. youtube.com or spotify.com inside media tree)
    return {
      subKey: canonical,
      title: formatTitle(canonical),
    }
  }

  return { subKey: hostname, title: formatTitle(hostname) }
}

export function findExistingDomainPlaceholder(domainKey: string, panelId?: ID): T.Tab | undefined {
  if (panelId !== undefined) {
    return Tabs.list.find(
      t =>
        t.panelId === panelId &&
        !t.pinned &&
        isDomainTreeGroup(t) &&
        getDomainTreeKey(t) === domainKey &&
        (t.parentId === NOID || !isDomainTreeGroup(Tabs.byId[t.parentId]))
    )
  }
  return Tabs.list.find(
    t =>
      !t.pinned &&
      isDomainTreeGroup(t) &&
      getDomainTreeKey(t) === domainKey &&
      (t.parentId === NOID || !isDomainTreeGroup(Tabs.byId[t.parentId]))
  )
}

export function findExistingSubPlaceholder(
  subKey: string,
  parentPlaceholderId: ID
): T.Tab | undefined {
  return Tabs.list.find(
    t =>
      !t.pinned &&
      isDomainTreeGroup(t) &&
      getDomainTreeKey(t) === subKey &&
      t.parentId === parentPlaceholderId
  )
}

export function getDomainTabs(domainKey: string, panelId?: ID): T.Tab[] {
  return Tabs.list.filter(t => {
    if (t.pinned || t.internal || t.isGroup || isDomainTreeGroup(t)) return false
    if (panelId !== undefined && t.panelId !== panelId) return false
    // If tab is already inside an ancestor domain tree, don't count towards top-level trees
    // UNLESS it matches an explicit custom rule that is different from ancestorTree
    const ancestor = getAncestorDomainTree(t)
    if (ancestor) {
      const parentKey = getDomainTreeKey(ancestor)
      const customMatch = matchCustomRule(t.url)
      if (!customMatch || customMatch.domainKey === parentKey) {
        return false
      }
    }
    const match = matchDomain(t.url)
    return match?.domainKey === domainKey
  })
}

const domainTabTimeouts: Map<ID, number> = new Map()

export function handleDomainTabDebounced(tabId: ID, delay = 200): void {
  let timeout = domainTabTimeouts.get(tabId)
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    domainTabTimeouts.delete(tabId)
    handleDomainTab(tabId)
  }, delay)
  domainTabTimeouts.set(tabId, timeout)
}

let scanningExistingTabs = false

/**
 * Scan all open unpinned tabs and group them into domain trees if they reach the 2+ tab threshold.
 */
export async function scanExistingTabs(panelId?: ID): Promise<void> {
  if (!Settings.state.domainTrees) return
  if (scanningExistingTabs) return
  scanningExistingTabs = true

  log('INFO', 'Scan', `Starting scanExistingTabs(panelId=${panelId ?? 'all'})`)

  try {
    await deduplicateDomainTrees(panelId)

    const panels = panelId !== undefined
      ? [Sidebar.panelsById[panelId]].filter(Utils.isTabsPanel)
      : Sidebar.panels.filter(Utils.isTabsPanel)

    for (const panel of panels) {
      if (!panel) continue

      const panelTabs = Tabs.list.filter(
        t => t.panelId === panel.id && !t.pinned && !t.internal && !t.isGroup && !isDomainTreeGroup(t)
      )
      log('INFO', 'Scan', `Panel ${panel.id} has ${panelTabs.length} content tabs to evaluate`)

      const domainGroups = new Map<string, { title: string; tabs: T.Tab[] }>()

      for (const tab of panelTabs) {
        const ancestorTree = getAncestorDomainTree(tab)
        if (ancestorTree) {
          const parentKey = getDomainTreeKey(ancestorTree)
          const customMatch = matchCustomRule(tab.url)
          if (!customMatch || customMatch.domainKey === parentKey) {
            continue
          }
        }

        const match = matchDomain(tab.url)
        if (!match) continue
        let group = domainGroups.get(match.domainKey)
        if (!group) {
          group = { title: match.title, tabs: [] }
          domainGroups.set(match.domainKey, group)
        }
        group.tabs.push(tab)
      }

      log(
        'INFO',
        'Scan',
        `Panel ${panel.id}: Detected domain groups: ${Array.from(domainGroups.keys()).join(', ') || 'none'}`
      )

      for (const [domainKey, { title, tabs: domainTabs }] of domainGroups) {
        let placeholder = findExistingDomainPlaceholder(domainKey, panel.id)

        const isCustom =
          isCustomRuleDomainKey(domainKey) ||
          domainTabs.some(t => matchCustomRule(t.url) !== null)
        const threshold = isCustom ? 1 : 2

        const totalDomainTabs = getDomainTabs(domainKey, panel.id)
        if (!placeholder && totalDomainTabs.length < threshold) {
          continue
        }

        if (!placeholder) {
          log('INFO', 'Scan', `Creating new placeholder for "${domainKey}" (${domainTabs.length} tabs in panel)`)
          placeholder = await createPlaceholder(domainKey, title, panel.id, domainTabs[0])
          if (!placeholder) continue
        }

        const tabsToAttach = domainTabs.filter(t => t.parentId !== placeholder!.id)
        if (tabsToAttach.length > 0) {
          log('INFO', 'Scan', `Attaching ${tabsToAttach.length} tabs to placeholder ${placeholder.id} (${domainKey})`)
          await attachTabsToPlaceholder(tabsToAttach, placeholder, panel)
        }

        await scanSubDomainTrees(placeholder)
      }

      // Also scan all existing top-level domain tree placeholders for nested sub-trees
      const topPlaceholders = Tabs.list.filter(
        tab =>
          tab.panelId === panel.id &&
          isDomainTreeGroup(tab) &&
          (tab.parentId === NOID || !isDomainTreeGroup(Tabs.byId[tab.parentId]))
      )
      for (const tab of topPlaceholders) {
        if (Tabs.byId[tab.id]) {
          await scanSubDomainTrees(tab)
        }
      }

      await cleanEmptyDomainTrees(panel.id)
      await ensureNamedDomainTreesAtTop(panel.id)
    }

    updateAllDomainTreesFavicons()
    log('INFO', 'Scan', `Completed scanExistingTabs(panelId=${panelId ?? 'all'})`)
  } catch (err) {
    log('ERROR', 'Scan', `Error in scanExistingTabs: ${err}`, err)
  } finally {
    scanningExistingTabs = false
  }
}

const inFlightTabs = new Set<ID>()

export async function handleDomainTab(tabId: ID): Promise<void> {
  if (inFlightTabs.has(tabId)) return
  inFlightTabs.add(tabId)
  try {
    const tab = Tabs.byId[tabId]
    if (!tab || tab.pinned || tab.internal || tab.isGroup || isDomainTreeGroup(tab)) return
    if (!Settings.state.domainTrees) return

    log('INFO', 'HandleTab', `handleDomainTab(tabId=${tabId}, url=${tab.url}, parentId=${tab.parentId})`)

  // 1. Is this tab currently inside an existing domain tree?
  const ancestorTree = getAncestorDomainTree(tab)
  if (ancestorTree) {
    const parentDomainKey = getDomainTreeKey(ancestorTree)
    if (parentDomainKey) {
      const customMatch = matchCustomRule(tab.url)
      if (customMatch && customMatch.domainKey !== parentDomainKey) {
        // Tab matches an explicit custom rule! Break out of ancestorTree.
        const oldImmediate = getImmediateDomainTree(tab)
        const dst = {
          index: tab.index,
          panelId: tab.panelId,
          parentId: NOID,
        }
        await Tabs.move([tab], {}, dst)
        if (oldImmediate) checkEmptyPlaceholder(oldImmediate.id)
        checkEmptyPlaceholder(ancestorTree.id)
        // Proceed to normal top-level domain tree routing below
      } else {
        // Tab stays inside ancestorTree!
        await scanSubDomainTrees(ancestorTree)
        return
      }
    }
  }

  // If tab was previously under a domain tree placeholder that it no longer belongs to
  const oldParent = tab.parentId !== NOID ? Tabs.byId[tab.parentId] : undefined
  if (oldParent && isDomainTreeGroup(oldParent)) {
    const oldKey = getDomainTreeKey(oldParent)
    const match = matchDomain(tab.url)
    if (!match || match.domainKey !== oldKey) {
      // Tab changed domain: un-parent it from old placeholder
      const dst = {
        index: tab.index,
        panelId: tab.panelId,
        parentId: NOID,
      }
      await Tabs.move([tab], {}, dst)
      checkEmptyPlaceholder(oldParent.id)
    }
  }

  const match = matchDomain(tab.url)
  if (!match) return

  const { domainKey, title } = match

  // Check Panel Priority: if an active panel move rule applies, let it route first
  const panelMoveRule = Tabs.findMoveRule(tab)
  let targetPanelId = tab.panelId
  if (panelMoveRule && panelMoveRule.panelId !== tab.panelId) {
    targetPanelId = panelMoveRule.panelId
  } else {
    // Domain Priority: If an existing domain tree already exists in another panel, target that panel
    const globalPlaceholder = findExistingDomainPlaceholder(domainKey)
    if (globalPlaceholder) {
      targetPanelId = globalPlaceholder.panelId
    }
  }

  const targetPanel = Sidebar.panelsById[targetPanelId]
  if (!Utils.isTabsPanel(targetPanel)) return

  // Check if placeholder already exists in target panel
  let placeholder = findExistingDomainPlaceholder(domainKey, targetPanelId)

  if (placeholder) {
    if (tab.parentId === placeholder.id && tab.panelId === targetPanelId) {
      await scanSubDomainTrees(placeholder)
      return
    }

    // Move tab under existing placeholder
    log('INFO', 'HandleTab', `Moving tab ${tabId} into existing placeholder ${placeholder.id} (${domainKey})`)
    await attachTabsToPlaceholder([tab], placeholder, targetPanel)
    await scanSubDomainTrees(placeholder)
    if (isNamedDomainRule(domainKey)) {
      await ensureNamedDomainTreesAtTop(targetPanelId)
    }
    return
  }

  // No placeholder exists yet. Check threshold (1+ for custom rules, 2+ for universal)
  const existingDomainTabs = getDomainTabs(domainKey, targetPanelId)
  const tabIncluded = existingDomainTabs.some(t => t.id === tab.id)
  const allDomainTabs = tabIncluded ? existingDomainTabs : [...existingDomainTabs, tab]

  log(
    'INFO',
    'HandleTab',
    `Tab ${tabId}: domainKey="${domainKey}", allDomainTabs=${allDomainTabs.length} in panel ${targetPanelId}`
  )

  const isCustom = matchCustomRule(tab.url) !== null || isCustomRuleDomainKey(domainKey)
  const threshold = isCustom ? 1 : 2

  if (allDomainTabs.length < threshold) {
    // Only 1 tab of this domain in universal mode. Remains an ordinary tab.
    return
  }

  // 2+ tabs! Create the placeholder header tab.
  placeholder = await createPlaceholder(domainKey, title, targetPanelId, allDomainTabs[0])
  if (!placeholder) return

  // Batch move all domain tabs under the placeholder together
  const tabsToAttach = allDomainTabs.filter(
    t => t.id !== placeholder!.id && t.parentId !== placeholder!.id
  )
  if (tabsToAttach.length > 0) {
    await attachTabsToPlaceholder(tabsToAttach, placeholder, targetPanel)
  }

  await scanSubDomainTrees(placeholder)
  if (isNamedDomainRule(domainKey)) {
    await ensureNamedDomainTreesAtTop(targetPanelId)
  }
  } finally {
    inFlightTabs.delete(tabId)
  }
}

async function createPlaceholder(
  domainKey: string,
  title: string,
  panelId: ID,
  firstTab?: T.Tab
): Promise<T.Tab | undefined> {
  if (!checkCircuitBreaker()) return

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const lockKey = `${panelId}:${domainKey}`
  let creating = creatingPlaceholder.get(lockKey)
  if (creating) return creating

  log('INFO', 'CreatePlaceholder', `Creating placeholder for "${domainKey}" ("${title}") in panel ${panelId}`)

  const promise = (async () => {
    const existing = findExistingDomainPlaceholder(domainKey, panelId)
    if (existing) {
      log('INFO', 'CreatePlaceholder', `Found existing placeholder ${existing.id} for "${domainKey}"`)
      return existing
    }

    const isNamed = isNamedDomainRule(domainKey)
    const targetIndex = isNamed
      ? getNamedDomainTreeInsertionIndex(panelId)
      : firstTab ? firstTab.index : panel.startTabIndex
    const url = createDomainTreeUrl(domainKey, title)

    Tabs.setNewTabPosition(targetIndex, NOID, panelId, false, true)
    const nativeTab = await browser.tabs.create({
      active: false,
      cookieStoreId: firstTab?.cookieStoreId ?? DEFAULT_CONTAINER_ID,
      index: targetIndex,
      url,
      windowId: Windows.id,
    })

    log('INFO', 'CreatePlaceholder', `Native tab created: id=${nativeTab.id}, index=${nativeTab.index}`)

    pendingPlaceholders.add(nativeTab.id)
    setTimeout(() => pendingPlaceholders.delete(nativeTab.id), 5000)

    let placeholderTab = Tabs.byId[nativeTab.id]
    if (!placeholderTab) {
      for (let i = 0; i < 30; i++) {
        await Utils.sleep(50)
        placeholderTab = Tabs.byId[nativeTab.id]
        if (placeholderTab) break
      }
    }

    log('INFO', 'CreatePlaceholder', `Placeholder tab resolved: id=${placeholderTab?.id ?? 'NOT_RESOLVED'}`)
    return placeholderTab
  })()

  creatingPlaceholder.set(lockKey, promise)
  try {
    return await promise
  } finally {
    creatingPlaceholder.delete(lockKey)
  }
}

export async function createSubPlaceholder(
  subKey: string,
  title: string,
  parentPlaceholder: T.Tab,
  firstTab?: T.Tab
): Promise<T.Tab | undefined> {
  if (!checkCircuitBreaker()) return

  const panel = Sidebar.panelsById[parentPlaceholder.panelId]
  if (!Utils.isTabsPanel(panel)) return

  const lockKey = `${parentPlaceholder.id}:${subKey}`
  let creating = creatingPlaceholder.get(lockKey)
  if (creating) {
    return creating
  }

  log('INFO', 'CreateSubPlaceholder', `Creating sub-placeholder for "${subKey}" under placeholder ${parentPlaceholder.id}`)

  const promise = (async () => {
    const targetIndex = firstTab ? firstTab.index : parentPlaceholder.index + 1
    const url = createDomainTreeUrl(subKey, title)

    Tabs.setNewTabPosition(targetIndex, parentPlaceholder.id, parentPlaceholder.panelId, false, true)
    const nativeTab = await browser.tabs.create({
      active: false,
      cookieStoreId: firstTab?.cookieStoreId ?? parentPlaceholder.cookieStoreId ?? DEFAULT_CONTAINER_ID,
      index: targetIndex,
      url,
      windowId: Windows.id,
    })

    log('INFO', 'CreateSubPlaceholder', `Native sub-tab created: id=${nativeTab.id}, index=${nativeTab.index}`)

    pendingPlaceholders.add(nativeTab.id)
    setTimeout(() => pendingPlaceholders.delete(nativeTab.id), 5000)

    let placeholderTab = Tabs.byId[nativeTab.id]
    if (!placeholderTab) {
      for (let i = 0; i < 30; i++) {
        await Utils.sleep(50)
        placeholderTab = Tabs.byId[nativeTab.id]
        if (placeholderTab) break
      }
    }

    if (placeholderTab && placeholderTab.parentId !== parentPlaceholder.id) {
      const dst = {
        index: placeholderTab.index,
        panelId: parentPlaceholder.panelId,
        parentId: parentPlaceholder.id,
      }
      await Tabs.move([placeholderTab], {}, dst)
    }

    log('INFO', 'CreateSubPlaceholder', `Sub-placeholder resolved: id=${placeholderTab?.id ?? 'NOT_RESOLVED'}`)
    return placeholderTab
  })()

  creatingPlaceholder.set(lockKey, promise)
  try {
    return await promise
  } finally {
    creatingPlaceholder.delete(lockKey)
  }
}

export async function scanSubDomainTrees(parentPlaceholder: T.Tab, depth = 0): Promise<void> {
  if (!Settings.state.domainTrees || depth > 3) return
  const freshParent = Tabs.byId[parentPlaceholder.id] ?? parentPlaceholder
  if (!isDomainTreeGroup(freshParent)) return

  const parentDomainKey = getDomainTreeKey(freshParent)
  if (!parentDomainKey) return

  const panel = Sidebar.panelsById[freshParent.panelId]
  if (!Utils.isTabsPanel(panel)) return

  const branch = Tabs.getBranch(freshParent, false)
  const existingSubPlaceholders = branch.filter(
    t => t.id !== freshParent.id && isDomainTreeGroup(t) && t.parentId === freshParent.id
  )
  const contentTabs = branch.filter(
    t => !isDomainTreeGroup(t) && !t.internal && !t.isGroup && !t.pinned && !Tabs.removingTabs?.includes(t.id)
  )

  const subDomainGroups = new Map<string, { title: string; tabs: T.Tab[] }>()

  for (const tab of contentTabs) {
    const customMatch = matchCustomRule(tab.url)
    if (customMatch && customMatch.domainKey !== parentDomainKey) {
      // Check if this parentPlaceholder is a daughter tree of an ancestor custom rule
      const ancestorTree = getAncestorDomainTree(freshParent)
      const ancestorKey = ancestorTree ? getDomainTreeKey(ancestorTree) : undefined
      if (ancestorKey && ancestorKey === customMatch.domainKey) {
        // Tab belongs to the ancestor custom category tree, so it is valid inside this daughter tree!
      } else {
        // Tab matches an explicit custom rule! Must not stay in parent tree.
        const dst = {
          index: tab.index,
          panelId: tab.panelId,
          parentId: NOID,
        }
        await Tabs.move([tab], {}, dst)
        handleDomainTabDebounced(tab.id)
        continue
      }
    }

    const subMatch = getSubDomainKey(tab.url, parentDomainKey)
    if (!subMatch) {
      // Root tab of parent domain. If it was under a sub-placeholder, move it directly to parent.
      if (tab.parentId !== freshParent.id) {
        const dst = {
          index: tab.index,
          panelId: tab.panelId,
          parentId: freshParent.id,
        }
        await Tabs.move([tab], {}, dst)
      }
      continue
    }

    let group = subDomainGroups.get(subMatch.subKey)
    if (!group) {
      group = { title: subMatch.title, tabs: [] }
      subDomainGroups.set(subMatch.subKey, group)
    }
    group.tabs.push(tab)
  }

  for (const [subKey, { title, tabs }] of subDomainGroups) {
    let subPlaceholder = findExistingSubPlaceholder(subKey, freshParent.id)

    if (tabs.length < 2) {
      if (subPlaceholder) {
        // Only 1 tab in this sub-tree: dissolve it and move tab up
        for (const t of tabs) {
          const dst = {
            index: subPlaceholder.index,
            panelId: freshParent.panelId,
            parentId: freshParent.id,
          }
          await Tabs.move([t], {}, dst)
        }
        lastActiveChildMap.delete(subPlaceholder.id)
        if (subPlaceholder.folded) Tabs.expTabsBranch(subPlaceholder.id)
        await Tabs.removeTabs([subPlaceholder.id], true)
      } else {
        // Threshold not met. Keep tabs directly under freshParent.
        for (const t of tabs) {
          if (t.parentId !== freshParent.id) {
            const dst = {
              index: t.index,
              panelId: t.panelId,
              parentId: freshParent.id,
            }
            await Tabs.move([t], {}, dst)
          }
        }
      }
      continue
    }

    if (!subPlaceholder) {
      subPlaceholder = await createSubPlaceholder(subKey, title, freshParent, tabs[0])
      if (!subPlaceholder) continue
    }

    const tabsToAttach = tabs.filter(t => t.parentId !== subPlaceholder!.id)
    if (tabsToAttach.length > 0) {
      await attachTabsToPlaceholder(tabsToAttach, subPlaceholder, panel)
    }

    // Recursively scan sub-placeholder
    await scanSubDomainTrees(subPlaceholder, depth + 1)
  }

  // Clean empty or single-tab sub-placeholders
  for (const sph of existingSubPlaceholders) {
    await checkEmptyOrSinglePlaceholder(sph.id)
  }

  // Update favicons
  for (const sph of existingSubPlaceholders) {
    updateDomainTreeFavicon(sph)
  }
  updateDomainTreeFavicon(freshParent)
}

async function attachTabsToPlaceholder(
  tabsToAttach: T.Tab[],
  placeholder: T.Tab,
  panel: T.TabsPanel
): Promise<void> {
  if (!tabsToAttach.length) {
    pendingPlaceholders.delete(placeholder.id)
    return
  }

  const oldParentIds = new Set<ID>()
  for (const t of tabsToAttach) {
    if (t.parentId !== NOID && t.parentId !== placeholder.id) {
      oldParentIds.add(t.parentId)
    }
  }

  const freshPlaceholder = Tabs.byId[placeholder.id] ?? placeholder
  const branchLen = Tabs.getBranchLen(freshPlaceholder.id) ?? 0
  const insertAtTop = Settings.state.domainTreeNewTabPosition === 'first_child'
  const dst = {
    index: insertAtTop ? freshPlaceholder.index + 1 : freshPlaceholder.index + branchLen + 1,
    panelId: panel.id,
    parentId: freshPlaceholder.id,
  }

  try {
    await Tabs.move(tabsToAttach, {}, dst)
  } finally {
    pendingPlaceholders.delete(freshPlaceholder.id)
  }

  for (const oldParentId of oldParentIds) {
    if (Tabs.byId[oldParentId]) {
      await checkEmptyOrSinglePlaceholder(oldParentId)
    }
  }

  // Update domain tree favicon to match the domain with the most tabs
  updateDomainTreeFavicon(freshPlaceholder)
  if (freshPlaceholder.parentId !== NOID && isDomainTreeGroup(Tabs.byId[freshPlaceholder.parentId])) {
    updateDomainTreeFavicon(Tabs.byId[freshPlaceholder.parentId])
  }

  // Auto-fold if configured and the active tab is not in the branch
  if (Settings.state.domainTreeAutoFold) {
    const actTab = Tabs.byId[Tabs.activeId]
    const isActInBranch =
      actTab &&
      (actTab.id === freshPlaceholder.id ||
        actTab.parentId === freshPlaceholder.id ||
        tabsToAttach.some(t => t.id === actTab.id))

    if (!isActInBranch && freshPlaceholder.reactive) {
      Tabs.foldTabsBranch(freshPlaceholder.id)
    }
  }
}

/**
 * Update the favicon of a domain tree placeholder to match the domain with the most tabs.
 */
export function updateDomainTreeFavicon(placeholderTabOrId?: T.Tab | ID): void {
  if (placeholderTabOrId === undefined) return
  const placeholder: T.Tab | undefined =
    typeof placeholderTabOrId === 'object' ? placeholderTabOrId : Tabs.byId[placeholderTabOrId]
  if (!placeholder || !isDomainTreeGroup(placeholder)) return

  // Get all descendant tabs in the branch
  const children = Tabs.getBranch(placeholder, false)
  if (!children.length) return

  // Count tabs per domain & collect candidate favicons per domain
  const domainCounts = new Map<string, { count: number; favicon?: string }>()

  for (const child of children) {
    if (child.pinned || child.id === placeholder.id || child.removing || isDomainTreeGroup(child)) continue
    let hostname = ''
    try {
      hostname = new URL(child.url).hostname
    } catch {
      continue
    }
    if (!hostname) continue

    const domain = (Utils.getDomain(hostname, true, 1) || hostname).toLowerCase()

    let entry = domainCounts.get(domain)
    if (!entry) {
      entry = { count: 0 }
      domainCounts.set(domain, entry)
    }
    entry.count++

    // Best favicon for this domain
    if (!entry.favicon) {
      if (child.favIconUrl && !child.favIconUrl.startsWith('chrome:')) {
        entry.favicon = child.favIconUrl
      } else {
        const cachedFav = Favicons.getFavicon(child.url)
        if (cachedFav && !cachedFav.startsWith('#')) {
          entry.favicon = cachedFav
        }
      }
    }
  }

  // Sort domains by tab count descending
  const sortedDomains = Array.from(domainCounts.entries()).sort((a, b) => b[1].count - a[1].count)

  let bestFavicon: string | undefined

  // Find favicon for the domain with the most tabs (checking top domains in order)
  for (const [domain, { favicon }] of sortedDomains) {
    if (favicon) {
      bestFavicon = favicon
      break
    }
    const cached = Favicons.reactive.byDomains[domain]
    if (cached && !cached.startsWith('#')) {
      bestFavicon = cached
      break
    }
  }

  // Fallback to any child tab favicon in the branch
  if (!bestFavicon) {
    for (const child of children) {
      if (child.pinned || isDomainTreeGroup(child)) continue
      if (child.favIconUrl && !child.favIconUrl.startsWith('chrome:')) {
        bestFavicon = child.favIconUrl
        break
      }
      const cached = Favicons.getFavicon(child.url)
      if (cached && !cached.startsWith('#')) {
        bestFavicon = cached
        break
      }
    }
  }

  if (placeholder.favIconUrl !== bestFavicon) {
    placeholder.favIconUrl = bestFavicon
    Tabs.renderFavicon(placeholder)
  }
}

export function updateAllDomainTreesFavicons(): void {
  if (!Settings.state.domainTrees) return
  for (const tab of Tabs.list) {
    if (isDomainTreeGroup(tab)) {
      updateDomainTreeFavicon(tab)
    }
  }
}

const checkingPlaceholders = new Set<ID>()

export async function checkEmptyOrSinglePlaceholder(placeholderId: ID): Promise<void> {
  if (!Settings.state.domainTrees) return
  if (checkingPlaceholders.has(placeholderId)) return

  const placeholder = Tabs.byId[placeholderId]
  if (!placeholder) return
  const isDT = isDomainTreeGroup(placeholder)
  const isGrp = placeholder.isGroup || (placeholder.url ? Utils.isGroupUrl(placeholder.url) : false)
  if (!isDT && !isGrp) return
  if (pendingPlaceholders.has(placeholder.id)) return
  if (Tabs.removingTabs?.includes(placeholder.id)) return

  checkingPlaceholders.add(placeholderId)
  try {
    const branch = Tabs.getBranch(placeholder, false)
    const contentTabs = branch.filter(
      t =>
        t.id !== placeholder.id &&
        (t.parentId === placeholder.id || Tabs.findAncestor(t, a => a.id === placeholder.id)) &&
        !Tabs.removingTabs?.includes(t.id) &&
        !isDomainTreeGroup(t) &&
        !t.internal &&
        !t.isGroup
    )

    if (contentTabs.length === 0) {
      const isRule =
        isDT &&
        (isCustomRulePlaceholder(placeholder, contentTabs) ||
          isNamedDomainRule(getDomainTreeKey(placeholder)))

      if (isRule) {
        log(
          'INFO',
          'CleanEmpty',
          `Preserving empty rule tree: ${placeholder.id} (${getDomainTreeKey(placeholder)})`
        )
        updateDomainTreeFavicon(placeholder)
        return
      }

      log(
        'WARN',
        'CleanEmpty',
        `Auto-removing empty tree: ${placeholder.id} (${getDomainTreeKey(placeholder) ?? placeholder.title ?? placeholder.url})`
      )
      const pinnedTab = Tabs.list.find(t => t.pinned && t.relGroupId === placeholder.id)
      if (pinnedTab) pinnedTab.relGroupId = NOID

      lastActiveChildMap.delete(placeholder.id)
      const parentId = placeholder.parentId
      if (placeholder.folded) Tabs.expTabsBranch(placeholder.id)
      await Tabs.removeTabs([placeholder.id], true)
      if (parentId !== NOID) {
        const pTab = Tabs.byId[parentId]
        if (pTab && (isDomainTreeGroup(pTab) || pTab.isGroup || (pTab.url ? Utils.isGroupUrl(pTab.url) : false))) {
          await checkEmptyOrSinglePlaceholder(parentId)
        }
      }
    } else if (contentTabs.length === 1) {
      if (!isDT) {
        return
      }
      const isTopLevel =
        placeholder.parentId === NOID || !isDomainTreeGroup(Tabs.byId[placeholder.parentId])
      const domainKey = getDomainTreeKey(placeholder)

      if (isTopLevel && domainKey) {
        // Custom rule root trees should NOT dissolve when down to 1 tab!
        if (isCustomRulePlaceholder(placeholder, contentTabs)) {
          log(
            'INFO',
            'CheckDissolve',
            `Preserving custom rule root placeholder ${placeholder.id} (${domainKey}) with 1 child tab`
          )
          updateDomainTreeFavicon(placeholder)
          return
        }

        // Before dissolving a top-level tree, check if there are 2+ tabs of this domain in the panel
        const allPanelTabs = Tabs.list.filter(
          t =>
            t.panelId === placeholder.panelId &&
            !t.pinned &&
            !t.internal &&
            !t.isGroup &&
            !isDomainTreeGroup(t) &&
            matchDomain(t.url)?.domainKey === domainKey
        )
        if (allPanelTabs.length >= 2) {
          log(
            'INFO',
            'CheckDissolve',
            `Preventing dissolution of placeholder ${placeholder.id} (${domainKey}) because ${allPanelTabs.length} tabs of this domain exist in panel`
          )
          // Do NOT dissolve! Attach unattached domain tabs instead.
          const unattached = allPanelTabs.filter(t => t.parentId !== placeholder.id)
          if (unattached.length > 0) {
            const panel = Sidebar.panelsById[placeholder.panelId]
            if (Utils.isTabsPanel(panel)) {
              await attachTabsToPlaceholder(unattached, placeholder, panel)
            }
          }
          return
        }
      }

      const singleTab = contentTabs[0]
      const targetParentId = placeholder.parentId
      const targetIndex = placeholder.index

      log(
        'WARN',
        'Dissolve',
        `Dissolving single-tab tree ${placeholder.id} (${domainKey}) and promoting tab ${singleTab.id} to parent ${targetParentId}`
      )

      if (placeholder.folded) Tabs.expTabsBranch(placeholder.id)

      // Move single tab up to placeholder's parent level
      const dst = {
        index: targetIndex,
        panelId: placeholder.panelId,
        parentId: targetParentId,
      }
      await Tabs.move([singleTab], {}, dst)

      lastActiveChildMap.delete(placeholder.id)
      await Tabs.removeTabs([placeholder.id], true)

      if (targetParentId !== NOID) {
        const pTab = Tabs.byId[targetParentId]
        if (pTab && (isDomainTreeGroup(pTab) || pTab.isGroup || (pTab.url ? Utils.isGroupUrl(pTab.url) : false))) {
          await checkEmptyOrSinglePlaceholder(targetParentId)
        }
      }
    } else {
      updateDomainTreeFavicon(placeholder)
    }
  } finally {
    checkingPlaceholders.delete(placeholderId)
  }
}

export function checkEmptyPlaceholder(placeholderId: ID): void {
  checkEmptyOrSinglePlaceholder(placeholderId)
}

export async function deduplicateDomainTrees(panelId?: ID): Promise<void> {
  if (!Settings.state.domainTrees) return

  const panels = panelId !== undefined
    ? [Sidebar.panelsById[panelId]].filter(Utils.isTabsPanel)
    : Sidebar.panels.filter(Utils.isTabsPanel)

  for (const panel of panels) {
    if (!panel) continue

    const placeholdersByDomain = new Map<string, T.Tab[]>()
    for (const tab of Tabs.list) {
      if (
        tab.panelId === panel.id &&
        isDomainTreeGroup(tab) &&
        (tab.parentId === NOID || !isDomainTreeGroup(Tabs.byId[tab.parentId]))
      ) {
        const key = getDomainTreeKey(tab)
        if (!key) continue
        let list = placeholdersByDomain.get(key)
        if (!list) {
          list = []
          placeholdersByDomain.set(key, list)
        }
        list.push(tab)
      }
    }

    for (const [key, list] of placeholdersByDomain) {
      if (list.length <= 1) continue
      // Keep the primary placeholder (preferably one with children, or the first one)
      let primary = list[0]
      let maxBranch = -1
      for (const ph of list) {
        const bl = Tabs.getBranch(ph, false).filter(t => !isDomainTreeGroup(t)).length
        if (bl > maxBranch) {
          maxBranch = bl
          primary = ph
        }
      }

      const duplicates = list.filter(ph => ph.id !== primary.id)
      log(
        'WARN',
        'Deduplicate',
        `Found ${duplicates.length} duplicate placeholders for domain "${key}". Consolidating under canonical placeholder ${primary.id}.`
      )
      for (const dup of duplicates) {
        const children = Tabs.getBranch(dup, false).filter(t => !isDomainTreeGroup(t))
        if (children.length > 0) {
          const freshPrimary = Tabs.byId[primary.id] ?? primary
          const dst = {
            index: freshPrimary.index + (Tabs.getBranchLen(freshPrimary.id) ?? 0) + 1,
            panelId: panel.id,
            parentId: freshPrimary.id,
          }
          await Tabs.move(children, {}, dst)
        }
        if (dup.folded) Tabs.expTabsBranch(dup.id)
        lastActiveChildMap.delete(dup.id)
        await Tabs.removeTabs([dup.id], true)
      }
    }
  }
}

export async function cleanEmptyDomainTrees(panelId?: ID): Promise<void> {
  if (!Settings.state.domainTrees) return

  await deduplicateDomainTrees(panelId)

  const placeholders = Tabs.list.filter(
    t =>
      (isDomainTreeGroup(t) || t.isGroup || (t.url ? Utils.isGroupUrl(t.url) : false)) &&
      !pendingPlaceholders.has(t.id) &&
      !Tabs.removingTabs?.includes(t.id) &&
      (panelId === undefined || t.panelId === panelId)
  )

  log('INFO', 'CleanEmpty', `Evaluating ${placeholders.length} placeholders for emptiness`)

  // Sort by lvl descending so deepest sub-placeholders are evaluated first
  placeholders.sort((a, b) => b.lvl - a.lvl)

  for (const ph of placeholders) {
    if (Tabs.byId[ph.id] && !Tabs.removingTabs?.includes(ph.id)) {
      await checkEmptyOrSinglePlaceholder(ph.id)
    }
  }
}

let cleanEmptyTimeout: number | undefined
export function cleanEmptyDomainTreesDebounced(delay = 100): void {
  clearTimeout(cleanEmptyTimeout)
  cleanEmptyTimeout = setTimeout(() => {
    cleanEmptyDomainTrees()
  }, delay)
}

export async function onTabRemovedCheck(removedTab: T.Tab): Promise<void> {
  if (!Settings.state.domainTrees) return
  if (removedTab.parentId === NOID) return

  const parentPlaceholders: ID[] = []
  let p: T.Tab | undefined = removedTab
  while (p && p.parentId !== NOID) {
    const next: T.Tab | undefined = Tabs.byId[p.parentId]
    if (!next) break
    p = next
    if (isDomainTreeGroup(next) || next.isGroup || (next.url ? Utils.isGroupUrl(next.url) : false)) {
      parentPlaceholders.push(next.id)
    }
  }

  for (const phId of parentPlaceholders) {
    await checkEmptyOrSinglePlaceholder(phId)
  }
}

export async function checkGuardedPlaceholderClose(tabIds: ID[]): Promise<boolean> {
  if (!Settings.state.domainTrees || !Settings.state.domainTreeConfirmClose) return true

  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab || !isDomainTreeGroup(tab)) continue

    const branch = Tabs.getBranch(tab, false).filter(
      t => !tabIds.includes(t.id) && !isDomainTreeGroup(t)
    )
    if (branch.length > 0) {
      const domainKey = getDomainTreeKey(tab) || tab.title
      const ok = await Popups.confirm(
        translate('confirm.domain_tree_close', domainKey, branch.length),
        ConfirmationType.RmTab
      )
      if (!ok) return false
    }
  }

  return true
}
