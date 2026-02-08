import { Reactivator } from 'src/types'
import * as Utils from 'src/utils'

import * as Permissions from 'src/services/permissions'

export interface PermissionsState {
  webData: boolean
  bookmarks: boolean
  tabHide: boolean
  clipboardWrite: boolean
  clipboardRead: boolean
  history: boolean
  downloads: boolean
}

export let reactive: PermissionsState = {
  webData: false,
  bookmarks: false,
  tabHide: false,
  clipboardWrite: false,
  clipboardRead: false,
  history: false,
  downloads: false,
}

export let allUrls = false
export let webRequest = false
export let webRequestBlocking = false
export let proxy = false

export let bookmarks = false
export let tabHide = false
export let clipboardWrite = false
export let clipboardRead = false
export let history = false
export let downloads = false

export function reactivate(r: Reactivator<PermissionsState>) {
  reactive = r(reactive)
}

/**
 * Retrieve current permissions
 */
export async function load(): Promise<void> {
  const perms = await Promise.all([
    browser.permissions.contains({ origins: ['<all_urls>'] }),
    browser.permissions.contains({ permissions: ['webRequest'] }),
    browser.permissions.contains({ permissions: ['webRequestBlocking'] }),
    browser.permissions.contains({ permissions: ['proxy'] }),
    browser.permissions.contains({ permissions: ['tabHide'] }),
    browser.permissions.contains({ permissions: ['clipboardWrite'] }),
    browser.permissions.contains({ permissions: ['clipboardRead'] }),
    browser.permissions.contains({ permissions: ['history'] }),
    browser.permissions.contains({ permissions: ['bookmarks'] }),
    browser.permissions.contains({ permissions: ['downloads'] }),
  ])
  allUrls = perms[0]
  webRequest = perms[1]
  webRequestBlocking = perms[2]
  proxy = perms[3]
  tabHide = perms[4]
  clipboardWrite = perms[5]
  clipboardRead = perms[6]
  history = perms[7]
  bookmarks = perms[8]
  downloads = perms[9]

  reactive.webData = allUrls && webRequest && webRequestBlocking && proxy
  reactive.tabHide = Permissions.tabHide
  reactive.clipboardWrite = Permissions.clipboardWrite
  reactive.clipboardRead = Permissions.clipboardRead
  reactive.history = Permissions.history
  reactive.bookmarks = Permissions.bookmarks
  reactive.downloads = Permissions.downloads

  if (!Permissions.reactive.webData) removedWebDataHandler?.()
  if (!Permissions.tabHide) removedTabHideHandler?.()
  if (!Permissions.history) removedHistoryHandler?.()
  if (!Permissions.bookmarks) removedBookmarksHandler?.()
  if (!Permissions.downloads) removedDownloadsHandler?.()
}

export type RequestablePermission =
  | '<all_urls>'
  | 'tabHide'
  | 'clipboardWrite'
  | 'clipboardRead'
  | 'history'
  | 'bookmarks'
  | 'downloads'

export async function _request(...perms: RequestablePermission[]): Promise<boolean> {
  const origins: string[] = []
  const permissions: string[] = []

  if (perms.includes('<all_urls>')) {
    origins.push('<all_urls>')
    permissions.push('webRequest', 'webRequestBlocking', 'proxy')
    Utils.rmFromArray(perms, '<all_urls>')
  }

  permissions.push(...perms)
  return await browser.permissions.request({ origins, permissions })
}

function onAdded(info: browser.permissions.Permissions) {
  if (info.origins?.includes('<all_urls>')) allUrls = true
  if (info.permissions?.includes('webRequest')) webRequest = true
  if (info.permissions?.includes('webRequestBlocking')) webRequestBlocking = true
  if (info.permissions?.includes('proxy')) proxy = true
  reactive.webData = allUrls && webRequest && webRequestBlocking && proxy

  if (info.permissions?.includes('tabHide')) {
    tabHide = true
    reactive.tabHide = true
  }
  if (info.permissions?.includes('clipboardWrite')) {
    clipboardWrite = true
    reactive.clipboardWrite = true
  }
  if (info.permissions?.includes('clipboardRead')) {
    clipboardRead = true
    reactive.clipboardRead = true
  }
  if (info.permissions?.includes('history')) {
    history = true
    reactive.history = true
    addedHistoryHandler?.()
  }
  if (info.permissions?.includes('bookmarks')) {
    bookmarks = true
    reactive.bookmarks = true
    addedBookmarksHandler?.()
  }
  if (info.permissions?.includes('downloads')) {
    downloads = true
    reactive.downloads = true
  }
}

function onRemoved(info: browser.permissions.Permissions): void {
  let webDataRemoved
  if (info.origins?.includes('<all_urls>')) {
    allUrls = false
    webDataRemoved = true
  }
  if (info.permissions?.includes('webRequest')) {
    webRequest = false
    webDataRemoved = true
  }
  if (info.permissions?.includes('webRequestBlocking')) {
    webRequestBlocking = false
    webDataRemoved = true
  }
  if (info.permissions?.includes('proxy')) {
    proxy = false
    webDataRemoved = true
  }

  if (webDataRemoved) {
    reactive.webData = false
    removedWebDataHandler?.()
  }

  if (info.permissions?.includes('tabHide')) {
    tabHide = false
    reactive.tabHide = false
    removedTabHideHandler?.()
  }

  if (info.permissions?.includes('clipboardWrite')) {
    clipboardWrite = false
    reactive.clipboardWrite = false
  }

  if (info.permissions?.includes('clipboardRead')) {
    clipboardRead = false
    reactive.clipboardRead = false
  }

  if (info.permissions?.includes('history')) {
    history = false
    reactive.history = false
    removedHistoryHandler?.()
  }

  if (info.permissions?.includes('bookmarks')) {
    bookmarks = false
    reactive.bookmarks = false
    removedBookmarksHandler?.()
  }

  if (info.permissions?.includes('downloads')) {
    downloads = false
    reactive.downloads = false
    removedDownloadsHandler?.()
  }
}

export function _setupListeners(): void {
  browser.permissions.onAdded.addListener(onAdded)
  browser.permissions.onRemoved.addListener(onRemoved)
}

let removedWebDataHandler: (() => void) | undefined
export const setRemovedWebDataHandler = (h: () => void) => (removedWebDataHandler = h)

let removedTabHideHandler: (() => void) | undefined
export const setRemovedTabHideHandler = (h: () => void) => (removedTabHideHandler = h)

let addedHistoryHandler: (() => void) | undefined
export const setAddedHistoryHandler = (h: () => void) => (addedHistoryHandler = h)
let removedHistoryHandler: (() => void) | undefined
export const setRemovedHistoryHandler = (h: () => void) => (removedHistoryHandler = h)

let addedBookmarksHandler: (() => void) | undefined
export const setAddedBookmarksHandler = (h: () => void) => (addedBookmarksHandler = h)
let removedBookmarksHandler: (() => void) | undefined
export const setRemovedBookmarksHandler = (h: () => void) => (removedBookmarksHandler = h)

let removedDownloadsHandler: (() => void) | undefined
export const setRemovedDownloadsHandler = (h: () => void) => (removedDownloadsHandler = h)
