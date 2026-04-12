import type { Tab } from 'src/types'
import * as Tabs from 'src/services/tabs.fg'
import * as Logs from 'src/services/logs'
import * as Permissions from 'src/services/permissions.fg'

/** Resolved URL for matching (native `url` is authoritative; reactive mirrors updates). */
export function tabUrl(t: Tab): string {
  return t.url || t.reactive.url || ''
}

function isYouTubePlaybackUrl(url: string | undefined): boolean {
  if (!url || url.startsWith('about:')) return false
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    if (h === 'youtu.be') return true
    if (h === 'music.youtube.com') return true
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

/**
 * 1) Audible YouTube tab (watch / shorts / live / embed / music / youtu.be).
 * 2) Paused-by-Sidebery YouTube tab.
 * 3) Active YouTube tab on a playback URL (covers muted video and delayed `audible` in Firefox).
 */
export function getTargetTab(): Tab | undefined {
  for (const t of Tabs.list) {
    void t.reactive.mediaAudible
    void t.reactive.mediaPaused
    void t.reactive.mediaMuted
    void t.reactive.url
    void t.reactive.active
  }

  const urlOk = (t: Tab) => !t.discarded && isYouTubePlaybackUrl(tabUrl(t))

  const audible = Tabs.list.find(
    t => urlOk(t) && (t.reactive.mediaAudible || t.audible === true)
  )
  if (audible) return audible

  const paused = Tabs.list.find(t => urlOk(t) && (t.reactive.mediaPaused || t.mediaPaused))
  if (paused) return paused

  return Tabs.list.find(t => urlOk(t) && t.reactive.active) ?? undefined
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
    Logs.err('YouTube.mute: Cannot mute tab:', err)
  })
}

export function unmute(): void {
  const tab = getTargetTab()
  if (!tab) return
  browser.tabs.update(tab.id, { muted: false }).catch(err => {
    Logs.err('YouTube.unmute: Cannot unmute tab:', err)
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
      Logs.err('YouTube.prevVideo: executeScript failed:', err)
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
      Logs.err('YouTube.nextVideo: executeScript failed:', err)
    })
}
