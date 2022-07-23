import { InstanceType } from 'src/types'
import { Info } from 'src/services/info'
import { Styles } from 'src/services/styles'
import { Settings } from 'src/services/settings'
import { Logs } from 'src/services/logs'
import { IPC } from 'src/services/ipc'

void (async () => {
  if (window.sideberyUrlPageInjected) return
  window.sideberyUrlPageInjected = true

  Info.setInstanceType(InstanceType.url)

  const titleEl = document.getElementById('title')
  const targetTitleLabelEl = document.getElementById('target_title_label')
  const targetTitleEl = document.getElementById('target_title')
  const targetLinkLabelEl = document.getElementById('target_url_label')
  const targetLinkEl = document.getElementById('target_url')
  const copyBtnEl = document.getElementById('copy_btn')
  const apiLimitNoteEl = document.getElementById('api_limit_note')
  const apiLimitNoteMoreEl = document.getElementById('api_limit_note_more')
  if (!titleEl) return Logs.err('Cannot get element of page')
  if (!targetTitleLabelEl) return Logs.err('Cannot get title label element')
  if (!targetTitleEl) return Logs.err('Cannot get title element')
  if (!targetLinkLabelEl) return Logs.err('Cannot get link label element')
  if (!targetLinkEl) return Logs.err('Cannot get link element')
  if (!copyBtnEl) return Logs.err('Cannot get copy button element')
  if (!apiLimitNoteEl) return Logs.err('Cannot get element of page')
  if (!apiLimitNoteMoreEl) return Logs.err('Cannot get element of page')

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

  const result = await Promise.all([IPC.bg('getUrlPageInitData'), Settings.loadSettings()])
  const initData = result[0]

  // Set theme/color-scheme
  Styles.initTheme()
  Styles.initColorScheme(initData.ffTheme)
    .then(() => {
      document.body.setAttribute('data-color-scheme', Styles.reactive.colorScheme)
    })
    .catch(err => {
      Logs.warn('Cannot init color scheme', err)
      document.body.setAttribute('data-color-scheme', 'dark')
    })

  if (!url) return Logs.err('Cannot get url value')

  // Setup link
  targetLinkEl.innerText = url

  // Setup copy button
  copyBtnEl.addEventListener('click', () => {
    if (url) navigator.clipboard.writeText(encodeURI(url))
  })
})()
