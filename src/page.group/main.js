import { DEFAULT_SETTINGS, CUSTOM_CSS_VARS } from '../defaults'
import { noiseBg } from '../noise-bg'
import Utils from '../utils'

let tabsBoxEl, groupTabId, groupTabIndex, tabs = []

void (async function() {
  let { settings } = await browser.storage.local.get({ settings: DEFAULT_SETTINGS })

  document.body.setAttribute('data-style', settings.style)
  document.body.setAttribute('data-layout', settings.groupLayout)
  document.body.setAttribute('data-animations', settings.animations ? 'fast' : 'none')

  if (settings.bgNoise) {
    noiseBg(document.body, {
      width: 300,
      height: 300,
      gray: [12, 175],
      alpha: [0, 66],
      spread: [0, 9],
    })
    let scaleShift = ~~window.devicePixelRatio
    let sW = 300 >> scaleShift
    let sH = 300 >> scaleShift
    document.body.style.backgroundSize = `${sW}px ${sH}px`
  }

  // Set user styles
  let { cssVars } = await browser.storage.local.get({ cssVars: {} })
  for (let key in CUSTOM_CSS_VARS) {
    if (!CUSTOM_CSS_VARS.hasOwnProperty(key)) continue
    if (cssVars[key]) {
      document.body.style.setProperty(Utils.toCSSVarName(key), cssVars[key])
    }
  }

  // Load current window and get url-hash
  const win = await browser.windows.getCurrent()
  const hash = decodeURI(window.location.hash.slice(1))

  // Init page
  await init(win.id, hash)

  // Set listeners
  browser.runtime.onMessage.addListener(msg => {
    if (msg.windowId !== undefined && msg.windowId !== win.id) return
    if (msg.instanceType !== undefined && msg.instanceType !== 'group') return

    if (msg.name === 'created') onTabCreated(msg)

    if (msg.name === 'loaded') {
      let tabInfo = tabs.find(t => t.id === msg.id)
      if (!tabInfo) return
      onTabLoaded(tabInfo, msg)
    }

    if (msg.name === 'rm') {
      let tabInfo = tabs.find(t => t.id === msg.tabId)
      if (!tabInfo) return
      onTabRemoved(tabInfo)
    }
  })
})()

/**
 * Init group page
 */
async function init(windowId, hash) {
  // Set title of group page
  const titleEl = document.getElementById('title')
  const hashData = hash.split(':id:')
  const title = hashData[0]
  const groupId = hashData[1]
  titleEl.value = title
  document.title = title

  // Listen chagnes of title
  titleEl.addEventListener('input', e => {
    const normTitle = e.target.value.trim()
    document.title = normTitle
    window.location.hash = `#${encodeURI(normTitle)}:id:${groupId}`
  })

  // Get list of tabs
  const groupInfo = await browser.runtime.sendMessage({
    action: 'getGroupInfo',
    windowId,
    arg: hash,
  })
  if (!groupInfo || !groupInfo.tabs) return

  tabs = groupInfo.tabs
  groupTabId = groupInfo.id
  groupTabIndex = groupInfo.index
  tabsBoxEl = document.getElementById('tabs')

  // Cleanup
  while (tabsBoxEl.lastChild) {
    tabsBoxEl.removeChild(tabsBoxEl.lastChild)
  }

  for (let tab of tabs) {
    createTabEl(tab, event => onTabClick(event, tab))
    tabsBoxEl.appendChild(tab.el)
    loadScreenshot(tab)
  }

  createNewTabButton()
}

/**
 * Create new-tab button
 */
function createNewTabButton() {
  let newTabEl = document.createElement('div')
  newTabEl.classList.add('new-tab')
  newTabEl.setAttribute('title', 'Create new tab')
  tabsBoxEl.appendChild(newTabEl)

  newTabEl.addEventListener('mousedown', event => {
    let lastTab = tabs[tabs.length - 1]
    browser.tabs.create({
      index: (lastTab ? lastTab.index : groupTabIndex) + 1,
      openerTabId: groupTabId,
      active: event.button === 0 ? true : false,
    })
  })
}

/**
 * Create tab element
 */
