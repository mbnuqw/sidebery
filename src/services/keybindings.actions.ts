import * as Utils from 'src/utils'
import { NOID } from 'src/defaults'
import { Command, CommandUpdateDetails, ItemBounds, Tab, Bookmark, MenuType } from 'src/types'
import { InstanceType, ItemInfo, SelectionType, ItemBoundsType, TabsPanel } from 'src/types'
import { DstPlaceInfo, SrcPlaceInfo } from 'src/types'
import { Keybindings } from 'src/services/keybindings'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { Search } from 'src/services/search'
import { Store } from 'src/services/storage'
import { SwitchingTabScope } from './tabs.fg.actions'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { SetupPage } from './setup-page'

const VALID_SHORTCUT =
  /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt|Ctrl|Command|MacCtrl)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt|Ctrl|Command|MacCtrl)\+)?(F\d\d?)$/

/**
 * Load keybindings
 */
export async function loadKeybindings(): Promise<void> {
  const commands = await browser.commands.getAll()
  Keybindings.reactive.byName = {}

  for (const k of commands as Command[]) {
    if (!k.name) continue
    k.error = ''
    k.focus = false
    Keybindings.reactive.byName[k.name] = k
  }

  Keybindings.reactive.list = commands
}

export async function saveKeybindingsToSync(): Promise<void> {
  const keybindings: { [name: string]: string } = {}

  Keybindings.reactive.list.map(cmd => {
    if (cmd.name && cmd.shortcut) keybindings[cmd.name] = cmd.shortcut
  })

  await Store.sync('kb', { keybindings })
}
export const saveKeybindingsToSyncDebounced = Utils.debounce(saveKeybindingsToSync)

/**
 * Reset addon's keybindings
 */
export async function resetKeybindings(): Promise<void> {
  const waitGroup = Keybindings.reactive.list.map(async k => {
    if (k.name) return browser.commands.reset(k.name)
  })

  await Promise.all(waitGroup)
  await loadKeybindings()

  if (Settings.state.syncSaveKeybindings) {
    Keybindings.saveKeybindingsToSync()
  }
}

/**
 * Validate shortcut
 */
export function checkShortcut(shortcut: string): 'valid' | 'duplicate' | 'invalid' {
  const duplicate = Keybindings.reactive.list.find(k => k.shortcut === shortcut)
  const valid = VALID_SHORTCUT.test(shortcut)
  if (duplicate) return 'duplicate'
  else if (!valid) return 'invalid'
  else return 'valid'
}

/**
 * Update keybinding
 */
export async function update(cmd: Command, details: CommandUpdateDetails): Promise<void> {
  Object.assign(cmd, details)

  if (details.shortcut !== undefined && cmd.name) {
    if (Settings.state.syncSaveKeybindings) {
      Keybindings.saveKeybindingsToSyncDebounced(150)
    }

    await browser.commands.update({ name: cmd.name, shortcut: details.shortcut })
  }
}

/**
 * Reset errors
 */
export function resetErrors(): void {
  Keybindings.reactive.list.forEach(k => {
    if (k.error) k.error = ''
  })
}

/**
 * Keybindings router
 */
