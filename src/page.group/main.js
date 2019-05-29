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

  // Load current window and get url-hash
  const win = await browser.windows.getCurrent()
  const hash = decodeURI(window.location.hash.slice(1))

  // Init page
  let lastState
  lastState = await init(win.id, hash, lastState)

  // Set listener for reinit request
  browser.runtime.onMessage.addListener(msg => {
    if (msg.windowId !== undefined && msg.windowId !== win.id) return

    const hash = decodeURI(window.location.hash.slice(1))
    if (msg.name === 'reinit_group' && decodeURI(msg.arg) === hash) {
      init(win.id, hash, lastState).then(state => (lastState = state))
    }
  })
})()

/**
 * Init group page
 */
async function init(windowId, hash, lastState) {
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
  if (!groupInfo || !groupInfo.tabs) return lastState

  // Check for changes
  const checkSum = groupInfo.tabs.map(t => {
    return [t.title, t.url, t.discarded]
  })
  const checkSumStr = JSON.stringify(checkSum)
  if (lastState === checkSumStr) return checkSumStr

  // Render tabs
  if (groupInfo && groupInfo.tabs) {
    const tabsBoxEl = document.getElementById('tabs')

    // Cleanup
    while (tabsBoxEl.lastChild) {
      tabsBoxEl.removeChild(tabsBoxEl.lastChild)
    }

    for (let info of groupInfo.tabs) {
      info.el = createTabEl(info)
      tabsBoxEl.appendChild(info.el)

      // Set click listeners
      info.el.addEventListener('click', async () => {
        await browser.runtime.sendMessage({
          action: 'expTabsBranch',
          arg: groupInfo.id,
        })
        browser.tabs.update(info.id, { active: true })
      })
    }
  }

  // Load screens
  loadScreens(groupInfo.tabs)

  return checkSumStr
}

/**
 * Create tab element
 */
function createTabEl(info) {
  const el = document.createElement('div')
  el.classList.add('tab-wrapper')
  el.title = info.url

  info.tabEl = document.createElement('div')
  info.tabEl.classList.add('tab')

  info.bgEl = document.createElement('div')
  info.bgEl.classList.add('bg')
  info.tabEl.appendChild(info.bgEl)

  const infoEl = document.createElement('div')
  infoEl.classList.add('info')
  info.tabEl.appendChild(infoEl)

  const titleEl = document.createElement('h3')
  titleEl.innerText = info.title
  infoEl.appendChild(titleEl)

  const urlEl = document.createElement('p')
  urlEl.classList.add('url')
  urlEl.innerText = info.url
  infoEl.appendChild(urlEl)

  el.appendChild(info.tabEl)
  return el
}

/**
 * Load screenshots
 */
function loadScreens(tabs) {
  for (let tab of tabs) {
    if (tab.discarded) {
      tab.tabEl.classList.add('-discarded')
      tab.bgEl.style.backgroundImage = `url(${tab.favIconUrl})`
      tab.bgEl.style.backgroundPosition = 'center'
      tab.bgEl.style.filter = 'blur(32px)'
      continue
    }

    // Set loading start
    browser.tabs.captureTab(tab.id, { format: 'jpeg', quality: 90 }).then(screen => {
      tab.bgEl.style.backgroundImage = `url(${screen})`
    })
  }
}
