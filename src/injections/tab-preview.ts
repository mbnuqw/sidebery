import { InstanceType } from 'src/types'
import { NOID } from 'src/defaults'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'

export interface TabPreviewInitData {
  bg: string | undefined | null
  fg: string | undefined | null
  hbg: string | undefined | null
  hfg: string | undefined | null
  tabId: ID
  winId: ID
  title: string
  url: string
  y: number
  dpr: number
  popupWidth: number
  offsetY: number
  offsetX: number
  atTheLeft: boolean
}

const MARGIN = 2
const state = {
  tabId: NOID,
  winId: NOID,
  unloaded: false,

  rootEl: null as HTMLElement | null,
  popupEl: null as HTMLElement | null,
  titleEl: null as HTMLElement | null,
  urlEl: null as HTMLElement | null,
  previewEl1: null as HTMLElement | null,
  previewEl2: null as HTMLElement | null,

  referenceDevicePixelRatio: 1,
  previewWidth: 280,
  previewHeight: 250,
  popupHeight: 250,
  offsetY: 0,
  offsetX: 0,
  pageWidth: window.innerWidth,
  pageHeight: window.innerHeight,
  compScale: 1,
  minY: MARGIN,
  maxY: window.innerHeight - 250,
  hidden: false,
}
const previewConf = {
  format: 'jpeg' as const,
  quality: 90,
  scale: window.devicePixelRatio / 2,
}

function waitInitData(): Promise<void> {
  return new Promise((ok, err) => {
    if (window.sideberyInitData) return ok()
    window.onSideberyInitDataReady = ok
    setTimeout(() => err('GroupPage: No initial data (sideberyInitData)'), 2000)
  })
}

async function updatePreview(tabId: ID, title: string, url: string, unloaded: boolean) {
  if (state.titleEl) state.titleEl.innerText = title
  if (state.urlEl) state.urlEl.innerText = url

  state.tabId = tabId
  state.unloaded = unloaded

  if (!state.unloaded) {
    const preview = (await IPC.bg('tabsApiProxy', 'captureTab', tabId, previewConf).catch(
      () => ''
    )) as string
    if (state.tabId === tabId) setPreview(preview)
  } else {
    setPreview('')
  }
}

let previewElN = 0
function setPreview(preview: string) {
  if (!state.previewEl1 || !state.previewEl2) return

  if (previewElN) {
    previewElN = 0
    state.previewEl1.style.setProperty('opacity', '1')
    state.previewEl1.style.setProperty('background-image', preview ? `url("${preview}")` : 'none')
    state.previewEl2.style.setProperty('opacity', '0')
  } else {
    previewElN++
    state.previewEl2.style.setProperty('opacity', '1')
    state.previewEl2.style.setProperty('background-image', preview ? `url("${preview}")` : 'none')
    state.previewEl1.style.setProperty('opacity', '0')
  }
}

function setPopupPosition(y: number) {
  if (!state.popupEl) return
  let newY = y + state.offsetY
  if (newY > state.maxY) newY = state.maxY
  else if (newY < state.minY) newY = state.minY
  state.popupEl.style.transform = `translateY(${newY}px)`
}

function show() {
  if (!state.rootEl || state.hidden) return
  state.rootEl.style.opacity = '1'
}

function hide() {
  if (!state.rootEl) return
  state.rootEl.style.opacity = '0'
  state.hidden = true

  IPC.disconnectFrom(InstanceType.bg)
  IPC.disconnectFrom(InstanceType.sidebar, state.winId)
}

function compensateZoom() {
  if (!state.rootEl) return
  if (state.referenceDevicePixelRatio === window.devicePixelRatio) return
  state.compScale = state.referenceDevicePixelRatio / window.devicePixelRatio
  state.rootEl.style.transform = `scale(${state.compScale})`
}

function calcPreviewHeight(popupWidth: number) {
  const pageWidth = state.pageWidth
  const pageHeight = state.pageHeight

  let popupHeight = Math.round((pageHeight / pageWidth) * popupWidth)
  if (popupHeight > popupWidth) popupHeight = popupWidth

  return popupHeight
}

function calcScale(previewWidth: number, previewHeight: number, devicePixelRatio: number) {
  const pageWidth = state.pageWidth
  const pageHeight = state.pageHeight

  const w = pageWidth / previewWidth
  const h = pageHeight / previewHeight
  let scale = (devicePixelRatio / Math.min(w, h)) * 1.5
  if (scale > devicePixelRatio) scale = devicePixelRatio

  return scale
}

function getPopupHeight() {
  if (!state.popupEl) return state.previewHeight
  return state.popupEl.offsetHeight
}

function calcPositionRestraints() {
  state.minY = MARGIN / state.compScale
  state.maxY = (state.pageHeight - MARGIN) / state.compScale - state.popupHeight
}

