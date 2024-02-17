import { ADDON_HOST, NOID } from 'src/defaults'
import { InstanceType } from 'src/types'
import { Sidebar } from './sidebar'
import { Tabs } from './tabs.fg'
import { Styles } from './styles'
import { Windows } from './windows'
import { Settings } from './settings'
import * as Logs from './logs'
import * as IPC from './ipc'

export const state = {
  creation: false,
  winId: NOID,
  tabId: NOID,

  mouseEnterTimeout: undefined as number | undefined,
  mouseLeaveTimeout: undefined as number | undefined,
}

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

export async function showPreviewPopup(tabId: ID, y?: number) {
  const tab = Tabs.byId[tabId]
  if (!tab || tab.invisible || tab.discarded) return

  state.creation = true

  const currentWindow = await browser.windows.getCurrent({ populate: false })
  currentWinWidth = currentWindow.width ?? 0
  currentWinHeight = currentWindow.height ?? 0
  currentWinY = currentWindow.top ?? 0
  currentWinX = currentWindow.left ?? 0

  if (currentWinWidth === 0 || currentWinHeight === 0) return

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
  const top = (currentWinY ?? 0) + (y ?? 0) + Settings.state.previewTabsOffsetY
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
  if (previewWindow.id === undefined) return

  state.winId = previewWindow.id
  state.creation = false

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
  if (state.winId !== NOID) {
    browser.windows.update(state.winId, {
      top: currentWinY + y + Settings.state.previewTabsOffsetY + currentWinOffsetY,
      left: getPopupX(),
    })
  }
}

export function updatePreviewPopup(tabId: ID) {
  if (state.creation) return

  const tab = Tabs.byId[tabId]
  if (!tab) return

  if (IPC.state.previewConnection) {
    IPC.sendToPreview('updatePreview', tabId, tab.title, tab.url, !!tab.discarded)
  } else {
    closePreviewPopup()
  }
}

export function closePreviewPopup() {
  if (state.creation) {
    deadOnArrival = true
    return
  }

  if (state.winId !== NOID) {
    browser.windows.remove(state.winId)
    state.winId = NOID
  }
}

function getPopupX() {
  if (Settings.state.previewTabsSide === 'right') {
    return currentWinX + Sidebar.width + Settings.state.previewTabsOffsetX + currentWinOffsetX
  } else {
    return (
      currentWinX +
      currentWinWidth -
      Sidebar.width -
      Settings.state.previewTabsPopupWidth -
      Settings.state.previewTabsOffsetX +
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

export async function showPreviewInline(tabId: ID) {
  if (state.tabId === tabId) return

  const tab = Tabs.byId[tabId]
  if (!tab || tab.discarded) return

  state.creation = true

  const currentWindow = await browser.windows.getCurrent({ populate: false })
  const pageWidth = (currentWindow.width ?? 0) - Sidebar.width

  if (pageWidth <= 0) return

  // Calc preview scale
  const w = pageWidth / Sidebar.width
  inlinePreviewConf.scale = (window.devicePixelRatio / w) * 1.5

  if (inlinePreviewConf.scale > window.devicePixelRatio) {
    inlinePreviewConf.scale = window.devicePixelRatio
  }

  const preview = await browser.tabs.captureTab(tabId, inlinePreviewConf).catch(() => '')

  state.creation = false

  if (deadOnArrival) {
    deadOnArrival = false
    closePreviewInline()
    return
  }

  const previewHeight = Settings.state.previewTabsInlineHeight
  document.body.style.setProperty('--tabs-inline-preview-height', `${previewHeight}px`)

  if (tab.pinned) {
    const prevTab = Tabs.byId[state.tabId]
    if (prevTab && !prevTab.pinned) Tabs.reactive.inlinePreviewTabId = NOID

    Tabs.reactive.inlinePreviewPinnedImg = `url("${preview}")`
  } else {
    const prevTab = Tabs.byId[state.tabId]
    if (prevTab && prevTab.pinned) Tabs.reactive.inlinePreviewPinnedImg = ''

    tab.previewImg = `url("${preview}")`
    Tabs.reactive.inlinePreviewTabId = tabId
  }

  state.tabId = tabId
}

export function closePreviewInline() {
  if (state.creation) {
    deadOnArrival = true
    return
  }

  const tab = Tabs.byId[state.tabId]
  if (!tab) {
    Tabs.reactive.inlinePreviewPinnedImg = ''
    Tabs.reactive.inlinePreviewTabId = NOID
    state.tabId = NOID
    return
  }

  if (tab.pinned) {
    Tabs.reactive.inlinePreviewPinnedImg = ''
  } else {
    Tabs.reactive.inlinePreviewTabId = NOID
  }

  state.tabId = NOID
}
