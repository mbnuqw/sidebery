import { InstanceType } from 'src/enums'
import * as IPC from 'src/services/ipc'
import * as Info from 'src/services/info'
import * as Settings from 'src/services/settings.fg'
import * as Styles from 'src/services/styles.fg'
import * as Windows from 'src/services/windows.fg'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'

const VERTICAL_MARGINS = 22
const el = document.getElementById('text_input') as HTMLInputElement | null

el?.focus()

el?.addEventListener('blur', () => {
  if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideEditingExit')
})

let ctxMenuKeyPressed: number | undefined
el?.addEventListener('keydown', (e: KeyboardEvent) => {
  // Enter
  if (e.key === 'Enter' && !e.altKey) {
    e.preventDefault()
    if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideEditingEnter')
  }
})

el?.addEventListener('contextmenu', (e: Event) => {
  if (ctxMenuKeyPressed !== undefined) e.preventDefault()
})

let initWidth: number | undefined
let placeholderHeight: number | undefined
let glitchFixTimeout: number | undefined
let prevHeight: number | undefined
el?.addEventListener('input', (e: Event) => {
  clearTimeout(glitchFixTimeout)

  if (Windows.id !== undefined) IPC.sendToSidebar(Windows.id, 'onOutsideEditingInput', el.value)

  el.style.height = '1px'

  let newHeight
  if (el.value.length === 0 && placeholderHeight) {
    newHeight = placeholderHeight
  } else {
    newHeight = el.scrollHeight - VERTICAL_MARGINS
  }

  const glitchFixIsNeeded = prevHeight !== undefined && prevHeight !== newHeight

  prevHeight = newHeight
  el.style.height = `${newHeight}px`

  if (glitchFixIsNeeded) {
    if (initWidth) document.body.style.width = initWidth - 13 + 'px'
    glitchFixTimeout = setTimeout(() => {
      if (initWidth) document.body.style.width = initWidth - 12 + 'px'
    }, 1)
  }
})

function closePopup(): void {
  window.close()
}

void (async () => {
  Info.setInstanceType(InstanceType.editing)
  Logs.setInstanceType(InstanceType.editing)
  IPC.setInstanceType(InstanceType.editing)
  IPC.setupGlobalMessageListener()
  IPC.registerActions({ closePopup })

  const sp = new URLSearchParams(document.location.search)
  const winIdStr = sp.get('winId')
  if (!winIdStr) return

  const winId = parseInt(winIdStr)
  if (isNaN(winId)) return

  const placeholder = sp.get('placeholder')
  if (placeholder && el) {
    el.placeholder = placeholder
    el.value = placeholder
    placeholderHeight = el.scrollHeight - VERTICAL_MARGINS
  }

  const value = sp.get('value')
  if (value && el) {
    el.value = value
    el.select()

    // 1px less, so later I can update height to fix graphical glitches
    el.style.height = `${el.scrollHeight - VERTICAL_MARGINS - 1}px`
  }

  // Update height to fix graphical glitches
  setTimeout(() => {
    if (el) {
      el.style.height = `${el.scrollHeight - VERTICAL_MARGINS}px`
      initWidth = document.body.offsetWidth
    }
  }, 3)

  if (winId !== undefined) {
    IPC.setWinId(winId)
    Windows.setCurrentId(winId)
    IPC.connectTo(InstanceType.sidebar, Windows.id)
  }

  await Settings.load()
  Styles.load()

  // Check if input is not focused and focus it if needed.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1918031
  Utils.untilElGetFocus(el, e => {
    e.focus()
    e.select()
  })
})()