function onCmd(name: string): void {
  if (!Windows.focused) return

  let kb: Command | undefined = Keybindings.reactive.byName[name]
  if (!kb) kb = Keybindings.reactive.list.find(k => k.name === name)
  if (!kb) return

  if (name === 'next_panel') Sidebar.switchPanel(1, false, true)
  else if (name === 'prev_panel') Sidebar.switchPanel(-1, false, true)
  else if (name === 'new_tab_on_panel') onKeyNewTabInPanel()
  else if (name === 'new_tab_in_group') onKeyNewTabAfter()
  else if (name === 'new_tab_as_first_child') onKeyNewTabAsFirstChild()
  else if (name === 'new_tab_as_last_child') onKeyNewTabAsLastChild()
  else if (name === 'rm_tab_on_panel') onKeyRmSelectedItem()
  else if (name === 'rm_tabs_above_in_panel') onKeyRAIP()
  else if (name === 'rm_tabs_below_in_panel') onKeyRBIP()
  else if (name === 'rm_tabs_other_in_panel') onKeyROIP()
  else if (name === 'sel_next_panel') Sidebar.selectPanel(1)
  else if (name === 'sel_prev_panel') Sidebar.selectPanel(-1)
  else if (name === 'activate') onKeyActivate()
  else if (name === 'reset_selection') {
    if (Windows.reactive.choosing) Windows.closeWindowsPopup()
    Selection.resetSelection()
    Menu.close()
    if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
  } else if (name === 'select_all') onKeySelectAll()
  else if (name === 'up') onKeySelect(-1)
  else if (name === 'down') onKeySelect(1)
  else if (name === 'up_shift') onKeySelectExpand(-1)
  else if (name === 'down_shift') onKeySelectExpand(1)
  else if (name === 'menu') onKeyMenu()
  else if (name === 'unload_tabs') onKeyUnloadTabs()
  else if (name === 'unload_all_tabs_in_panel') onKeyUnloadAllTabsInPanel()
  else if (name === 'unload_other_tabs_in_panel') onKeyUnloadOtherTabsInPanel()
  else if (name === 'unload_folded_tabs_in_panel') onKeyUnloadFoldedTabsInPanel()
  else if (name === 'unload_all_tabs_in_inact_panels') onKeyUnloadAllTabsInInactPanels()
  else if (name === 'fold_branch') onKeyFoldBranch()
  else if (name === 'expand_branch') onKeyExpandBranch()
  else if (name === 'fold_inact_branches') onKeyFoldInactiveBranches()
  else if (name === 'activate_prev_active_tab_c') Tabs.tabFlip()
  else if (name === 'activate_prev_active_tab') {
    Tabs.switchToRecentlyActiveTab(SwitchingTabScope.global, -1)
  } else if (name === 'activate_next_active_tab') {
    Tabs.switchToRecentlyActiveTab(SwitchingTabScope.global, 1)
  } else if (name === 'activate_panel_prev_active_tab') {
    Tabs.switchToRecentlyActiveTab(SwitchingTabScope.panel, -1)
  } else if (name === 'activate_panel_next_active_tab') {
    Tabs.switchToRecentlyActiveTab(SwitchingTabScope.panel, 1)
  } else if (name === 'tabs_indent') onKeyTabsIndent()
  else if (name === 'tabs_outdent') onKeyTabsOutdent()
  else if (name === 'move_tab_to_active') onKeyMoveTabsToAct()
  else if (name === 'move_tabs_up') onKeyMoveTabs(-1)
  else if (name === 'move_tabs_down') onKeyMoveTabs(1)
  else if (name === 'create_snapshot') {
    IPC.broadcast({ dstType: InstanceType.bg, action: 'createSnapshot' })
  } else if (name === 'open_snap_viewer') {
    SetupPage.open('snapshots')
  } else if (name.startsWith('switch_to_panel_')) {
    const panel = Sidebar.panels[parseInt(name.slice(-1))]
    if (panel) Sidebar.switchToPanel(panel.id)
  } else if (name === 'move_tabs_to_panel_start') onKeyMoveTabsInPanel('start', true)
  else if (name === 'move_tabs_to_panel_end') onKeyMoveTabsInPanel('end', true)
  else if (name.startsWith('move_tabs_to_panel_')) onKeyMoveTabsToPanel(parseInt(name[19]))
  else if (name === 'search') {
    Search.start()
  } else if (name === 'switch_to_parent_tab') {
    Tabs.activateParent(Selection.get()[0])
  } else if (name === 'switch_to_last_tab') {
    onKeySwitchToTab()
  } else if (name.startsWith('switch_to_tab_')) {
    const index = parseInt(name.slice(-1))
    if (!isNaN(index)) onKeySwitchToTab(index)
  } else if (name.startsWith('switch_to_unpinned_tab_')) {
    const index = parseInt(name.slice(-1))
    if (!isNaN(index)) onKeySwitchToTab(index, { unpinned: true })
  } else if (name === 'switch_to_next_tab') {
    const globaly = Settings.state.scrollThroughTabs === 'global'
    Tabs.switchTab(globaly, Settings.state.scrollThroughTabsCyclic, 1, false)
  } else if (name === 'switch_to_prev_tab') {
    const globaly = Settings.state.scrollThroughTabs === 'global'
    Tabs.switchTab(globaly, Settings.state.scrollThroughTabsCyclic, -1, false)
  } else if (name === 'scroll_to_active_panel_top') {
    onKeyScrollToTopBottom(-1)
  } else if (name === 'scroll_to_active_panel_bottom') {
    onKeyScrollToTopBottom(1)
  } else if (name === 'duplicate_tabs') onKeyDuplicateTabs(false)
  else if (name === 'pin_tabs') onKeyPinTabs()
  else if (name === 'hide_act_panel') Sidebar.hidePanel(Sidebar.activePanelId)
}

function onKeyScrollToTopBottom(dir: 1 | -1) {
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!activePanel) return

  Sidebar.scrollActivePanel(dir > 0 ? 99999999 : 0)
}

interface SwitchToTab {
  visible?: boolean
  unpinned?: boolean
}

