import { TabReopenRuleConfig } from './sidebar'

export interface Container extends browser.contextualIdentities.Container {
  id: string
  proxified: boolean
  proxy: browser.proxy.ProxyInfo | null
  reopenRulesActive: boolean
  reopenRules: TabReopenRuleConfig[]
  includeHostsActive?: boolean // DEPR, rm after b32
  includeHosts?: string // DEPR
  excludeHostsActive?: boolean // DEPR
  excludeHosts?: string // DEPR
  userAgentActive: boolean
  userAgent: string
}

export interface Container_v4 extends browser.contextualIdentities.Container {
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
