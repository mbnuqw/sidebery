import Actions from '../actions.js'

const BG_URL = browser.runtime.getURL('background.html')

let updateReqHandlerTimeout
let handledReqId
let incHistory = {}

/**
 * Create new tab in appropriate container
 * and then close the original tab.
 */
async function recreateTab(tab, info, cookieStoreId) {
  let index
  try {
    index = await browser.runtime.sendMessage({
      instanceType: 'sidebar',
      windowId: tab.windowId,
      action: 'handleReopening',
      args: [tab.id, cookieStoreId],
    })
  } catch (err) {
    /* itsokay */
  }

  if (index === undefined) index = tab.index

  await browser.tabs.create({
    windowId: tab.windowId,
    url: info.url,
    cookieStoreId,
    active: tab.active,
    index,
    pinned: tab.pinned,
  })
  await browser.tabs.remove(tab.id)
}

async function checkIpInfoThroughIPIFY_ORG(cookieStoreId) {
  if (!cookieStoreId || !this.proxies[cookieStoreId]) return
  this.ipCheckCtx = cookieStoreId

  let info
  let result = {}

  try {
    info = await fetch('https://api.ipify.org', {
      cache: 'reload',
    }).then(res => res.text())
  } catch (err) {
    return null
  }

  if (info) result.ip = info

  return result
}

async function checkIpInfoThroughEXTREME_IP_LOOKUP_COM(cookieStoreId) {
  if (!cookieStoreId || !this.proxies[cookieStoreId]) return
  this.ipCheckCtx = cookieStoreId

  let info
  let result = {}

  try {
    info = await fetch('https://extreme-ip-lookup.com/json', {
      cache: 'reload',
    }).then(r => r.json())
  } catch (err) {
    return null
  }
  if (!info) return null

  if (info.status !== 'success') return null
  if (info.query) result.ip = info.query
  if (info.country) result.country = info.country

  return result
}

async function checkIpInfo(cookieStoreId) {
  let result
  result = await this.actions.checkIpInfoThroughEXTREME_IP_LOOKUP_COM(cookieStoreId)
  if (!result) {
    result = await this.actions.checkIpInfoThroughIPIFY_ORG(cookieStoreId)
  }

  return result
}

/**
 * Handle requests before sending and define proxy
 * config for them.
 */
function proxyReqHandler(info) {
  if (!this.tabsMap) return

  let tab = this.tabsMap[info.tabId]

  // Proxify requests for checking ip and other info
  if (!tab && this.ipCheckCtx && info.type === 'xmlhttprequest') {
    if (info.originUrl === BG_URL && this.proxies[this.ipCheckCtx]) {
      let ctx = this.ipCheckCtx
      this.ipCheckCtx = null
      return this.proxies[ctx]
    }
  }

  // Check hosts rules, if the rule is matched
  // return promise with the process of reopening new tab.
  // This will block request from the original tab.
  if (tab && info.type === 'main_frame' && handledReqId !== info.requestId) {
    handledReqId = info.requestId
    let includedUrl

    // Include rules
    for (let rule of this.includeHostsRules) {
      let ok
      if (rule.value.test) ok = rule.value.test(info.url)
      else ok = info.url.indexOf(rule.value) !== -1

      if (!includedUrl) includedUrl = ok

      if (ok && info.cookieStoreId !== rule.ctx) {
        if (incHistory[info.cookieStoreId] === info.url) {
          incHistory[info.cookieStoreId] = null
          break
        }

        incHistory[rule.ctx] = info.url
        return recreateTab(tab, info, rule.ctx)
      }
    }

    // Exclude rules
    if (!includedUrl && this.excludeHostsRules[info.cookieStoreId]) {
      for (let rule of this.excludeHostsRules[info.cookieStoreId]) {
        let ok
        if (rule.test) ok = rule.test(info.url)
        else ok = info.url.indexOf(rule) !== -1

        if (ok) {
          incHistory['firefox-default'] = info.url
          return recreateTab(tab, info)
        }
      }
    }
  }

  // Check proxy
  if (this.proxies[info.cookieStoreId]) return this.proxies[info.cookieStoreId]
}

/**
 * Handle headers of requests before sending them
 */
function headersHandler(info) {
  if (this.userAgents[info.cookieStoreId]) {
    let h = info.requestHeaders.find(rh => rh.name === 'User-Agent')
    if (h) {
      h.value = this.userAgents[info.cookieStoreId]
      return { requestHeaders: info.requestHeaders }
    }
  }
}

/**
 * Update all configs related to requests handling and
 * set (or remove) event listeners.
 */
