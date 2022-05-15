import Utils from 'src/utils'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from 'src/defaults'
import { SettingsState, Stored } from 'src/types'
import { Settings } from 'src/services/settings'
import { Store } from './storage'
import { Info } from './info'
import { Windows } from './windows'
import { Sidebar } from 'src/services/sidebar'
import { Styles } from 'src/services/styles'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Snapshots } from 'src/services/snapshots'
import { Logs } from './logs'

type Opts = typeof SETTINGS_OPTIONS
export async function loadSettings(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('settings')

  if (!stored.settings) {
    // Respect prefersReducedMotion rule for default settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReducedMotion?.matches) DEFAULT_SETTINGS.animations = false

    stored.settings = {} as SettingsState
  }

  Utils.normalizeObject(stored.settings, DEFAULT_SETTINGS)
  Utils.updateObject(Settings.reactive, stored.settings)

  if (Settings.reactive.hideInact) {
    Settings.reactive.activateLastTabOnPanelSwitching = true
    Settings.reactive.tabsPanelSwitchActMove = true
  }

  Logs.info('Settings: Loaded')
}

export async function saveSettings(): Promise<void> {
  const clone = Utils.cloneObject(Settings.reactive)
  const settings = Utils.recreateNormalizedObject(clone, DEFAULT_SETTINGS)
  await Store.set({ settings })

  if (settings.syncSaveSettings) saveSettingsToSync()
}

async function saveSettingsToSync(settings?: SettingsState): Promise<void> {
  if (!settings) settings = Utils.recreateNormalizedObject(Settings.reactive, DEFAULT_SETTINGS)
  await Store.sync('settings', { settings })
}

export function setupSettingsChangeListener(): void {
  if (Info.isBg) Store.onKeyChange('settings', updateSettingsBg)
  else Store.onKeyChange('settings', updateSettingsFg)
}

export function updateSettingsBg(settings?: SettingsState | null): void {
  if (!settings) return

  const prev = Settings.reactive
  const next = settings

  const markWindowChanged = prev.markWindow !== next.markWindow
  const markWindowPrefaceChanged = prev.markWindowPreface !== next.markWindowPreface
  const snapIntervalChanged = prev.snapInterval !== next.snapInterval
  const snapIntervalUnitChanged = prev.snapIntervalUnit !== next.snapIntervalUnit

  Utils.updateObject(Settings.reactive, settings)

  if (markWindowChanged) {
    for (const win of Object.values(Windows.byId)) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (!next.markWindow) {
        browser.windows.update(win.id, { titlePreface: '' })
      } else if (win.sidebarPort) {
        browser.windows.update(win.id, { titlePreface: Settings.reactive.markWindowPreface })
      }
    }
  } else if (markWindowPrefaceChanged) {
    const value = next.markWindowPreface
    for (const win of Object.values(Windows.byId)) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (Settings.reactive.markWindow && win.sidebarPort) {
        browser.windows.update(win.id, { titlePreface: value })
      }
    }
  }

  if (snapIntervalChanged || snapIntervalUnitChanged) Snapshots.scheduleSnapshots()
}

export function updateSettingsFg(settings?: SettingsState | null): void {
  if (!settings) return

  Logs.info('Settings: Update settings')

  const prev = Settings.reactive
  const next = settings

  // Check what values was updated
  const hideInactTabs = prev.hideInact !== next.hideInact
  const updateSuccessions =
    prev.activateAfterClosing !== next.activateAfterClosing ||
    prev.activateAfterClosingNoDiscarded !== next.activateAfterClosingNoDiscarded
  const resetTree = prev.tabsTree !== next.tabsTree && prev.tabsTree
  const updateTree = prev.tabsTreeLimit !== next.tabsTreeLimit
  const updateInvisTabs = prev.hideFoldedTabs !== next.hideFoldedTabs
  const theme = prev.theme !== next.theme
  const highlightOpenBookmarks = prev.highlightOpenBookmarks !== next.highlightOpenBookmarks
  const colorScheme = prev.colorScheme !== next.colorScheme
  const ctxMenuCtrIgnore = prev.ctxMenuIgnoreContainers !== next.ctxMenuIgnoreContainers
  const fontSize = prev.fontSize !== next.fontSize
  const updateSidebarTitleChanged = prev.updateSidebarTitle !== next.updateSidebarTitle
  const pinnedTabsPositionChanged = prev.pinnedTabsPosition !== next.pinnedTabsPosition
  const colorizeTabsBranchesChanged = prev.colorizeTabsBranches !== next.colorizeTabsBranches

  // Update settings of this instance
  Utils.updateObject(Settings.reactive, settings)

  if (Info.isSidebar && updateSuccessions && Sidebar.hasTabs) {
    const activeTab = Tabs.list.find(t => t.active)
    if (Settings.reactive.activateAfterClosing !== 'none' && activeTab) {
      const target = Tabs.findSuccessorTab(activeTab)
      if (target) browser.tabs.moveInSuccession([activeTab.id], target.id)
    }
  }

  if (resetTree && Sidebar.hasTabs) {
    for (const tab of Tabs.list) {
      const rTab = Tabs.reactive.byId[tab.id]
      if (!rTab) continue
      rTab.isParent = false
      tab.isParent = false
      rTab.folded = false
      tab.folded = false
      rTab.invisible = false
      tab.invisible = false
      tab.parentId = -1
      rTab.lvl = 0
      tab.lvl = 0
    }
  }

  if (updateTree && Sidebar.hasTabs) {
    Tabs.updateTabsTree()
  }

  if ((hideInactTabs || updateInvisTabs) && Sidebar.hasTabs) {
    Tabs.updateNativeTabsVisibility()
  }

  if (highlightOpenBookmarks && Bookmarks.reactive.byId) {
    if (Settings.reactive.highlightOpenBookmarks) Bookmarks.markOpenedBookmarksDebounced()
    else Bookmarks.resetOpenedBookmarksMarks(Bookmarks.reactive.tree)
  }

  if (theme) Styles.initTheme()
  if (ctxMenuCtrIgnore) Menu.parseContainersRules()
  if (fontSize) Sidebar.updateFontSize()

  if (colorScheme) Styles.initColorScheme()

  if (Info.isSidebar && updateSidebarTitleChanged) Sidebar.updateSidebarTitle(0)

  if (pinnedTabsPositionChanged && Sidebar.hasTabs) Sidebar.recalcTabsPanels()

  if (Sidebar.reMountSidebar) Sidebar.reMountSidebar()

  if (colorizeTabsBranchesChanged && Settings.reactive.colorizeTabsBranches) Tabs.colorizeBranches()
}

export function resetSettings(): void {
  Utils.updateObject(Settings.reactive, DEFAULT_SETTINGS)
}

/**
 * Get available options
 */
export function getOpts<K extends keyof Opts, V extends Opts[K]>(key: K): V {
  return SETTINGS_OPTIONS[key] as V
}
