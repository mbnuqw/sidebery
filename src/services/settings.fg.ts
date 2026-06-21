import * as Utils from 'src/utils'
import { DEFAULT_SETTINGS, NOID, SETTINGS_OPTIONS } from 'src/defaults'
import { SettingsState } from 'src/types'
import * as Store from 'src/services/storage.fg'
import * as Info from 'src/services/info'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Styles from 'src/services/styles.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Menu from 'src/services/menu.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Preview from 'src/services/tabs.fg.preview'
import { updateWebReqHandlers } from './web-req.fg'
import * as Search from 'src/services/search.fg'
import * as Sync from 'src/services/sync.fg'
import * as Logs from 'src/services/logs'
import * as Notifications from 'src/services/notifications.fg'
import { translate } from 'src/dict'

import * as Settings from 'src/services/settings'
export * from 'src/services/settings'

export async function load() {
  await Settings.load()
  Search.parseShortcuts()
}

export async function saveSettings(): Promise<void> {
  Logs.info('Settings.saveSettings')

  const clone = Utils.cloneObject(Settings.state)
  const settings = Utils.recreateNormalizedObject(clone, DEFAULT_SETTINGS)
  await Store.set({ settings })

  if (settings.syncSaveSettings) {
    Sync.save(Sync.SyncedEntryType.Settings, settings)
  }
}

let saveSettingsTimeout: number | undefined
export function saveDebounced(delay = 500): void {
  clearTimeout(saveSettingsTimeout)
  saveSettingsTimeout = setTimeout(() => {
    saveSettings()
  }, delay)
}

export function setupSettingsChangeListener(): void {
  Store.onKeyChange('settings', updateSettings)
}

export async function importSyncedSettings(entry: Sync.SyncedEntry) {
  Logs.info('Settings.importSyncedSettings(): entry:', entry)

  const prevSettings = Utils.clone(Settings.state)
  const settings = await Sync.getData<SettingsState>(entry)
  if (!settings) {
    Logs.err('Settings.importSyncedSettings(): No data')
    return
  }

  // Keep sync settings
  settings.syncName = Settings.state.syncName
  settings.syncSaveSettings = Settings.state.syncSaveSettings
  settings.syncSaveCtxMenu = Settings.state.syncSaveCtxMenu
  settings.syncSaveStyles = Settings.state.syncSaveStyles
  settings.syncSaveKeybindings = Settings.state.syncSaveKeybindings

  await importSettings(settings)

  Notifications.notify({
    icon: '#icon_sync',
    title: translate('sync.success.import_settings'),
    ctrl: translate('notif.undo_ctrl'),
    callback: () => importSettings(prevSettings),
  })
}

export async function importSettings(settings: SettingsState) {
  Logs.info('Settings.importSettings: settings:', settings)

  await Store.set({ settings: settings })

  updateSettings(settings)
}