function onKeySwitchToTab(targetIndex?: number, conf?: SwitchToTab): void {
  const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  let normTabs
  if (conf?.visible) normTabs = actPanel.reactive.visibleTabIds.map(id => Tabs.byId[id])
  else normTabs = actPanel.tabs

  let tabsList
  if (conf?.unpinned) tabsList = [...normTabs]
  else tabsList = [...actPanel.pinnedTabs, ...normTabs]
  if (!tabsList.length) return

  let targetTab
  if (targetIndex === undefined) targetTab = tabsList[tabsList.length - 1]
  else targetTab = tabsList[targetIndex]
  if (!targetTab) return

  if (targetTab.id !== Tabs.activeId) browser.tabs.update(targetTab.id, { active: true })
  else if (Settings.state.tabsSecondClickActPrev) Tabs.tabFlip()
}

function onKeyMoveTabsToPanel(targetIndex: number): void {
  if (isNaN(targetIndex)) return

  let index = -1
  const panel = Sidebar.panels.find(p => {
    if (Utils.isTabsPanel(p)) index++
    return index === targetIndex
  })
  if (!Utils.isTabsPanel(panel)) return

  const targetTabIds = Selection.isTabs() ? Selection.get() : [Tabs.activeId]
  Tabs.sortTabIds(targetTabIds)
  const probeTab = Tabs.byId[targetTabIds[0]]
  if (probeTab && probeTab.panelId !== panel.id) {
    const items = Tabs.getTabsInfo(targetTabIds)
    const src = { windowId: Windows.id, panelId: probeTab.panelId, pinned: probeTab.pinned }
    Tabs.move(items, src, { panelId: panel.id, index: panel.nextTabIndex })
  }
}

/**
 * Handle shortcut 'activate'
 */
function onKeyActivate(): void {
  if (Windows.reactive.choosing) {
    Windows.activateSelectedWindow()
    return
  }

  if (Menu.isOpen) {
    Menu.activateOption()
    return
  }

  // Switch to selected panel
  if (Sidebar.panelsById[Selection.getFirst()]) {
    const panelId = Selection.getFirst()
    if (Sidebar.reactive.hiddenPanelsPopup) Sidebar.reactive.hiddenPanelsPopup = false
    Sidebar.switchToPanel(panelId, false, false)
    return
  }

  // Close hidden panels bar
  if (Sidebar.reactive.hiddenPanelsPopup) {
    Sidebar.closeHiddenPanelsPopup()
    return
  }

  Sidebar.updateBounds()

  // No selection
  if (!Selection.isSet()) {
    const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
    // Select active tab
    if (Utils.isTabsPanel(activePanel) && activePanel.tabs.length) {
      const activeTab = Tabs.list.find(t => t.active && t.panelId === activePanel.id)
      if (activeTab) Selection.selectTab(activeTab.id)
    }
  }

  // Header
  if (Selection.isHeader()) {
    const id = Selection.getFirst()
    const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
    if (Utils.isBookmarksPanel(activePanel) && activePanel.component) {
      activePanel.component.toggleGroupById(id)
    }
  }

  // Tabs
  else if (Selection.isTabs()) {
    const tabId = Selection.getFirst()
    const tab = Tabs.byId[tabId]
    if (!tab) return
    if (tab.active) {
      Selection.resetSelection()
      if (tab.isParent) Tabs.toggleBranch(tab.id)
    }
    browser.tabs.update(tabId, { active: true })
  }

  // Bookmarks
  else if (Selection.isBookmarks()) {
    const targetId = Selection.getFirst()
    const target = Bookmarks.reactive.byId[targetId]
    if (!target) return

    if (target.type === 'folder') {
      const isExpanded = Bookmarks.reactive.expanded[Sidebar.activePanelId]?.[target.id]
      if (isExpanded) Bookmarks.foldBookmark(target.id, Sidebar.activePanelId)
      else Bookmarks.expandBookmark(target.id, Sidebar.activePanelId)
    }

    if (target.type === 'bookmark') {
      if (Settings.state.activateOpenBookmarkTab && target.isOpen) {
        const tab = Tabs.list.find(t => t.url === target.url)
        if (tab) {
          browser.tabs.update(tab.id, { active: true })
          return
        }
      }

      const { dst, useActiveTab, activateFirstTab } = Bookmarks.getMouseOpeningConf(0)
      Bookmarks.open([targetId], dst, useActiveTab, activateFirstTab)
    }
  }
}

/**
 * New tab in active panel
 */
function onKeyNewTabInPanel(): void {
  let panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel)) panel = Sidebar.panelsById[Sidebar.lastTabsPanelId]
  if (!Utils.isTabsPanel(panel)) return
  Tabs.createTabInPanel(panel)
}

/**
 * New tab after active
 */
function onKeyNewTabAfter(): void {
  const activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  let index = activeTab.index + 1
  if (!activeTab.pinned) {
    for (let t; index < Tabs.list.length; index++) {
      t = Tabs.list[index]
      if (t.lvl <= activeTab.lvl) break
    }
  }

  Tabs.setNewTabPosition(index, activeTab.parentId, activeTab.panelId)

  const conf: browser.tabs.CreateProperties = {
    index,
    pinned: activeTab.pinned,
    cookieStoreId: activeTab.cookieStoreId,
    windowId: Windows.id,
  }

  browser.tabs.create(conf)
}