function createTabEl(info, clickHandler) {
  info.el = document.createElement('div')
  info.el.classList.add('tab')
  info.el.title = info.url
  info.el.setAttribute('id', 'tab_' + info.id)
  info.el.setAttribute('data-lvl', info.lvl)
  info.el.setAttribute('data-discarded', info.discarded)

  info.bgEl = document.createElement('div')
  info.bgEl.classList.add('bg')
  info.el.appendChild(info.bgEl)

  info.favEl = document.createElement('div')
  info.favEl.classList.add('fav')
  info.favEl.style.backgroundImage = `url(${info.favIconUrl})`
  info.el.appendChild(info.favEl)

  let infoEl = document.createElement('div')
  infoEl.classList.add('info')
  info.el.appendChild(infoEl)

  info.titleEl = document.createElement('h3')
  info.titleEl.classList.add('tab-title')
  info.titleEl.innerText = info.title
  infoEl.appendChild(info.titleEl)

  info.urlEl = document.createElement('p')
  info.urlEl.classList.add('tab-url')
  info.urlEl.innerText = info.url
  infoEl.appendChild(info.urlEl)

  let ctrlsEl = document.createElement('div')
  ctrlsEl.classList.add('ctrls')
  info.el.appendChild(ctrlsEl)

  let discardBtnEl = createButton('icon_discard', 'discard-btn', event => {
    event.stopPropagation()
    browser.tabs.discard(info.id)
    info.el.setAttribute('data-discarded', true)
  })
  ctrlsEl.appendChild(discardBtnEl)

  let reloadBtnEl = createButton('icon_reload', 'reload-btn', event => {
    event.stopPropagation()
    browser.tabs.reload(info.id)
  })
  ctrlsEl.appendChild(reloadBtnEl)

  let closeBtnEl = createButton('icon_close', 'close-btn', event => {
    event.stopPropagation()
    browser.tabs.remove(info.id)
  })
  ctrlsEl.appendChild(closeBtnEl)

  info.el.addEventListener('mousedown', clickHandler)
}

/**
 * Create button element
 */
function createButton(svgId, className, clickHandler) {
  let btnEl = document.createElement('div')
  btnEl.classList.add('btn', className)

  let svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')  
  svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink')
  btnEl.appendChild(svgEl)

  let useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use')  
  useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + svgId)
  svgEl.appendChild(useEl)

  btnEl.addEventListener('mousedown', clickHandler)

  return btnEl
}

/**
 * Load screenshots
 */
function loadScreenshot(tab) {
  if (tab.discarded) return
  browser.tabs.captureTab(tab.id, { format: 'jpeg', quality: 90 }).then(screen => {
    tab.bgEl.style.backgroundImage = `url(${screen})`
  })
}

/**
 * Handle tab click
 */
async function onTabClick(event, tab) {
  await browser.runtime.sendMessage({
    action: 'expTabsBranch',
    arg: groupTabId,
  })
  browser.tabs.update(tab.id, { active: true })
}

/**
 * Handle tab loaded event
 */
function onTabLoaded(tab, info) {
  tab.title = info.title
  tab.url = info.title

  tab.titleEl.innerText = info.title
  tab.urlEl.innerText = info.url
  tab.favEl.style.backgroundImage = `url(${info.favIconUrl})`
  tab.el.setAttribute('data-discarded', tab.discarded)

  browser.tabs.captureTab(tab.id, { format: 'jpeg', quality: 90 }).then(screen => {
    tab.bgEl.style.backgroundImage = `url(${screen})`
  })
}

/**
 * Handle removing tab
 */
function onTabRemoved(tab) {
  const index = tabs.findIndex(t => t.index === tab.index)
  if (index === -1) return
  tabs.splice(index, 1)
  tab.el.remove()
}

/**
 * Handle creating tab
 */
function onTabCreated(tab) {
  createTabEl(tab, event => onTabClick(event, tab))

  const index = tabs.findIndex(t => t.index === tab.index)
  if (index === -1) {
    tabsBoxEl.lastChild.before(tab.el)
    tabs.push(tab)
  } else {
    tabs[index].el.before(tab.el)
    tabs.splice(index, 0, tab)
  }

  browser.tabs.captureTab(tab.id, { format: 'jpeg', quality: 90 }).then(screen => {
    tab.bgEl.style.backgroundImage = `url(${screen})`
  })
}