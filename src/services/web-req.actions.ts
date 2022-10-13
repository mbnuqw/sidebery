import * as Utils from 'src/utils'
import { Tab, IPCheckResult, InstanceType } from 'src/types'
import { WebReq } from 'src/services/web-req'
import { Containers } from 'src/services/containers'
import { Tabs } from 'src/services/tabs.bg'

type optBlockingResponse = browser.webRequest.BlockingResponse | void

interface IncludeRule {
  ctx: string
  value: RegExp | string
}

const BG_URL = browser.runtime.getURL('bg/background.html')

let handledReqId: string | undefined
let includeHostsRules: IncludeRule[] = []
let excludeHostsRules: Record<ID, (RegExp | string)[]> = {}
const incHistory: Record<ID, string | null> = {}
let ipCheckCtx: ID | undefined
let userAgents: Record<ID, string> = {}

/**
 * Create new tab in appropriate container
 * and then close the original tab.
 */
async function recreateTab(
  tab: Tab,
  info: browser.proxy.RequestDetails,
  cookieStoreId?: string
): Promise<void> {
  let index: number | undefined
  try {
    index = await browser.runtime.sendMessage({
      instanceType: InstanceType.sidebar,
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

async function checkIpInfoWithIPIFY_ORG(cookieStoreId: ID): Promise<IPCheckResult | null> {
  if (!cookieStoreId || !WebReq.containersProxies[cookieStoreId]) return null
  ipCheckCtx = cookieStoreId

  let info: string
  const result: IPCheckResult = {}

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

async function checkIpInfoWithEXTREME_IP_LOOKUP_COM(
  cookieStoreId: ID
): Promise<IPCheckResult | null> {
  if (!cookieStoreId || !WebReq.containersProxies[cookieStoreId]) return null
  ipCheckCtx = cookieStoreId

  interface IpInfo {
    status: string
    query: string
    country: string
  }

  let info: IpInfo
  const result: IPCheckResult = {}

  try {
    info = await fetch('https://extreme-ip-lookup.com/json', {
      cache: 'reload',
    }).then(r => r.json() as Promise<IpInfo>)
  } catch (err) {
    return null
  }
  if (!info) return null

  if (info.status !== 'success') return null
  if (info.query) result.ip = info.query
  if (info.country) result.country = info.country

  return result
}

export async function checkIpInfo(cookieStoreId: ID): Promise<IPCheckResult | null> {
  let result: IPCheckResult | null

  result = await checkIpInfoWithEXTREME_IP_LOOKUP_COM(cookieStoreId)
  if (!result) {
    result = await checkIpInfoWithIPIFY_ORG(cookieStoreId)
  }

  return result
}

/**
 * Update all configs related to requests handling and
 * set (or remove) event listeners.
 */
export function updateReqHandlers(): void {
  WebReq.containersProxies = {}
  includeHostsRules = []
  excludeHostsRules = {}
  userAgents = {}

  for (const ctr of Object.values(Containers.reactive.byId)) {
    // Proxy
    if (ctr.proxified && ctr.proxy) WebReq.containersProxies[ctr.id] = { ...ctr.proxy }

    // Include rules
    if (ctr.includeHostsActive) {
      for (const rawRule of ctr.includeHosts.split('\n')) {
        let rule: RegExp | string = rawRule.trim()
        if (!rule) continue

        if (rule[0] === '/' && rule[rule.length - 1] === '/') {
          try {
            rule = new RegExp(rule.slice(1, rule.length - 1))
          } catch (err) {
            // nothing
          }
        }

        includeHostsRules.push({ ctx: ctr.id, value: rule })
      }
    }

    // Exclude rules
    if (ctr.excludeHostsActive) {
      excludeHostsRules[ctr.id] = ctr.excludeHosts
        .split('\n')
        .map(r => {
          let rule: RegExp | string = r.trim()

          if (rule[0] === '/' && rule[rule.length - 1] === '/') {
            rule = new RegExp(rule.slice(1, rule.length - 1))
          }

          return rule
        })
        .filter(r => r)
    }

    // User agents
    if (ctr.userAgentActive) {
      userAgents[ctr.id] = ctr.userAgent
    }
  }

  // Check features
  const hasIncRules = includeHostsRules.length > 0
  const hasExcRules = Object.keys(excludeHostsRules).length > 0
  const hasProxy = Object.keys(WebReq.containersProxies).length > 0
  const hasCustomUserAgents = Object.keys(userAgents).length > 0

  // Update proxy badges
  if (hasProxy) {
    for (const tab of Object.values(Tabs.byId)) {
      if (!tab) continue
      if (WebReq.containersProxies[tab.cookieStoreId] && !tab.proxified) {
        tab.proxified = true
        Tabs.showProxyBadge(tab.id)
      }
      if (!WebReq.containersProxies[tab.cookieStoreId] && tab.proxified) {
        tab.proxified = false
        Tabs.hideProxyBadge(tab.id)
      }
    }
  } else {
    for (const tab of Object.values(Tabs.byId)) {
      if (!tab) continue
      tab.proxified = false
      Tabs.hideProxyBadge(tab.id)
    }
  }

  if (hasIncRules || hasExcRules || hasProxy) turnOnReqHandler()
  else turnOffReqHandler()

  if (hasCustomUserAgents) turnOnBeforeSendHeadersHandler()
  else turnOffBeforeSendHeadersHandler()
}

let updateReqHandlersTimeout: number | undefined
export function updateReqHandlersDebounced(): void {
  clearTimeout(updateReqHandlersTimeout)
  updateReqHandlersTimeout = setTimeout(() => updateReqHandlers(), 500)
}

///
/// Proxy
///

/**
 * Handle requests before sending and define proxy
 * config for them.
 */
function proxyReqHandler(info: browser.proxy.RequestDetails): browser.proxy.ProxyInfoResult {
  if (!Tabs.byId) return

  const tab = Tabs.byId[info.tabId]

  // Proxify requests for checking ip and other info
  if (!tab && ipCheckCtx && info.type === 'xmlhttprequest') {
    if (info.originUrl === BG_URL && WebReq.containersProxies[ipCheckCtx]) {
      const ctx = ipCheckCtx
      ipCheckCtx = undefined
      return WebReq.containersProxies[ctx]
    }
  }

  // Check hosts rules, if the rule is matched
  // return promise with the process of reopening new tab.
  // This will block request from the original tab.
  if (tab && info.type === 'main_frame' && handledReqId !== info.requestId) {
    handledReqId = info.requestId
    let includedUrl

    // Include rules
    for (const rule of includeHostsRules) {
      let ok
      if (Utils.isRegExp(rule.value)) ok = (rule.value as RegExp).test(info.url)
      else ok = info.url.indexOf(rule.value as string) !== -1

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
    if (!includedUrl && excludeHostsRules[info.cookieStoreId]) {
      for (const rule of excludeHostsRules[info.cookieStoreId]) {
        let ok
        if (Utils.isRegExp(rule)) ok = (rule as RegExp).test(info.url)
        else ok = info.url.indexOf(rule as string) !== -1

        if (ok) {
          incHistory['firefox-default'] = info.url
          return recreateTab(tab, info)
        }
      }
    }
  }

  // Check proxy
  if (WebReq.containersProxies[info.cookieStoreId]) {
    return WebReq.containersProxies[info.cookieStoreId]
  }
}

function turnOnReqHandler(): void {
  if (!browser.proxy) return
  if (!browser.proxy.onRequest.hasListener(proxyReqHandler)) {
    browser.proxy.onRequest.addListener(proxyReqHandler, { urls: ['<all_urls>'] })
  }
}

function turnOffReqHandler(): void {
  if (!browser.proxy) return
  if (browser.proxy.onRequest.hasListener(proxyReqHandler)) {
    browser.proxy.onRequest.removeListener(proxyReqHandler)
  }
}

///
/// Before send headers
///

function beforeSendHeadersHandler(info: browser.webRequest.ReqDetails): optBlockingResponse {
  if (userAgents[info.cookieStoreId]) {
    const h = info.requestHeaders?.find(rh => rh.name === 'User-Agent')
    if (h) {
      h.value = userAgents[info.cookieStoreId]
      return { requestHeaders: info.requestHeaders }
    }
  }
}

function turnOnBeforeSendHeadersHandler(): void {
  if (!browser.webRequest) return
  const eventTarget = browser.webRequest.onBeforeSendHeaders
  if (!eventTarget.hasListener(beforeSendHeadersHandler)) {
    const filter = { urls: ['<all_urls>'] }
    eventTarget.addListener(beforeSendHeadersHandler, filter, ['blocking', 'requestHeaders'])
  }
}

function turnOffBeforeSendHeadersHandler(): void {
  if (!browser.webRequest) return
  if (browser.webRequest.onBeforeSendHeaders.hasListener(beforeSendHeadersHandler)) {
    browser.webRequest.onBeforeSendHeaders.removeListener(beforeSendHeadersHandler)
  }
}
