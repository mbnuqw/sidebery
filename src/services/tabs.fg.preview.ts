import type { Tab } from 'src/types'
import { NOID } from 'src/defaults'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Styles from 'src/services/styles.fg'
import * as Windows from 'src/services/windows.fg'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as Menu from 'src/services/menu.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as Selection from 'src/services/selection.fg'
import { TabPreviewInitData } from 'src/injections/tab-preview'

export const enum Status {
  Closing = -1,
  Closed = 0,
  Opening = 1,
  Open = 2,
}

export const enum Mode {
  Nope = 0,
  InSidebar = 1,
  InPage = 3,
}

export const state = {
  status: Status.Closed,
  mode: Mode.Nope,
  modeFallback: false,

  popupWinId: NOID,
  targetTabId: NOID,

  openTimeout: undefined as number | undefined,
  closeTimeout: undefined as number | undefined,
}

const DEFERRED_CLOSE_DELAY = 36
const TOOLTIP_UPD_DELAY = 64
const TITLE_MAX_LEN = 2_000
const URL_MAX_LEN = 2_000
const URL_DECODE_MAX_LEN = 5_000

const inlinePreviewConf = {
  format: 'jpeg' as const,
  quality: 90,
  scale: window.devicePixelRatio / 2,
}
let deadOnArrival = false
let tooltipUpdTimeout: number | undefined = undefined

function dbgStr() {
  let m = state.mode === Mode.Nope ? 'Nope' : 'Inline'
  if (state.mode === Mode.InPage) m = 'InPage'

  let s = state.status === Status.Closed ? 'Closed' : 'Closing'
  if (state.status === Status.Open) s = 'Open'
  else if (state.status === Status.Opening) s = 'Opening'

  return `mode: ${m}, status: ${s}`
}

export function setTargetTab(tabId: ID) {
  clearTimeout(state.openTimeout)
  if (Settings.state.previewTabsFollowMouse) {
    clearTimeout(state.closeTimeout)
  }

  const tab = Tabs.byId[tabId]
  state.targetTabId = tabId

  // Start timeout to...
  if (!Menu.isOpen && !Mouse.multiSelectionMode && !Selection.selected.size && tab) {
    // Update default tooltip
    clearTimeout(tooltipUpdTimeout)
    tooltipUpdTimeout = setTimeout(() => {
      const tab = Tabs.byId[tabId]
      if (tab) {
        const noText = !Settings.state.previewTabsTitle && !Settings.state.previewTabsUrl
        if (
          (Settings.state.previewTabsMode === 'p' && state.mode === Mode.Nope) ||
          (state.mode === Mode.InSidebar && noText && tab.discarded)
        ) {
          tab.reactive.tooltip = Tabs.getTooltip(tab)
        } else {
          tab.reactive.tooltip = ''
        }
      }
    }, TOOLTIP_UPD_DELAY)

    // Show/Update preview in sidebar
    if (state.mode === Mode.InSidebar) {
      if (Settings.state.previewTabsFollowMouse && state.status === Status.Open) {
        if (sPreviewEl) setSPreviewPosition(sPreviewEl, tab)
        state.openTimeout = setTimeout(() => {
          state.openTimeout = undefined
          updateSPreview(state.targetTabId)
        }, 128)
      } else {
        state.openTimeout = setTimeout(() => {
          state.openTimeout = undefined
          showSPreview(tab)
        }, Settings.state.previewTabsDelay)
      }
    }

    // Show/Update preview in page
    else if (state.mode === Mode.InPage) {
      if (Settings.state.previewTabsFollowMouse && state.status === Status.Open) {
        state.openTimeout = setTimeout(() => {
          state.openTimeout = undefined
          updatePPreview(state.targetTabId)
        }, 128)
      } else {
        state.openTimeout = setTimeout(() => {
          state.openTimeout = undefined
          showPPreview(tab, Mouse.y)
        }, Settings.state.previewTabsDelay)
      }
    }
  }
}

export function resetTargetTab(tabId: ID, closeDelay = DEFERRED_CLOSE_DELAY) {
  clearTimeout(state.openTimeout)
  clearTimeout(state.closeTimeout)

  if (tabId === undefined || tabId === state.targetTabId) {
    state.targetTabId = NOID
  }

  state.openTimeout = undefined

  state.closeTimeout = setTimeout(() => {
    if (state.mode === Mode.InSidebar) {
      closeSPreview()
    } else {
      closePPreview()
    }
  }, closeDelay)
}

export function closePreview() {
  clearTimeout(state.openTimeout)
  clearTimeout(state.closeTimeout)

  if (state.mode === Mode.InSidebar) return closeSPreview()
  else if (state.mode === Mode.InPage) return closePPreview()
}

export function resetMode() {
  if (state.status !== Status.Closed) closePreview()

  if (Settings.state.previewTabsMode === 'i') state.mode = Mode.InSidebar
  else if (Settings.state.previewTabsMode === 'p') state.mode = Mode.InPage
  else state.mode = Mode.Nope

  state.modeFallback = false
}