async function main() {
  // Remove previous container
  state.rootEl = document.getElementById('sdbr_preview_root')
  if (state.rootEl) state.rootEl.remove()

  // Create new container
  state.rootEl = document.createElement('div')
  state.rootEl.setAttribute('id', 'sdbr_preview_root')
  document.body.appendChild(state.rootEl)

  await waitInitData()

  const initData = window.sideberyInitData as TabPreviewInitData

  window.sideberyInitData = undefined
  window.onSideberyInitDataReady = undefined

  state.winId = initData.winId
  state.referenceDevicePixelRatio = initData.dpr
  state.previewWidth = initData.popupWidth
  state.previewHeight = calcPreviewHeight(initData.popupWidth)
  state.offsetY = initData.offsetY
  state.offsetX = initData.offsetX

  previewConf.scale = calcScale(
    state.previewWidth,
    state.previewHeight,
    state.referenceDevicePixelRatio
  )

  // Setup IPC
  IPC.setInstanceType(InstanceType.preview)
  IPC.connectTo(InstanceType.bg)
  IPC.connectTo(InstanceType.sidebar, initData.winId)
  IPC.registerActions({ updatePreview, setY: setPopupPosition, close: hide })

  // Create shadow DOM
  const shadow = state.rootEl.attachShadow({ mode: 'closed' })

  // Setup styles for shadow
  // meh... Can't use `adoptedStyleSheets` b/c it throws
  // an error: "Accessing from Xray wrapper is not supported."
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1817675
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1751346
  // const shadowStyles = new CSSStyleSheet()
  // shadowStyles.replaceSync(popupStyles)
  // shadow.adoptedStyleSheets = [shadowStyles]

  // Set container styles
  state.rootEl.style.cssText = `
    --bg: ${initData.bg};
    --fg: ${initData.fg};
    --hbg: ${initData.hbg};
    --hfg: ${initData.hfg};
    position: fixed;
    z-index: 999999;
    top: 0;
    ${initData.atTheLeft ? 'left: 0;' : 'right: 0;'}
    height: 100vh;
    width: 0;
    padding: 0;
    margin: 0;
    border: none;
    pointer-events: none;
    opacity: 0;
    transition: opacity .1s;
    transform-origin: 50% 0%;
`

  // Create popup element
  state.popupEl = document.createElement('div')
  state.popupEl.classList.add('popup')
  shadow.appendChild(state.popupEl)
  state.popupEl.style.cssText = `
    position: absolute;
    width: ${state.previewWidth}px;
    ${initData.atTheLeft ? 'left' : 'right'}: ${MARGIN + state.offsetX}px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    border-radius: 8px;
    box-shadow: 0 1px 12px 0 #0005;
    background-color: var(--bg);
    overflow: hidden;
    color: var(--fg);
    font-family: sans-serif;
    transition: background 1s;
`

  // Create header element
  const headerEl = document.createElement('div')
  headerEl.classList.add('header')
  state.popupEl.appendChild(headerEl)
  headerEl.style.cssText = `
    position: relative;
    flex-shrink: 0;
    width: 100%;
    background-color: var(--hbg);
    font-size: 16px;
    color: var(--hfg);
    overflow: hidden;
`

  // Create title element
  state.titleEl = document.createElement('div')
  state.titleEl.classList.add('title')
  headerEl.appendChild(state.titleEl)
  state.titleEl.style.cssText = `
    position: relative;
    margin: 6px 8px 4px;
    padding: 0;
    font-size: .875em;
    font-weight: 700;
    line-height: 1.2em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

  // Create url element
  state.urlEl = document.createElement('div')
  state.urlEl.classList.add('url')
  headerEl.appendChild(state.urlEl)
  state.urlEl.style.cssText = `
    position: relative;
    margin: 0 8px 8px;
    padding: 0;
    font-size: .8125em;
    font-weight: 400;
    line-height: 1.2em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: .75;
`

  // Create preview box element
  const previewBoxEl = document.createElement('div')
  state.popupEl.appendChild(previewBoxEl)
  previewBoxEl.style.cssText = `
    position: relative;
    width: 100%;
    height: ${state.previewHeight}px;
`

  // Create preview 1 element
  state.previewEl1 = document.createElement('div')
  previewBoxEl.appendChild(state.previewEl1)
  state.previewEl1.style.cssText = `
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-image: var(--preview);
    background-repeat: no-repeat;
    background-position: 50% 0%;
    background-size: cover;
    opacity: 0;
    transition: opacity .2s;
`

  // Create preview 2 element
  state.previewEl2 = document.createElement('div')
  previewBoxEl.appendChild(state.previewEl2)
  state.previewEl2.style.cssText = `
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-image: var(--preview);
    background-repeat: no-repeat;
    background-position: 50% 0%;
    background-size: cover;
    opacity: 0;
    transition: opacity .2s;
`

  compensateZoom()
  updatePreview(initData.tabId, initData.title, initData.url, false)
  state.popupHeight = getPopupHeight()
  calcPositionRestraints()
  setPopupPosition(initData.y)
  setTimeout(() => show(), 50)
}

main()
