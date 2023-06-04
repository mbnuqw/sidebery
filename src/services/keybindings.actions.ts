import * as Utils from 'src/utils'
import { NOID } from 'src/defaults'
import { Command, CommandUpdateDetails, ItemBounds, Tab, Bookmark, MenuType } from 'src/types'
import { InstanceType, ItemInfo, SelectionType, ItemBoundsType } from 'src/types'
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

const VALID_SHORTCUT =
  /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/

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
    await browser.commands.update({ name: cmd.name, shortcut: details.shortcut })

    if (Settings.state.syncSaveKeybindings) {
      Keybindings.saveKeybindingsToSync()
    }
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
  else if (name === 'activate') onKeyActivate()
  else if (name === 'reset_selection') {
    if (Windows.reactive.choosing) Windows.closeWindowsPopup()
    Selection.resetSelection()
    Menu.close()
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
  } else if (name === 'switch_to_next_tab') {
    const globaly = Settings.state.scrollThroughTabs === 'global'
    Tabs.switchTab(globaly, Settings.state.scrollThroughTabsCyclic, 1, false)
  } else if (name === 'switch_to_prev_tab') {
    const globaly = Settings.state.scrollThroughTabs === 'global'
    Tabs.switchTab(globaly, Settings.state.scrollThroughTabsCyclic, -1, false)
  } else if (name === 'duplicate_tabs') onKeyDuplicateTabs(false)
  else if (name === 'pin_tabs') onKeyPinTabs()
}

function onKeySwitchToTab(targetIndex?: number): void {
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) return

  const tabsList = [...activePanel.pinnedTabs, ...activePanel.tabs]

  let targetTab
  if (targetIndex === undefined) targetTab = tabsList[tabsList.length - 1]
  else targetTab = tabsList[targetIndex]

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

  // Close hidden panels bar
  if (Sidebar.reactive.hiddenPanelsPopup) {
    Sidebar.closeHiddenPanelsPopup()
    return
  }

  Sidebar.updateBounds()

  // No selection
  if (!Selection.isSet()) {
    const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
    // Select active tab
    if (Utils.isTabsPanel(activePanel) && activePanel.tabs.length) {
      const activeTab = Tabs.list.find(t => t.active && t.panelId === activePanel.id)
      if (activeTab) Selection.selectTab(activeTab.id)
    }
  }

  // Header
  if (Selection.isHeader()) {
    const id = Selection.getFirst()
    const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
      const isExpanded = Bookmarks.reactive.expanded[Sidebar.reactive.activePanelId]?.[target.id]
      if (isExpanded) Bookmarks.foldBookmark(target.id, Sidebar.reactive.activePanelId)
      else Bookmarks.expandBookmark(target.id, Sidebar.reactive.activePanelId)
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
  let panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
  for (let t; index < Tabs.list.length; index++) {
    t = Tabs.list[index]
    if (t.lvl <= activeTab.lvl) break
  }

  Tabs.setNewTabPosition(index, activeTab.parentId, activeTab.panelId)

  const conf: browser.tabs.CreateProperties = {
    index,
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

  Sidebar.updateBounds()
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!activePanel?.bounds?.length) return

  const actPanelIsTabs = Utils.isTabsPanel(activePanel)
  const selIsSet = Selection.isSet()
  const selId = Selection.getFirst()

  let selIndex = -1
  if (selIsSet) {
    selIndex = activePanel.bounds.findIndex(s => s.id === selId)
  } else if (actPanelIsTabs) {
    selIndex = activePanel.bounds.findIndex(s => Tabs.byId[s.id]?.active)
    if (Settings.state.selectActiveTabFirst && selIndex !== -1) selIndex -= dir
  }
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

/**
 * Expand selection to provided direction
 */
function onKeySelectExpand(dir: number): void {
  if (!dir) return
  Sidebar.updateBounds()
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!activePanel) return

  const actPanelIsTabs = Utils.isTabsPanel(activePanel)
  if (!Selection.isSet() && actPanelIsTabs) {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab && activeTab.panelId === activePanel.id) Selection.selectTab(Tabs.activeId)
  }
  if (!Selection.isSet()) return

  Sidebar.updateBounds()
  if (!activePanel.bounds || !activePanel.bounds.length) return

  const targetId = Selection.getFirst()
  const targetSlot = activePanel.bounds.find(s => s.id === targetId)
  if (!targetSlot) return

  let target: Tab | Bookmark | undefined
  const isTab = targetSlot.type === ItemBoundsType.Tab
  const isBookmark = targetSlot.type === ItemBoundsType.Bookmarks
  if (isTab) target = Tabs.byId[targetId]
  if (isBookmark) target = Bookmarks.reactive.byId[targetId]

  if (!target || !activePanel.scrollEl) return
  const offset = (activePanel.topOffset ?? 0) - activePanel.scrollEl.scrollTop
  const start = targetSlot.start + offset
  if (isTab) Menu.open(MenuType.Tabs, 16, start + 15, true)
  if (isBookmark) Menu.open(MenuType.Bookmarks, 16, start + 15, true)
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
    const activePanelId = Sidebar.reactive.activePanelId
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
    const activePanelId = Sidebar.reactive.activePanelId
    for (const bookmarkId of Selection) {
      const bookmark = Bookmarks.reactive.byId[bookmarkId]
      const isExpanded = Bookmarks.reactive.expanded[activePanelId]?.[bookmarkId]
      if (!bookmark || isExpanded) continue
      Bookmarks.expandBookmark(bookmarkId, activePanelId)
    }
  }
}

