import { DEFAULT_SETTINGS, CUSTOM_CSS_VARS } from '../../addon/defaults'

void (async function() {
  let checkInfoBtnEl = document.getElementById('btn_check_ip')
  let confBtnEl = document.getElementById('btn_conf')
  let ipValueEl = document.getElementById('info_ip')
  let countryValueEl = document.getElementById('info_country')

  initTitle()
  initConfigInfo()

  // Load settings and set theme
  let { settings } = await browser.storage.local.get({ settings: DEFAULT_SETTINGS })
  let style = settings ? settings.style : 'dark'

  initTheme(settings.theme)

  // Set style
  document.body.setAttribute('data-style', style)

  // Set background noise
  if (settings.bgNoise) {
    let scaleShift = ~~window.devicePixelRatio
    let sW = 300 >> scaleShift
    let sH = 300 >> scaleShift
    document.body.style.setProperty('--bg-size', `${sW}px ${sH}px`)
    document.body.style.setProperty('--bg-img', 'url("/assets/bg/noise-300x300.png")')
  }

  // Set user styles
  let { cssVars } = await browser.storage.local.get({ cssVars: {} })
  for (let key of Object.keys(CUSTOM_CSS_VARS)) {
    if (!cssVars[key]) continue
    document.body.style.setProperty(Utils.toCSSVarName(key), cssVars[key])
  }

  setTimeout(() => {
    window.resizeTo(450, 640)
  }, 2000)

  // Check ip and country
  checkInfoBtnEl.addEventListener('click', async () => {
    document.body.classList.add('-loading')

    let [activeTab] = await browser.tabs.query({
      currentWindow: true,
      active: true,
    })

    let info = await browser.runtime.sendMessage({
      instanceType: 'bg',
      action: 'checkIpInfo',
      arg: activeTab.cookieStoreId,
    })

    if (!info) {
      document.body.classList.remove('-loading')
      document.body.classList.add('-error')
      return
    }

    if (info.ip) ipValueEl.innerText = info.ip
    else ipValueEl.innerText = '---'
    if (info.country) countryValueEl.innerText = info.country
    else countryValueEl.innerText = '---'

    document.body.classList.remove('-loading')
  })

  // Configure
  confBtnEl.addEventListener('click', async () => {
    let url = browser.runtime.getURL('settings/settings.html')
    let tabs = await browser.tabs.query({ currentWindow: true })
    let activeTab = tabs.find(t => t.active)
    let existedTab = tabs.find(t => t.url.startsWith(url))

    url += '#settings_containers.' + activeTab.cookieStoreId
    if (existedTab) {
      if (existedTab.url === url) {
        browser.tabs.update(existedTab.id, { active: true })
      } else {
        browser.tabs.update(existedTab.id, { url, active: true })
      }
    } else {
      let conf = { url, windowId: browser.windows.WINDOW_ID_CURRENT }
      browser.tabs.create(conf)
    }

    window.close()
  })
})()

/**
 * Load predefined theme and apply it
 */
function initTheme(theme) {
  let themeLinkEl = document.getElementById('theme_link')

  // Remove theme css
  if (theme === 'none') {
    if (themeLinkEl) themeLinkEl.setAttribute('disabled', 'disabled')
    return
  } else {
    if (themeLinkEl) themeLinkEl.removeAttribute('disabled')
  }

  if (!themeLinkEl) {
    themeLinkEl = document.createElement('link')
    themeLinkEl.id = 'theme_link'
    themeLinkEl.type = 'text/css'
    themeLinkEl.rel = 'stylesheet'
    document.head.appendChild(themeLinkEl)
  }

  themeLinkEl.href = `../themes/${theme}/proxy.css`
}

/**
 * Init title
 */
async function initTitle() {
  let [activeTab] = await browser.tabs.query({
    currentWindow: true,
    active: true,
  })
  if (!activeTab) return

  let container = await browser.contextualIdentities.get(activeTab.cookieStoreId)
  if (!container) return

  let popupTitleEl = document.getElementById('popup_title')

  // Update labels
  let titlePre = browser.i18n.getMessage('proxy_popup.title_prefix')
  let titlePost = browser.i18n.getMessage('proxy_popup.title_postfix')
  let title = titlePre + container.name + titlePost
  document.title = title
  if (popupTitleEl) popupTitleEl.innerText = title
}

/**
 * Init static config
 */
async function initConfigInfo() {
  let [activeTab] = await browser.tabs.query({
    currentWindow: true,
    active: true,
  })
  if (!activeTab) return

  let typeValueEl = document.getElementById('conf_type')
  let hostValueEl = document.getElementById('conf_host')
  let dnsValueEl = document.getElementById('conf_dns')

  let { containers_v4 } = await browser.storage.local.get({ containers_v4: {} })
  if (!containers_v4) return

  let container = containers_v4[activeTab.cookieStoreId]
  if (!container || !container.proxy) return
  let conf = container.proxy

  if (conf.type === 'socks') typeValueEl.innerText = 'socks5'
  else if (conf.type === 'socks4') typeValueEl.innerText = 'socks4'
  else typeValueEl.innerText = conf.type
  hostValueEl.innerText = conf.host + ':' + conf.port
  dnsValueEl.innerText = conf.proxyDNS
}
