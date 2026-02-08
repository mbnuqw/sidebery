import { InstanceType } from 'src/enums'
import * as IPC from 'src/services/ipc'
import * as Info from 'src/services/info'
import * as Settings from 'src/services/settings.fg'
import * as Styles from 'src/services/styles.fg'
import * as Windows from 'src/services/windows.fg'
import * as Search from 'src/services/search.fg'
import * as Utils from 'src/utils'

const el = document.getElementById('textInput') as HTMLInputElement | null

el?.focus()

el?.addEventListener('blur', () => {
  if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchExit')
})

let ctxMenuKeyPressed: number | undefined
el?.addEventListener('keydown', (e: KeyboardEvent) => {
  // Select all
  if (e.code === 'KeyA' && e.ctrlKey && e.shiftKey) {
    e.preventDefault()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchSelectAll')
  }

  // Down
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchNext')
  }

  // Up
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchPrev')
  }

  // Enter
  else if (e.key === 'Enter' && !e.altKey) {
    e.preventDefault()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchEnter')
  }

  // Menu
  else if (e.key === 'ContextMenu') {
    e.preventDefault()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchMenu')
    clearTimeout(ctxMenuKeyPressed)
    ctxMenuKeyPressed = setTimeout(() => (ctxMenuKeyPressed = undefined), 500)
  }

  // Bookmarks
  else if (
    Search.shortcuts.bookmarks &&
    Search.shortcuts.bookmarks.key === e.key &&
    Search.shortcuts.bookmarks.ctrl === e.ctrlKey &&
    Search.shortcuts.bookmarks.alt === e.altKey &&
    Search.shortcuts.bookmarks.meta === e.metaKey
  ) {
    e.preventDefault()
    e.stopPropagation()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchBookmarks')
  }

  // History
  else if (
    Search.shortcuts.history &&
    Search.shortcuts.history.key === e.key &&
    Search.shortcuts.history.ctrl === e.ctrlKey &&
    Search.shortcuts.history.alt === e.altKey &&
    Search.shortcuts.history.meta === e.metaKey
  ) {
    e.preventDefault()
    e.stopPropagation()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchHistory')
  }
})

el?.addEventListener('contextmenu', (e: Event) => {
  if (ctxMenuKeyPressed !== undefined) e.preventDefault()
})

el?.addEventListener('input', (e: Event) => {
  if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchInput', el.value)
})

function closePopup(): void {
  window.close()
}

void (async () => {
  Info.setInstanceType(InstanceType.search)
  IPC.setInstanceType(InstanceType.search)
  IPC.setupGlobalMessageListener()
  IPC.registerActions({ closePopup })
  const [win] = await Promise.all([
    browser.windows.getCurrent({ populate: false }),
    Settings.load(),
  ])
  if (win.id !== undefined) {
    IPC.setWinId(win.id)
    Windows.setCurrentId(win.id)
    IPC.connectTo(InstanceType.sidebar, Windows.id)
    IPC.sidebar(win.id, 'getSearchQuery').then(query => {
      if (query && el) el.value = query
    })
  }
  Styles.load()

  // Check if input is not focused and focus it if needed.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1918031
  Utils.untilElGetFocus(el, e => e.focus())
})()
