/* eslint no-console: off */
import { UrlPageInitData } from 'src/services/tabs.bg.actions'
import { toCSSVarName } from 'src/utils'
import * as Logs from 'src/services/logs'
import { InstanceType } from 'src/types'
import { ParsedTheme, SrcVars } from 'src/services/styles'

function waitDOM(): Promise<void> {
  return new Promise(res => {
    if (document.readyState !== 'loading') res()
    else document.addEventListener('DOMContentLoaded', () => res())
  })
}
function waitInitData(): Promise<void> {
  return new Promise((ok, err) => {
    if (window.sideberyInitData) return ok()
    window.onSideberyInitDataReady = ok
    setTimeout(() => err('UrlPage: No initial data (sideberyInitData)'), 2000)
  })
}

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
  Logs.setInstanceType(InstanceType.url)

  await Promise.all([waitDOM(), waitInitData()])
  const initData = window.sideberyInitData as UrlPageInitData

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
  const titleLabel = browser.i18n.getMessage('unavailable_url')
  if (titleLabel) titleEl.innerText = titleLabel
  const targetTitleLabelLable = browser.i18n.getMessage('page_title')
  if (targetTitleLabelLable) targetTitleLabelEl.innerText = targetTitleLabelLable
  const linkLabelLable = browser.i18n.getMessage('original_url')
  if (linkLabelLable) targetLinkLabelEl.innerText = linkLabelLable
  const copyBtnLabel = browser.i18n.getMessage('copy_url')
  if (copyBtnLabel) copyBtnEl.innerText = copyBtnLabel
  const apiLimitNoteLabel = browser.i18n.getMessage('api_limit_info')
  if (apiLimitNoteLabel) titleNoteEl.innerText = apiLimitNoteLabel

  // Get data from URL
  const hash = window.location.hash.slice(1)
  let url: string | undefined
  if (hash) {
    try {
      const jsonData = decodeURIComponent(hash)
      const data = JSON.parse(jsonData) as string[]
      url = decodeURI(data[0])
      document.title = data[1]
      targetTitleEl.innerText = data[1]
    } catch {
      url = decodeURI(hash)
      document.title = hash
      targetTitleLabelEl.remove()
      targetTitleEl.remove()
    }
  }
  if (!url) return Logs.err('Cannot get url value')

  // Setup link
  targetLinkEl.innerText = url

  // Setup copy button
  copyBtnEl.addEventListener('click', () => {
    if (url) navigator.clipboard.writeText(encodeURI(url))
  })
})()
