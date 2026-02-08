import * as T from 'src/types'
import * as D from 'src/defaults'
import { translate } from 'src/dict'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage'

export let reactive: T.SidebarConfig = {
  nav: [],
  panels: {},
}

export function reactivate(r: T.Reactivator<T.SidebarConfig>) {
  reactive = r(reactive)
}

export async function loadSidebarConfig() {
  const storage = await browser.storage.local.get<T.Stored>('sidebar')
  if (storage.sidebar?.nav) reactive.nav = storage.sidebar.nav
  if (storage.sidebar?.panels) {
    // Normalize configs
    for (const conf of Object.values(storage.sidebar.panels)) {
      if (Utils.isTabsPanel(conf)) Utils.normalizeObject(conf, D.TABS_PANEL_CONFIG)
      else if (Utils.isBookmarksPanel(conf)) Utils.normalizeObject(conf, D.BOOKMARKS_PANEL_CONFIG)
      else if (Utils.isHistoryPanel(conf)) Utils.normalizeObject(conf, D.HISTORY_PANEL_CONFIG)
      else if (Utils.isSyncPanel(conf)) Utils.normalizeObject(conf, D.SYNC_PANEL_CONFIG)
    }

    reactive.panels = storage.sidebar.panels
  }
}

export function createTabsPanelConfig(conf?: Partial<T.TabsPanelConfig>): T.TabsPanelConfig {
  const panelConf = Utils.cloneObject(D.TABS_PANEL_CONFIG)

  if (conf) Utils.updateObject(panelConf, conf, conf)

  if (!panelConf.id) panelConf.id = Utils.uid()
  if (!panelConf.name) panelConf.name = translate('panel.tabs.title')

  return panelConf
}

export function createBookmarksPanelConfig(
  conf?: Partial<T.BookmarksPanelConfig>
): T.BookmarksPanelConfig {
  const panelConf = Utils.cloneObject(D.BOOKMARKS_PANEL_CONFIG)

  if (conf) Utils.updateObject(panelConf, conf, conf)

  if (!panelConf.id) panelConf.id = Utils.uid()
  if (!panelConf.name) panelConf.name = translate('panel.bookmarks.title')
  if (!panelConf.rootId) panelConf.rootId = D.BKM_ROOT_ID

  return panelConf
}

export function createHistoryPanelConfig(): T.HistoryPanelConfig {
  return Utils.cloneObject(D.HISTORY_PANEL_CONFIG)
}

export function createSyncPanelConfig(): T.SyncPanelConfig {
  return Utils.cloneObject(D.SYNC_PANEL_CONFIG)
}

export function createDefaultSidebarConfig(): T.SidebarConfig {
  const defaultTabsPanelConfig = createTabsPanelConfig()

  return {
    panels: { [defaultTabsPanelConfig.id]: defaultTabsPanelConfig },
    nav: [defaultTabsPanelConfig.id, 'add_tp', 'sp-0', 'settings'],
  }
}

export function setupSidebarConfigListeners() {
  Store.onKeyChange('sidebar', updateSidebarConfig)
}

export function updateSidebarConfig(newConfig?: T.SidebarConfig | null): void {
  if (!newConfig?.nav?.length) newConfig = { nav: [], panels: {} }

  if (newConfig.nav) reactive.nav = newConfig.nav
  if (newConfig.panels) {
    // Normalize configs
    for (const conf of Object.values(newConfig.panels)) {
      if (Utils.isTabsPanel(conf)) Utils.normalizeObject(conf, D.TABS_PANEL_CONFIG)
      else if (Utils.isBookmarksPanel(conf)) Utils.normalizeObject(conf, D.BOOKMARKS_PANEL_CONFIG)
      else if (Utils.isHistoryPanel(conf)) Utils.normalizeObject(conf, D.HISTORY_PANEL_CONFIG)
      else if (Utils.isSyncPanel(conf)) Utils.normalizeObject(conf, D.SYNC_PANEL_CONFIG)
    }

    reactive.panels = newConfig.panels
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
