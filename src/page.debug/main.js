import { CUSTOM_STYLES } from '../sidebar/store/state'
import { noiseBg } from '../libs/noise-bg'
import Utils from '../libs/utils'

void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'

  // Set theme class
  document.body.classList.add('-' + theme)

  // Set background noise
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
  ans = await browser.storage.local.get('styles')
  let loadedStyles = ans.styles
  if (loadedStyles) {
    for (let key in CUSTOM_STYLES) {
      if (!CUSTOM_STYLES.hasOwnProperty(key)) continue
      if (loadedStyles[key]) {
        document.body.style.setProperty(Utils.toCSSVarName(key), loadedStyles[key])
      }
    }
  }

  // Get debug info
  const currentWindow = await browser.windows.getCurrent()
  const windows = await browser.windows.getAll()
  const info = await browser.runtime.sendMessage({
    action: 'getCommonDbgInfo',
    windowId: currentWindow.id,
    instanceType: 'sidebar',
  })
  if (!info) return

  for (let win of windows) {
    const winInfo = await browser.runtime.sendMessage({
      action: 'getWindowDbgInfo',
      instanceType: 'sidebar',
      windowId: win.id,
    })

    if (winInfo) Object.assign(win, winInfo)
  }
  info.windows = windows

  parseStorageInfo(info)
  parseTabsInfo(info)
  parseBookmarksInfo(info)
  if (info.windows && info.windows.length) {
    for (let win of info.windows) {
      parseWindowInfo(win)
    }
  }

  const dataEl = document.getElementById('dbg_data')
  dataEl.innerText = JSON.stringify(info)
  dataEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(dataEl)
    selection.addRange(range)
  })
})()

/**
 * Import data
 */
window.ImportJSON = function(infoStr) {
  const info = JSON.parse(infoStr)

  parseStorageInfo(info)
  parseTabsInfo(info)
  parseBookmarksInfo(info)
  if (info.windows && info.windows.length) {
    for (let win of info.windows) {
      parseWindowInfo(win)
    }
  }
}

/**
 * Parse storage
 */
function parseStorageInfo(info) {
  if (!info || !info.storage) return
  const storage = info.storage

  const overalEl = document.getElementById('info_storage_value')
  const faviconsEl = document.getElementById('info_storage_favs')
  const tabsEl = document.getElementById('info_storage_tabs')
  const snapshotsEl = document.getElementById('info_storage_snapshots')

  if (storage.overal) overalEl.innerText = storage.overal
  if (storage.favicons) faviconsEl.innerText = `${storage.faviconsCount} (${storage.favicons})`
  if (storage.tabs) tabsEl.innerText = storage.tabs
  if (storage.snapshots) snapshotsEl.innerText = storage.snapshots
}

/**
 * Parse general tabs info
 */
function parseTabsInfo(info) {
  if (!info || !info.windows) return

  const tabsCountEl = document.getElementById('info_tabs_count')
  const windowsCountEl = document.getElementById('info_tabs_windows')
  const containersEl = document.getElementById('info_tabs_containers')
  const pinnedEl = document.getElementById('info_tabs_pinned')

  let tabsCount = 0
  let pinnedTabsCount = 0
  for (let win of info.windows) {
    tabsCount += win.tabs.length
    pinnedTabsCount += win.tabs.filter(t => t.pinned).length
  }
  tabsCountEl.innerText = tabsCount
  windowsCountEl.innerText = info.windows.length
  containersEl.innerText = info.panels.filter(p => p.panel === 'TabsPanel').length
  pinnedEl.innerText = pinnedTabsCount
}

/**
 * Parse general bookmarks info
 */
function parseBookmarksInfo(info) {
  if (!info || !info.bookmarks) return
  const bookmarks = info.bookmarks

  const bookmarksCountEl = document.getElementById('info_boomkars_count')
  const foldersCountEl = document.getElementById('info_bookmarks_folders')
  const separatorsCountEl = document.getElementById('info_bookmarks_separators')
  const depthEl = document.getElementById('info_bookmarks_depth')

  if (bookmarks.bookmarksCount) {
    bookmarksCountEl.innerText = bookmarks.bookmarksCount
    foldersCountEl.innerText = bookmarks.foldersCount
    separatorsCountEl.innerText = bookmarks.separatorsCount
    depthEl.innerText = bookmarks.maxDepth
  } else {
    bookmarksCountEl.innerText = '-'
    foldersCountEl.innerText = '-'
    separatorsCountEl.innerText = '-'
    depthEl.innerText = '-'
  }
}

/**
 * Parse window info
 */
