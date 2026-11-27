/* eslint no-console: off */
import type { ParsedTheme, SrcVars } from 'src/services/styles'
import type { PlaceholderPageInitData } from 'src/services/tabs.bg'
import { createPlaceholderUrl, decodePlaceholderInfo, toCSSVarName } from 'src/utils'
import * as Logs from './url.logs'
import * as IPPC from 'src/services/ippc.page'
import { InstanceType } from 'src/enums'
import { PAGE_HASH_RE } from 'src/defaults'

let prefix = ''
let url = ''
let title = ''
let bind = false
let unbound = false
let renderHeading: (() => void) | undefined

function applyThemeSrcVars(parsed: ParsedTheme, rootEl?: HTMLElement): void {
  if (!rootEl) rootEl = document.getElementById('root') ?? undefined
  if (!rootEl) return

  for (const prop of Object.keys(parsed.vars) as (keyof SrcVars)[]) {
    const value = parsed.vars[prop]

    if (value) {
      rootEl.style.setProperty(toCSSVarName('s_' + prop), value)
    } else {
      rootEl.style.removeProperty(toCSSVarName('s_' + prop))
    }
  }
}

void (async () => {
  try {
    parseUrl()
  } catch {
    Logs.err('Cannot parse url')
    const titleNoteEl = document.getElementById('title_note')
    if (titleNoteEl) titleNoteEl.textContent = 'Cannot parse url...'
    return
  }

  document.title = title

  const initData: PlaceholderPageInitData = await IPPC.init(InstanceType.url, setHash, {
    setBound: onSetBound,
  })

  if (initData.winId !== undefined) Logs.setWinId(initData.winId)
  if (initData.tabId !== undefined) Logs.setTabId(initData.tabId)

  if (initData.theme) document.body.setAttribute('data-theme', initData.theme)
  else Logs.warn('Cannot init sidebery theme')
  if (initData.frameColorScheme) {
    document.body.setAttribute('data-frame-color-scheme', initData.frameColorScheme)
  } else Logs.warn('Cannot set frame color scheme')
  if (initData.toolbarColorScheme) {
    document.body.setAttribute('data-toolbar-color-scheme', initData.toolbarColorScheme)
  } else Logs.warn('Cannot set toolbar color scheme')
  if (initData.parsedTheme) applyThemeSrcVars(initData.parsedTheme)
  else Logs.warn('Cannot apply firefox theme colors')

  const titleEl = document.getElementById('title')
  const titleNoteEl = document.getElementById('title_note')
  const targetTitleLabelEl = document.getElementById('target_title_label')
  const targetTitleEl = document.getElementById('target_title')
  const targetLinkLabelEl = document.getElementById('target_url_label')
  const targetLinkEl = document.getElementById('target_url')
  const copyBtnEl = document.getElementById('copy_btn')
  if (!titleEl) return Logs.err('Cannot get element: titleEl')
  if (!titleNoteEl) return Logs.err('Cannot get element: titleNoteEl')
  if (!targetTitleLabelEl) return Logs.err('Cannot get element: targetTitleLabelEl')
  if (!targetTitleEl) return Logs.err('Cannot get element: targetTitleEl')
  if (!targetLinkLabelEl) return Logs.err('Cannot get element: targetLinkLabelEl')
  if (!targetLinkEl) return Logs.err('Cannot get element: targetLinkEl')
  if (!copyBtnEl) return Logs.err('Cannot get element: copyBtnEl')

  // Translate
  const titleLabel = initData.labels?.unavailable_url ?? 'unavailable_url'
  if (titleLabel) titleEl.innerText = titleLabel
  const targetTitleLabelLable = initData.labels?.page_title ?? 'page_title'
  if (targetTitleLabelLable) targetTitleLabelEl.innerText = targetTitleLabelLable
  const linkLabelLable = initData.labels?.original_url ?? 'original_url'
  if (linkLabelLable) targetLinkLabelEl.innerText = linkLabelLable
  const copyBtnLabel = initData.labels?.copy_url ?? 'copy_url'
  if (copyBtnLabel) copyBtnEl.innerText = copyBtnLabel
  const apiLimitNoteLabel = initData.labels?.api_limit_info ?? 'api_limit_info'
  if (apiLimitNoteLabel) titleNoteEl.innerText = apiLimitNoteLabel

  // Render title and url
  targetTitleEl.innerText = title
  try {
    targetLinkEl.innerText = decodeURI(url)
  } catch {
    targetLinkEl.innerText = url
  }

  // Bind placeholder: editable url with "Open" button
  if (bind) {
    const openBtnEl = document.getElementById('open_btn')
    const inputEl = document.getElementById('target_url_input') as HTMLTextAreaElement | null
    if (!openBtnEl) return Logs.err('Cannot get element: openBtnEl')
    if (!inputEl) return Logs.err('Cannot get element: inputEl')

    renderHeading = () => {
      if (unbound) titleEl.innerText = initData.labels?.unbound_tab || 'Unbound Tab'
      else titleEl.innerText = initData.labels?.bound_tab || 'Bound Tab'
    }
    renderHeading()
    targetLinkLabelEl.innerText = initData.labels?.url || 'URL'
    openBtnEl.innerText = initData.labels?.open || 'Open'
    document.body.setAttribute('data-bind', 'true')
    const iconEl = document.createElement('link')
    iconEl.rel = 'icon'
    iconEl.type = 'image/svg+xml'
    iconEl.href = '/assets/bound-page-favicon.svg'
    document.head.appendChild(iconEl)
    titleNoteEl.hidden = true
    targetLinkEl.hidden = true
    copyBtnEl.hidden = true
    openBtnEl.hidden = false
    inputEl.hidden = false
    inputEl.value = targetLinkEl.innerText

    // Grow with the text; scroll only once it would reach the bottom of the page
    const fit = () => {
      inputEl.style.height = 'auto'
      const fullH = inputEl.scrollHeight + 2
      let h = fullH
      // The page is vertically centered, so each height change moves the box; re-measure a few times
      for (let i = 0; i < 6; i++) {
        inputEl.style.height = `${h}px`
        const over = inputEl.getBoundingClientRect().bottom - (window.innerHeight - 24)
        const next = Math.max(48, Math.min(fullH, h - over))
        if (Math.abs(next - h) < 1) break
        h = next
      }
    }
    inputEl.addEventListener('input', fit)
    window.addEventListener('resize', fit)
    fit()

    const open = () => {
      const dst = inputEl.value.trim()
      if (dst) window.location.href = dst
    }
    openBtnEl.addEventListener('click', open)
    // Enter anywhere on the page opens (also stops the URL box getting a newline)
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        open()
      }
    })
    return
  }

  // Setup copy button
  copyBtnEl.addEventListener('click', () => {
    if (url) navigator.clipboard.writeText(encodeURI(url))
  })
  copyBtnEl.addEventListener('keydown', e => {
    if (e.code === 'Enter' && url) {
      copyBtnEl.style.opacity = '.6'
    }
  })
  copyBtnEl.addEventListener('keyup', e => {
    if (e.code === 'Enter' && url) {
      navigator.clipboard.writeText(encodeURI(url))
      copyBtnEl.style.opacity = '1'
    }
  })
})()

function parseUrl() {
  const reResult = PAGE_HASH_RE.exec(window.location.hash)
  const data = reResult?.groups?.prefix
  if (!data) throw 'parseUrl: no data'
  prefix = data

  const info = decodePlaceholderInfo(data)
  url = info.url
  if (info.title) title = info.title
  bind = !!info.bind
  unbound = !!info.unbound
}

/**
 * Sidebar (un)bound this placeholder's tab: update the heading, and the hash
 * so a reload keeps the state (the trailing IPPC suffix is kept as is)
 */
function onSetBound(isBound: boolean) {
  if (!bind) return
  unbound = !isBound
  const suffix = window.location.hash.slice(1 + prefix.length)
  const info = { url, title: title || undefined, bind: true, unbound: unbound || undefined }
  const newUrl = createPlaceholderUrl(info)
  prefix = newUrl.slice(newUrl.indexOf('#') + 1)
  history.replaceState(undefined, '', `#${prefix}${suffix}`)
  renderHeading?.()
}

function setHash(h: string) {
  history.replaceState(undefined, '', `#${prefix}${h}`)
}
