import * as Utils from 'src/utils'
import * as Containers from 'src/services/containers'
import * as Settings from 'src/services/settings'
import * as Info from 'src/services/info'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as History from 'src/services/history.fg'
import * as SetupPage from 'src/services/setup-page.fg'

import * as Perm from 'src/services/permissions'
export * from 'src/services/permissions'

export function setupListeners() {
  Perm._setupListeners()

  Perm.setRemovedWebDataHandler(onRemovedWebData)

  Perm.setRemovedTabHideHandler(onRemovedTabHide)

  Perm.setAddedHistoryHandler(onAddedHistory)
  Perm.setRemovedHistoryHandler(onRemovedHistory)

  Perm.setAddedBookmarksHandler(onAddedBookmarks)
  Perm.setRemovedBookmarksHandler(onRemovedBookmarks)

  Perm.setRemovedDownloadsHandler(onRemovedDownloads)
}

export async function request(...perms: Perm.RequestablePermission[]): Promise<boolean> {
  try {
    return Perm._request(...perms)
  } catch {
    if (perms.includes('<all_urls>')) SetupPage.open('all-urls')
    else if (perms.includes('tabHide')) SetupPage.open('tab-hide')
    else if (perms.includes('history')) SetupPage.open('history')
    else if (perms.includes('bookmarks')) SetupPage.open('bookmarks')
    else if (perms.includes('clipboardWrite')) SetupPage.open('clipboard-write')
    else if (perms.includes('clipboardRead')) SetupPage.open('clipboard-read')
    else if (perms.includes('downloads')) SetupPage.open('downloads')
    return false
  }
}

function onRemovedWebData(): void {
  if (Info.isSetup) {
    for (const c of Object.values(Containers.reactive.byId)) {
      if (c.proxified) c.proxified = false
      if (c.proxy) c.proxy.type = 'direct'
      if (c.reopenRulesActive) c.reopenRulesActive = false
      if (c.userAgentActive) c.userAgentActive = false
    }

    if (Settings.state.selWinScreenshots) {
      Settings.state.selWinScreenshots = false
    }

    if (Settings.state.newTabCtxReopen) {
      Settings.state.newTabCtxReopen = false
    }
  }
}

function onRemovedTabHide(): void {
  if (Info.isSetup) {
    Settings.state.hideInact = false
    Settings.state.hideFoldedTabs = false
    Settings.state.hideUnloadedTabs = false
  }
}

function onAddedHistory(): void {
  if (Info.isSidebar) {
    if (!Sidebar.hasHistory) return

    const panel = Sidebar.panelsById.history
    if (!panel) return

    if (!panel.ready && Sidebar.activePanelId === 'history') History.load()
  }
}

function onRemovedHistory(): void {
  if (Info.isSidebar && History.ready) {
    History.unload()
  }
}

function onAddedBookmarks(): void {
  if (Info.isSidebar) {
    if (!Sidebar.hasBookmarks) return

    const panel = Sidebar.panels.find(p => Utils.isBookmarksPanel(p))
    if (!panel) return

    const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
    if (!panel.ready && Utils.isBookmarksPanel(actPanel)) Bookmarks.load()
  }
}

function onRemovedBookmarks(): void {
  if (Info.isSidebar) {
    Bookmarks.unload()
  }
}

function onRemovedDownloads() {
  if (Info.isSetup) {
    Settings.state.snapAutoExport = false
  }
}
