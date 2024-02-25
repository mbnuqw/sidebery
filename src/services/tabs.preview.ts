import { ADDON_HOST, NOID } from 'src/defaults'
import { InstanceType } from 'src/types'
import { Sidebar } from './sidebar'
import { Tabs } from './tabs.fg'
import { Styles } from './styles'
import { Windows } from './windows'
import { Settings } from './settings'
import * as Logs from './logs'
import * as IPC from './ipc'
import { Menu } from './menu'
import { Mouse } from './mouse'
import { Selection } from './selection'
import { TabPreviewInitData } from 'src/injections/tab-preview'

export const enum Status {
  Closing = -1,
  Closed = 0,
  Opening = 1,
  Open = 2,
}

export const enum Mode {
  Nope = 0,
  Inline = 1,
  Window = 2,
  InPage = 3,
}

export const state = {
  status: Status.Closed,
  mode: Mode.Nope,
  modeFallback: false,

  popupWinId: NOID,
  targetTabId: NOID,

  mouseEnterTimeout: undefined as number | undefined,
  mouseLeaveTimeout: undefined as number | undefined,
}

const approxFFToolbarsHeight = 70
const approxPopupHeaderHeight = 40
const inlinePreviewConf = {
  format: 'jpeg' as const,
  quality: 90,
  scale: window.devicePixelRatio / 2,
}

let currentWinWidth = 0
let currentWinHeight = 0
let currentWinY = 0
let currentWinX = 0
let currentWinOffsetY = 0
let currentWinOffsetX = 0
let deadOnArrival = false
let listening = false
let tooltipUpdTimeout: number | undefined = undefined

function dbgStr() {
  let m = state.mode === Mode.Nope ? 'Nope' : 'Inline'
  if (state.mode === Mode.Window) m = 'Window'
  else if (state.mode === Mode.InPage) m = 'InPage'

  let s = state.status === Status.Closed ? 'Closed' : 'Closing'
  if (state.status === Status.Open) s = 'Open'
  else if (state.status === Status.Opening) s = 'Opening'

  return `mode: ${m}, status: ${s}`
}

export function setTargetTab(tabId: ID, y: number) {
  clearTimeout(state.mouseEnterTimeout)
  if (Settings.state.previewTabsFollowMouse) {
    clearTimeout(state.mouseLeaveTimeout)
  }

  state.targetTabId = tabId

  // Start timeout to...
  if (!Menu.isOpen && !Mouse.multiSelectionMode && !Selection.selected.length) {
    // Update default tooltip
    clearTimeout(tooltipUpdTimeout)
    tooltipUpdTimeout = setTimeout(() => {
      const tab = Tabs.byId[tabId]
      if (tab) {
        const isClosed = state.status === Status.Closed
        if (
          (Settings.state.previewTabsMode === 'p' && state.mode === Mode.Nope) ||
          (state.mode === Mode.InPage && isClosed && (tab.discarded || tab.active)) ||
          (state.mode === Mode.Window && isClosed && (tab.discarded || tab.active)) ||
          (state.mode === Mode.Inline && tab.discarded)
        ) {
          tab.reactive.tooltip = Tabs.getTooltip(tab)
        } else {
          tab.reactive.tooltip = ''
        }
      }
    }, 64)

    // Show preview in inline mode
    if (state.mode === Mode.Inline) {
      state.mouseEnterTimeout = setTimeout(() => {
        state.mouseEnterTimeout = undefined
        showPreviewInline(state.targetTabId)
      }, Settings.state.previewTabsDelay)
      return
    }

    // Update popup
    if (Settings.state.previewTabsFollowMouse && state.status === Status.Open) {
      state.mouseEnterTimeout = setTimeout(() => {
        state.mouseEnterTimeout = undefined
        updatePreviewPopup(state.targetTabId)
      }, 128)
      return
    }

    // Show preview popup
    if (state.status === Status.Closed) {
      state.mouseEnterTimeout = setTimeout(() => {
        state.mouseEnterTimeout = undefined
        showPreview(state.targetTabId, y)
      }, Settings.state.previewTabsDelay)
      return
    }
  }
}