function updateReqHandler() {
  this.proxies = {}
  this.includeHostsRules = []
  this.excludeHostsRules = {}
  this.userAgents = {}

  for (let ctr of Object.values(this.containers)) {
    // Proxy
    if (ctr.proxified && ctr.proxy) this.proxies[ctr.id] = { ...ctr.proxy }

    // Include rules
    if (ctr.includeHostsActive) {
      for (let rawRule of ctr.includeHosts.split('\n')) {
        let rule = rawRule.trim()
        if (!rule) continue

        if (rule[0] === '/' && rule[rule.length - 1] === '/') {
          try {
            rule = new RegExp(rule.slice(1, rule.length - 1))
          } catch (err) {
            // nothing
          }
        }

        this.includeHostsRules.push({ ctx: ctr.id, value: rule })
      }
    }

    // Exclude rules
    if (ctr.excludeHostsActive) {
      this.excludeHostsRules[ctr.id] = ctr.excludeHosts
        .split('\n')
        .map(r => {
          let rule = r.trim()

          if (rule[0] === '/' && rule[rule.length - 1] === '/') {
            rule = new RegExp(rule.slice(1, rule.length - 1))
          }

          return rule
        })
        .filter(r => r)
    }

    // User agents
    if (ctr.userAgentActive) {
      this.userAgents[ctr.id] = ctr.userAgent
    }
  }

  // Turn on request handler
  const incRulesOk = this.includeHostsRules.length > 0
  const excRulesOk = Object.keys(this.excludeHostsRules).length > 0
  const proxyOk = Object.keys(this.proxies).length > 0
  const userAgentsOk = Object.keys(this.userAgents).length > 0

  // Update proxy badges
  if (proxyOk) {
    for (let tab of Object.values(this.tabsMap)) {
      if (!tab) continue
      if (this.proxies[tab.cookieStoreId] && !tab.proxified) {
        tab.proxified = true
        this.actions.showProxyBadge(tab.id)
      }
      if (!this.proxies[tab.cookieStoreId] && tab.proxified) {
        tab.proxified = false
        this.actions.hideProxyBadge(tab.id)
      }
    }
  } else {
    for (let tab of Object.values(this.tabsMap)) {
      if (!tab) continue
      tab.proxified = false
      this.actions.hideProxyBadge(tab.id)
    }
  }

  if (incRulesOk || excRulesOk || proxyOk) Actions.turnOnReqHandler()
  else Actions.turnOffReqHandler()

  if (userAgentsOk) Actions.turnOnHeadersHandler()
  else Actions.turnOffHeadersHandler()
}

function updateReqHandlerDebounced() {
  if (updateReqHandlerTimeout) clearTimeout(updateReqHandlerTimeout)
  updateReqHandlerTimeout = setTimeout(() => {
    Actions.updateReqHandler()
    updateReqHandlerTimeout = null
  }, 500)
}

function turnOnReqHandler() {
  if (!browser.proxy) return
  if (!browser.proxy.onRequest.hasListener(Actions.proxyReqHandler)) {
    browser.proxy.onRequest.addListener(Actions.proxyReqHandler, { urls: ['<all_urls>'] })
  }
}

function turnOffReqHandler() {
  if (!browser.proxy) return
  if (browser.proxy.onRequest.hasListener(Actions.proxyReqHandler)) {
    browser.proxy.onRequest.removeListener(Actions.proxyReqHandler)
  }
}

function turnOnHeadersHandler() {
  if (
    browser.webRequest &&
    !browser.webRequest.onBeforeSendHeaders.hasListener(Actions.headersHandler)
  ) {
    browser.webRequest.onBeforeSendHeaders.addListener(
      Actions.headersHandler,
      { urls: ['<all_urls>'] },
      ['blocking', 'requestHeaders']
    )
  }
}

function turnOffHeadersHandler() {
  if (
    browser.webRequest &&
    browser.webRequest.onBeforeSendHeaders.hasListener(Actions.headersHandler)
  ) {
    browser.webRequest.onBeforeSendHeaders.removeListener(Actions.headersHandler)
  }
}

export default {
  checkIpInfoThroughIPIFY_ORG,
  checkIpInfoThroughEXTREME_IP_LOOKUP_COM,
  checkIpInfo,
  proxyReqHandler,
  headersHandler,
  updateReqHandler,
  updateReqHandlerDebounced,
  turnOnReqHandler,
  turnOffReqHandler,
  turnOnHeadersHandler,
  turnOffHeadersHandler,
}