/**
 * Change selection
 */
function onKeySelect(dir: number): void {
  if (!dir) return

  if (Windows.reactive.choosing) {
    Windows.selectWindow(dir)
    return
  }

  if (Menu.isOpen) {
    Menu.selectOption(dir)
    return
  }

  if (Search.rawValue) {
    if (dir > 0) Search.next()
    else Search.prev()
    return
  }

  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]

  if (Utils.isTabsPanel(activePanel)) {
    let tabs
    if (Settings.state.pinnedTabsPosition === 'panel') {
      tabs = [...activePanel.pinnedTabs, ...activePanel.tabs]
    } else {
      tabs = [...Tabs.pinned, ...activePanel.tabs]
    }
    if (!tabs.length) return

    const selIsSet = Selection.isSet()
    let target: Tab | undefined

    if (Settings.state.selectActiveTabFirst && !selIsSet) {
      target = Tabs.byId[Tabs.activeId]
      const wrongPanel =
        target &&
        (!target.pinned || Settings.state.pinnedTabsPosition === 'panel') &&
        target.panelId !== activePanel.id

      if (!target || wrongPanel) {
        target = dir > 0 ? tabs[0] : tabs.findLast(t => !t.invisible)
      }
    } else {
      let afterSel = false
      const tabFinder = (tab: Tab) => {
        if (tab.invisible) return false
        if (afterSel) return true
        if ((selIsSet && tab.sel) || (!selIsSet && tab.active)) afterSel = true
      }
      target = dir > 0 ? tabs.find(tabFinder) : tabs.findLast(tabFinder)
    }

    if (!target) {
      if (dir > 0) target = tabs.findLast(t => !t.invisible)
      else target = tabs[0]
      if (!target) return
    }

    Selection.resetSelection()
    Selection.selectTab(target.id)

    Tabs.scrollToTab(target.id, true)
  } else {
    Sidebar.updateBounds()
    if (!activePanel?.bounds?.length) return

    const selIsSet = Selection.isSet()
    const selId = Selection.getFirst()

    let selIndex = -1
    if (selIsSet) selIndex = activePanel.bounds.findIndex(s => s.id === selId)
    if (selIndex === -1 && dir < 0) selIndex = activePanel.bounds.length

    const target = activePanel.bounds[selIndex + dir]
    if (target) {
      Selection.resetSelection()
      if (target.type === ItemBoundsType.Header) Selection.select(target.id, SelectionType.Header)
      else Selection.select(target.id)
    }

    // Update scroll position
    if (target && activePanel.scrollEl) {
      const h = activePanel.scrollEl.offsetHeight ?? 0
      const s = activePanel.scrollEl.scrollTop ?? 0
      if (target.start < s + 64) Sidebar.scrollActivePanel(target.start - 64)
      if (target.end > h + s - 64) Sidebar.scrollActivePanel(target.end - h + 64)
    }
  }
}

/**
 * Expand selection to provided direction
 */
function onKeySelectExpand(dir: number): void {
  if (!dir) return
  Sidebar.updateBounds()
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!activePanel) return
  if (!activePanel.bounds?.length) return

  let target: ItemBounds | undefined

  // No selected items -> select first/last
  if (!Selection.isSet()) {
    // From start / end
    if (dir > 0) {
      target = activePanel.bounds[0]
      Selection.select(target.id)
    } else {
      target = activePanel.bounds[activePanel.bounds.length - 1]
      Selection.select(target.id)
    }
  }

  // Change current selection
  if (Selection.isSet()) {
    const lastId = Selection.getLast()
    const index = activePanel.bounds.findIndex(b => b.id === lastId)
    target = activePanel.bounds[index + dir]

    if (target) {
      if (Selection.isTabs()) {
        const nextTab = Tabs.byId[target.id]
        if (nextTab) Selection.selectTabsRange(nextTab)
      } else if (Selection.isBookmarks()) {
        const nextBookmark = Bookmarks.reactive.byId[target.id]
        if (nextBookmark) Selection.selectBookmarksRange(nextBookmark)
      }
    }
  }

  // Update scroll position
  if (target && activePanel.scrollEl) {
    activePanel.scrollEl
    const h = activePanel.scrollEl.offsetHeight
    const s = activePanel.scrollEl.scrollTop
    if (target.start < s + 64) activePanel.scrollEl.scrollTop = target.start - 64
    if (target.end > h + s - 64) activePanel.scrollEl.scrollTop = target.end - h + 64
  }
}

/**
 * Select all items on current panel
 */
function onKeySelectAll(): void {
  Sidebar.updateBounds()
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!activePanel) return
  if (!activePanel.bounds || !activePanel.bounds.length) return

  Selection.resetSelection()
  for (const s of activePanel.bounds) {
    Selection.select(s.id)
  }
}