export function resetTargetTab(tabId: ID) {
  clearTimeout(state.mouseEnterTimeout)
  clearTimeout(state.mouseLeaveTimeout)

  if (tabId === undefined || tabId === state.targetTabId) {
    state.targetTabId = NOID
  }

  state.mouseEnterTimeout = undefined

  if (state.mode !== Mode.Inline) {
    state.mouseLeaveTimeout = setTimeout(() => {
      closePreviewPopup()
    }, 36)
  }
}

async function injectTabPreview(tabId: ID, y?: number) {
  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab) return

  const initData = getTabPreviewInitData(tabId, y)
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
  const [result, _] = await Promise.all([injectingData, injectingScript])
  return result
}

function getTabPreviewInitData(tabId: ID, y?: number): TabPreviewInitData {
  const tab = Tabs.byId[tabId]

  return {
    bg: Styles.parsedTheme?.vars.frame_bg,
    fg: Styles.parsedTheme?.vars.frame_fg,
    hbg: Styles.parsedTheme?.vars.toolbar_bg,
    hfg: Styles.parsedTheme?.vars.toolbar_fg,
    tabId: tabId,
    winId: Windows.id,
    title: tab?.title ?? '---',
    url: tab?.url ?? '---',
    y: y ?? 0,
    dpr: window.devicePixelRatio,
    popupWidth: Settings.state.previewTabsPopupWidth,
    offsetY: Settings.state.previewTabsInPageOffsetY,
    offsetX: Settings.state.previewTabsInPageOffsetX,
    atTheLeft: Settings.state.previewTabsSide === 'right',
    rCrop: Settings.state.previewTabsCropRight,
  }
}

async function showPreview(tabId: ID, y?: number) {
  const tab = Tabs.byId[tabId]
  if (!tab || tab.invisible || tab.discarded || tab.active) return

  // Inline
  if (state.mode === Mode.Inline) {
    return showPreviewInline(tabId)
  }

  // In page popup
  else if (state.mode === Mode.InPage) {
    state.status = Status.Opening
    const result = await injectTabPreview(tabId, y)
    if (result?.[0]) {
      state.status = Status.Open

      if (deadOnArrival || tab.invisible) {
        deadOnArrival = false
        closePreviewPopup()
      }

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
      state.mode = Mode.Inline
      return showPreviewInline(tabId)
    }

    if (Windows.focused && Settings.state.previewTabsPageModeFallback === 'w') {
      state.mode = Mode.Window
      return showPreveiwPopupWindow(tabId, y)
    }
  }

  // Popup window
  else if (Windows.focused && state.mode === Mode.Window) {
    return showPreveiwPopupWindow(tabId, y)
  }
}

export function closePreview() {
  clearTimeout(state.mouseEnterTimeout)
  clearTimeout(state.mouseLeaveTimeout)

  if (state.mode === Mode.Inline) return closePreviewInline()
  else if (state.mode === Mode.InPage || state.mode === Mode.Window) return closePreviewPopup()
}

export function resetMode() {
  if (state.status !== Status.Closed) closePreview()

  if (Settings.state.previewTabsMode === 'i') state.mode = Mode.Inline
  else if (Settings.state.previewTabsMode === 'p') state.mode = Mode.InPage
  else state.mode = Mode.Window

  state.modeFallback = false
}

