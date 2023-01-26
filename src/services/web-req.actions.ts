import * as Utils from 'src/utils'
import { Tab, IPCheckResult } from 'src/types'
import { WebReq } from 'src/services/web-req'
import { Containers } from 'src/services/containers'
import { Tabs } from 'src/services/tabs.bg'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'

type optBlockingResponse = browser.webRequest.BlockingResponse | void

interface IncludeRule {
  ctx: string
  value: RegExp | string
}

const BG_URL = browser.runtime.getURL('bg/background.html')

let handledReqId: string | undefined
let includeHostsRules: IncludeRule[] = []
let excludeHostsRules: Record<ID, (RegExp | string)[]> = {}
let proxyAuthCredentials: Record<string, browser.webRequest.AuthCredentials> = {}
const pendingAuthRequests: Set<string> = new Set()
const incHistory: Record<ID, string | null> = {}
let ipCheckCtx: ID | undefined
let userAgents: Record<ID, string> = {}

async function recreateTab(
  tab: Tab,
  info: browser.proxy.RequestDetails,
  cookieStoreId?: string
): Promise<void> {
  let index: number | undefined
  try {
    index = await IPC.sidebar(tab.windowId, 'handleReopening', tab.id, cookieStoreId)
  } catch {
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
  proxyAuthCredentials = {}
  pendingAuthRequests.clear()
  userAgents = {}

  for (const ctr of Object.values(Containers.reactive.byId)) {
    // Proxy
    if (ctr.proxified && ctr.proxy) {
      WebReq.containersProxies[ctr.id] = { ...ctr.proxy }
      if (ctr.proxy.type.startsWith('http') && ctr.proxy.username && ctr.proxy.password) {
        proxyAuthCredentials[ctr.id] = {
          username: ctr.proxy.username,
          password: ctr.proxy.password,
        }
      }
    }

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
  const hasAuthProxy = hasProxy && Object.values(proxyAuthCredentials).length > 0

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

  if (hasAuthProxy) turnOnAuthHandler()
  else turnOffAuthHandler()

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
        return Utils.inQueue(recreateTab, tab, info, rule.ctx)
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
          return Utils.inQueue(recreateTab, tab, info)
        }
      }
    }
  }

  // Check proxy
  if (WebReq.containersProxies[info.cookieStoreId]) {
    return WebReq.containersProxies[info.cookieStoreId]
  }
}

function proxyAuthReqHandler(
  info: browser.webRequest.AuthReqDetails
): browser.webRequest.BlockingResponse | void {
  if (!info.isProxy) return

  const authCredentials = proxyAuthCredentials[info.cookieStoreId]
  if (!authCredentials) return

  if (pendingAuthRequests.has(info.requestId)) {
    return { cancel: true }
  } else {
    pendingAuthRequests.add(info.requestId)
  }

  return { authCredentials }
}

function proxyAuthCompletedHandler(info: browser.webRequest.ReqDetails) {
  if (pendingAuthRequests.has(info.requestId)) {
    cancelDebouncedProxyAuthErrorHandler(info.cookieStoreId)
    pendingAuthRequests.delete(info.requestId)
  }
}

function proxyAuthWithErrorHandler(info: browser.webRequest.ErrReqDetails) {
  if (!pendingAuthRequests.has(info.requestId)) return
  proxyAuthErrorHandlerDebounced(info.cookieStoreId, info.error, 640)
}

const proxyAuthErrorHandlerTimeouts: Map<string, number> = new Map()
function proxyAuthErrorHandlerDebounced(containerId: string, error: string, delay: number) {
  let timeout = proxyAuthErrorHandlerTimeouts.get(containerId)
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    Logs.warn(`WebReq.proxyAuthWithErrorHandler: ${error}`)
    IPC.sendToLastFocusedSidebar('notifyAboutWrongProxyAuthData', containerId)
  }, delay)
  proxyAuthErrorHandlerTimeouts.set(containerId, timeout)
}
function cancelDebouncedProxyAuthErrorHandler(containerId: string) {
  clearTimeout(proxyAuthErrorHandlerTimeouts.get(containerId))
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

function turnOnAuthHandler(): void {
  if (!browser.proxy || !browser.webRequest) return
  const filter = { urls: ['<all_urls>'] }
  if (!browser.webRequest.onAuthRequired.hasListener(proxyAuthReqHandler)) {
    browser.webRequest.onAuthRequired.addListener(proxyAuthReqHandler, filter, ['blocking'])
  }
  if (!browser.webRequest.onCompleted.hasListener(proxyAuthCompletedHandler)) {
    browser.webRequest.onCompleted.addListener(proxyAuthCompletedHandler, filter)
  }
  if (!browser.webRequest.onErrorOccurred.hasListener(proxyAuthWithErrorHandler)) {
    browser.webRequest.onErrorOccurred.addListener(proxyAuthWithErrorHandler, filter)
  }
}

function turnOffAuthHandler(): void {
  if (!browser.proxy || !browser.webRequest) return
  if (browser.webRequest.onAuthRequired.hasListener(proxyAuthReqHandler)) {
    browser.webRequest.onAuthRequired.removeListener(proxyAuthReqHandler)
  }
  if (browser.webRequest.onCompleted.hasListener(proxyAuthCompletedHandler)) {
    browser.webRequest.onCompleted.removeListener(proxyAuthCompletedHandler)
  }
  if (browser.webRequest.onErrorOccurred.hasListener(proxyAuthWithErrorHandler)) {
    browser.webRequest.onErrorOccurred.removeListener(proxyAuthWithErrorHandler)
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
