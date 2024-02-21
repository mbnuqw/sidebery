import * as Utils from 'src/utils'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from 'src/defaults'
import { SettingsState, Stored, InstanceType } from 'src/types'
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
import * as IPC from './ipc'
import * as Preview from 'src/services/tabs.preview'
import { updateWebReqHandlers } from './web-req.fg'
import { Search } from './search'

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
  Utils.updateObject(Settings.state, stored.settings, Settings.state)

  if (Settings.state.hideInact) {
    Settings.state.activateLastTabOnPanelSwitching = true
    Settings.state.tabsPanelSwitchActMove = true
  }

  Search.parseShortcuts()
}

export async function saveSettings(): Promise<void> {
  const clone = Utils.cloneObject(Settings.state)
  const settings = Utils.recreateNormalizedObject(clone, DEFAULT_SETTINGS)
  await Store.set({ settings })

  if (settings.syncSaveSettings) saveSettingsToSync()
}

let saveSettingsTimeout: number | undefined
export function saveDebounced(delay = 500): void {
  clearTimeout(saveSettingsTimeout)
  saveSettingsTimeout = setTimeout(() => {
    Settings.saveSettings()
  }, delay)
}

async function saveSettingsToSync(settings?: SettingsState): Promise<void> {
  if (!settings) settings = Utils.recreateNormalizedObject(Settings.state, DEFAULT_SETTINGS)
  await Store.sync('settings', { settings })
}

export function setupSettingsChangeListener(): void {
  if (Info.isBg) Store.onKeyChange('settings', updateSettingsBg)
  else Store.onKeyChange('settings', updateSettingsFg)
}

export function updateSettingsBg(settings?: SettingsState | null): void {
  if (!settings) return

  const prev = Settings.state
  const next = settings

  const markWindowChanged = prev.markWindow !== next.markWindow
  const markWindowPrefaceChanged = prev.markWindowPreface !== next.markWindowPreface
  const snapIntervalChanged = prev.snapInterval !== next.snapInterval
  const snapIntervalUnitChanged = prev.snapIntervalUnit !== next.snapIntervalUnit
  const colorSchemeChanged = prev.colorScheme !== next.colorScheme

  Utils.updateObject(Settings.state, settings, Settings.state)

  if (markWindowChanged) {
    for (const win of Object.values(Windows.byId)) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (!next.markWindow) {
        browser.windows.update(win.id, { titlePreface: '' })
      } else if (IPC.isConnected(InstanceType.sidebar, win.id)) {
        browser.windows.update(win.id, { titlePreface: Settings.state.markWindowPreface })
      }
    }
  } else if (markWindowPrefaceChanged) {
    const value = next.markWindowPreface
    for (const win of Object.values(Windows.byId)) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (Settings.state.markWindow && IPC.isConnected(InstanceType.sidebar, win.id)) {
        browser.windows.update(win.id, { titlePreface: value })
      }
    }
  }

  if (snapIntervalChanged || snapIntervalUnitChanged) Snapshots.scheduleSnapshots()

  if (colorSchemeChanged) Styles.updateColorScheme()
}

export function updateSettingsFg(settings?: SettingsState | null): void {
  if (!settings) return

  const prev = Settings.state
  const next = settings

  // Check what values was updated
  const hideInactTabs = prev.hideInact !== next.hideInact
  const updateSuccessions =
    prev.activateAfterClosing !== next.activateAfterClosing ||
    prev.activateAfterClosingNoDiscarded !== next.activateAfterClosingNoDiscarded
  const resetTree = prev.tabsTree !== next.tabsTree && prev.tabsTree
  const updateTree = prev.tabsTreeLimit !== next.tabsTreeLimit
  const hideFoldedTabs = prev.hideFoldedTabs !== next.hideFoldedTabs
  const hideFoldedParent = prev.hideFoldedParent !== next.hideFoldedParent
  const theme = prev.theme !== next.theme
  const highlightOpenBookmarks = prev.highlightOpenBookmarks !== next.highlightOpenBookmarks
  const colorScheme = prev.colorScheme !== next.colorScheme
  const ctxMenuCtrIgnore = prev.ctxMenuIgnoreContainers !== next.ctxMenuIgnoreContainers
  const fontSize = prev.fontSize !== next.fontSize
  const updateSidebarTitleChanged = prev.updateSidebarTitle !== next.updateSidebarTitle
  const pinnedTabsPositionChanged = prev.pinnedTabsPosition !== next.pinnedTabsPosition
  const colorizeTabsChanged = prev.colorizeTabs !== next.colorizeTabs
  const colorizeTabsSrcChanged = prev.colorizeTabsSrc !== next.colorizeTabsSrc
  const colorizeTabsBranchesChanged = prev.colorizeTabsBranches !== next.colorizeTabsBranches
  const colorizeTabsBranchesSrcChanged =
    prev.colorizeTabsBranchesSrc !== next.colorizeTabsBranchesSrc
  const tabsUpdateMarkChanged = prev.tabsUpdateMark !== next.tabsUpdateMark
  const navTabsPanelMidClickAction =
    prev.navTabsPanelMidClickAction !== next.navTabsPanelMidClickAction
  const navBookmarksPanelMidClickAction =
    prev.navBookmarksPanelMidClickAction !== next.navBookmarksPanelMidClickAction
  const tabsUrlInTooltip = prev.tabsUrlInTooltip !== next.tabsUrlInTooltip
  const newTabCtxReopen = prev.newTabCtxReopen !== next.newTabCtxReopen
  const previewTabs = prev.previewTabs !== next.previewTabs
  const previewTabsMode = prev.previewTabsMode !== next.previewTabsMode

  // Update settings of this instance
  Utils.updateObject(Settings.state, settings, Settings.state)

  if (Info.isSidebar && newTabCtxReopen) updateWebReqHandlers()

  if (tabsUrlInTooltip || previewTabs) {
    Tabs.list.forEach(t => Tabs.updateTooltip(t.id))
  }

  if (previewTabsMode) {
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

  if (updateTree && Sidebar.hasTabs) {
    Tabs.updateTabsTree()
    Sidebar.recalcVisibleTabs()
  }

  if ((hideInactTabs || hideFoldedTabs || hideFoldedParent) && Sidebar.hasTabs) {
    Tabs.updateNativeTabsVisibility()
  }

  if (highlightOpenBookmarks && Bookmarks.reactive.byId) {
    if (Settings.state.highlightOpenBookmarks) Bookmarks.markOpenBookmarksForAllTabs()
    else Bookmarks.unmarkAllOpenBookmarks()
  }

  if (theme) {
    Styles.updateColorScheme()
    if (Info.isSidebar) {
      Styles.removeCustomCSS()
      Styles.loadCustomSidebarCSS()
    }
  }
  if (ctxMenuCtrIgnore) Menu.parseContainersRules()
  if (fontSize) Sidebar.updateFontSize()

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

  Search.parseShortcuts()
}

export function resetSettings(): void {
  Utils.updateObject(Settings.state, DEFAULT_SETTINGS, DEFAULT_SETTINGS)
}

/**
 * Get available options
 */
export function getOpts<K extends keyof Opts, V extends Opts[K]>(key: K): V {
  return SETTINGS_OPTIONS[key] as V
}