/**
 * Open context menu
 */
function onKeyMenu(): void {
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!activePanel) return

  const activeTab = Tabs.byId[Tabs.activeId]
  const actPanelIsTabs = Utils.isTabsPanel(activePanel)
  const pinnedGlobally = activeTab?.pinned && Settings.state.pinnedTabsPosition !== 'panel'
  if (!Selection.isSet() && activeTab) {
    const panelIsOk = actPanelIsTabs && activeTab.panelId === activePanel.id
    if (pinnedGlobally || panelIsOk) Selection.selectTab(Tabs.activeId)
  }
  if (!Selection.isSet()) return

  let targetEl: HTMLElement | undefined | null
  let targetType: MenuType
  const targetId = Selection.getFirst()
  // Tabs
  if (Selection.isTabs()) {
    targetEl = document.getElementById(`tab${targetId}`)
    targetType = MenuType.Tabs
  }
  // Bookmarks
  else if (Selection.isBookmarks()) {
    const actPanelId = Sidebar.activePanelId
    targetEl = document.getElementById(`bookmark${actPanelId}${targetId}`)
    targetType = MenuType.Bookmarks
  }
  // Nav item
  else if (Selection.isNavItem()) {
    const panel = Sidebar.panelsById[targetId]
    if (Utils.isTabsPanel(panel)) targetType = MenuType.TabsPanel
    else if (Utils.isBookmarksPanel(panel)) targetType = MenuType.BookmarksPanel
    else if (Utils.isHistoryPanel(panel)) targetType = MenuType.Panel
    else return

    targetEl = document.getElementById(`nav${targetId}`)
  }
  // Unsuported targets
  else {
    return
  }

  if (!targetEl) return

  const br = targetEl.getBoundingClientRect()
  Menu.open(targetType, br.left + 1, br.bottom + 1, true)
}

/**
 * Handler removing selected items or active tab
 */
function onKeyRmSelectedItem(): void {
  if (Selection.isSet()) {
    if (Selection.isTabs()) {
      Tabs.removeTabs(Selection.get())
    } else if (Selection.isBookmarks()) {
      Bookmarks.removeBookmarks(Selection.get())
    }
    Selection.resetSelection()
  } else {
    const activeTab = Tabs.list.find(t => t && t.active)
    if (activeTab) Tabs.removeTabs([activeTab.id])
  }
}

function onKeyFoldBranch(): void {
  if (!Selection.isSet()) {
    Tabs.foldTabsBranch(Tabs.activeId)
  } else if (Selection.isTabs()) {
    for (const tabId of Selection) {
      const tab = Tabs.byId[tabId]
      if (!tab || !tab.isParent || tab.folded) continue
      Tabs.foldTabsBranch(tabId)
    }
  } else if (Selection.isBookmarks()) {
    const activePanelId = Sidebar.activePanelId
    for (const bookmarkId of Selection) {
      const bookmark = Bookmarks.reactive.byId[bookmarkId]
      const isExpanded = Bookmarks.reactive.expanded[activePanelId]?.[bookmarkId]
      if (!bookmark || !isExpanded) continue
      Bookmarks.foldBookmark(bookmarkId, activePanelId)
    }
  }
}

function onKeyExpandBranch(): void {
  if (!Selection.isSet()) {
    Tabs.expTabsBranch(Tabs.activeId)
  } else if (Selection.isTabs()) {
    for (const tabId of Selection) {
      const tab = Tabs.byId[tabId]
      if (!tab || !tab.isParent || !tab.folded) continue
      Tabs.expTabsBranch(tabId)
    }
  } else if (Selection.isBookmarks()) {
    const activePanelId = Sidebar.activePanelId
    for (const bookmarkId of Selection) {
      const bookmark = Bookmarks.reactive.byId[bookmarkId]
      const isExpanded = Bookmarks.reactive.expanded[activePanelId]?.[bookmarkId]
      if (!bookmark || isExpanded) continue
      Bookmarks.expandBookmark(bookmarkId, activePanelId)
    }
  }
}

function onKeyFoldInactiveBranches(): void {
  const activePanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) return

  Tabs.foldAllInactiveBranches(activePanel.tabs.map(rt => Tabs.byId[rt.id] as Tab) ?? [])
}

