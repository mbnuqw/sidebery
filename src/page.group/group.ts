import Utils from 'src/utils'
import { GroupPin, GroupedTabInfo, InstanceType } from 'src/types'
import { Msg } from 'src/services/msg'
import { Settings } from 'src/services/settings'
import { Favicons } from 'src/services/favicons'
import { Styles } from 'src/services/styles'
import { Info } from 'src/services/info'
import { Logs } from 'src/services/logs'
import { Windows } from 'src/services/windows'

interface MsgUpdated {
  name: 'update'
  windowId: ID
  instanceType: InstanceType
  id: ID
  index: number
  len: number
  parentId: ID
  tabs: GroupedTabInfo[]
}

type MsgTabCreated = {
  name: 'create'
  windowId: ID
  instanceType: InstanceType
} & GroupedTabInfo

type MsgTabUpdated = {
  name: 'updateTab'
  windowId: ID
  instanceType: InstanceType
} & GroupedTabInfo

type MsgTabRemoved = {
  name: 'remove'
  windowId: ID
  instanceType: InstanceType
} & GroupedTabInfo

type Msg = MsgUpdated | MsgTabCreated | MsgTabUpdated | MsgTabRemoved

const PIN_SCREENSHOT_QUALITY = 90
const SCREENSHOT_QUALITY = 25

let tabsBoxEl: HTMLElement | null
let newTabEl: HTMLDivElement
let groupId: string
let groupWinId: ID
let groupTabId: ID
let groupTabIndex: number
let pinTab: GroupPin | undefined
let tabs: GroupedTabInfo[] = []
let groupLen: number, groupParentId: ID | undefined
let screenshots: Record<string, string> = {}

function waitDOM(): Promise<void> {
  return new Promise(res => {
    if (document.readyState !== 'loading') res()
    else document.addEventListener('DOMContentLoaded', () => res())
  })
}

async function main() {
  if (window.sideberyGroupPageInjected) return Logs.info('Already initialized')
  window.sideberyGroupPageInjected = true

  Info.setInstanceType(InstanceType.group)

  if (window.groupWinId === undefined || window.groupTabId === undefined) {
    await Utils.sleep(123)
  }
  if (window.groupWinId === undefined || window.groupTabId === undefined) {
    Logs.err('Group: No initial data (groupWinId or groupTabId)')
    return
  }

  groupWinId = window.groupWinId
  Windows.id = window.groupWinId
  groupTabId = window.groupTabId

  const result = await Promise.all([
    Msg.req(InstanceType.bg, 'getGroupPageInitData', groupWinId, groupTabId ?? -1),
    Settings.loadSettings(),
    waitDOM(),
  ])
  const initData = result[0]

  document.body.setAttribute('data-layout', Settings.reactive.groupLayout || 'grid')
  document.body.setAttribute('data-animations', Settings.reactive.animations ? 'fast' : 'none')
  Styles.initTheme()
  Styles.initColorScheme(initData.ffTheme)
    .then(() => {
      document.body.setAttribute('data-color-scheme', Styles.reactive.colorScheme || 'dark')
    })
    .catch(() => {
      document.body.setAttribute('data-color-scheme', 'dark')
    })
  Styles.loadCustomGroupCSS()

  // Load current window and get url-hash
  let hash
  try {
    hash = decodeURIComponent(window.location.hash.slice(1))
  } catch (err) {
    Logs.err('Group: Cannot decode URI component', err)
    return
  }

  // Set title of group page
  const titleEl = document.getElementById('title') as HTMLInputElement
  const hashData = hash.split(':id:')
  const title = hashData[0]
  groupId = hashData[1]
  titleEl.value = title
  document.title = title

  // Listen chagnes of title
  titleEl.addEventListener('input', onTitleChange as (e: Event) => void)

  if (!initData.groupInfo) {
    const warnEl = document.getElementById('disconnected_warn')
    if (warnEl) warnEl.innerText = browser.i18n.getMessage('group_disconnected_warn')
    document.body.setAttribute('data-disconnected', 'true')
    return
  }

  tabs = initData.groupInfo.tabs || []
  groupTabId = initData.groupInfo.id || -1
  groupTabIndex = initData.groupInfo.index || 0
  groupLen = initData.groupInfo.len || 0
  groupParentId = initData.groupInfo.parentId
  pinTab = initData.groupInfo.pin

  if (pinTab) {
    document.body.setAttribute('data-pin', 'true')
    document.title = pinTab.title
    createPinnedTab(pinTab, (event: MouseEvent) => onTabClick(event, pinTab))
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
    if (e.button === 2 && groupParentId) {
      e.preventDefault()
      Msg.req(InstanceType.bg, 'tabsApiProxy', 'update', groupParentId, { active: true })
    }
  })

  document.body.addEventListener('contextmenu', e => e.preventDefault())

  // Set listeners
  browser.runtime.onMessage.addListener((msg: Msg) => {
    if (msg.windowId !== undefined && msg.windowId !== groupWinId) return
    if (msg.instanceType !== undefined && msg.instanceType !== InstanceType.group) return

    if (msg.name === 'update') onGroupUpdated(msg)
    if (msg.name === 'create') onTabCreated(msg)
    if (msg.name === 'updateTab') onTabUpdated(msg)
    if (msg.name === 'remove') onTabRemoved(msg)
  })

  updateScreenshots()
}