function parseWindowInfo(win) {
  const boxEl = document.getElementById('windows_box')

  // Cleanup
  while (boxEl.lastChild) {
    boxEl.removeChild(boxEl.lastChild)
  }

  // Window
  const winEl = document.createElement('div')
  winEl.classList.add('window')

  // Title
  const titleEl = document.createElement('h2')
  titleEl.innerText = `Window ${win.id}`
  winEl.appendChild(titleEl)

  // Init section
  const initEl = document.createElement('section')
  initEl.classList.add('init')
  const settingsLoaded = win.logs.includes('[INFO] Settings loaded')
  appendField(initEl, 'Settings', settingsLoaded ? 'Loaded' : '-')
  appendSeparator(initEl)
  const ctrsLoaded = win.logs.includes('[INFO] Containers loaded')
  appendField(initEl, 'Containers', ctrsLoaded ? 'Loaded' : '-')
  appendSeparator(initEl)
  const bkmsLoaded = win.logs.includes('[INFO] Bookmarks loaded')
  appendField(initEl, 'Bookmarks', bkmsLoaded ? 'Loaded' : '-')
  appendSeparator(initEl)
  const tabsLoaded = win.logs.includes('[INFO] Tabs loaded')
  appendField(initEl, 'Tabs', tabsLoaded ? 'Loaded' : '-')
  appendSeparator(initEl)
  const stylesLoaded = win.logs.includes('[INFO] Styles loaded')
  appendField(initEl, 'Custom styles', stylesLoaded ? 'Loaded' : '-')
  appendSeparator(initEl)
  const kbLoaded = win.logs.includes('[INFO] Keybindings loaded')
  appendField(initEl, 'Keybindings', kbLoaded ? 'Loaded' : '-')
  appendSeparator(initEl)
  const favsLoaded = win.logs.includes('[INFO] Favicons loaded')
  appendField(initEl, 'Favicons', favsLoaded ? 'Loaded' : '-')
  winEl.appendChild(initEl)

  // Tabs section
  const tabsEl = document.createElement('section')
  tabsEl.classList.add('tabs')
  for (let tab of win.tabs) {
    appendTab(tabsEl, tab)
  }
  winEl.appendChild(tabsEl)

  boxEl.appendChild(winEl)
}

/**
 * Careate field element and append it
 */
function appendField(el, label, value) {
  const fieldEl = document.createElement('div')
  fieldEl.classList.add('field')

  const labelEl = document.createElement('div')
  labelEl.classList.add('label')
  labelEl.innerText = label
  fieldEl.appendChild(labelEl)

  const valueEl = document.createElement('div')
  valueEl.classList.add('value')
  valueEl.innerText = value
  fieldEl.appendChild(valueEl)

  el.appendChild(fieldEl)
}

/**
 * Create separator element and append it
 */
function appendSeparator(el) {
  const sepEl = document.createElement('div')
  sepEl.classList.add('separator')
  el.appendChild(sepEl)
}

/**
 * Create tab element adn append it to provided container
 */
function appendTab(el, tab) {
  const tabEl = document.createElement('div')
  tabEl.classList.add('tab')

  const refsEl = document.createElement('div')
  refsEl.classList.add('refs')
  const index = String(tab.index).padStart(4, ' ')
  const id = String(tab.id).padStart(5, ' ')
  const ctxIdI = tab.cookieStoreId.lastIndexOf('-')
  let ctx = tab.cookieStoreId.slice(ctxIdI + 1).padStart(5, ' ')
  if (ctx.length > 5) {
    ctx = tab.pinned ? '    ^' : '    -'
  }
  refsEl.innerText = index + id + ctx
  tabEl.appendChild(refsEl)

  const flagsEl = document.createElement('div')
  flagsEl.classList.add('flags')
  appendTabFlag(flagsEl, 'd', tab.discarded)
  appendTabFlag(flagsEl, ' m', tab.muted)
  appendTabFlag(flagsEl, ' h', tab.hidden)
  appendTabFlag(flagsEl, ' p', tab.isParent)
  appendTabFlag(flagsEl, ' f', tab.folded)
  appendTabFlag(flagsEl, ' i', tab.invisible)
  tabEl.appendChild(flagsEl)

  const lvlEl = document.createElement('div')
  lvlEl.classList.add('lvl')
  lvlEl.innerText = '*'.padStart(tab.lvl + 1, ' ')
  tabEl.appendChild(lvlEl)

  el.appendChild(tabEl)
}

/**
 * Create tab info flag
 */
function appendTabFlag(el, flag, value) {
  const flagEl = document.createElement('div')
  if (value) flagEl.classList.add('-active')
  flagEl.innerText = flag
  el.appendChild(flagEl)
}