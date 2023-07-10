import { sleep } from 'src/utils'
import { GroupPin, GroupedTabInfo, InstanceType, GroupConfig } from 'src/types'
import { GroupPageInitData } from 'src/services/tabs.bg.actions'
import { getFavPlaceholder } from 'src/services/favicons.actions'
import { NOID, SETTINGS_OPTIONS } from 'src/defaults'
import { applyThemeSrcVars, loadCustomGroupCSS } from './group.styles'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { GroupMsg } from './group.ipc'

const PIN_SCREENSHOT_QUALITY = 90
const SCREENSHOT_QUALITY = 25

let tabsBoxEl: HTMLElement | null
let newTabEl: HTMLDivElement
let groupWinId: ID
let groupTabId: ID
let groupTabIndex: number
let groupLayout: (typeof SETTINGS_OPTIONS.groupLayout)[number]
let pinTab: GroupPin | undefined
let tabs: GroupedTabInfo[]
let groupLen: number, groupParentId: ID | undefined
let screenshots: Record<string, string>

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
    setTimeout(() => err('GroupPage: No initial data (sideberyInitData)'), 2000)
  })
}

async function main() {
  IPC.setInstanceType(InstanceType.group)
  Logs.setInstanceType(InstanceType.group)

  try {
    await Promise.all([waitDOM(), waitInitData()])
  } catch (e) {
    Logs.err('Group page: Initialization error:', e)
    return
  }
  const initData = window.sideberyInitData as GroupPageInitData

  groupWinId = initData.winId ?? -1
  groupTabId = initData.tabId ?? -1

  IPC.setWinId(groupWinId)
  IPC.setTabId(groupTabId)
  Logs.setWinId(groupWinId)
  Logs.setTabId(groupTabId)

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
  loadCustomGroupCSS()

  groupLayout = initData.groupLayout ?? 'grid'
  document.body.setAttribute('data-layout', groupLayout)
  document.body.setAttribute('data-animations', initData.animations ? 'fast' : 'none')

  const config = parseUrl()

  // Set title of group page
  const title = config?.title ?? ''
  const titleEl = document.getElementById('title') as HTMLInputElement
  titleEl.value = title
  document.title = title || '‎'

  if (!initData.groupInfo) {
    Logs.warn('No group info')
    const warnEl = document.getElementById('disconnected_warn')
    if (warnEl) warnEl.textContent = browser.i18n.getMessage('group_disconnected_warn')
    document.body.setAttribute('data-disconnected', 'true')
    return
  }

  IPC.connectTo(InstanceType.bg, groupWinId, groupTabId)

  screenshots = {}
  tabs = initData.groupInfo.tabs || []
  groupTabIndex = initData.groupInfo.index || 0
  groupLen = initData.groupInfo.len || 0
  groupParentId = initData.groupInfo.parentId
  pinTab = initData.groupInfo.pin

  // Listen chagnes of title
  titleEl.addEventListener('input', onTitleChange as (e: Event) => void)

  if (pinTab) {
    document.body.setAttribute('data-pin', 'true')
    document.title = pinTab.title
    updatePinnedTab(pinTab, (event: MouseEvent) => onTabClick(event, pinTab))
  }

  tabsBoxEl = document.getElementById('tabs')
  if (!tabsBoxEl) throw new Error('Cannot get tabs container element')

  while (tabsBoxEl.lastChild) {
    tabsBoxEl.removeChild(tabsBoxEl.lastChild)
  }

  for (const tab of tabs) {
    createTabEl(tab, (event: MouseEvent) => onTabClick(event, tab))
    if (tab.el) tabsBoxEl.appendChild(tab.el)
  }

  createNewTabButton()

  document.body.addEventListener('mousedown', e => {
    if (e.button === 2 && groupParentId !== undefined && groupParentId !== NOID) {
      e.preventDefault()
      IPC.bg('tabsApiProxy', 'update', groupParentId, { active: true })
    }
  })

  document.body.addEventListener('contextmenu', e => e.preventDefault())

  // Set listener
  browser.runtime.onMessage.addListener(onGroupMsg)

  updateScreenshots()
}

function parseUrl(): GroupConfig | undefined {
  let hash
  try {
    hash = decodeURIComponent(window.location.hash.slice(1))
  } catch (e) {
    Logs.err('parseUrl: Cannot decode URI component', e)
    return
  }

  const hashData = hash.split(':id:')
  const title = hashData[0].trim()

  return { title }
}

