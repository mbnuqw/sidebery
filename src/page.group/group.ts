import type * as T from 'src/types'
import { getFavPlaceholder } from 'src/services/favicons'
import { NOID, PAGE_HASH_RE, SETTINGS_OPTIONS } from 'src/defaults'
import { applyCustomCSS, applyThemeSrcVars } from './group.styles'
import * as Logs from './group.logs'
import * as IPPC from 'src/services/ippc.page'
import { DstTreePos, InstanceType } from 'src/enums'
import { getDomainOf } from 'src/utils'

let groupTitle = ''
let tabsBoxEl: HTMLElement | null = null
let newTabEl: HTMLDivElement | null = null
let groupWinId: ID = NOID
let groupTabId: ID = NOID
let groupLayout: (typeof SETTINGS_OPTIONS.groupLayout)[number] = 'grid'
let groupNewTabPos: 'first_child' | 'last_child' = 'last_child'
let pinTab: T.GroupPin | undefined
let tabs: T.GroupedTabInfo[] = []
let groupParentId: ID | undefined
let labels: Record<string, string>

async function main() {
  try {
    parseUrl()
  } catch {
    Logs.err('Cannot parse url')
    const warnEl = document.getElementById('disconnected_warn')
    if (warnEl) warnEl.textContent = 'Cannot parse url'
    document.body.setAttribute('data-disconnected', 'true')
    const ldEl = document.getElementById('loading_dots')
    if (ldEl) ldEl.style.display = 'none'
    return
  }

  // Set title of group page
  const titleEl = document.getElementById('title') as HTMLInputElement
  titleEl.value = groupTitle
  document.title = groupTitle || '‎'

  // Initialize communication and get initial data
  const initData: T.GroupPageInitData = await IPPC.init(InstanceType.group, setHash, {
    update: onGroupUpdMsg,
  })
  const ldEl = document.getElementById('loading_dots')
  if (ldEl) ldEl.style.display = 'none'
  if (!initData) {
    Logs.err('Cannot initialize')
    const warnEl = document.getElementById('disconnected_warn')
    if (warnEl) warnEl.textContent = 'No initialization data'
    document.body.setAttribute('data-disconnected', 'true')
    return
  }

  groupWinId = initData.winId ?? NOID
  groupTabId = initData.tabId ?? NOID
  groupNewTabPos = initData.newTabPos ?? 'last_child'
  labels = initData.labels ?? {}

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
  if (initData.customCSS) applyCustomCSS(initData.customCSS)

  groupLayout = initData.groupLayout ?? 'grid'
  document.body.setAttribute('data-layout', groupLayout)
  document.body.setAttribute('data-animations', initData.animations ? 'fast' : 'none')

  if (!initData.groupInfo) {
    Logs.warn('No group info')
    const warnEl = document.getElementById('disconnected_warn')
    if (warnEl) warnEl.textContent = getLabel('group_disconnected_warn')
    document.body.setAttribute('data-disconnected', 'true')
    const ldEl = document.getElementById('loading_dots')
    if (ldEl) ldEl.style.display = 'none'
    return
  }

  tabs = initData.groupInfo.tabs || []
  groupParentId = initData.groupInfo.parentId
  pinTab = initData.groupInfo.pin

  // Listen chagnes of title
  titleEl.addEventListener('input', onTitleChange as (e: Event) => void)

  // Set favicons for each tab
  for (const tab of tabs) {
    if (tab.favIconUrl) continue
    const domain = getDomainOf(tab.url)
    const favicon = initData.groupInfo.favicons[domain]
    if (favicon) tab.favIconUrl = favicon
  }

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
      IPPC.bg('tabsApiProxy', 'update', groupParentId, { active: true })
    }
  })

  document.body.addEventListener('contextmenu', e => e.preventDefault())
}

function setHash(h: string) {
  history.replaceState(undefined, '', `#${encodeURIComponent(groupTitle)}${h}`)
}

