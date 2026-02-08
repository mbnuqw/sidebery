import { TabReopenRuleConfig } from 'src/types'

export interface ProfileInfo {
  name: string
  icon: string
  color: string
}

export const enum FileType {
  ProfileInfo = 1,
  Settings = 2,
  CtxMenu = 3,
  Styles = 4,
  Keybindings = 5,
  Tabs = 6,
}

export interface SyncedContainer {
  id: string
  name: string
  icon: string
  color: string
  proxified: boolean
  proxy: browser.proxy.ProxyInfo | null
  reopenRulesActive: boolean
  reopenRules: TabReopenRuleConfig[]
  userAgentActive: boolean
  userAgent: string
}

export interface SyncedTab {
  id: ID
  title: string
  url: string
  domain?: string
  pin?: boolean
  parentId?: ID
  folded?: boolean
  containerId?: string
  customTitle?: string
  customColor?: string
}

export interface SyncedTabsBatch {
  id: string
  time: number
  profileId: string
  tabs: SyncedTab[]
  containers: Record<string, SyncedContainer>
}

export interface SyncedTabsFileData {
  batches: SyncedTabsBatch[]
  favicons: Record<string, string>
}

export const typeNames: Record<(typeof FileType)[keyof typeof FileType], string> = {
  [FileType.ProfileInfo]: 'profile-info',
  [FileType.Settings]: 'settings',
  [FileType.CtxMenu]: 'ctx-menu',
  [FileType.Styles]: 'styles',
  [FileType.Keybindings]: 'keybindings',
  [FileType.Tabs]: 'tabs',
}