let onTitleChangeTimeout: number | undefined
function onTitleChange(e: DOMEvent<Event, HTMLInputElement>): void {
  clearTimeout(onTitleChangeTimeout)
  onTitleChangeTimeout = setTimeout(() => {
    const normTitle = e.target.value.trim()
    document.title = normTitle || '‎'
    window.location.hash = `#${encodeURIComponent(normTitle)}`
  }, 500)
}

/**
 * Handle group page update msg
 */
function onGroupMsg(msg: GroupMsg) {
  let i
  if (msg.index !== undefined) groupTabIndex = msg.index
  if (msg.len !== undefined) groupLen = msg.len
  if (msg.parentId !== undefined) groupParentId = msg.parentId
  if (msg.title !== undefined) {
    const normTitle = msg.title.trim()
    document.title = normTitle || '‎'
    const titleEl = document.getElementById('title') as HTMLInputElement | null
    if (titleEl) titleEl.value = normTitle
    window.location.hash = `#${encodeURIComponent(normTitle)}`
  }

  if (msg.tabs !== undefined) {
    for (i = 0; i < msg.tabs.length; i++) {
      const newTab = msg.tabs[i]
      const oldTab = tabs[i]
      if (!oldTab) {
        createTabEl(newTab, (event: MouseEvent) => onTabClick(event, newTab))
        if (newTab.el) {
          newTabEl.before(newTab.el)
          tabs[i] = newTab
        }
      } else {
        updateTab(oldTab, newTab)
      }
    }

    for (; i < tabs.length; i++) {
      const tab = tabs[i]
      tab.el?.remove()
      tabs.splice(i, 1)
    }
  }

  if (msg.pin) {
    pinTab = msg.pin
    if (pinTab) {
      document.body.setAttribute('data-pin', 'true')
      document.title = pinTab.title
      updatePinnedTab(pinTab, (event: MouseEvent) => onTabClick(event, pinTab))
    }
  }

  if (msg.createdTab) onTabCreated(msg.createdTab)
  if (msg.updatedTab) onTabUpdated(msg.updatedTab)
  if (msg.removedTab !== undefined) onTabRemoved(msg.removedTab)
}

/**
 * Handle creating tab
 */
async function onTabCreated(tab: GroupedTabInfo) {
  createTabEl(tab, (event: MouseEvent) => onTabClick(event, tab))
  if (!tab.el) return

  const index = tab.index - groupTabIndex - 1
  if (index === -1 || index === tabs.length) {
    newTabEl.before(tab.el)
    tabs.push(tab)
  } else if (index >= 0 && index < tabs.length) {
    tabs[index].el?.before(tab.el)
    tabs.splice(index, 0, tab)
  } else {
    Logs.warn('Cannot add new tab: Wrong index')
    return
  }

  groupLen++
  await sleep(256)
  takeScreenshot(tab, SCREENSHOT_QUALITY)
}

/**
 * Handle tab update msg
 */
function onTabUpdated(upd: GroupedTabInfo) {
  const tab = tabs.find(t => t.id === upd.id)
  if (!tab?.el) return

  tab.el.setAttribute('data-status', upd.status ?? '')
  if (upd.status === 'complete') {
    tab.el.setAttribute('data-fav', String(!!upd.favIconUrl))
    if (tab.favEl) tab.favEl.style.backgroundImage = `url(${upd.favIconUrl})`
    tab.favIconUrl = upd.favIconUrl
    takeScreenshot(tab, SCREENSHOT_QUALITY)
  }

  if (tab.titleEl) tab.titleEl.textContent = upd.title
  tab.title = upd.title

  if (tab.urlEl) {
    if (upd.url.startsWith('moz-ext')) tab.urlEl.textContent = ''
    else tab.urlEl.textContent = upd.url
  }
  tab.url = upd.url

  if (tab.favPlaceholderSvgEl) {
    setSvgId(tab.favPlaceholderSvgEl, getFavPlaceholder(upd.url))
  }

  tab.el.setAttribute('data-discarded', String(upd.discarded))
  tab.discarded = upd.discarded

  tab.el.setAttribute('data-lvl', String(upd.lvl))
  tab.lvl = upd.lvl
}

/**
 * Handle tab remove msg
 */
function onTabRemoved(id: ID) {
  const index = tabs.findIndex(t => t.id === id)
  if (index === -1) return
  tabs[index].el?.remove()
  tabs.splice(index, 1)
  groupLen--

  if (groupLen === 0 && window.location.search.includes('pin=')) {
    IPC.bg('tabsApiProxy', 'remove', groupTabId)
  }
}

/**
 * Create new-tab button
 */