function parseUrl() {
  const reResult = PAGE_HASH_RE.exec(window.location.hash)
  const rawTitle = reResult?.groups?.prefix || ''

  groupTitle = decodeURIComponent(rawTitle).trim()
}

function getLabel(id: string) {
  return labels[id] ?? id
}

let onTitleChangeTimeout: number | undefined
function onTitleChange(e: DOMEvent<Event, HTMLInputElement>): void {
  clearTimeout(onTitleChangeTimeout)
  onTitleChangeTimeout = setTimeout(() => {
    const normTitle = e.target.value.trim()
    document.title = normTitle || '‎'
    history.replaceState(undefined, '', `#${encodeURIComponent(normTitle)}${IPPC.hashSuffix}`)
  }, 500)
}

/**
 * Handle group page update msg
 */
export function onGroupUpdMsg(upd: T.GroupUpdMsg) {
  if (!newTabEl) return

  let i
  if (upd.parentId !== undefined) groupParentId = upd.parentId
  if (upd.title !== undefined) {
    const normTitle = upd.title.trim()
    document.title = normTitle || '‎'
    const titleEl = document.getElementById('title') as HTMLInputElement | null
    if (titleEl) titleEl.value = normTitle
    history.replaceState(undefined, '', `#${encodeURIComponent(normTitle)}${IPPC.hashSuffix}`)
  }
  if (upd.windowId !== undefined) {
    groupWinId = upd.windowId
    Logs.setWinId(groupWinId)
  }

  if (upd.tabs !== undefined) {
    for (i = 0; i < upd.tabs.length; i++) {
      const newTab = upd.tabs[i]
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

  if (upd.pin) {
    pinTab = upd.pin
    if (pinTab) {
      document.body.setAttribute('data-pin', 'true')
      document.title = pinTab.title
      updatePinnedTab(pinTab, (event: MouseEvent) => onTabClick(event, pinTab))
    }
  }

  if (upd.createdTab) onTabCreated(upd.createdTab)
  if (upd.updatedTab) onTabUpdated(upd.updatedTab)
  else if (upd.updatedTabs) upd.updatedTabs.forEach(t => onTabUpdated(t))
  if (upd.removedTab !== undefined) onTabRemoved(upd.removedTab)
}

/**
 * Handle creating tab
 */
async function onTabCreated(tab: T.GroupedTabInfo) {
  createTabEl(tab, (event: MouseEvent) => onTabClick(event, tab))
  if (!tab.el || !newTabEl) return

  const index = tab.index
  if (index === -1 || index === tabs.length) {
    newTabEl.before(tab.el)
    tabs.push(tab)
  } else if (index >= 0 && index < tabs.length) {
    tabs[index].el?.before(tab.el)
    tabs.splice(index, 0, tab)
  } else {
    Logs.warn('Cannot add new tab: Wrong index:', index)
    return
  }
}

/**
 * Handle tab update msg
 */
function onTabUpdated(upd: T.GroupedTabInfo) {
  const tab = tabs.find(t => t.id === upd.id)
  if (!tab?.el) return

  let normURL
  try {
    normURL = decodeURI(upd.url)
  } catch {
    normURL = upd.url
  }

  tab.el.title = normURL
  tab.el.setAttribute('data-fav', String(!!upd.favIconUrl))
  if (tab.favEl) tab.favEl.style.backgroundImage = `url(${upd.favIconUrl})`
  tab.favIconUrl = upd.favIconUrl

  if (tab.titleEl) tab.titleEl.textContent = upd.title
  tab.title = upd.title

  if (tab.urlEl) {
    if (upd.url.startsWith('moz-ext')) tab.urlEl.textContent = ''
    else tab.urlEl.textContent = normURL
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

  if (tabs.length === 0 && window.location.search.includes('pin=')) {
    IPPC.bg('tabsApiProxy', 'remove', groupTabId)
  }
}

/**
 * Create new-tab button
 */
function createNewTabButton() {
  if (!tabsBoxEl) return

  newTabEl = document.createElement('div')
  newTabEl.classList.add('new-tab')
  newTabEl.title = getLabel('group_new_tab_tooltip')
  tabsBoxEl.appendChild(newTabEl)

  const plusIconEl = document.createElement('div')
  plusIconEl.classList.add('new-tab-plus')
  newTabEl.appendChild(plusIconEl)

  newTabEl.addEventListener('mousedown', (e: MouseEvent) => e.stopPropagation())
  newTabEl.addEventListener('mouseup', e => e.stopPropagation())
  newTabEl.addEventListener('click', () => {
    const pos = groupNewTabPos === 'last_child' ? DstTreePos.End : DstTreePos.Start
    const newTabConf = { id: 0, url: 'about:newtab', active: true }
    const dst: T.DstPlaceInfo = { windowId: groupWinId, parentId: groupTabId, pos }
    IPPC.bg('openTabs', [newTabConf], dst)
  })
}

/**
 * Create tab element
 */
function createTabEl(info: T.GroupedTabInfo, clickHandler: (e: MouseEvent) => void) {
  let normURL
  try {
    normURL = decodeURI(info.url)
  } catch {
    normURL = info.url
  }

  info.el = document.createElement('div')
  info.el.classList.add('tab')
  info.el.title = normURL
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

  info.urlEl = document.createElement('span')
  info.urlEl.classList.add('tab-url')
  info.urlEl.setAttribute('href', info.url)
  info.urlEl.addEventListener('click', e => e.preventDefault())
  if (info.url.startsWith('moz-ext')) info.urlEl.textContent = ''
  else info.urlEl.textContent = normURL
  infoEl.appendChild(info.urlEl)

  const ctrlsEl = document.createElement('div')
  ctrlsEl.classList.add('ctrls')
  info.el.appendChild(ctrlsEl)

  const discardBtnEl = createTabButton('#icon_discard', 'discard-btn', event => {
    event.stopPropagation()
    IPPC.bg('tabsApiProxy', 'discard', info.id)
  })
  discardBtnEl.title = getLabel('group_tab_discard_tooltip')
  ctrlsEl.appendChild(discardBtnEl)

  const reloadBtnEl = createTabButton('#icon_reload', 'reload-btn', event => {
    event.stopPropagation()
    if (event.button === 0 || event.button === 1) {
      IPPC.bg('tabsApiProxy', 'reload', info.id)
    }
  })
  reloadBtnEl.title = getLabel('group_tab_reload_tooltip')
  ctrlsEl.appendChild(reloadBtnEl)

  const closeBtnEl = createTabButton('#icon_close', 'close-btn', event => {
    event.stopPropagation()
    IPPC.bg('tabsApiProxy', 'remove', info.id)
  })
  closeBtnEl.title = getLabel('group_tab_close_tooltip')
  ctrlsEl.appendChild(closeBtnEl)

  info.el.addEventListener('mousedown', e => e.stopPropagation())
  info.el.addEventListener('click', clickHandler)
}

let pinnedTabEventsListeners = false
/**
 * Create pinned tab element on the page
 */
function updatePinnedTab(info: T.GroupPin, clickHandler: (e: MouseEvent) => void) {
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
  useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgId)
  svgEl.appendChild(useEl)

  return svgEl
}

/**
 * Set id for use tag
 */
function setSvgId(svgEl: SVGElement, svgId: string) {
  const useEl = svgEl.childNodes[0] as SVGElement
  if (!useEl) return
  useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgId)
}

/**
 * Handle tab click
 */
function onTabClick(event: MouseEvent, tab?: { id: ID }) {
  if (!tab) return
  event.stopPropagation()
  IPPC.bg('tabsApiProxy', 'update', tab.id, { active: true })
}

/**
 * Update tab
 */
function updateTab(oldTab: T.GroupedTabInfo, newTab: T.GroupedTabInfo) {
  const titleChanged = oldTab.title !== newTab.title
  const urlChanged = oldTab.url !== newTab.url

  if (!oldTab.el) return Logs.warn('updateTab: no el')

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
}

void main()