export async function showPreveiwPopupWindow(tabId: ID, y?: number) {
  const tab = Tabs.byId[tabId]
  if (!tab || tab.invisible || tab.discarded) return

  state.status = Status.Opening

  const currentWindow = await browser.windows.getCurrent({ populate: false })
  currentWinWidth = currentWindow.width ?? 0
  currentWinHeight = currentWindow.height ?? 0
  currentWinY = currentWindow.top ?? 0
  currentWinX = currentWindow.left ?? 0

  if (currentWinWidth === 0 || currentWinHeight === 0) {
    state.status = Status.Closed
    return
  }

  if (!listening) setupPopupDisconnectionListener()

  currentWinOffsetY = 0
  currentWinOffsetX = 0

  const previewWidth = Settings.state.previewTabsPopupWidth
  const previewData: Record<string, string> = {
    bg: Styles.parsedTheme?.vars.frame_bg ?? '',
    fg: Styles.parsedTheme?.vars.frame_fg ?? '',
    hbg: Styles.parsedTheme?.vars.toolbar_bg ?? '',
    hfg: Styles.parsedTheme?.vars.toolbar_fg ?? '',
    tabId: tab.id.toString(),
    winId: Windows.id.toString(),
    title: tab.title,
    url: tab.url,
  }

  const pageWidth = currentWinWidth - Sidebar.width

  // Calc preview height
  let previewHeight = Math.round((currentWinHeight / pageWidth) * previewWidth)
  if (previewHeight > previewWidth) previewHeight = previewWidth

  // Calc preview scale
  const w = pageWidth / previewWidth
  const h = currentWinHeight / previewHeight
  let scale = (window.devicePixelRatio / Math.min(w, h)) * 1.5
  if (scale > window.devicePixelRatio) scale = window.devicePixelRatio

  // Append height of header to previewHeight
  previewHeight += approxPopupHeaderHeight

  previewData.scale = String(scale)

  if (tab.discarded) previewData.off = 'y'

  const params = new URLSearchParams(previewData).toString()
  const top = (currentWinY ?? 0) + (y ?? 0) + Settings.state.previewTabsWinOffsetY
  const left = getPopupX()
  const previewWindow = await browser.windows.create({
    allowScriptsToClose: true,
    focused: true,
    top,
    left,
    width: previewWidth,
    height: previewHeight,
    incognito: false,
    state: 'normal',
    type: 'popup',
    url: `/popup.tab-preview/tab-preview.html?${params}`,
    // For userChrome modificatoins with `#main-window[titlepreface='Tab Preview‎']`
    titlePreface: 'Tab Preview‎',
  })
  if (previewWindow.id === undefined) {
    state.status = Status.Closed
    return
  }

  state.popupWinId = previewWindow.id
  state.status = Status.Open

  if (deadOnArrival || tab.invisible) {
    deadOnArrival = false
    closePreviewPopup()
    return
  }

  let updPosition = false
  let updSize = false

  // Get differences between defined and actual size
  const dw = (previewWindow.width ?? previewWidth) - previewWidth
  const dh = (previewWindow.height ?? previewHeight) - previewHeight
  if (dw !== 0 || dh !== 0) updSize = true

  // Get differences between defined and actual position
  const dt = (previewWindow.top ?? top) - top
  const dl = (previewWindow.left ?? left) - left

  // Preserve discrepancy if small
  if (Math.abs(dt) < 30 && Math.abs(dl) < 5) {
    currentWinOffsetY = dt
    currentWinOffsetX = dl
  }
  // or try to update preview position
  else {
    updPosition = true
  }

  if (updSize) {
    await browser.windows.update(previewWindow.id, {
      width: previewWidth,
      height: previewHeight,
    })
  }
  if (updPosition) {
    await browser.windows.update(previewWindow.id, {
      top,
      left,
    })
  }
}

export function setPreviewPopupPosition(y: number) {
  if (state.popupWinId !== NOID) {
    browser.windows.update(state.popupWinId, {
      top: currentWinY + y + Settings.state.previewTabsWinOffsetY + currentWinOffsetY,
      left: getPopupX(),
    })
  } else if (IPC.state.previewConnection) {
    IPC.sendToPreview('setY', y)
  }
}

export function updatePreviewPopup(tabId: ID) {
  if (state.status !== Status.Open) return

  const tab = Tabs.byId[tabId]
  if (!tab) return

  if (IPC.state.previewConnection) {
    IPC.sendToPreview('updatePreview', tabId, tab.title, tab.url, !!tab.discarded)
  } else {
    closePreviewPopup()
  }
}

export async function closePreviewPopup() {
  if (state.status === Status.Opening) {
    deadOnArrival = true
    return
  }

  if (state.status === Status.Open) {
    state.status = Status.Closing
    if (state.popupWinId !== NOID) await browser.windows.remove(state.popupWinId)
    else if (Settings.state.previewTabsMode === 'p' && IPC.state.previewConnection) {
      IPC.sendToPreview('close')
    }
    state.popupWinId = NOID
    state.status = Status.Closed
  }
}