function createNewTabButton() {
  if (!tabsBoxEl) return

  newTabEl = document.createElement('div')
  newTabEl.classList.add('new-tab')
  newTabEl.title = browser.i18n.getMessage('group_new_tab_tooltip')
  tabsBoxEl.appendChild(newTabEl)

  newTabEl.addEventListener('mousedown', (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    IPC.bg('tabsApiProxy', 'create', {
      windowId: groupWinId,
      index: groupTabIndex + groupLen + 1,
      openerTabId: groupTabId,
      active: event.button === 0 ? true : false,
    })
  })
  newTabEl.addEventListener('mouseup', event => {
    event.stopPropagation()
    event.preventDefault()
  })
}

/**
 * Create tab element
 */
function createTabEl(info: GroupedTabInfo, clickHandler: (e: MouseEvent) => void) {
  info.el = document.createElement('div')
  info.el.classList.add('tab')
  info.el.title = info.url
  info.el.setAttribute('data-lvl', String(info.lvl))
  info.el.setAttribute('data-discarded', String(info.discarded))
  info.el.setAttribute('data-fav', String(!!info.favIconUrl))

  info.bgEl = document.createElement('div')
  info.bgEl.classList.add('bg')
  info.el.appendChild(info.bgEl)

  info.favEl = document.createElement('div')
  info.favEl.classList.add('fav')
  info.favEl.style.backgroundImage = `url(${info.favIconUrl})`
  info.el.appendChild(info.favEl)

  info.favPlaceholderEl = document.createElement('div')
  info.favPlaceholderEl.classList.add('fav-placeholder')
  const iconId = getFavPlaceholder(info.url)
  info.favPlaceholderSvgEl = createSvgIcon(iconId)
  info.favPlaceholderEl.appendChild(info.favPlaceholderSvgEl)
  info.el.appendChild(info.favPlaceholderEl)

  const infoEl = document.createElement('div')
  infoEl.classList.add('info')
  info.el.appendChild(infoEl)

  info.titleEl = document.createElement('h3')
  info.titleEl.classList.add('tab-title')
  info.titleEl.textContent = info.title
  infoEl.appendChild(info.titleEl)

  info.urlEl = document.createElement('a')
  info.urlEl.classList.add('tab-url')
  info.urlEl.setAttribute('href', info.url)
  info.urlEl.addEventListener('click', e => e.preventDefault())
  if (info.url.startsWith('moz-ext')) info.urlEl.textContent = ''
  else info.urlEl.textContent = info.url
  infoEl.appendChild(info.urlEl)

  const ctrlsEl = document.createElement('div')
  ctrlsEl.classList.add('ctrls')
  info.el.appendChild(ctrlsEl)

  const discardBtnEl = createTabButton('#icon_discard', 'discard-btn', event => {
    event.stopPropagation()
    IPC.bg('tabsApiProxy', 'discard', info.id)
  })
  discardBtnEl.title = browser.i18n.getMessage('group_tab_discard_tooltip')
  ctrlsEl.appendChild(discardBtnEl)

  const reloadBtnEl = createTabButton('#icon_reload', 'reload-btn', event => {
    event.stopPropagation()
    if (event.button === 0 || event.button === 1) {
      IPC.bg('tabsApiProxy', 'reload', info.id)
    }
  })
  reloadBtnEl.title = browser.i18n.getMessage('group_tab_reload_tooltip')
  ctrlsEl.appendChild(reloadBtnEl)

  const closeBtnEl = createTabButton('#icon_close', 'close-btn', event => {
    event.stopPropagation()
    IPC.bg('tabsApiProxy', 'remove', info.id)
  })
  closeBtnEl.title = browser.i18n.getMessage('group_tab_close_tooltip')
  ctrlsEl.appendChild(closeBtnEl)

  info.el.addEventListener('mousedown', e => e.stopPropagation())
  info.el.addEventListener('click', clickHandler)
}

let pinnedTabEventsListeners = false
/**
 * Create pinned tab element on the page
 */
function updatePinnedTab(info: GroupPin, clickHandler: (e: MouseEvent) => void) {
  info.el = document.getElementById('pinned_tab')
  if (!info.el) return
  info.el.title = info.url

  info.bgEl = document.getElementById('pinned_tab_bg')

  info.titleEl = document.getElementById('pinned_tab_title')
  if (info.titleEl) info.titleEl.textContent = info.title

  info.urlEl = document.getElementById('pinned_tab_url')
  if (info.urlEl) info.urlEl.textContent = info.url

  if (!pinnedTabEventsListeners) {
    info.el.addEventListener('mousedown', e => e.stopPropagation())
    info.el.addEventListener('click', clickHandler)
    pinnedTabEventsListeners = true
  }
}

