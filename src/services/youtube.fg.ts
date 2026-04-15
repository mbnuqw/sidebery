import type { Tab, Reactivator } from 'src/types'
import { NOID } from 'src/defaults'
import * as Tabs from 'src/services/tabs.fg'
import * as Windows from 'src/services/windows.fg'
import * as Logs from 'src/services/logs'
import * as Permissions from 'src/services/permissions.fg'

export interface YouTubeReactiveState {
  probeTick: number
}

export let reactive: YouTubeReactiveState = { probeTick: 0 }

export function reactivate(r: Reactivator<YouTubeReactiveState>): void {
  reactive = r(reactive)
}

let nativeAudibleYtTabId: ID = NOID
let probeTimeout: number | undefined
let probeInterval: number | undefined
let listenersBound = false

function tabUrl(t: Tab): string {
  return t.url || t.reactive.url || ''
}

function isYouTubePlaybackUrl(url: string | undefined): boolean {
  if (!url || url.startsWith('about:')) return false
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    if (h === 'youtu.be') return true
    if (h === 'music.youtube.com') return u.pathname.startsWith('/watch')
    if (h === 'm.youtube.com' || h.endsWith('.youtube.com') || h === 'youtube.com') {
      const p = u.pathname
      return (
        p.startsWith('/watch') ||
        p.startsWith('/shorts/') ||
        p.startsWith('/live/') ||
        p.startsWith('/embed/')
      )
    }
  } catch {
    /* ignore */
  }
  return (
    url.includes('youtu.be/') ||
    url.includes('youtube.com/watch') ||
    url.includes('youtube.com/shorts/') ||
    url.includes('youtube.com/live/') ||
    url.includes('youtube.com/embed/') ||
    url.includes('music.youtube.com/watch')
  )
}

async function refreshNativeAudibleYouTubeTabId(): Promise<void> {
  if (!Windows.id) return
  try {
    const audibleTabs = await browser.tabs.query({ audible: true, windowId: Windows.id })
    let next: ID = NOID
    for (const nt of audibleTabs) {
      if (nt.id === undefined || !nt.url) continue
      if (isYouTubePlaybackUrl(nt.url)) {
        next = nt.id
        break
      }
    }
    if (next !== nativeAudibleYtTabId) {
      nativeAudibleYtTabId = next
      reactive.probeTick++
    }
  } catch (err) {
    Logs.err('YouTube: audible probe failed', err)
  }
}

function scheduleNativeAudibleProbe(): void {
  clearTimeout(probeTimeout)
  probeTimeout = setTimeout(() => {
    probeTimeout = undefined
    void refreshNativeAudibleYouTubeTabId()
  }, 80) as unknown as number
}

/** Sync audible YouTube tab id from Firefox (Sidebery tab updates can lag). */
export function setupYouTubeBarListeners(): void {
  if (listenersBound) return
  listenersBound = true

  const onUpdated = (_tabId: ID, change: browser.tabs.ChangeInfo): void => {
    if (
      change.audible !== undefined ||
      change.url !== undefined ||
      change.status !== undefined
    ) {
      scheduleNativeAudibleProbe()
    }
  }
  browser.tabs.onUpdated.addListener(onUpdated)
  browser.tabs.onActivated.addListener(scheduleNativeAudibleProbe)
  void refreshNativeAudibleYouTubeTabId()

  probeInterval = setInterval(() => {
    void refreshNativeAudibleYouTubeTabId()
  }, 3000) as unknown as number
}

/** Resolve target: native audible match, then Sidebery state, then active-tab fallback. */
export function getTargetTab(): Tab | undefined {
  for (const t of Tabs.list) {
    void t.reactive.mediaAudible
    void t.reactive.mediaPaused
    void t.reactive.mediaMuted
    void t.reactive.url
    void t.reactive.active
  }
  void reactive.probeTick

  const urlOk = (t: Tab) => !t.discarded && isYouTubePlaybackUrl(tabUrl(t))

  if (nativeAudibleYtTabId !== NOID) {
    const t = Tabs.byId[nativeAudibleYtTabId]
    if (t && urlOk(t)) return t
  }

  const audible = Tabs.list.find(
    t => urlOk(t) && (t.reactive.mediaAudible || t.audible === true)
  )
  if (audible) return audible

  const paused = Tabs.list.find(t => urlOk(t) && (t.reactive.mediaPaused || t.mediaPaused))
  if (paused) return paused

  const act = Tabs.byId[Tabs.activeId]
  if (act && urlOk(act)) return act

  return undefined
}

export function isTargetMuted(tab: Tab): boolean {
  return tab.reactive.mediaMuted || tab.mutedInfo?.muted === true
}

export async function play(): Promise<void> {
  const tab = getTargetTab()
  if (!tab) return
  await Tabs.playTabMedia(tab.id)
}

export async function pause(): Promise<void> {
  const tab = getTargetTab()
  if (!tab) return
  await Tabs.pauseTabMedia(tab.id)
}

export function mute(): void {
  const tab = getTargetTab()
  if (!tab) return
  browser.tabs.update(tab.id, { muted: true }).catch(err => {
    Logs.err('YouTube: mute tab failed', err)
  })
}

export function unmute(): void {
  const tab = getTargetTab()
  if (!tab) return
  browser.tabs.update(tab.id, { muted: false }).catch(err => {
    Logs.err('YouTube: unmute tab failed', err)
  })
}

async function ensureScriptingPermission(): Promise<boolean> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return false
  }
  return true
}

export async function prevVideo(): Promise<void> {
  if (!(await ensureScriptingPermission())) return
  const tab = getTargetTab()
  if (!tab) return
  browser.tabs
    .executeScript(tab.id, {
      code: "void document.querySelector('.ytp-prev-button')?.click()",
      runAt: 'document_idle',
    })
    .catch(err => {
      Logs.err('YouTube: prev executeScript failed', err)
    })
}

export async function nextVideo(): Promise<void> {
  if (!(await ensureScriptingPermission())) return
  const tab = getTargetTab()
  if (!tab) return
  browser.tabs
    .executeScript(tab.id, {
      code: "void document.querySelector('.ytp-next-button')?.click()",
      runAt: 'document_idle',
    })
    .catch(err => {
      Logs.err('YouTube: next executeScript failed', err)
    })
}
