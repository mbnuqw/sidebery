import {
  BookmarksPanelConfig,
  HistoryPanelConfig,
  SidebarConfig,
  Stored,
  SyncPanelConfig,
  TabsPanelConfig,
} from 'src/types'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import { Store } from './storage'
import {
  BKM_ROOT_ID,
  BOOKMARKS_PANEL_CONFIG,
  HISTORY_PANEL_CONFIG,
  SYNC_PANEL_CONFIG,
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
      else if (Utils.isSyncPanel(conf)) Utils.normalizeObject(conf, SYNC_PANEL_CONFIG)
    }

    SidebarConfigRState.panels = storage.sidebar.panels
  }
}

export async function saveSidebarConfig(delay?: number) {
  return Store.set({ sidebar: Utils.cloneObject(SidebarConfigRState) }, delay)
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

export function createSyncPanelConfig(): SyncPanelConfig {
  return Utils.cloneObject(SYNC_PANEL_CONFIG)
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

export function updateSidebarConfig(newConfig?: SidebarConfig | null): void {
  if (!newConfig?.nav?.length) newConfig = { nav: [], panels: {} }

  if (newConfig.nav) SidebarConfigRState.nav = newConfig.nav
  if (newConfig.panels) {
    // Normalize configs
    for (const conf of Object.values(newConfig.panels)) {
      if (Utils.isTabsPanel(conf)) Utils.normalizeObject(conf, TABS_PANEL_CONFIG)
      else if (Utils.isBookmarksPanel(conf)) Utils.normalizeObject(conf, BOOKMARKS_PANEL_CONFIG)
      else if (Utils.isHistoryPanel(conf)) Utils.normalizeObject(conf, HISTORY_PANEL_CONFIG)
      else if (Utils.isSyncPanel(conf)) Utils.normalizeObject(conf, SYNC_PANEL_CONFIG)
    }

    SidebarConfigRState.panels = newConfig.panels
  }
}

export async function openPanelConfigWindow(panelId: ID) {
  const width = 720
  const height = 640

  await browser.windows.create({
    allowScriptsToClose: true,
    focused: true,
    width,
    height,
    incognito: false,
    state: 'normal',
    type: 'popup',
    url: `/popup.panel-config/panel-config.html?panelId=${panelId}`,
    // For userChrome modificatoins with `#main-window[titlepreface='PanelConfig‎']`
    titlePreface: 'PanelConfig‎',
  })
}