function trimTitle(t: string) {
  return t.length > TITLE_MAX_LEN ? t.slice(0, TITLE_MAX_LEN) + '…' : t
}

function trimUrl(u: string) {
  return u.length > URL_MAX_LEN ? u.slice(0, URL_MAX_LEN) + '…' : u
}

function tryDecodeUrl(url: string): string {
  if (url.length > URL_DECODE_MAX_LEN) return url
  try {
    return decodeURI(url)
  } catch (err) {
    return url
  }
}

// ---
// -- Preview in page
// -

async function showPPreview(tab: Tab, y?: number) {
  if (deadOnArrival) {
    deadOnArrival = false
    closePPreview()
  }

  state.status = Status.Opening
  const result = await injectPPreview(tab.id, y)
  if (result?.[0]) {
    state.status = Status.Open

    if (deadOnArrival || tab.invisible) {
      deadOnArrival = false
      closePPreview()
    }

    return
  } else if (deadOnArrival) {
    state.status = Status.Closed
    deadOnArrival = false
    if (IPC.state.previewConnection) IPC.sendToPreview('close')
    return
  }

  state.status = Status.Closed
  state.modeFallback = true

  if (Settings.state.previewTabsPageModeFallback === 'n') {
    state.mode = Mode.Nope
    // Set default tooltip
    tab.reactive.tooltip = Tabs.getTooltip(tab)
    return
  }

  if (Settings.state.previewTabsPageModeFallback === 'i') {
    state.mode = Mode.InSidebar
    return showSPreview(tab)
  }
}

let cancelInjecting: (() => void) | undefined

async function injectPPreview(tabId: ID, y?: number) {
  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) return

  const initData = getPPreviewInitData(tabId, y)
  const initDataJson = JSON.stringify(initData)
  const injectingData = browser.tabs
    .executeScript(activeTab.id, {
      code: `window.sideberyInitData=${initDataJson};window.onSideberyInitDataReady?.();true;`,
      runAt: 'document_start',
      allFrames: false,
      matchAboutBlank: true,
    })
    .catch(() => {
      // Cannot inject init data
    })
  const injectingScript = browser.tabs
    .executeScript(activeTab.id, {
      file: '../injections/tab-preview.js',
      runAt: 'document_start',
      allFrames: false,
      matchAboutBlank: true,
    })
    .catch(() => {
      // Cannot exec script
    })

  const cancelation = new Promise<void>((ok, _) => (cancelInjecting = ok))
  const results = await Promise.any([Promise.all([injectingData, injectingScript]), cancelation])
  cancelInjecting = undefined

  return results?.[0]
}

function getPPreviewInitData(tabId: ID, y?: number): TabPreviewInitData {
  const tab = Tabs.byId[tabId]
  const isFrameDark = Styles.reactive.frameColorScheme === 'dark'
  const isToolbarDark = Styles.reactive.toolbarColorScheme === 'dark'

  return {
    bg: Styles.parsedTheme?.vars.frame_bg ?? (isFrameDark ? '#282828' : '#eaeaea'),
    fg: Styles.parsedTheme?.vars.frame_fg ?? (isFrameDark ? '#ccc' : '#222'),
    hbg: Styles.parsedTheme?.vars.toolbar_bg ?? (isToolbarDark ? '#323232' : '#fafafa'),
    hfg: Styles.parsedTheme?.vars.toolbar_fg ?? (isToolbarDark ? '#eee' : '#111'),
    tabId: tabId,
    winId: Windows.id,
    title: trimTitle(tab?.title ?? '---'),
    url: trimUrl(tryDecodeUrl(tab?.url ?? '---')),
    y: y ?? 0,
    dpr: window.devicePixelRatio,
    sh: Sidebar.height,
    popupWidth: Settings.state.previewTabsPopupWidth,
    offsetY: Settings.state.previewTabsInPageOffsetY,
    offsetX: Settings.state.previewTabsInPageOffsetX,
    atTheLeft: Settings.state.previewTabsSide === 'right',
    rCrop: Settings.state.previewTabsCropRight,
    tMax: Settings.state.previewTabsTitle,
    uMax: Settings.state.previewTabsUrl,
    unloaded: tab?.discarded ?? false,
  }
}

export function setPPreviewPosition(y: number) {
  if (IPC.state.previewConnection) IPC.sendToPreview('setY', y)
}

export function updatePPreview(tabId: ID) {
  if (state.status !== Status.Open) return

  const tab = Tabs.byId[tabId]
  if (!tab) return

  if (IPC.state.previewConnection) {
    const title = trimTitle(tab.title)
    const url = trimUrl(tryDecodeUrl(tab.url))
    IPC.sendToPreview('updatePreview', tabId, title, url, !!tab.discarded)
  } else {
    closePPreview()
  }
}

