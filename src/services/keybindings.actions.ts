import Utils from 'src/utils'
import { BKM_OTHER_ID } from 'src/defaults'
import { Command, CommandUpdateDetails, ItemBounds, Tab, Bookmark, MenuType } from 'src/types'
import { ActiveTabsHistory, InstanceType, ItemInfo, TabsPanel, SelectionType } from 'src/types'
import { ItemBoundsType } from 'src/types'
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

const VALID_SHORTCUT =
  /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/

/**
 * Load keybindings
 */
export async function loadKeybindings(): Promise<void> {
  const [commands, storage] = await Promise.all([
    browser.commands.getAll(),
    browser.storage.local.get({ disabledKeybindings: {} as Record<string, string> }),
  ])

  Keybindings.byName = {}

  for (const k of commands as Command[]) {
    if (!k.name) continue
    k.active = !storage.disabledKeybindings[k.name]
    k.error = ''
    k.focus = false
    if (typeof storage.disabledKeybindings[k.name] === 'string') {
      k.shortcut = storage.disabledKeybindings[k.name]
    }
    Keybindings.byName[k.name] = k
  }

  Keybindings.reactive.list = commands
}

/**
 * Save keybindings
 */
export async function saveKeybindings(): Promise<void> {
  const { disabledKeybindings } = await browser.storage.local.get({
    disabledKeybindings: {} as Record<string, string>,
  })
  const disabled: { [name: string]: string } = {}
  for (const k of Keybindings.reactive.list) {
    if (!k.name) continue
    if (!k.active) {
      disabled[k.name] = k.shortcut ?? ''
      browser.commands.update({ name: k.name, shortcut: '' })
    } else if (typeof disabledKeybindings[k.name] === 'string') {
      browser.commands.update({ name: k.name, shortcut: disabledKeybindings[k.name] })
    }
  }
  await Store.set({ disabledKeybindings: disabled })
}

/**
 * Reset addon's keybindings
 */
export async function resetKeybindings(): Promise<void> {
  const waitGroup = Keybindings.reactive.list.map(async k => {
    if (k.name) return browser.commands.reset(k.name)
  })

  await Promise.all(waitGroup)
  loadKeybindings()
}

/**
 * Toggle all keybindings
 */
