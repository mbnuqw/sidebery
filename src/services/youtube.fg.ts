import type { Tab } from 'src/types'
import * as Tabs from 'src/services/tabs.fg'
import * as Logs from 'src/services/logs'
import * as Permissions from 'src/services/permissions.fg'

function isYouTubePlaybackUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('youtube.com/shorts/')
  )
}

/**
 * Prefer the tab that is currently audible; otherwise any matching paused YouTube tab.
 */
export function getTargetTab(): Tab | undefined {
  for (const t of Tabs.list) {
    void t.reactive.mediaAudible
    void t.reactive.mediaPaused
    void t.reactive.mediaMuted
    void t.reactive.url
  }

  const audible = Tabs.list.find(
    t =>
      isYouTubePlaybackUrl(t.reactive.url) &&
      (t.reactive.mediaAudible || t.audible) &&
      !t.discarded
  )
  if (audible) return audible

  return Tabs.list.find(
    t =>
      isYouTubePlaybackUrl(t.reactive.url) &&
      (t.reactive.mediaPaused || t.mediaPaused) &&
      !t.discarded
  )
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
