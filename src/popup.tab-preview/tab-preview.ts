import { NOID } from 'src/defaults'
import * as IPC from 'src/services/ipc'
import { InstanceType } from 'src/enums'

const state = {
  tabId: NOID,
  winId: NOID,
  unloaded: false,
  previewHeight: 0,

  titleEl: null as HTMLElement | null,
  urlEl: null as HTMLElement | null,
}
const previewConf = {
  format: 'jpeg' as const,
  quality: 90,
  scale: window.devicePixelRatio / 2,
}

async function main() {
  const url = new URL(window.location.href)
  const params = url.searchParams

  document.body.style.setProperty('--bg', params.get('bg'))
  document.body.style.setProperty('--fg', params.get('fg'))
  document.body.style.setProperty('--hbg', params.get('hbg'))
  document.body.style.setProperty('--hfg', params.get('hfg'))

  state.titleEl = document.getElementById('title')
  if (state.titleEl) state.titleEl.innerText = params.get('title') ?? ''

  state.urlEl = document.getElementById('url')
  if (state.urlEl) state.urlEl.innerText = params.get('url') ?? ''

  const winId = parseInt(params.get('winId') ?? '')
  if (!isNaN(winId)) state.winId = winId

  const tabId = parseInt(params.get('tabId') ?? '')
  if (!isNaN(tabId)) state.tabId = tabId

  const scale = parseFloat(params.get('scale') ?? '')
  if (!isNaN(scale)) previewConf.scale = scale

  const previewHeight = parseFloat(params.get('ph') ?? '')
  if (!isNaN(previewHeight)) state.previewHeight = previewHeight

  let tMax = parseInt(params.get('tMax') ?? '')
  if (isNaN(tMax)) tMax = 2
  if (state.titleEl) {
    if (tMax > 0) {
      setLinesLimitStyles(state.titleEl, tMax)
    } else {
      state.titleEl.style.display = 'none'
      if (state.urlEl) {
        state.urlEl.style.paddingTop = '8px'
        state.urlEl.style.opacity = '1'
      }
    }
  }

  let uMax = parseInt(params.get('uMax') ?? '')
  if (isNaN(uMax)) uMax = 1
  if (state.urlEl) {
    if (uMax > 0) {
      setLinesLimitStyles(state.urlEl, uMax)
    } else {
      state.urlEl.style.display = 'none'
    }
  }

  updateWindowHeight()

  state.unloaded = !!params.get('off')
  hidePreviewBoxWhenUnloaded()
  if (!state.unloaded) {
    const preview = await browser.tabs.captureTab(state.tabId, previewConf).catch(() => '')
    if (state.tabId === tabId) setPreview(preview)
  }

  // Close preview on Esc
  document.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.code === 'Escape') window.close()
  })

  // Close preview on losing focus
  document.addEventListener('blur', () => window.close())

  IPC.setInstanceType(InstanceType.preview)
  IPC.connectTo(InstanceType.sidebar, state.winId)
  IPC.registerActions({ updatePreview, setY: () => {}, close: () => {} })
}

function setLinesLimitStyles(el: HTMLElement, maxCount: number) {
  if (maxCount === 1) {
    el.style.whiteSpace = 'nowrap'
  } else {
    el.style.display = '-webkit-box'
    el.style.webkitBoxOrient = 'vertical'
    el.style.webkitLineClamp = maxCount.toString()
  }
}

let previewElN = 0
const previewEl1 = document.getElementById('preview_1')
const previewEl2 = document.getElementById('preview_2')
function setPreview(preview: string) {
  if (!previewEl1 || !previewEl2) return

  hidePreviewBoxWhenUnloaded()

  if (previewElN) {
    previewElN = 0
    previewEl1.style.setProperty('opacity', '1')
    previewEl1.style.setProperty('background-image', preview ? `url("${preview}")` : 'none')
    previewEl2.style.setProperty('opacity', '0')
  } else {
    previewElN++
    previewEl2.style.setProperty('opacity', '1')
    previewEl2.style.setProperty('background-image', preview ? `url("${preview}")` : 'none')
    previewEl1.style.setProperty('opacity', '0')
  }
}

async function updatePreview(tabId: ID, title: string, url: string, unloaded: boolean) {
  if (state.titleEl) state.titleEl.innerText = title
  if (state.urlEl) state.urlEl.innerText = url

  state.tabId = tabId
  state.unloaded = unloaded

  updateWindowHeight()

  if (!state.unloaded) {
    const preview = await browser.tabs.captureTab(tabId, previewConf).catch(() => '')
    if (state.tabId === tabId) setPreview(preview)
  } else {
    setPreview('')
  }
}

function updateWindowHeight() {
  if (!state.titleEl || !state.urlEl || !state.previewHeight) return

  const tHeight = state.titleEl.offsetHeight
  const uHeight = state.urlEl.offsetHeight
  const previewHeight = state.unloaded ? 0 : state.previewHeight

  browser.windows.update(browser.windows.WINDOW_ID_CURRENT, {
    height: tHeight + uHeight + previewHeight,
  })
}

function hidePreviewBoxWhenUnloaded() {
  const previewBoxEl = document.getElementById('preview_box')
  if (state.unloaded) {
    previewBoxEl?.style.setProperty('display', 'none')
  } else {
    previewBoxEl?.style.setProperty('display', 'block')
  }
  updateWindowHeight()
}

main()