function createTabButton(svgId: string, className: string, clickHandler: (e: MouseEvent) => void) {
  const btnEl = document.createElement('div')
  btnEl.classList.add('tab-btn', className)

  const svgEl = createSvgIcon(svgId)
  btnEl.appendChild(svgEl)

  btnEl.addEventListener('click', clickHandler)

  return btnEl
}

/**
 * Create svg element with use tag
 */
function createSvgIcon(svgId: string) {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgEl.setAttributeNS(
    'http://www.w3.org/2000/xmlns/',
    'xmlns:xlink',
    'http://www.w3.org/1999/xlink'
  )

  const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', svgId)
  svgEl.appendChild(useEl)

  return svgEl
}

/**
 * Set id for use tag
 */
function setSvgId(svgEl: SVGElement, svgId: string) {
  const useEl = svgEl.childNodes[0] as SVGElement
  if (!useEl) return
  useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', svgId)
}

/**
 * Take screenshot of tab
 */
async function takeScreenshot(tab: GroupedTabInfo | GroupPin, quality = 90) {
  if (tab.discarded) {
    const screen = screenshots[tab.url]
    if (tab.bgEl && screen) tab.bgEl.style.backgroundImage = `url(${screen})`
    else if (tab.bgEl && tab.favIconUrl) {
      tab.bgEl.style.backgroundImage = `url(${tab.favIconUrl})`
      tab.bgEl.style.filter = 'blur(8px)'
      if (groupLayout === 'list') tab.bgEl.style.left = '-4px'
    }
    return
  } else {
    if (tab.bgEl) {
      tab.bgEl.style.filter = 'none'
      if (groupLayout === 'list') tab.bgEl.style.left = '0'
    }
  }

  try {
    const screen = (await IPC.bg('tabsApiProxy', 'captureTab', tab.id, {
      format: 'jpeg',
      quality,
    })) as string
    if (tab.bgEl) tab.bgEl.style.backgroundImage = `url(${screen})`
    screenshots[tab.url] = screen
  } catch {
    const screen = screenshots[tab.url]
    if (tab.bgEl && screen) tab.bgEl.style.backgroundImage = `url(${screen})`
  }
}

/**
 * Update screenshots for all tabs
 */
async function updateScreenshots() {
  const newScreenshots: Record<string, string> = {}
  if (pinTab) {
    takeScreenshot(pinTab, PIN_SCREENSHOT_QUALITY)
    await takeScreenshot(pinTab, PIN_SCREENSHOT_QUALITY)
    newScreenshots[pinTab.url] = screenshots[pinTab.url]
  }

  for (const tab of tabs) {
    await takeScreenshot(tab, SCREENSHOT_QUALITY)
    newScreenshots[tab.url] = screenshots[tab.url]
  }

  screenshots = newScreenshots
}

/**
 * Handle tab click
 */
function onTabClick(event: MouseEvent, tab?: { id: ID }) {
  if (!tab) return
  event.stopPropagation()
  IPC.bg('tabsApiProxy', 'update', tab.id, { active: true })
}

/**
 * Update tab
 */
function updateTab(oldTab: GroupedTabInfo, newTab: GroupedTabInfo) {
  const titleChanged = oldTab.title !== newTab.title
  const urlChanged = oldTab.url !== newTab.url

  if (!oldTab.el) return

  if (titleChanged && oldTab.titleEl) oldTab.titleEl.textContent = newTab.title
  if (urlChanged && oldTab.urlEl) {
    if (newTab.url.startsWith('moz-ext')) oldTab.urlEl.textContent = ''
    else oldTab.urlEl.textContent = newTab.url
    oldTab.urlEl.setAttribute('href', newTab.url)
    oldTab.el.title = newTab.url
    if (oldTab.favPlaceholderSvgEl) {
      setSvgId(oldTab.favPlaceholderSvgEl, getFavPlaceholder(newTab.url))
    }
  }
  if (oldTab.lvl !== newTab.lvl) oldTab.el.setAttribute('data-lvl', String(newTab.lvl))
  if (oldTab.discarded !== newTab.discarded) {
    oldTab.el.setAttribute('data-discarded', String(newTab.discarded))
  }
  if (oldTab.favIconUrl !== newTab.favIconUrl && oldTab.favEl) {
    oldTab.el.setAttribute('data-fav', String(!!newTab.favIconUrl))
    oldTab.favEl.style.backgroundImage = `url(${newTab.favIconUrl})`
  }

  Object.assign(oldTab, newTab)

  if (titleChanged || urlChanged) takeScreenshot(oldTab, SCREENSHOT_QUALITY)
}

void main()