let onTitleChangeTimeout: number | undefined
function onTitleChange(e: DOMEvent<Event, HTMLInputElement>): void {
  clearTimeout(onTitleChangeTimeout)
  onTitleChangeTimeout = setTimeout(() => {
    const normTitle = e.target.value.trim()
    if (!normTitle) return
    document.title = normTitle
    window.location.hash = `#${encodeURI(normTitle)}:id:${groupId}`
  }, 500)
}

/**
 * Handle group page update msg
 */
function onGroupUpdated(msg: MsgUpdated) {
  let i
  groupTabId = msg.id
  groupTabIndex = msg.index
  groupLen = msg.len
  groupParentId = msg.parentId

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
  } else {
    tabs[index].el?.before(tab.el)
    tabs.splice(index, 0, tab)
  }

  groupLen++
  await Utils.sleep(256)
  takeScreenshot(tab, SCREENSHOT_QUALITY)
}

/**
 * Handle tab update msg
 */
function onTabUpdated(msg: MsgTabUpdated) {
  const tab = tabs.find(t => t.id === msg.id)
  if (!tab?.el) return

  tab.el.setAttribute('data-status', msg.status ?? '')
  if (msg.status === 'complete') {
    tab.el.setAttribute('data-fav', String(!!msg.favIconUrl))
    if (tab.favEl) tab.favEl.style.backgroundImage = `url(${msg.favIconUrl})`
    tab.favIconUrl = msg.favIconUrl
    takeScreenshot(tab, SCREENSHOT_QUALITY)
  }

  if (tab.titleEl) tab.titleEl.innerText = msg.title
  tab.title = msg.title

  if (tab.urlEl) {
    if (msg.url.startsWith('moz-ext')) tab.urlEl.innerText = ''
    else tab.urlEl.innerText = msg.url
  }
  tab.url = msg.url

  if (tab.favPlaceholderSvgEl) {
    setSvgId(tab.favPlaceholderSvgEl, Favicons.getFavPlaceholder(msg.url))
  }

  tab.el.setAttribute('data-discarded', String(msg.discarded))
  tab.discarded = msg.discarded

  tab.el.setAttribute('data-lvl', String(msg.lvl))
  tab.lvl = msg.lvl
}

/**
 * Handle tab remove msg
 */
function onTabRemoved(msg: MsgTabRemoved) {
  const index = tabs.findIndex(t => t.id === msg.id)
  if (index === -1) return
  tabs[index].el?.remove()
  tabs.splice(index, 1)
  groupLen--

  if (groupLen === 0 && window.location.search.includes('pin=')) {
    Msg.req(InstanceType.bg, 'tabsApiProxy', 'remove', groupTabId)
  }
}

/**
 * Create new-tab button
 */
