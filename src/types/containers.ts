export interface Container extends browser.contextualIdentities.Container {
  id: string
  proxified: boolean
  proxy: browser.proxy.ProxyInfo | null
  includeHostsActive: boolean
  includeHosts: string
  excludeHostsActive: boolean
  excludeHosts: string
  userAgentActive: boolean
  userAgent: string
}