function onKeyTabsIndent(): void {
  let selected: ID[]
  if (Selection.isTabs()) selected = Selection.get()
  else selected = [Tabs.activeId]

  if (!Tabs.byId[selected[0]]) return

  selected.sort((a, b) => {
    const at = Tabs.byId[a]
    const bt = Tabs.byId[b]
    if (!at || !bt) return 0
    return at.index - bt.index
  })

  const align: [Tab, Tab][] = []
  const toExpand: ID[] = []
  const toColorize: ID[] = []

  for (const id of selected) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    let parentTab
    for (let t, i = tab.index; i--; ) {
      t = Tabs.list[i]
      if (!t || t.panelId !== tab.panelId) continue
      if (t.lvl < tab.lvl) break
      if (t.lvl === tab.lvl) {
        parentTab = t
        break
      }
    }
    if (!parentTab) continue
    if (selected.includes(parentTab.id)) {
      align.push([tab, parentTab])
      continue
    }

    if (parentTab.folded) toExpand.push(parentTab.id)
    if (parentTab.lvl === 0) toColorize.push(parentTab.id)

    tab.parentId = parentTab.id
  }

  align.forEach(([a, b]) => (a.parentId = b.parentId))
  toExpand.forEach(id => Tabs.expTabsBranch(id))

  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
  selected.forEach(id => Tabs.saveTabData(id))

  toColorize.forEach(id => Tabs.colorizeBranch(id))
}

function onKeyTabsOutdent(): void {
  let selected: ID[]
  if (Selection.isTabs()) selected = Selection.get()
  else selected = [Tabs.activeId]

  if (!Tabs.byId[selected[0]]) return

  selected.sort((a, b) => {
    const at = Tabs.byId[a]
    const bt = Tabs.byId[b]
    if (!at || !bt) return 0
    return at.index - bt.index
  })

  const toColorize: ID[] = []

  for (const id of selected) {
    const tab = Tabs.byId[id]
    if (!tab) continue
    if (tab.parentId === -1) continue

    let parentTab
    for (let t, i = tab.index; i--; ) {
      t = Tabs.list[i]
      if (!t) continue
      if (t.lvl < tab.lvl) {
        parentTab = t
        break
      }
    }
    if (!parentTab) continue
    if (selected.includes(parentTab.id)) continue

    tab.parentId = parentTab.parentId

    if (tab.parentId === NOID) toColorize.push(tab.id)
  }

  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
  selected.forEach(id => Tabs.saveTabData(id))

  toColorize.forEach(id => Tabs.colorizeBranch(id))
}

function onKeyMoveTabsToAct(): void {
  if (!Selection.isTabs()) return

  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab || activeTab.pinned) return

  const items = Selection.getTabsInfo(true)
  const firstItem = items[0]
  if (!firstItem) return

  const panelId = firstItem.panelId ?? NOID
  if (!Utils.isTabsPanel(Sidebar.panelsById[panelId])) return

  Selection.resetSelection()

  const src = { panelId, pinned: false, windowId: Windows.id }
  Tabs.move(items, src, { index: activeTab.index + 1, parentId: activeTab.id, panelId })
}