export async function closePPreview() {
  if (state.status === Status.Opening) {
    deadOnArrival = true
    if (cancelInjecting) cancelInjecting()
    return
  }

  if (state.status === Status.Open) {
    state.status = Status.Closing
    if (state.popupWinId !== NOID) await browser.windows.remove(state.popupWinId)
    else if (Settings.state.previewTabsMode === 'p' && IPC.state.previewConnection) {
      IPC.sendToPreview('close')
    } else {
      Tabs.reactive.inlinePreviewImg = ''
    }
    state.popupWinId = NOID
    state.status = Status.Closed
  }
}

// ---
// -- Preview in sidebar
// -

let sPreviewTabId = NOID
async function showSPreview(tab: Tab) {
  if (deadOnArrival) {
    deadOnArrival = false
    closeSPreview()
    return
  }

  if (sPreviewTabId === tab.id) return
  if (!sPreviewEl) return

  const noText = !Settings.state.previewTabsTitle && !Settings.state.previewTabsUrl
  if (noText && tab.discarded) return resetTargetTab(tab.id)

  state.status = Status.Opening

  sPreviewEl.style.setProperty('--t-lines', Settings.state.previewTabsTitle.toString())
  sPreviewEl.style.setProperty('--u-lines', Settings.state.previewTabsUrl.toString())

  setSPreviewPosition(sPreviewEl, tab)

  Tabs.reactive.inlinePreviewTitle = trimTitle(tab.title)
  Tabs.reactive.inlinePreviewUrl = trimUrl(tryDecodeUrl(tab.url))

  let preview = ''
  if (!tab.discarded) {
    const currentWindow = await browser.windows.getCurrent({ populate: false })
    const pageWidth = (currentWindow.width ?? 0) - Sidebar.width

    if (pageWidth <= 0) return

    // Calc preview scale
    const w = pageWidth / Sidebar.width
    inlinePreviewConf.scale = (window.devicePixelRatio / w) * 1.5

    if (inlinePreviewConf.scale > window.devicePixelRatio) {
      inlinePreviewConf.scale = window.devicePixelRatio
    }

    preview = await browser.tabs.captureTab(tab.id, inlinePreviewConf).catch(() => '')
  }

  sPreviewTabId = tab.id
  state.status = Status.Open

  if (deadOnArrival) {
    deadOnArrival = false
    closeSPreview()
    return
  }

  Tabs.reactive.inlinePreviewImg = preview
  Tabs.reactive.inlinePreview = true
}

async function updateSPreview(tabId: ID) {
  if (!sPreviewEl) return

  const noText = !Settings.state.previewTabsTitle && !Settings.state.previewTabsUrl
  const tab = Tabs.byId[tabId]
  if (!tab || (noText && tab.discarded)) return resetTargetTab(tabId, 250)
  sPreviewTabId = tabId

  Tabs.reactive.inlinePreviewTitle = trimTitle(tab.title)
  Tabs.reactive.inlinePreviewUrl = trimUrl(tryDecodeUrl(tab.url))

  let preview = ''
  if (!tab.discarded) {
    preview = await browser.tabs.captureTab(tabId, inlinePreviewConf).catch(() => '')
  }
  if (state.status === Status.Closed || state.status === Status.Closing) return
  if (sPreviewTabId !== tabId) return
  Tabs.reactive.inlinePreviewImg = preview
}

function setSPreviewPosition(popupEl: HTMLElement, tab: Tab) {
  const el = document.getElementById(`tab${tab.id}`)
  if (!el) return

  const tb = el.getBoundingClientRect()
  const hq = Sidebar.height - (Sidebar.height >> 2)
  const maxH =
    Settings.state.previewTabsInlineHeight > 0
      ? `${Settings.state.previewTabsInlineHeight}px`
      : '100vh'
  const rCrop = `${Settings.state.previewTabsCropRight}px`
  if (tb.bottom <= hq) {
    popupEl.style.transform = `translateY(${tb.bottom}px)`
    popupEl.classList.remove('-above')
  } else {
    popupEl.style.transform = `translateY(${tb.top}px)`
    popupEl.classList.add('-above')
  }
  popupEl.style.setProperty('--max-h', maxH)
  popupEl.style.setProperty('--r-crop', rCrop)
  popupEl.setAttribute('data-margin', (!Settings.state.pinnedTabsList && tab.pinned).toString())
}

let sPreviewEl: HTMLElement | null = null
export function registerSPreviewEl(el: HTMLElement | null) {
  sPreviewEl = el
}

export function closeSPreview() {
  if (state.status === Status.Opening) {
    deadOnArrival = true
    return
  }

  Tabs.reactive.inlinePreview = false
  Tabs.reactive.inlinePreviewImg = ''
  Tabs.reactive.inlinePreviewTitle = ''
  Tabs.reactive.inlinePreviewUrl = ''

  sPreviewTabId = NOID
  state.status = Status.Closed
}
