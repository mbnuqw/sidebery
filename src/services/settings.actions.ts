import * as Utils from 'src/utils'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from 'src/defaults'
import { SettingsState, Stored, InstanceType, CopyTemplate } from 'src/types'
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
import { Logs, Sync } from './_services'
import { Notifications } from './notifications'
import { translate } from 'src/dict'

type Opts = typeof SETTINGS_OPTIONS
export async function loadSettings(): Promise<void> {
  Logs.info('Settings.loadSettings()')

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

  parsePrefaceTemplate()

  if (Info.isSidebar) {
    parseCopyTemplates()
  }

  Search.parseShortcuts()

  updPrecalcSettings()
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
    Settings.saveSettings()
  }, delay)
}

export function setupSettingsChangeListener(): void {
  if (Info.isBg) Store.onKeyChange('settings', updateSettingsBg)
  else Store.onKeyChange('settings', updateSettingsFg)
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
    title: translate('sync.success.import_settings_success'),
    ctrl: translate('notif.undo_ctrl'),
    callback: () => importSettings(prevSettings),
  })
}

export async function importSettings(settings: SettingsState) {
  Logs.info('Settings.importSettings: settings:', settings)

  await Store.set({ settings: settings })

  if (Info.isBg) Settings.updateSettingsBg(settings)
  else Settings.updateSettingsFg(settings)
}

export function updateSettingsBg(settings?: SettingsState | null): void {
  if (!settings) return

  Logs.info('Settings.updateSettingsBg()')

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
        IPC.sendToSidebar(win.id, 'updWindowPreface', next.markWindowPreface)
      }
    }
  } else if (markWindowPrefaceChanged) {
    for (const win of Object.values(Windows.byId)) {
      if (win.type !== 'normal' || win.id === undefined) continue
      if (Settings.state.markWindow && IPC.isConnected(InstanceType.sidebar, win.id)) {
        IPC.sendToSidebar(win.id, 'updWindowPreface', Settings.state.markWindowPreface)
      }
    }
  }

  if (snapIntervalChanged || snapIntervalUnitChanged) Snapshots.scheduleSnapshots()

  if (colorSchemeChanged) Styles.updateColorScheme()

  updPrecalcSettings()
}

export function updateSettingsFg(settings?: SettingsState | null): void {
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
  const updateTree = prev.tabsTreeLimit !== next.tabsTreeLimit
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
  const tabsUpdateMarkChanged = prev.tabsUpdateMark !== next.tabsUpdateMark
  const navTabsPanelMidClickAction =
    prev.navTabsPanelMidClickAction !== next.navTabsPanelMidClickAction
  const navBookmarksPanelMidClickAction =
    prev.navBookmarksPanelMidClickAction !== next.navBookmarksPanelMidClickAction
  const newTabCtxReopen = prev.newTabCtxReopen !== next.newTabCtxReopen
  const previewTabs = prev.previewTabs !== next.previewTabs
  const previewTabsMode = prev.previewTabsMode !== next.previewTabsMode
  const markWindowPreface = prev.markWindowPreface !== next.markWindowPreface
  const tabsUnreadMark = prev.tabsUnreadMark !== next.tabsUnreadMark
  const copyTemplates = prev.copyTemplates !== next.copyTemplates

  // Update settings of this instance
  Utils.updateObject(Settings.state, settings, Settings.state)

  updPrecalcSettings()

  if (Info.isSidebar && newTabCtxReopen) updateWebReqHandlers()

  if (Info.isSidebar && tabsUnreadMark && !next.tabsUnreadMark) {
    Tabs.list.forEach(t => (t.reactive.unread = t.unread = false))
  }

  if (previewTabs || previewTabsMode) {
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

  if (
    (hideInactTabs || hideFoldedTabs || hideFoldedParent || hideUnloadedTabs) &&
    Sidebar.hasTabs
  ) {
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

  if (markWindowPreface) parsePrefaceTemplate()

  if (Info.isSidebar && copyTemplates) parseCopyTemplates()

  Search.parseShortcuts()
}

function updPrecalcSettings() {
  Settings.rmChildTabsFolded = Settings.state.rmChildTabs === 'folded'
  Settings.rmChildTabsAll = Settings.state.rmChildTabs === 'all'
  Settings.rmChildTabsNone = Settings.state.rmChildTabs === 'none'

  Settings.activateAfterClosingNone = Settings.state.activateAfterClosing === 'none'
  Settings.activateAfterClosingNext = Settings.state.activateAfterClosing === 'next'
  Settings.activateAfterClosingPrev = Settings.state.activateAfterClosing === 'prev'
  Settings.activateAfterClosingPrevAct = Settings.state.activateAfterClosing === 'prev_act'

  Settings.tabsUpdateMarkAll = Settings.state.tabsUpdateMark === 'all'
  Settings.tabsUpdateMarkPin = Settings.state.tabsUpdateMark === 'pin'
  Settings.tabsUpdateMarkNorm = Settings.state.tabsUpdateMark === 'norm'
  Settings.tabsUpdateMarkNone = Settings.state.tabsUpdateMark === 'none'
}

export function resetSettings(): void {
  Utils.updateObject(Settings.state, DEFAULT_SETTINGS, DEFAULT_SETTINGS)
  updPrecalcSettings()
}

/**
 * Get available options
 */
export function getOpts<K extends keyof Opts, V extends Opts[K]>(key: K): V {
  return SETTINGS_OPTIONS[key] as V
}

function parsePrefaceTemplate() {
  const preface = Settings.state.markWindowPreface
  Settings.updateWinPrefaceOnPanelSwitch = preface.includes('%PN')
}

const COPY_TEMPLATE_RE = /^(?<name>.+):(?<template>.+)$/
function parseCopyTemplates() {
  const templates: CopyTemplate[] = []

  if (Settings.state.copyTemplates) {
    const rawLines = Settings.state.copyTemplates.split('\n')
    for (const rawLine of rawLines) {
      const line = rawLine.trim()
      if (!line) continue

      const result = COPY_TEMPLATE_RE.exec(line)
      if (!result?.groups) continue

      const name = result.groups['name']
      const template = result.groups['template']
      if (!name || !template) continue

      templates.push({
        name,
        str: template,
        hasCT: template.includes('%CT'),
        hasT: template.includes('%T'),
        hasU: template.includes('%U'),
        hasB: template.includes('%B'),
      })
    }
  }

  Settings.copyTemplates = templates
}
