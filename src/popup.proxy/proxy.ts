import { Stored, IPCheckResult, InstanceType } from 'src/types'
import { Info } from 'src/services/info'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import * as IPC from 'src/services/ipc'

void (async function () {
  Info.setInstanceType(InstanceType.proxy)

  const checkInfoBtnEl = document.getElementById('btn_check_ip')
  const confBtnEl = document.getElementById('btn_conf')
  const ipValueEl = document.getElementById('info_ip')
  const countryValueEl = document.getElementById('info_country')
  if (!checkInfoBtnEl || !confBtnEl || !ipValueEl || !countryValueEl) return

  initTitle()
  initConfigInfo()

  // Load settings and set theme
  await Settings.loadSettings()

  // Set theme/style
  Styles.initColorScheme().then(() => {
    document.body.setAttribute('data-frame-color-scheme', Styles.reactive.frameColorScheme)
    document.body.setAttribute('data-popup-color-scheme', Styles.reactive.popupColorScheme)
    document.body.setAttribute('data-ready', 'true')
  })

  setTimeout(() => {
    window.resizeTo(450, 640)
  }, 2000)

  // Check ip and country
  checkInfoBtnEl.addEventListener('click', async () => {
    document.body.classList.add('-loading')

    const [activeTab] = await browser.tabs.query({
      currentWindow: true,
      active: true,
    })

    const info: IPCheckResult | null = await IPC.broadcast({
      dstType: InstanceType.bg,
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
    const tabs = await browser.tabs.query({ currentWindow: true })
    const activeTab = tabs.find(t => t.active)
    const existedTab = tabs.find(t => t.url.startsWith(url))

    if (!activeTab) return

    url += '#settings_containers.' + activeTab.cookieStoreId
    if (existedTab) {
      if (existedTab.url === url) {
        browser.tabs.update(existedTab.id, { active: true })
      } else {
        browser.tabs.update(existedTab.id, { url, active: true })
      }
    } else {
      const conf = { url, windowId: browser.windows.WINDOW_ID_CURRENT }
      browser.tabs.create(conf)
    }

    window.close()
  })
})()

/**
 * Init title
 */
async function initTitle() {
  const [activeTab] = await browser.tabs.query({
    currentWindow: true,
    active: true,
  })
  if (!activeTab) return

  const container = await browser.contextualIdentities.get(activeTab.cookieStoreId)
  if (!container) return

  const popupTitleEl = document.getElementById('popup_title')

  // Update labels
  const titlePre = browser.i18n.getMessage('proxy_popup_title_prefix')
  const titlePost = browser.i18n.getMessage('proxy_popup_title_postfix')
  const title = titlePre + container.name + titlePost
  document.title = title
  if (popupTitleEl) popupTitleEl.innerText = title
}

/**
 * Init static config
 */
async function initConfigInfo() {
  const [activeTab] = await browser.tabs.query({
    currentWindow: true,
    active: true,
  })
  if (!activeTab) return

  const typeValueEl = document.getElementById('conf_type')
  const hostValueEl = document.getElementById('conf_host')
  const dnsValueEl = document.getElementById('conf_dns')
  if (!typeValueEl || !hostValueEl || !dnsValueEl) return

  const { containers } = await browser.storage.local.get<Stored>({ containers: {} })
  if (!containers) return

  const container = containers[activeTab.cookieStoreId]
  if (!container || !container.proxy) return
  const conf = container.proxy

  if (conf.type === 'socks') typeValueEl.innerText = 'socks5'
  else if (conf.type === 'socks4') typeValueEl.innerText = 'socks4'
  else typeValueEl.innerText = conf.type
  hostValueEl.innerText = `${conf.host ?? '???'}:${conf.port ?? '???'}`
  dnsValueEl.innerText = String(conf.proxyDNS)
}