export function toggleKeybindings(value?: boolean): void {
  if (value === undefined) {
    const first = Keybindings.reactive.list[0]
    value = !first?.active
  }

  for (const k of Keybindings.reactive.list) {
    k.active = value
  }

  saveKeybindings()
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
export async function update(index: number, details: CommandUpdateDetails): Promise<void> {
  const k = Keybindings.reactive.list[index]
  if (!k?.name) return

  Keybindings.reactive.list.splice(index, 1, { ...k, ...details })

  if (details.shortcut !== undefined) {
    await browser.commands.update({ name: k.name, shortcut: details.shortcut })
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

  let kb: Command | undefined = Keybindings.byName[name]
  if (!kb) kb = Keybindings.reactive.list.find(k => k.name === name)
  if (!kb || !kb.active) return

  if (name === 'next_panel') Sidebar.switchPanel(1)
  else if (name === 'prev_panel') Sidebar.switchPanel(-1)
  else if (name === 'new_tab_on_panel') onKeyNewTabInPanel()
  else if (name === 'new_tab_in_group') onKeyNewTabAfter()
  else if (name === 'new_tab_as_first_child') onKeyNewTabAsFirstChild()
  else if (name === 'new_tab_as_last_child') onKeyNewTabAsLastChild()
  else if (name === 'rm_tab_on_panel') onKeyRmSelectedItem()
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
  else if (name === 'fold_branch') onKeyFoldBranch()
  else if (name === 'expand_branch') onKeyExpandBranch()
  else if (name === 'fold_inact_branches') onKeyFoldInactiveBranches()
  else if (name === 'activate_prev_active_tab') onKeyActivatePrevActTab('global', -1)
  else if (name === 'activate_next_active_tab') onKeyActivatePrevActTab('global', 1)
  else if (name === 'activate_panel_prev_active_tab') onKeyActivatePrevActTab('panel', -1)
  else if (name === 'activate_panel_next_active_tab') onKeyActivatePrevActTab('panel', 1)
  else if (name === 'tabs_indent') onKeyTabsIndent()
  else if (name === 'tabs_outdent') onKeyTabsOutdent()
  else if (name === 'move_tab_to_active') onKeyMoveTabsToAct()
  else if (name === 'move_tabs_up') onKeyMoveTabs(-1)
  else if (name === 'move_tabs_down') onKeyMoveTabs(1)
  else if (name === 'create_snapshot') {
    browser.runtime.sendMessage({
      instanceType: InstanceType.bg,
      windowId: -1,
      action: 'createSnapshot',
    })
  } else if (name.startsWith('switch_to_panel_')) {
    const panel = Sidebar.reactive.panels[parseInt(name.slice(-1))]
    if (panel) Sidebar.switchToPanel(panel.id)
  } else if (name.startsWith('move_tabs_to_panel_')) onKeyMoveTabsToPanel(parseInt(name[19]))
  else if (name === 'search') {
    Search.start()
  }
}

function onKeyMoveTabsToPanel(targetIndex: number): void {
  if (isNaN(targetIndex)) return

  let index = -1
  const panel = Sidebar.reactive.panels.find(p => {
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

  Sidebar.updateBounds()

  // No selection
  if (!Selection.isSet()) {
    const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
    // Select active tab
    if (Utils.isTabsPanel(activePanel) && activePanel.tabs.length) {
      const activeTab = Tabs.list.find(t => t.active && t.panelId === activePanel.id)
      if (activeTab) Selection.selectTab(activeTab.id)
    }
  }

  // Header
  if (Selection.isHeader()) {
    const id = Selection.getFirst()
    const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
      if (target.expanded) Bookmarks.foldBookmark(target.id)
      else Bookmarks.expandBookmark(target.id)
    }

    if (target.type === 'bookmark') {
      if (Settings.reactive.activateOpenBookmarkTab && target.isOpen) {
        const tab = Tabs.list.find(t => t.url === target.url)
        if (tab) {
          browser.tabs.update(tab.id, { active: true })
          return
        }
      }

      if (target.parentId === BKM_OTHER_ID && Settings.reactive.autoRemoveOther) {
        browser.bookmarks.remove(target.id)
      }

      if (Settings.reactive.openBookmarkNewTab) {
        const panel = Sidebar.reactive.panels.find(p => Utils.isTabsPanel(p)) as TabsPanel
        const index = panel?.nextTabIndex
        browser.tabs.create({ index, url: target.url, active: true })
      } else {
        browser.tabs.update({ url: target.url })
        if (Settings.reactive.openBookmarkNewTab && !Sidebar.reactive.panels[0].lockedPanel) {
          Sidebar.goToActiveTabPanel()
        }
      }
    }
  }
}

/**
 * New tab in active panel
 */
function onKeyNewTabInPanel(): void {
  let panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel)) panel = Sidebar.reactive.panelsById[Sidebar.lastTabsPanelId]
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

  if (activeTab.parentId > -1) {
    conf.openerTabId = activeTab.parentId
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
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!activePanel?.bounds?.length) return

  const actPanelIsTabs = Utils.isTabsPanel(activePanel)
  const selIsSet = Selection.isSet()
  const selId = Selection.getFirst()

  let selIndex = -1
  if (selIsSet) {
    selIndex = activePanel.bounds.findIndex(s => s.id === selId)
  } else if (actPanelIsTabs) {
    selIndex = activePanel.bounds.findIndex(s => Tabs.byId[s.id]?.active)
    if (selIndex !== -1) selIndex -= dir
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
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
    for (const bookmarkId of Selection) {
      const bookmark = Bookmarks.reactive.byId[bookmarkId]
      if (!bookmark || !bookmark.expanded) continue
      Bookmarks.foldBookmark(bookmarkId)
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
    for (const bookmarkId of Selection) {
      const bookmark = Bookmarks.reactive.byId[bookmarkId]
      if (!bookmark || bookmark.expanded) continue
      Bookmarks.expandBookmark(bookmarkId)
    }
  }
}

function onKeyFoldInactiveBranches(): void {
  const activePanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(activePanel)) return

  Tabs.foldAllInactiveBranches(activePanel.tabs.map(rt => Tabs.byId[rt.id] as Tab) ?? [])
}

function onKeyActivatePrevActTab(scope: 'global' | 'panel' = 'global', dir: number): void {
  let history: ActiveTabsHistory | undefined
  if (scope === 'global') history = Tabs.getActiveTabsHistory()
  if (scope === 'panel') {
    const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
    if (!Utils.isTabsPanel(panel)) return
    history = Tabs.getActiveTabsHistory(panel.id)
  }

  if (!history?.actTabs?.length) return

  const offset = history.actTabOffset
  if (offset === undefined || offset < 0 || offset > history.actTabs.length) {
    history.actTabOffset = history.actTabs.length
  }

  let targetTabId, targetIdIndex, tabId
  for (let i = history.actTabOffset + dir; i >= 0 && i < history.actTabs.length; i += dir) {
    tabId = history.actTabs[i]
    if (Tabs.byId[tabId] && tabId !== Tabs.activeId) {
      targetIdIndex = i
      targetTabId = tabId
      break
    }
  }

  if (targetTabId !== undefined) {
    if (dir < 0 && targetIdIndex === history.actTabs.length - 1) {
      const actTab = Tabs.byId[Tabs.activeId]
      if (scope === 'global' || (scope === 'panel' && actTab && actTab.panelId === history.id)) {
        history.actTabs.push(Tabs.activeId)
      }
    }
    if (targetIdIndex) history.actTabOffset = targetIdIndex
    Tabs.skipActiveTabsHistoryCollecting()
    if (tabId !== undefined) browser.tabs.update(tabId, { active: true })
  }
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

    tab.parentId = parentTab.id
  }

  align.forEach(([a, b]) => (a.parentId = b.parentId))

  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
  selected.forEach(id => Tabs.saveTabData(id))
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
  }

  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
  selected.forEach(id => Tabs.saveTabData(id))
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

