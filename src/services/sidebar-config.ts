import {
  BookmarksPanelConfig,
  HistoryPanelConfig,
  OldPanelConfig,
  SidebarConfig,
  Stored,
  TabToPanelMoveRuleConfig,
  TabsPanelConfig,
} from 'src/types'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import { Store } from './storage'
import {
  BKM_ROOT_ID,
  BOOKMARKS_PANEL_CONFIG,
  HISTORY_PANEL_CONFIG,
  TABS_PANEL_CONFIG,
} from 'src/defaults'
import { translate } from 'src/dict'
import { Settings } from './settings'

export let reactive: SidebarConfig = {
  nav: [],
  panels: {},
}
export let SidebarConfigRState = reactive

let reactFn: (<T extends object>(rObj: T) => T) | undefined
export function initSidebarConfig(reactivate?: (rObj: object) => object) {
  if (!reactivate) return
  reactFn = reactivate as <T extends object>(rObj: T) => T
  SidebarConfigRState = reactive = reactFn(reactive)
}

export async function loadSidebarConfig() {
  const storage = await browser.storage.local.get<Stored>('sidebar')
  if (storage.sidebar?.nav) SidebarConfigRState.nav = storage.sidebar.nav
  if (storage.sidebar?.panels) {
    // Normalize configs
    for (const conf of Object.values(storage.sidebar.panels)) {
      if (Utils.isTabsPanel(conf)) Utils.normalizeObject(conf, TABS_PANEL_CONFIG)
      else if (Utils.isBookmarksPanel(conf)) Utils.normalizeObject(conf, BOOKMARKS_PANEL_CONFIG)
      else if (Utils.isHistoryPanel(conf)) Utils.normalizeObject(conf, HISTORY_PANEL_CONFIG)
    }

    SidebarConfigRState.panels = storage.sidebar.panels
  }
}

export async function saveSidebarConfig(delay?: number) {
  return Store.set({ sidebar: Utils.cloneObject(SidebarConfigRState) }, delay)
}

export function getSidebarConfigFromV4(panels_v4: OldPanelConfig[]): SidebarConfig {
  const sidebar: SidebarConfig = { panels: {}, nav: [] }

  for (const oldPanelConf of panels_v4) {
    if (oldPanelConf.type === 'bookmarks') {
      const panel = Utils.cloneObject(BOOKMARKS_PANEL_CONFIG)
      panel.id = 'bookmarks'
      panel.name = translate('panel.bookmarks.title')
      panel.lockedPanel = oldPanelConf.lockedPanel
      panel.skipOnSwitching = oldPanelConf.skipOnSwitching

      sidebar.panels[panel.id] = panel
      sidebar.nav.push(panel.id)
    } else {
      const panel = Utils.cloneObject(TABS_PANEL_CONFIG)
      panel.id = oldPanelConf.id
      panel.name = oldPanelConf.name
      panel.lockedPanel = oldPanelConf.lockedPanel
      panel.skipOnSwitching = oldPanelConf.skipOnSwitching
      panel.color = Utils.normalizeColor(oldPanelConf.color)
      panel.iconSVG = oldPanelConf.icon
      panel.iconIMG = oldPanelConf.customIcon
      panel.iconIMGSrc = oldPanelConf.customIconSrc
      panel.noEmpty = oldPanelConf.noEmpty
      panel.newTabCtx = oldPanelConf.newTabCtx
      panel.dropTabCtx = oldPanelConf.dropTabCtx

      if (oldPanelConf.moveTabCtx && oldPanelConf.moveTabCtx !== 'none') {
        panel.moveRules.push({
          id: Utils.uid(),
          active: true,
          containerId: oldPanelConf.moveTabCtx,
          topLvlOnly: !!oldPanelConf.moveTabCtxNoChild,
        })
      }

      if (oldPanelConf.urlRules) {
        panel.moveRules.push(...convertOldUrlRulesToMoveRules(oldPanelConf))
      }

      sidebar.panels[panel.id] = panel
      sidebar.nav.push(panel.id)
    }
  }

  if (!Settings.state.hideAddBtn) sidebar.nav.push('add_tp')
  sidebar.nav.push('sp-0')
  if (!Settings.state.hideSettingsBtn) sidebar.nav.push('settings')

  return sidebar
}

function convertOldUrlRulesToMoveRules(panel: OldPanelConfig): TabToPanelMoveRuleConfig[] {
  const output: TabToPanelMoveRuleConfig[] = []
  const isActive = !!panel.urlRulesActive

  for (const rawRule of panel.urlRules.split('\n')) {
    const rule = rawRule.trim()
    if (!rule) continue

    output.push({
      id: Utils.uid(),
      active: isActive,
      url: rule,
    })
  }

  return output
}

export function createTabsPanelConfig(conf?: Partial<TabsPanelConfig>): TabsPanelConfig {
  const panelConf = Utils.cloneObject(TABS_PANEL_CONFIG)

  if (conf) Utils.updateObject(panelConf, conf, conf)

  if (!panelConf.id) panelConf.id = Utils.uid()
  if (!panelConf.name) panelConf.name = translate('panel.tabs.title')

  return panelConf
}

export function createBookmarksPanelConfig(
  conf?: Partial<BookmarksPanelConfig>
): BookmarksPanelConfig {
  const panelConf = Utils.cloneObject(BOOKMARKS_PANEL_CONFIG)

  if (conf) Utils.updateObject(panelConf, conf, conf)

  if (!panelConf.id) panelConf.id = Utils.uid()
  if (!panelConf.name) panelConf.name = translate('panel.bookmarks.title')
  if (!panelConf.rootId) panelConf.rootId = BKM_ROOT_ID

  return panelConf
}

export function createHistoryPanelConfig(): HistoryPanelConfig {
  return Utils.cloneObject(HISTORY_PANEL_CONFIG)
}

export function createDefaultSidebarConfig(): SidebarConfig {
  const defaultTabsPanelConfig = createTabsPanelConfig()

  return {
    panels: { [defaultTabsPanelConfig.id]: defaultTabsPanelConfig },
    nav: [defaultTabsPanelConfig.id, 'add_tp', 'sp-0', 'settings'],
  }
}

export function setupSidebarConfigListeners() {
  Store.onKeyChange('sidebar', updateSidebarConfig)
}

function updateSidebarConfig(newConfig?: SidebarConfig | null): void {
  if (!newConfig?.nav?.length) newConfig = { nav: [], panels: {} }

  if (newConfig.nav) SidebarConfigRState.nav = newConfig.nav
  if (newConfig.panels) {
    // Normalize configs
    for (const conf of Object.values(newConfig.panels)) {
      if (Utils.isTabsPanel(conf)) Utils.normalizeObject(conf, TABS_PANEL_CONFIG)
      else if (Utils.isBookmarksPanel(conf)) Utils.normalizeObject(conf, BOOKMARKS_PANEL_CONFIG)
      else if (Utils.isHistoryPanel(conf)) Utils.normalizeObject(conf, HISTORY_PANEL_CONFIG)
    }

    SidebarConfigRState.panels = newConfig.panels
  }
}
