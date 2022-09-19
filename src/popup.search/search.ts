import { InstanceType } from 'src/types'
import { IPC } from 'src/services/ipc'
import { Info } from 'src/services/info'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import { Windows } from 'src/services/windows'

const el = document.getElementById('textInput') as HTMLInputElement

el?.focus()

el?.addEventListener('blur', () => {
  if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideSearchExit')
})

let ctxMenuKeyPressed: number | undefined
el?.addEventListener('keydown', (e: KeyboardEvent) => {
  // Select all
  if (e.code === 'KeyA' && e.ctrlKey) {
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
  IPC.setupGlobalMessageListener()
  IPC.registerActions({ closePopup })
  const [win] = await Promise.all([
    browser.windows.getCurrent({ populate: false }),
    Settings.loadSettings(),
  ])
  if (win.id !== undefined) {
    Windows.id = win.id
    IPC.connectTo(InstanceType.sidebar, Windows.id)
  }
  Styles.initTheme()
  await Styles.initColorScheme()
  document.body.setAttribute('data-color-scheme', Styles.reactive.colorScheme || 'dark')
})()
