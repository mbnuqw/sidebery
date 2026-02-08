import { Reactivator, Window, WindowChooseOption, WindowChoosingDetails } from 'src/types'
import { NOID } from 'src/defaults'
import * as Preview from 'src/services/tabs.fg.preview'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Info from 'src/services/info'

export interface WindowsState {
  choosing: WindowChooseOption[] | null
  choosingTitle: string
}

export interface WindowInfo {
  id: ID
  title: string
  incognito: boolean
}

export let id = NOID
export let uniqWinId = NOID
export let incognito = browser.extension.inIncognitoContext
export let focused = false
export let lastFocused = false
export let lastFocusedId = NOID
export let otherWindows: WindowInfo[] = []
export let reactive: WindowsState = {
  choosing: null,
  choosingTitle: '',
}

export function reactivate(r: Reactivator<WindowsState>) {
  reactive = r(reactive)
}

export function setCurrentId(newId: ID) {
  id = newId
}

export async function load(): Promise<void> {
  const winData = await Promise.all([
    browser.windows.getCurrent({ populate: false }),
    browser.sessions.getWindowValue<string>(browser.windows.WINDOW_ID_CURRENT, 'uniqWinId'),
  ])
  const currentWindow = winData[0]
  uniqWinId = winData[1] ?? NOID

  // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1660564
  if (Info.isSidebar && currentWindow.type !== 'normal') {
    // Sidebar is launched in popup windows.
    throw `1660564`
  }

  // Generate unique window id
  if (uniqWinId === NOID) {
    uniqWinId = Utils.uid()
    browser.sessions.setWindowValue(browser.windows.WINDOW_ID_CURRENT, 'uniqWinId', uniqWinId)
  }

  incognito = currentWindow.incognito
  id = currentWindow.id ?? NOID
  focused = currentWindow.focused
  if (focused && currentWindow.id) lastFocusedId = currentWindow.id
  lastFocused = currentWindow.focused
  browser.windows.getAll().then(windows => {
    otherWindows = windows
      .filter(w => w.id !== id && w.type === 'normal')
      .map(w => ({ id: w.id ?? NOID, incognito: w.incognito, title: w.title ?? '' }))
  })
}

export async function showWindowsPopup(config: WindowChoosingDetails = {}): Promise<ID> {
  reactive.choosingTitle = config.title ?? ''

  // Show empty popup with loading animation if windows are not ready
  setTimeout(() => {
    if (!reactive.choosing) reactive.choosing = []
  }, 120)

  let wins = (await browser.windows.getAll({
    windowTypes: ['normal'],
    populate: false,
  })) as Window[]
  if (config.otherWindows) wins = wins.filter(w => w.id !== id)
  else wins = (await browser.windows.getAll()) as Window[]
  if (config.filter) wins = wins.filter(config.filter)

  return new Promise(res => {
    const options = wins.map<Promise<WindowChooseOption>>(async w => {
      const [tab] = await browser.tabs.query({ active: true, windowId: w.id })
      let screen
      if (Settings.state.selWinScreenshots && browser.tabs.captureTab) {
        const imageConf: browser.ImageDetails = { format: 'jpeg', quality: 75, scale: 0.5 }
        if (tab) screen = await browser.tabs.captureTab(tab.id, imageConf)
      }
      return {
        id: w.id ?? NOID,
        title: w.title ?? tab?.title,
        screen,
        sel: false,
        choose: () => {
          closeWindowsPopup()
          res(w.id ?? NOID)
        },
      } as WindowChooseOption
    })

    Promise.all(options).then(wins => {
      reactive.choosing = wins
    })
  })
}

export function selectWindow(dir: number): void {
  if (!reactive.choosing) return
  let selIndex = reactive.choosing.findIndex(w => w.sel)

  if (selIndex !== -1) reactive.choosing[selIndex].sel = false

  selIndex += dir
  if (selIndex < 0 || selIndex >= reactive.choosing.length) {
    selIndex = dir > 0 ? 0 : reactive.choosing.length - 1
  }

  reactive.choosing[selIndex].sel = true
}

export function activateSelectedWindow(): void {
  if (!reactive.choosing) return
  const winInfo = reactive.choosing.find(w => w.sel)
  if (winInfo) winInfo.choose()
}

export function closeWindowsPopup(): void {
  reactive.choosing = null
  reactive.choosingTitle = ''
}

export function updWindowPreface(preface?: string) {
  if (preface === undefined) preface = Settings.state.markWindowPreface

  preface = preface.replace('%PN', Sidebar.panelsById[Sidebar.activePanelId]?.name ?? '')

  browser.windows.update(id, { titlePreface: preface })
}

export function setupWindowsListeners(): void {
  browser.windows.onCreated.addListener(onWindowCreated)
  browser.windows.onRemoved.addListener(onWindowRemoved)
  browser.windows.onFocusChanged.addListener(onWindowFocused)
}

export function resetWindowsListeners(): void {
  browser.windows.onCreated.removeListener(onWindowCreated)
  browser.windows.onRemoved.removeListener(onWindowRemoved)
  browser.windows.onFocusChanged.removeListener(onWindowFocused)
}

function onWindowCreated(window: browser.windows.Window): void {
  if (window.id === undefined) return
  if (window.id === id) return
  if (window.type !== 'normal') return
  otherWindows.push({
    id: window.id,
    incognito: window.incognito,
    title: window.title ?? '',
  })
}

function onWindowRemoved(windowId: ID): void {
  if (Preview.state.popupWinId === windowId) {
    Preview.state.popupWinId = NOID
    Preview.state.status = Preview.Status.Closed
  }
  if (windowId === id || !otherWindows) return
  const index = otherWindows.findIndex(w => w.id === windowId)
  if (index >= 0) otherWindows.splice(index, 1)
}

function onWindowFocused(windowId: ID): void {
  focused = windowId === id
  if (windowId !== -1) {
    lastFocusedId = windowId
    lastFocused = windowId === id
  }
}
