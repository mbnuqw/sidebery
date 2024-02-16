import { NOID } from 'src/defaults'
import * as IPC from 'src/services/ipc'
import { InstanceType } from 'src/types'

const state = {
  tabId: NOID,
  winId: NOID,
  unloaded: false,

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

  state.unloaded = !!params.get('off')
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
  IPC.registerActions({ updatePreview })
}

let previewElN = 0
const previewEl1 = document.getElementById('preview_1')
const previewEl2 = document.getElementById('preview_2')
function setPreview(preview: string) {
  if (!previewEl1 || !previewEl2) return

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

  if (!state.unloaded) {
    const preview = await browser.tabs.captureTab(tabId, previewConf).catch(() => '')
    if (state.tabId === tabId) setPreview(preview)
  } else {
    setPreview('')
  }
}

main()
