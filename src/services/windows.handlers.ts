import { Window } from 'src/types'
import { Windows } from 'src/services/windows'
import { Logs } from 'src/services/logs'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.bg'
import { Info } from 'src/services/info'

type WindowCreatedHandler = (w: browser.windows.Window) => void

export function setupWindowsListeners(): void {
  if (Info.isBg) {
    browser.windows.onCreated.addListener(onWindowCreatedBg as WindowCreatedHandler)
    browser.windows.onRemoved.addListener(onWindowRemovedBg)
    browser.windows.onFocusChanged.addListener(onWindowFocusedBg)
  } else {
    browser.windows.onCreated.addListener(onWindowCreatedFg as WindowCreatedHandler)
    browser.windows.onRemoved.addListener(onWindowRemovedFg)
    browser.windows.onFocusChanged.addListener(onWindowFocusedFg)
  }
}

export function resetWindowsListeners(): void {
  if (Info.isBg) {
    browser.windows.onCreated.removeListener(onWindowCreatedBg as WindowCreatedHandler)
    browser.windows.onRemoved.removeListener(onWindowRemovedBg)
    browser.windows.onFocusChanged.removeListener(onWindowFocusedBg)
  } else {
    browser.windows.onCreated.removeListener(onWindowCreatedFg as WindowCreatedHandler)
    browser.windows.onRemoved.removeListener(onWindowRemovedFg)
    browser.windows.onFocusChanged.removeListener(onWindowFocusedFg)
  }
}

function onWindowCreatedBg(window: Window): void {
  if (window.id === undefined) return

  const existedTabs = Windows.byId[window.id]?.tabs
  if (existedTabs) window.tabs = existedTabs
  Windows.byId[window.id] = window

  Logs.info(`Window created: ${window.id}`)
}

function onWindowCreatedFg(window: Window): void {
  if (window.id === Windows.id) return
  if (window.type !== 'normal') return
  Windows.otherWindows.push(window)
}

function onWindowRemovedBg(windowId: ID): void {
  const window = Windows.byId[windowId]
  if (!window) return

  delete Windows.byId[windowId]
  delete Tabs.cacheByWin[windowId]

  Logs.info(`Window removed: ${windowId}`)
}

function onWindowRemovedFg(windowId: ID): void {
  if (windowId === Windows.id || !Windows.otherWindows) return
  const index = Windows.otherWindows.findIndex(w => w.id === windowId)
  if (index >= 0) Windows.otherWindows.splice(index, 1)
}

function onWindowFocusedBg(windowId: ID): void {
  // Unfocused
  if (windowId === -1) {
    for (const id of Object.keys(Windows.byId)) {
      const window = Windows.byId[id]
      if (window.focused) {
        window.focused = false
      }
    }
  }

  // Focused
  else {
    const window = Windows.byId[windowId]
    if (window) {
      Windows.lastFocusedWinId = window.id
      window.focused = true
    }
  }
}

function onWindowFocusedFg(id: ID): void {
  Windows.focusedWindowId = id
  Windows.focused = id === Windows.id
  if (id !== -1) Windows.lastFocused = id === Windows.id
  if (Windows.focused) {
    Sidebar.saveActivePanel()
  }
}