function onKeyMoveTabs(dir: 1 | -1): void {
  let selected
  if (Selection.isTabs()) {
    selected = Selection.get()
    Selection.preserveSelection()
  } else {
    selected = [Tabs.activeId]
  }

  const toMove = []
  for (const id of selected) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    toMove.push(tab)

    if (tab.isParent) {
      for (let t, i = tab.index + 1; i < Tabs.list.length; i++) {
        t = Tabs.list[i]
        if (t.lvl <= tab.lvl) break
        if (!selected.includes(t.id)) toMove.push(t)
      }
    }
  }

  toMove.sort((a, b) => a.index - b.index)

  const edgeTab = dir < 0 ? toMove[0] : toMove[toMove.length - 1]
  if (!edgeTab) return
  const panel = Sidebar.reactive.panelsById[edgeTab.panelId]
  if (!Utils.isTabsPanel(panel)) return
  if (dir < 0 && edgeTab.index === 0) return
  if (dir < 0 && panel?.startTabIndex === edgeTab.index) return
  if (dir > 0 && edgeTab.index === Tabs.list.length - 1) return
  if (dir > 0 && panel?.endTabIndex === edgeTab.index) return

  for (let tab, i = dir < 0 ? 0 : toMove.length - 1; i >= 0 && i < toMove.length; i -= dir) {
    tab = toMove[i]

    Tabs.list.splice(tab.index, 1)
    tab.index += dir
    Tabs.list.splice(tab.index, 0, tab)

    browser.tabs.move(tab.id, { index: tab.index })
  }

  for (let i = 0; i < Tabs.list.length; i++) {
    Tabs.list[i].index = i
  }

  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
  toMove.forEach(t => Tabs.saveTabData(t.id))

  Selection.allowSelectionReset(256)
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

/**
 * Setup keybinding listeners
 */
export function setupListeners(): void {
  browser.commands.onCommand.addListener(onCmd)
  Store.onKeyChange('disabledKeybindings', loadKeybindings)
}

/**
 * Remove keybindings listeners
 */
export function resetListeners(): void {
  browser.commands.onCommand.removeListener(onCmd)
}