function onKeyFoldInactiveBranches(): void {
  const activePanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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

  const items: ItemInfo[] = []
  let panelId: ID | undefined
  for (const id of Selection) {
    if (Tabs.activeId === id) return

    const tab = Tabs.byId[id]
    if (!tab || tab.pinned) continue
    if (!panelId) panelId = tab.panelId

    items.push({ id: tab.id, index: tab.index, parentId: tab.parentId })
  }

  Selection.resetSelection()

  if (panelId === undefined) return

  items.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

  const src = { panelId, pinned: false, windowId: Windows.id }
  Tabs.move(items, src, { index: activeTab.index + 1, parentId: activeTab.id })
}

let tabsMoving = false
function onKeyMoveTabs(dir: 1 | -1): void {
  if (tabsMoving) return

  let selected
  if (Selection.isTabs()) {
    selected = Selection.get()
    Selection.preserveSelection()
    Selection.allowSelectionReset(300)
  } else {
    selected = [Tabs.activeId]
  }

  const toMove = []
  const toMoveById: Record<ID, Tab> = {}
  for (const id of selected) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    toMove.push(tab)
    toMoveById[tab.id] = tab

    if (tab.isParent) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (t.lvl <= tab.lvl) break
        if (!selected.includes(t.id)) {
          toMove.push(t)
          toMoveById[t.id] = t
        }
      }
    }
  }

  toMove.sort((a, b) => a.index - b.index)

  let minIndex = toMove[0].index
  let maxIndex = toMove[toMove.length - 1].index

  const edgeTab = dir < 0 ? toMove[0] : toMove[toMove.length - 1]
  if (!edgeTab) return
  const panel = Sidebar.panelsById[edgeTab.panelId]
  if (!Utils.isTabsPanel(panel)) return
  if (dir < 0 && edgeTab.index === 0) return
  if (dir < 0 && panel?.startTabIndex === edgeTab.index) return
  if (dir > 0 && edgeTab.index === Tabs.list.length - 1) return
  if (dir > 0 && panel?.endTabIndex === edgeTab.index) return

  let rootParentId = NOID
  let step: number = dir
  if (dir < 0) {
    let prevTab: Tab | undefined = Tabs.list[edgeTab.index - 1]
    if (prevTab && prevTab.panelId === edgeTab.panelId) {
      if (prevTab.invisible) {
        prevTab = Tabs.byId[prevTab.parentId]
        while (prevTab && prevTab.invisible) {
          prevTab = Tabs.byId[prevTab.parentId]
        }
        if (prevTab) step = prevTab.index - edgeTab.index
      }
      if (prevTab) rootParentId = prevTab.parentId
      minIndex += step
    }
  } else {
    const nextTab = Tabs.list[edgeTab.index + 1]
    if (nextTab && nextTab.panelId === edgeTab.panelId) {
      if (nextTab.isParent && nextTab.folded) {
        for (let tab, i = nextTab.index + 1; i < Tabs.list.length; i++) {
          tab = Tabs.list[i]
          if (!tab.invisible) break
          step++
        }
      }
      if (nextTab.isParent && !nextTab.folded) {
        rootParentId = nextTab.id
      } else {
        rootParentId = nextTab.parentId
      }
      maxIndex += step
    }
  }

  const targetIndex = edgeTab.index + step

  for (let tab, i = toMove.length - 1; i >= 0; i--) {
    tab = toMove[i]
    Tabs.list.splice(tab.index, 1)
    Tabs.movingTabs.push(tab.id)
    if (!toMoveById[tab.parentId]) tab.parentId = rootParentId
  }
  if (dir > 0) Tabs.list.splice(targetIndex - toMove.length + 1, 0, ...toMove)
  else Tabs.list.splice(targetIndex, 0, ...toMove)

  tabsMoving = true
  const toMoveIds = toMove.map(t => t.id)
  browser.tabs.move(toMoveIds, { index: targetIndex }).then(() => {
    tabsMoving = false
  })

  for (let i = minIndex; i <= maxIndex; i++) {
    Tabs.list[i].index = i
  }

  Sidebar.recalcTabsPanels()
  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
  toMove.forEach(t => Tabs.saveTabData(t.id))
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
  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab || actTab.pinned || actTab.panelId !== actPanel.id) return

  Tabs.removeTabsAbove()
}

function onKeyRBIP() {
  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(actPanel)) return

  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab || actTab.pinned || actTab.panelId !== actPanel.id) return

  Tabs.removeTabsBelow()
}

function onKeyROIP() {
  const actPanel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
  const panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
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
  const panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel)) return

  const tabIds: ID[] = []
  panel.tabs.forEach(t => t.invisible && tabIds.push(t.id))

  if (tabIds.length) Tabs.discardTabs(tabIds)
}

async function onKeyUnloadAllTabsInInactPanels() {
  const actTab = Tabs.byId[Tabs.activeId]
  if (!actTab) return

  let actPanelId = Sidebar.reactive.activePanelId
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
