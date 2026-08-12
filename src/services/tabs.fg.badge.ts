import type * as T from 'src/types'
import { translate } from 'src/dict'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Notifications from 'src/services/notifications.fg'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

export interface BadgeRule {
  src: string
  urgent: boolean
  urlRe: RegExp
  urlAny: boolean
  urlVal: boolean
  titleRe: RegExp
  titleAny: boolean
  titleVal: boolean
  hasVal: boolean
  notify: boolean
  excludePinned: boolean
  excludeNormal: boolean
  staticValue?: string
  minIdleTime?: number
  bg?: string
  fg?: string
}

const URL_RE = /url:(?<u>.+?)(?:; |;?$)/
const TITLE_RE = /title:(?<t>.+?)(?:; |;?$)/
const BG_RE = /bg:(?<bg>.+?)(?:; |;?$)/
const FG_RE = /fg:(?<fg>.+?)(?:; |;?$)/
const URGENT_RE = /urgent(?:; |;?$)/
const NOTIFY_RE = /notify(?:; |;?$)/
const PINNED_RE = /pinned(?:; |;?$)/
const NORMAL_RE = /normal(?:; |;?$)/
const VALUE_RE = /value:(?<v>.+?)(?:; |;?$)/
const MIN_IDLE_TIME_RE = /minIdleTime:(?<time>\d+?)(?:; |;?$)/
const VAL_GROUP_RE = /\(?<v>(?:.+?)\)/

const badgeRules: BadgeRule[] = []
let idleCalcNeeded = false

export let badgeRulesEnabled = false

export function parseBadgeRegexpRules() {
  badgeRules.length = 0
  badgeRulesEnabled = false

  if (!Settings.state.tabsBadge) return

  const rulesConf = Settings.state.tabsBadgeRules
  for (const rule of rulesConf.trim().split('\n')) {
    try {
      badgeRules.push(parseBadgeRegexpRule(rule))
    } catch {
      continue
    }
  }
  badgeRulesEnabled = badgeRules.length > 0
}

/**
 * Update (Set/Remove) the badge for the target tab.
 *
 * Logic for applying the badge on unloaded/active tab and
 * resetting the badge on the tab unloading/activating:
 *
 * | Badge type | Has value | Apply?    | Reset?    |
 * |:-----------|-----------|-----------|-----------|
 * | Any        | No        | No        | Yes       |
 * | Normal     | Yes       | Yes       | No        |
 * | Urgent     | Yes       | Downgrade | Downgrade |
 */
export function updateBadge(tab: T.Tab, change?: browser.tabs.ChangeInfo) {
  if (badgeRulesEnabled) {
    let urlMatched = false
    let titleMatched = false
    let urlVal: string | undefined
    let titleVal: string | undefined
    let idleTime
    if (idleCalcNeeded && tab.lastActivity !== undefined) {
      idleTime = Date.now() - tab.lastActivity
    }

    for (const rule of badgeRules) {
      if (rule.excludeNormal && !tab.pinned) continue
      if (rule.excludePinned && tab.pinned) continue
      urlMatched = rule.urlAny
      titleMatched = rule.titleAny
      if (!urlMatched) {
        if (rule.urlVal) {
          const result = rule.urlRe.exec(tab.url)
          urlMatched = !!result
          urlVal = result?.groups?.v
        } else {
          urlMatched = rule.urlRe.test(tab.url)
        }
      }
      if (!titleMatched) {
        if (rule.titleVal) {
          const result = rule.titleRe.exec(tab.title)
          titleMatched = !!result
          titleVal = result?.groups?.v
        } else {
          titleMatched = rule.titleRe.test(tab.title)
        }
      }
      if (urlMatched && titleMatched) {
        const badgeValue = urlVal || titleVal || rule.staticValue || true
        // If the badge is value-less: ignore for active/unloaded tabs
        if (badgeValue === true && (tab.active || tab.discarded)) continue
        if (rule.minIdleTime !== undefined) {
          if (change?.title === undefined) continue
          if (idleTime === undefined) continue
          if (idleTime < rule.minIdleTime) continue
        }
        tab.reactive.badge = tab.badge = badgeValue
        tab.reactive.badgeBg = rule.bg ?? null
        tab.reactive.badgeFg = rule.fg ?? null
        const prevUrg = tab.badgeUrgent
        // If the badge should be urgent but the tab is active/unloaded, downgrade
        // to normal badge
        if (rule.urgent && !tab.active && !tab.discarded) {
          if (!prevUrg) tab.reactive.badgeUrgent = tab.badgeUrgent = true
        } else {
          if (prevUrg) tab.reactive.badgeUrgent = tab.badgeUrgent = false
        }
        if (rule.notify && change) {
          Notifications.notify({
            id: 'urgenttab' + tab.id,
            icon: tab.favIconUrl,
            title: tab.title.length > 36 ? tab.title.slice(0, 36) + '…' : tab.title,
            details:
              tab.url.length > 50 ? tab.url.slice(0, 25) + '…' + tab.url.slice(-24) : tab.url,
            ctrl: !tab.active ? translate('notif.switch_to_tab') : undefined,
            callback: () => browser.tabs.update(tab.id, { active: true }).catch(() => {}),
          })
        }
        if (prevUrg !== tab.badgeUrgent) propagateBadgeUrgency(tab)
        return
      }
    }
  }

  if (tab.badge) {
    tab.reactive.badge = tab.badge = false
    tab.reactive.badgeBg = null
    tab.reactive.badgeFg = null
    if (tab.badgeUrgent) {
      tab.reactive.badgeUrgent = tab.badgeUrgent = false
      propagateBadgeUrgency(tab)
    }
  }
}