let tabsMoving = false
async function onKeyMoveTabs(dir: 1 | -1) {
  if (tabsMoving) return

  let preSelected: ID[] | undefined
  if (Selection.isTabs()) preSelected = Selection.get()
  else preSelected = [Tabs.activeId]

  const toMove: Tab[] = []
  const toMoveById: Record<ID, Tab> = {}
  let tabsPinned: boolean | undefined
  for (const id of preSelected) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    // Ignore mixed pinned/unpinned tabs
    if (tabsPinned === undefined) tabsPinned = tab.pinned
    else if (tabsPinned !== tab.pinned) return

    toMove.push(tab)
    toMoveById[tab.id] = tab

    if (tab.isParent) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (t.lvl <= tab.lvl) break
        if (!preSelected.includes(t.id)) {
          toMove.push(t)
          toMoveById[t.id] = t
        }
      }
    }
  }

  toMove.sort((a, b) => a.index - b.index)
  const toMoveIds = toMove.map(t => t.id)

  // Update selection
  Selection.resetSelection(true)
  Selection.selectTabs(toMoveIds)
  Selection.preserveSelection()
  Selection.allowSelectionReset(300)

  const firstTab = toMove[0]
  if (!firstTab) return

  const edgeTab = dir < 0 ? firstTab : toMove[toMove.length - 1]
  if (!edgeTab) return

  let panel = Sidebar.panelsById[edgeTab.panelId]
  let unpin = false
  let pin = false
  if (!Utils.isTabsPanel(panel)) return
  if (dir < 0 && edgeTab.pinned && edgeTab.index === panel.startTabIndex) return
  if (dir < 0 && !edgeTab.pinned && edgeTab.index === panel.startTabIndex) pin = true
  if (dir > 0 && edgeTab.pinned) {
    let list: Tab[] | undefined
    if (Settings.state.pinnedTabsPosition === 'panel') list = panel.pinnedTabs
    else list = Tabs.pinned
    if (!list?.length) return
    if (edgeTab.id === list[list.length - 1]?.id) unpin = true
  }

  let rootParentId = NOID
  let targetIndex
  if (firstTab.pinned) {
    let list: Tab[] | undefined
    if (Settings.state.pinnedTabsPosition === 'panel') list = panel.pinnedTabs
    else list = Tabs.pinned

    const index = list.findLastIndex(t => t.id === edgeTab.id)
    if (index === -1) return

    if (unpin) {
      // Find target panel for unpinned global tab
      if (Settings.state.pinnedTabsPosition !== 'panel') {
        const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
        if (Utils.isTabsPanel(actPanel)) panel = actPanel
        else panel = (Sidebar.panels.find(Utils.isTabsPanel) as TabsPanel | undefined) ?? panel
      }

      targetIndex = panel.startTabIndex
    } else if (dir < 0) {
      const prevTab = list.findLast(t => t.index < edgeTab.index)
      if (!prevTab) return
      targetIndex = prevTab.index
    } else {
      const nextTab = list.find(t => t.index > edgeTab.index)
      if (!nextTab) return
      targetIndex = nextTab.index + 1
    }
  } else {
    if (pin) {
      let lastPinned: Tab | undefined
      if (Settings.state.pinnedTabsPosition === 'panel') {
        lastPinned = panel.pinnedTabs[panel.pinnedTabs.length - 1]
      } else {
        lastPinned = Tabs.pinned[Tabs.pinned.length - 1]
      }
      if (lastPinned) targetIndex = lastPinned.index + 1
      else targetIndex = 0
    } else if (dir < 0) {
      const prevTab = panel.tabs.findLast(t => t.index < firstTab.index && !t.invisible)
      if (!prevTab) return
      targetIndex = prevTab.index
      rootParentId = prevTab.parentId
      // Increase tree lvl (only change parentId)
      if (rootParentId !== firstTab.parentId && prevTab.lvl > firstTab.lvl) {
        const rootParent = panel.tabs.findLast(t => {
          return t.index < firstTab.index && !t.invisible && t.lvl === firstTab.lvl + 1
        })
        if (rootParent) rootParentId = rootParent.parentId
        targetIndex = firstTab.index
      }
    } else {
      const fIndex = firstTab.index
      const nextTab = panel.tabs.find(t => t.index > fIndex && !toMoveById[t.id] && !t.invisible)

      if (nextTab) {
        if (nextTab.isParent && nextTab.folded) {
          const branchLen = Tabs.getBranchLen(nextTab.id) ?? 0
          targetIndex = nextTab.index + 1 + branchLen
        } else {
          targetIndex = nextTab.index + 1
        }

        if (nextTab.isParent && !nextTab.folded) rootParentId = nextTab.id
        else rootParentId = nextTab.parentId
        // Decrease tree lvl (only change parentId)
        if (rootParentId !== firstTab.parentId && nextTab.lvl < firstTab.lvl) {
          const rootParent = panel.tabs.findLast(t => {
            return (
              t.index < firstTab.index &&
              !toMoveById[t.id] &&
              !t.invisible &&
              t.lvl === firstTab.lvl - 1
            )
          })
          if (rootParent) rootParentId = rootParent.parentId
          targetIndex = firstTab.index
        }
      } else {
        // Decrease tree lvl (only change parentId)
        if (firstTab.lvl > 0) {
          const rootParent = panel.tabs.findLast(t => {
            return (
              t.index < firstTab.index &&
              !toMoveById[t.id] &&
              !t.invisible &&
              t.lvl === firstTab.lvl - 1
            )
          })
          if (rootParent) rootParentId = rootParent.parentId
          targetIndex = firstTab.index
        } else {
          return
        }
      }
    }
  }

  // Move tabs
  // ---
  tabsMoving = true

  const dst: DstPlaceInfo = { index: targetIndex, parentId: rootParentId, panelId: panel.id }

  if (pin) dst.pinned = true
  else if (unpin) dst.pinned = false
  else dst.pinned = edgeTab.pinned

  await Tabs.move(toMove, {}, dst).catch(err => {
    Logs.err('KB.onKeyMoveTabs: Cannot move tabs', err)
  })

  tabsMoving = false
}

function onKeyNewTabAsFirstChild(): void {
  const activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  Tabs.setNewTabPosition(activeTab.index + 1, activeTab.id, activeTab.panelId)
  browser.tabs.create({
    index: activeTab.index + 1,
    cookieStoreId: activeTab.cookieStoreId,
    windowId: Windows.id,
    openerTabId: activeTab.id,
  })
}

function onKeyNewTabAsLastChild(): void {
  const activeTab = Tabs.list.find(t => t.active)
  if (!activeTab) return

  let index = activeTab.index + 1
  for (let t; index < Tabs.list.length; index++) {
    t = Tabs.list[index]
    if (t.lvl <= activeTab.lvl) break
  }

  Tabs.setNewTabPosition(activeTab.index + 1, activeTab.id, activeTab.panelId)
  browser.tabs.create({
    index,
    cookieStoreId: activeTab.cookieStoreId,
    windowId: Windows.id,
    openerTabId: activeTab.id,
  })
}