function getPopupX() {
  if (Settings.state.previewTabsSide === 'right') {
    return currentWinX + Sidebar.width + Settings.state.previewTabsWinOffsetX + currentWinOffsetX
  } else {
    return (
      currentWinX +
      currentWinWidth -
      Sidebar.width -
      Settings.state.previewTabsPopupWidth -
      Settings.state.previewTabsWinOffsetX +
      currentWinOffsetX
    )
  }
}

export function setupPopupDisconnectionListener() {
  const checkPart = ADDON_HOST.slice(50, 52) + '/p'

  IPC.onDisconnected(InstanceType.preview, async () => {
    if (!Settings.state.previewTabs) return

    const recentlyClosedItems = await browser.sessions.getRecentlyClosed({ maxResults: 3 })
    for (const rc of recentlyClosedItems) {
      if (!rc.window?.sessionId) continue
      if (rc.window.tabs?.length === 1) {
        const url = rc.window.tabs[0].url
        if (url.startsWith(checkPart, 50)) browser.sessions.forgetClosedWindow(rc.window.sessionId)
      }
    }
  })
  listening = true
}

let inlinePreviewTabId = NOID
export async function showPreviewInline(tabId: ID) {
  if (inlinePreviewTabId === tabId) return

  const tab = Tabs.byId[tabId]
  if (!tab || tab.discarded) return

  state.status = Status.Opening

  const currentWindow = await browser.windows.getCurrent({ populate: false })
  const pageWidth = (currentWindow.width ?? 0) - Sidebar.width
  const pageHeight = (currentWindow.height ?? 0) - approxFFToolbarsHeight

  if (pageWidth <= 0) return

  // Calc preview scale
  const w = pageWidth / Sidebar.width
  inlinePreviewConf.scale = (window.devicePixelRatio / w) * 1.5

  if (inlinePreviewConf.scale > window.devicePixelRatio) {
    inlinePreviewConf.scale = window.devicePixelRatio
  }

  const preview = await browser.tabs.captureTab(tabId, inlinePreviewConf).catch(() => '')
  const prevTabId = inlinePreviewTabId

  inlinePreviewTabId = tabId
  state.status = Status.Open

  if (deadOnArrival) {
    deadOnArrival = false
    closePreviewInline()
    return
  }

  let previewHeight = Settings.state.previewTabsInlineHeight
  if (Settings.state.previewTabsInlineHeight === 0) {
    previewHeight = Math.round((pageHeight / pageWidth) * Sidebar.width)
    if (previewHeight > Sidebar.width) previewHeight = Sidebar.width
  }
  document.body.style.setProperty('--tabs-inline-preview-height', `${previewHeight}px`)

  const prevTab = Tabs.byId[prevTabId]
  if (prevTab) prevTab.reactive.preview = false

  if (tab.pinned) {
    if (prevTab && !prevTab.pinned) {
      Tabs.reactive.inlinePreviewTabId = NOID
    }

    Tabs.reactive.inlinePreviewPinnedImg = `url("${preview}")`
  } else {
    if (prevTab && prevTab.pinned) Tabs.reactive.inlinePreviewPinnedImg = ''

    tab.previewImg = `url("${preview}")`
    tab.reactive.preview = true
    Tabs.reactive.inlinePreviewTabId = tabId
  }
}

export function closePreviewInline() {
  if (state.status === Status.Opening) {
    deadOnArrival = true
    return
  }

  const tab = Tabs.byId[inlinePreviewTabId]
  if (!tab) {
    Tabs.reactive.inlinePreviewPinnedImg = ''
    Tabs.reactive.inlinePreviewTabId = NOID
    inlinePreviewTabId = NOID
    state.status = Status.Closed
    return
  }

  if (tab.pinned) {
    Tabs.reactive.inlinePreviewPinnedImg = ''
  } else {
    Tabs.reactive.inlinePreviewTabId = NOID
    tab.reactive.preview = false
  }

  inlinePreviewTabId = NOID
  state.status = Status.Closed
}
