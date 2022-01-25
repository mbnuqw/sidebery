import { InstanceType } from 'src/types'
import { Msg } from 'src/services/msg'
import { Info } from 'src/services/info'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'

const el = document.getElementById('textInput') as HTMLInputElement

el?.focus()

el?.addEventListener('blur', () => {
  // This will lead to the "Promise resolved after context unloaded" error,
  // but I need to notify sidebar about "blur" event... ¯\_(ツ)_/¯
  Msg.call(InstanceType.sidebar, 'onOutsideSearchExit')
})

let ctxMenuKeyPressed: number | undefined
el?.addEventListener('keydown', (e: KeyboardEvent) => {
  // Select all
  if (e.code === 'KeyA' && e.ctrlKey) {
    e.preventDefault()
    Msg.call(InstanceType.sidebar, 'onOutsideSearchSelectAll')
  }

  // Down
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    Msg.call(InstanceType.sidebar, 'onOutsideSearchNext')
  }

  // Up
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    Msg.call(InstanceType.sidebar, 'onOutsideSearchPrev')
  }

  // Enter
  else if (e.key === 'Enter' && !e.altKey) {
    e.preventDefault()
    Msg.call(InstanceType.sidebar, 'onOutsideSearchEnter')
  }

  // Menu
  else if (e.key === 'ContextMenu') {
    e.preventDefault()
    Msg.call(InstanceType.sidebar, 'onOutsideSearchMenu')
    clearTimeout(ctxMenuKeyPressed)
    ctxMenuKeyPressed = setTimeout(() => (ctxMenuKeyPressed = undefined), 500)
  }
})

el?.addEventListener('contextmenu', (e: Event) => {
  if (ctxMenuKeyPressed !== undefined) e.preventDefault()
})

el?.addEventListener('input', (e: Event) => {
  Msg.call(InstanceType.sidebar, 'onOutsideSearchInput', el.value)
})

function closePopup(): void {
  window.close()
}

void (async () => {
  Info.setInstanceType(InstanceType.search)
  Msg.setupListeners()
  Msg.registerActions({ closePopup })
  await Settings.loadSettings()
  Styles.initTheme()
  await Styles.initColorScheme()
  document.body.setAttribute('data-color-scheme', Styles.reactive.colorScheme || 'dark')
})()