function createNewTabButton() {
  if (!tabsBoxEl) return

  newTabEl = document.createElement('div')
  newTabEl.classList.add('new-tab')
  newTabEl.setAttribute('title', 'Create new tab')
  tabsBoxEl.appendChild(newTabEl)

  newTabEl.addEventListener('mousedown', (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    Msg.req(InstanceType.bg, 'tabsApiProxy', 'create', {
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
  const iconId = Favicons.getFavPlaceholder(info.url)
  info.favPlaceholderSvgEl = createSvgIcon(iconId)
  info.favPlaceholderEl.appendChild(info.favPlaceholderSvgEl)
  info.el.appendChild(info.favPlaceholderEl)

  const infoEl = document.createElement('div')
  infoEl.classList.add('info')
  info.el.appendChild(infoEl)

  info.titleEl = document.createElement('h3')
  info.titleEl.classList.add('tab-title')
  info.titleEl.innerText = info.title
  infoEl.appendChild(info.titleEl)

  info.urlEl = document.createElement('a')
  info.urlEl.classList.add('tab-url')
  info.urlEl.setAttribute('href', info.url)
  info.urlEl.addEventListener('click', e => e.preventDefault())
  if (info.url.startsWith('moz-ext')) info.urlEl.innerText = ''
  else info.urlEl.innerText = info.url
  infoEl.appendChild(info.urlEl)

  const ctrlsEl = document.createElement('div')
  ctrlsEl.classList.add('ctrls')
  info.el.appendChild(ctrlsEl)

  const discardBtnEl = createTabButton('#icon_discard', 'discard-btn', event => {
    event.stopPropagation()
    Msg.req(InstanceType.bg, 'tabsApiProxy', 'discard', info.id)
  })
  ctrlsEl.appendChild(discardBtnEl)

  const reloadBtnEl = createTabButton('#icon_reload', 'reload-btn', event => {
    event.stopPropagation()
    if (event.button === 0 || event.button === 1) {
      Msg.req(InstanceType.bg, 'tabsApiProxy', 'reload', info.id)
    }
  })
  ctrlsEl.appendChild(reloadBtnEl)

  const closeBtnEl = createTabButton('#icon_close', 'close-btn', event => {
    event.stopPropagation()
    Msg.req(InstanceType.bg, 'tabsApiProxy', 'remove', info.id)
  })
  ctrlsEl.appendChild(closeBtnEl)

  info.el.addEventListener('mousedown', e => e.stopPropagation())
  info.el.addEventListener('click', clickHandler)
}

/**
 * Create pinned tab element on the page
 */
function createPinnedTab(info: GroupPin, clickHandler: (e: MouseEvent) => void) {
  info.el = document.getElementById('pinned_tab')
  if (!info.el) return
  info.el.title = info.url

  info.bgEl = document.getElementById('pinned_tab_bg')

  info.titleEl = document.getElementById('pinned_tab_title')
  if (info.titleEl) info.titleEl.innerText = info.title

  info.urlEl = document.getElementById('pinned_tab_url')
  if (info.urlEl) info.urlEl.innerText = info.url

  info.el.addEventListener('mousedown', e => e.stopPropagation())
  info.el.addEventListener('click', clickHandler)
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
      if (Settings.reactive.groupLayout === 'list') tab.bgEl.style.left = '-4px'
    }
    return
  } else {
    if (tab.bgEl) {
      tab.bgEl.style.filter = 'none'
      if (Settings.reactive.groupLayout === 'list') tab.bgEl.style.left = '0'
    }
  }

  try {
    const screen = (await Msg.req(InstanceType.bg, 'tabsApiProxy', 'captureTab', tab.id, {
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
async function onTabClick(event: MouseEvent, tab?: { id: ID }) {
  if (!tab) return
  event.stopPropagation()
  await browser.runtime.sendMessage({
    instanceType: InstanceType.sidebar,
    action: 'expTabsBranch',
    arg: groupTabId,
  })
  Msg.req(InstanceType.bg, 'tabsApiProxy', 'update', tab.id, { active: true })
}

/**
 * Update tab
 */
function updateTab(oldTab: GroupedTabInfo, newTab: GroupedTabInfo) {
  const titleChanged = oldTab.title !== newTab.title
  const urlChanged = oldTab.url !== newTab.url

  if (!oldTab.el) return

  if (titleChanged && oldTab.titleEl) oldTab.titleEl.innerText = newTab.title
  if (urlChanged && oldTab.urlEl) {
    if (newTab.url.startsWith('moz-ext')) oldTab.urlEl.innerText = ''
    else oldTab.urlEl.innerText = newTab.url
    oldTab.urlEl.setAttribute('href', newTab.url)
    oldTab.el.title = newTab.url
    if (oldTab.favPlaceholderSvgEl) {
      setSvgId(oldTab.favPlaceholderSvgEl, Favicons.getFavPlaceholder(newTab.url))
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

main()
