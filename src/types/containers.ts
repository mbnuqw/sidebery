import { TabReopenRuleConfig } from './sidebar'

export interface Container extends browser.contextualIdentities.Container {
  id: string
  proxified: boolean
  proxy: browser.proxy.ProxyInfo | null
  reopenRulesActive: boolean
  reopenRules: TabReopenRuleConfig[]
  userAgentActive: boolean
  userAgent: string
}

export interface NewContainerConf {
  name: string
  color: string
  icon: string
  proxified?: boolean
  proxy?: browser.proxy.ProxyInfo | null
  reopenRulesActive?: boolean
  reopenRules?: TabReopenRuleConfig[]
  userAgentActive?: boolean
  userAgent?: string
}