export function updateBadges() {
  for (const tab of Tabs.list) {
    if (!tab.internal) updateBadge(tab)
  }
}

export function resetBadges() {
  for (const panel of Sidebar.panels) {
    if (!Utils.isTabsPanel(panel)) continue
    panel.urgentTabIds.clear()
    panel.reactive.badge = false
  }
  for (const tab of Tabs.list) {
    tab.reactive.badge = tab.badge = false
    tab.reactive.badgeBg = null
    tab.reactive.badgeFg = null
    tab.urgentTabIds?.clear()
    tab.reactive.badgeUrgent = tab.badgeUrgent = false
  }
}

export function resetUrgencyAndValuelessBadge(tab: T.Tab) {
  if (tab.badgeUrgent) tab.reactive.badgeUrgent = tab.badgeUrgent = false
  if (tab.badge === true) tab.reactive.badge = tab.badge = false
}

/**
 * Propagate urgency state to parent tabs and panel.
 */
export function propagateBadgeUrgency(tab: T.Tab, urgency?: boolean) {
  if (urgency === undefined) urgency = tab.badgeUrgent

  // Propagate to ancestors
  Tabs.findAncestor(tab, t => {
    if (urgency) {
      if (!t.urgentTabIds) t.urgentTabIds = new Set()
      if (t.urgentTabIds.size === 0) t.reactive.hasUrgentDescendant = true
      t.urgentTabIds.add(tab.id)
    } else {
      const prevSize = t.urgentTabIds?.size ?? 0
      t.urgentTabIds?.delete(tab.id)
      if (prevSize > 0 && t.urgentTabIds?.size === 0) t.reactive.hasUrgentDescendant = false
    }
  })

  if (!tab.pinned || Settings.state.pinnedTabsPosition === 'panel') {
    const panel = Sidebar.panelsById[tab.panelId]
    if (!Utils.isTabsPanel(panel)) return
    if (urgency) {
      if (panel.urgentTabIds.size === 0) panel.reactive.badge = true
      panel.urgentTabIds.add(tab.id)
    } else {
      const prevSize = panel.urgentTabIds.size
      panel.urgentTabIds.delete(tab.id)
      if (prevSize > 0) panel.reactive.badge = panel.urgentTabIds.size > 0
    }
  }
}

function reHasValGroup(re: string): boolean {
  return VAL_GROUP_RE.test(re)
}

export function parseBadgeRegexpRule(rule: string): BadgeRule {
  rule = rule.trim()
  if (!rule) throw 'no rule'

  const urlReStr = URL_RE.exec(rule)?.groups?.u
  const titleReStr = TITLE_RE.exec(rule)?.groups?.t
  const urlVal = urlReStr ? reHasValGroup(urlReStr) : false
  const titleVal = titleReStr ? reHasValGroup(titleReStr) : false
  const bg = BG_RE.exec(rule)?.groups?.bg
  const fg = FG_RE.exec(rule)?.groups?.fg
  const pinned = PINNED_RE.test(rule)
  const normal = NORMAL_RE.test(rule)
  const urgent = URGENT_RE.test(rule)
  const notify = NOTIFY_RE.test(rule)
  const staticValue = VALUE_RE.exec(rule)?.groups?.v
  const minIdleTimeStr = MIN_IDLE_TIME_RE.exec(rule)?.groups?.time
  const minIdleTime = minIdleTimeStr ? parseInt(minIdleTimeStr) : undefined
  const excludePinned = !pinned && normal
  const excludeNormal = !normal && pinned

  if (!idleCalcNeeded) idleCalcNeeded = minIdleTime !== undefined && !isNaN(minIdleTime)

  return {
    src: rule,
    urlRe: new RegExp(urlReStr ?? ''),
    urlAny: !urlReStr || urlReStr === '.*',
    urlVal,
    titleRe: new RegExp(titleReStr ?? ''),
    titleAny: !titleReStr || titleReStr === '.*',
    titleVal,
    hasVal: urlVal || titleVal,
    urgent,
    notify,
    excludePinned,
    excludeNormal,
    staticValue: staticValue === '.' ? ' ' : staticValue,
    minIdleTime: minIdleTime && !isNaN(minIdleTime) ? minIdleTime : undefined,
    bg,
    fg,
  }
}

export const TESTING = {
  badgeRules,
  reHasValGroup,
}
