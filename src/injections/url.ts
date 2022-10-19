/* eslint no-console: off */
import { UrlPageInitData } from 'src/services/tabs.bg.actions'
import { toCSSVarName } from 'src/utils'
import * as Logs from 'src/services/logs'
import { InstanceType } from 'src/types'

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

function initTheme(theme: string): void {
  const themeLinkEl = document.getElementById('theme_link') as HTMLLinkElement

  // Create next theme link
  const nextThemeLinkEl = document.createElement('link')
  nextThemeLinkEl.type = 'text/css'
  nextThemeLinkEl.rel = 'stylesheet'
  document.head.appendChild(nextThemeLinkEl)

  // Wait until new theme loaded
  nextThemeLinkEl.onload = () => {
    // Remove prev theme link
    if (themeLinkEl) themeLinkEl.remove()
    nextThemeLinkEl.id = 'theme_link'
  }
  nextThemeLinkEl.href = `/themes/${theme}/url.css`
}

function applyFirefoxThemeColors(theme: browser.theme.Theme): void {
  const rootEl = document.getElementById('root')
  if (!rootEl || !theme.colors) return

  for (const prop of Object.keys(theme.colors) as (keyof browser.theme.ThemeColors)[]) {
    const value = theme.colors[prop]

    if (value) {
      rootEl.style.setProperty(toCSSVarName('ff_' + prop), value)
    } else {
      rootEl.style.removeProperty(toCSSVarName('ff_' + prop))
    }
  }
}

void (async () => {
  Logs.setType(InstanceType.url)

  await Promise.all([waitDOM(), waitInitData()])
  const initData = window.sideberyInitData as UrlPageInitData

  if (initData.winId !== undefined) Logs.setWinId(initData.winId)
  if (initData.tabId !== undefined) Logs.setTabId(initData.tabId)

  if (initData.theme) initTheme(initData.theme)
  else Logs.warn('Cannot init sidebery theme')
  if (initData.ffTheme) applyFirefoxThemeColors(initData.ffTheme)
  else Logs.warn('Cannot apply firefox theme colors')
  if (initData.colorScheme) document.body.setAttribute('data-color-scheme', initData.colorScheme)
  else {
    Logs.warn('Cannot set color scheme')
    document.body.setAttribute('data-color-scheme', 'dark')
  }

  const titleEl = document.getElementById('title')
  const targetTitleLabelEl = document.getElementById('target_title_label')
  const targetTitleEl = document.getElementById('target_title')
  const targetLinkLabelEl = document.getElementById('target_url_label')
  const targetLinkEl = document.getElementById('target_url')
  const copyBtnEl = document.getElementById('copy_btn')
  const apiLimitNoteEl = document.getElementById('api_limit_note')
  const apiLimitNoteMoreEl = document.getElementById('api_limit_note_more')
  if (!titleEl) return Logs.err('Cannot get element: titleEl')
  if (!targetTitleLabelEl) return Logs.err('Cannot get element: targetTitleLabelEl')
  if (!targetTitleEl) return Logs.err('Cannot get element: targetTitleEl')
  if (!targetLinkLabelEl) return Logs.err('Cannot get element: targetLinkLabelEl')
  if (!targetLinkEl) return Logs.err('Cannot get element: targetLinkEl')
  if (!copyBtnEl) return Logs.err('Cannot get element: copyBtnEl')
  if (!apiLimitNoteEl) return Logs.err('Cannot get element: apiLimitNoteEl')
  if (!apiLimitNoteMoreEl) return Logs.err('Cannot get element: apiLimitNoteMoreEl')

  // Translate
  const titleElLable = browser.i18n.getMessage('unavailable_url')
  if (titleElLable) titleEl.innerText = titleElLable
  const targetTitleLabelLable = browser.i18n.getMessage('page_title')
  if (targetTitleLabelLable) targetTitleLabelEl.innerText = targetTitleLabelLable
  const linkLabelLable = browser.i18n.getMessage('original_url')
  if (linkLabelLable) targetLinkLabelEl.innerText = linkLabelLable
  const copyBtnLabel = browser.i18n.getMessage('copy_url')
  if (copyBtnLabel) copyBtnEl.innerText = copyBtnLabel
  const apiLimitNoteLabel = browser.i18n.getMessage('api_limit_info')
  if (apiLimitNoteLabel) apiLimitNoteEl.innerText = apiLimitNoteLabel
  const apiLimitNoteMoreLabel = browser.i18n.getMessage('api_limit_info_more')
  if (apiLimitNoteMoreLabel) apiLimitNoteMoreEl.innerText = apiLimitNoteMoreLabel

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