export function updateSettings(settings?: SettingsState | null): void {
  if (!settings) return

  Logs.info('Settings.updateSettingsFg()')

  const prev = Settings.state
  const next = settings

  // Check what values was updated
  const hideInactTabs = prev.hideInact !== next.hideInact
  const updateSuccessions =
    prev.activateAfterClosing !== next.activateAfterClosing ||
    prev.activateAfterClosingNoDiscarded !== next.activateAfterClosingNoDiscarded
  const resetTree = prev.tabsTree !== next.tabsTree && prev.tabsTree
  const reviveTree = prev.tabsTree !== next.tabsTree && !prev.tabsTree
  const tabsTreeLimit = prev.tabsTreeLimit !== next.tabsTreeLimit
  const hideFoldedTabs = prev.hideFoldedTabs !== next.hideFoldedTabs
  const hideUnloadedTabs = prev.hideUnloadedTabs !== next.hideUnloadedTabs
  const hideFoldedParent = prev.hideFoldedParent !== next.hideFoldedParent
  const theme = prev.theme !== next.theme
  const highlightOpenBookmarks = prev.highlightOpenBookmarks !== next.highlightOpenBookmarks
  const colorScheme = prev.colorScheme !== next.colorScheme
  const ctxMenuCtrIgnore = prev.ctxMenuIgnoreContainers !== next.ctxMenuIgnoreContainers
  const fontSize = prev.fontSize !== next.fontSize
  const fontFamily = prev.fontFamily !== next.fontFamily
  const updateSidebarTitleChanged = prev.updateSidebarTitle !== next.updateSidebarTitle
  const pinnedTabsPositionChanged = prev.pinnedTabsPosition !== next.pinnedTabsPosition
  const colorizeTabsChanged = prev.colorizeTabs !== next.colorizeTabs
  const colorizeTabsSrcChanged = prev.colorizeTabsSrc !== next.colorizeTabsSrc
  const colorizeTabsBranchesChanged = prev.colorizeTabsBranches !== next.colorizeTabsBranches
  const colorizeTabsBranchesSrcChanged =
    prev.colorizeTabsBranchesSrc !== next.colorizeTabsBranchesSrc
  const tabsNotificationBadgeScopeChanged =
    prev.tabsNotificationBadgeScope !== next.tabsNotificationBadgeScope
  const tabsNotificationBadgeRegExpPatternChanged =
    prev.tabsNotificationBadgeRegExpPattern !== next.tabsNotificationBadgeRegExpPattern
  const tabsUpdateMarkChanged = prev.tabsUpdateMark !== next.tabsUpdateMark
  const navTabsPanelMidClickAction =
    prev.navTabsPanelMidClickAction !== next.navTabsPanelMidClickAction
  const navBookmarksPanelMidClickAction =
    prev.navBookmarksPanelMidClickAction !== next.navBookmarksPanelMidClickAction
  const newTabCtxReopen = prev.newTabCtxReopen !== next.newTabCtxReopen
  const previewTabs = prev.previewTabs !== next.previewTabs
  const previewTabsMode = prev.previewTabsMode !== next.previewTabsMode
  const previewTabsModeFallback =
    prev.previewTabsPageModeFallback !== next.previewTabsPageModeFallback
  const markWindowPreface = prev.markWindowPreface !== next.markWindowPreface
  const tabsUnreadMark = prev.tabsUnreadMark !== next.tabsUnreadMark
  const copyTemplates = prev.copyTemplates !== next.copyTemplates

  // Update settings of this instance
  Utils.updateObject(Settings.state, settings, Settings.state)

  Settings.updPrecalcSettings()

  if (Info.isSidebar && newTabCtxReopen) updateWebReqHandlers()

  if (Info.isSidebar && tabsUnreadMark && !next.tabsUnreadMark) {
    Tabs.list.forEach(t => (t.reactive.unread = t.unread = false))
  }

  if (previewTabs || previewTabsMode || previewTabsModeFallback) {
    Preview.resetMode()
  }

  if (navTabsPanelMidClickAction || navBookmarksPanelMidClickAction) {
    Sidebar.updatePanelsTooltips()
  }

  if (Info.isSidebar && updateSuccessions && Sidebar.hasTabs) {
    Tabs.updateSuccessionDebounced(0)
  }

  if (resetTree && Sidebar.hasTabs) {
    for (const tab of Tabs.list) {
      tab.reactive.isParent = tab.isParent = false
      tab.reactive.folded = tab.folded = false
      tab.invisible = false
      tab.parentId = -1
      tab.reactive.lvl = tab.lvl = 0
    }
    Sidebar.recalcVisibleTabs()
  }

  if (reviveTree && Sidebar.hasTabs) {
    for (const tab of Tabs.list) {
      tab.parentId = tab.openerTabId ?? NOID
    }
    Tabs.updateTabsTree()
    Sidebar.recalcVisibleTabs()
  }

  if (tabsTreeLimit && Sidebar.hasTabs) {
    Tabs.updateTabsTree()
    Sidebar.recalcVisibleTabs()
  }

  if (
    (hideInactTabs || hideFoldedTabs || hideFoldedParent || hideUnloadedTabs) &&
    Sidebar.hasTabs
  ) {
    Tabs.updateNativeTabsVisibility()
  }

  if (highlightOpenBookmarks && Bookmarks.tree.length) {
    Bookmarks.recalcOpenTabs()
  }

  if (theme) {
    Styles.updateColorScheme()
    if (Info.isSidebar) {
      Styles.removeCustomCSS()
      Styles.loadCustomSidebarCSS()
    }
  }
  if (ctxMenuCtrIgnore) Menu.parseContainersRules()
  if (fontSize) Styles.updateGlobalFontSize()
  if (fontFamily) Styles.udpateGlobalFontFamily()

  if (colorScheme) Styles.updateColorScheme()

  if (Info.isSidebar && updateSidebarTitleChanged) Sidebar.updateSidebarTitle(0)

  if (pinnedTabsPositionChanged && Sidebar.hasTabs) Sidebar.recalcTabsPanels()

  if (Sidebar.reMountSidebar) Sidebar.reMountSidebar()

  if (
    (colorizeTabsBranchesChanged || colorizeTabsBranchesSrcChanged) &&
    Settings.state.colorizeTabsBranches
  ) {
    Tabs.colorizeBranches()
  }

  if ((colorizeTabsChanged || colorizeTabsSrcChanged) && Settings.state.colorizeTabs) {
    Tabs.colorizeTabs()
  }

  if (tabsNotificationBadgeScopeChanged || tabsNotificationBadgeRegExpPatternChanged) {
    Tabs.updateNotificationBadgeCountTabs()
  }

  if (tabsUpdateMarkChanged && next.tabsUpdateMark === 'none') {
    for (const tab of Tabs.list) {
      tab.reactive.updated = tab.updated = false
    }
    for (const panel of Sidebar.panels) {
      if (Utils.isTabsPanel(panel)) {
        panel.updatedTabs = []
        panel.reactive.updated = false
      }
    }
  }

  if (markWindowPreface) Settings.parsePrefaceTemplate()

  if (Info.isSidebar && copyTemplates) Settings.parseCopyTemplates()

  Search.parseShortcuts()
}

export function resetSettings(): void {
  Utils.updateObject(Settings.state, DEFAULT_SETTINGS, DEFAULT_SETTINGS)
  Settings.updPrecalcSettings()
}

type Opts = typeof SETTINGS_OPTIONS
/**
 * Get available options
 */
export function getOpts<K extends keyof Opts, V extends Opts[K]>(key: K): V {
  return SETTINGS_OPTIONS[key] as V
}