function onKeyRAIP() {
  const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab || actTab.pinned || actTab.panelId !== actPanel.id) return

  Tabs.removeTabsAbove()
}

function onKeyRBIP() {
  const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab || actTab.pinned || actTab.panelId !== actPanel.id) return

  Tabs.removeTabsBelow()
}

function onKeyROIP() {
  const actPanel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab || actTab.pinned || actTab.panelId !== actPanel.id) return

  Tabs.removeOtherTabs()
}

function onKeyUnloadTabs() {
  const ids = Selection.isTabs() ? Selection.get() : [Tabs.activeId]
  if (ids.length) Tabs.discardTabs(ids)
}

function onKeyUnloadAllTabsInPanel() {
  const panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel)) return

  const tabIds: ID[] = []
  panel.pinnedTabs.forEach(t => tabIds.push(t.id))
  panel.tabs.forEach(t => tabIds.push(t.id))

  if (tabIds.length) Tabs.discardTabs(tabIds)
}

function onKeyUnloadOtherTabsInPanel() {
  const ids = Selection.isTabs() ? Selection.get() : [Tabs.activeId]
  if (!ids.length) return

  const firstTab = Tabs.byId[ids[0]]
  if (!firstTab) return

  const panelOfFirstTab = Sidebar.panelsById[firstTab.panelId]
  if (!Utils.isTabsPanel(panelOfFirstTab)) return

  const tabIds: ID[] = []
  panelOfFirstTab.pinnedTabs.forEach(t => !ids.includes(t.id) && tabIds.push(t.id))
  panelOfFirstTab.tabs.forEach(t => !ids.includes(t.id) && tabIds.push(t.id))

  if (tabIds.length) Tabs.discardTabs(tabIds)
}

function onKeyUnloadFoldedTabsInPanel() {
  const panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel)) return

  const tabIds: ID[] = []
  panel.tabs.forEach(t => t.invisible && tabIds.push(t.id))

  if (tabIds.length) Tabs.discardTabs(tabIds)
}

async function onKeyUnloadAllTabsInInactPanels() {
  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab) return

  let actPanelId = Sidebar.activePanelId
  const actPanel = Sidebar.panelsById[actPanelId]

  if (!Utils.isTabsPanel(actPanel)) {
    actPanelId = actTab.panelId
  } else if (actTab.panelId !== actPanelId) {
    await Tabs.activateLastActiveTabOf(actPanelId)
  }

  const tabIds: ID[] = []

  for (const panel of Sidebar.panels) {
    if (!Utils.isTabsPanel(panel)) continue
    if (panel.id === actPanelId) continue

    panel.pinnedTabs.forEach(t => tabIds.push(t.id))
    panel.tabs.forEach(t => tabIds.push(t.id))
  }

  if (tabIds.length) Tabs.discardTabs(tabIds)
}

function onKeyMoveTabsInPanel(place: 'start' | 'end', branch: boolean) {
  const ids = Selection.isTabs() ? Selection.get() : [Tabs.activeId]
  if (!ids.length) return

  Tabs.sortTabIds(ids)

  const firstTab = Tabs.byId[ids[0]]
  if (!firstTab || firstTab.pinned) return

  const panel = Sidebar.panelsById[firstTab.panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (branch && ids.length === 1) {
    ids.push(...Tabs.getBranch(firstTab, false).map(t => t.id))
  }

  const items = Tabs.getTabsInfo(ids)
  const src: SrcPlaceInfo = {}
  const dst: DstPlaceInfo = { panelId: panel.id }

  if (place === 'start') dst.index = panel.startTabIndex
  else if (place === 'end') dst.index = panel.nextTabIndex

  Tabs.move(items, src, dst)
}

function onKeyDuplicateTabs(branch: boolean) {
  const ids = Selection.isTabs() ? Selection.get() : [Tabs.activeId]
  if (!ids.length) return

  const firstTab = Tabs.byId[ids[0]]
  if (!firstTab || firstTab.pinned) return

  if (branch && ids.length === 1) {
    ids.push(...Tabs.getBranch(firstTab, false).map(t => t.id))
  }

  Tabs.duplicateTabs(ids)
}

function onKeyPinTabs() {
  const ids = Selection.isTabs() ? Selection.get() : [Tabs.activeId]
  if (!ids.length) return

  const firstTab = Tabs.byId[ids[0]]
  if (!firstTab) return

  if (firstTab.pinned) Tabs.unpinTabs(ids)
  else Tabs.pinTabs(ids)
}

/**
 * Setup keybinding listeners
 */
export function setupListeners(): void {
  browser.commands.onCommand.addListener(onCmd)
}

/**
 * Remove keybindings listeners
 */
export function resetListeners(): void {
  browser.commands.onCommand.removeListener(onCmd)
}
