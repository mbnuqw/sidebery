import { DEFAULT_CTX_ID } from '../../../addon/defaults'
import EventBus from '../../event-bus'
import Handlers from '../handlers'

/**
 * Keybindings router
 */
function onCmd(name) {
  if (!this.state.windowFocused) return

  let kb = this.state.kbMap[name]
  if (!kb) kb = this.state.keybindings.find(k => k.name === name)
  if (!kb || !kb.active) return

  if (name === 'next_panel') this.handlers.onKeyNextPanel()
  else if (name === 'prev_panel') this.handlers.onKeyPrevPanel()
  else if (name === 'new_tab_on_panel') this.handlers.onKeyNewTabInPanel()
  else if (name === 'new_tab_in_group') this.handlers.onKeyNewTabAfter()
  else if (name === 'new_tab_as_first_child') this.handlers.onKeyNewTabAsFirstChild()
  else if (name === 'new_tab_as_last_child') this.handlers.onKeyNewTabAsLastChild()
  else if (name === 'rm_tab_on_panel') this.handlers.onKeyRmSelection()
  else if (name === 'activate') this.handlers.onKeyActivate()
  else if (name === 'reset_selection') {
    this.actions.resetSelection()
    this.actions.closeCtxMenu()
  } else if (name === 'select_all') this.handlers.onKeySelectAll()
  else if (name === 'up') this.handlers.onKeySelect(-1)
  else if (name === 'down') this.handlers.onKeySelect(1)
  else if (name === 'up_shift') this.handlers.onKeySelectExpand(-1)
  else if (name === 'down_shift') this.handlers.onKeySelectExpand(1)
  else if (name === 'menu') this.handlers.onKeyMenu()
  else if (name === 'fold_branch') this.handlers.onKeyFoldBranch()
  else if (name === 'expand_branch') this.handlers.onKeyExpandBranch()
  else if (name === 'fold_inact_branches') this.handlers.onKeyFoldInactiveBranches()
  else if (name === 'activate_prev_active_tab') this.handlers.onKeyActivatePrevActTab('state', -1)
  else if (name === 'activate_next_active_tab') this.handlers.onKeyActivatePrevActTab('state', 1)
  else if (name === 'activate_panel_prev_active_tab') {
    this.handlers.onKeyActivatePrevActTab('panel', -1)
  } else if (name === 'activate_panel_next_active_tab') {
    this.handlers.onKeyActivatePrevActTab('panel', 1)
  } else if (name === 'move_tab_to_active') this.handlers.onKeyMoveTabsToAct()
  else if (name === 'tabs_indent') this.handlers.onKeyTabsIndent()
  else if (name === 'tabs_outdent') this.handlers.onKeyTabsOutdent()
  else if (name === 'move_tabs_up') this.handlers.onKeyMoveTabsUp()
  else if (name === 'move_tabs_down') this.handlers.onKeyMoveTabsDown()
  else if (name === 'create_snapshot') {
    browser.runtime.sendMessage({ instanceType: 'bg', windowId: -1, action: 'createSnapshot' })
  } else if (name.startsWith('switch_to_panel_')) {
    let index = parseInt(name.slice(-1))
    if (isNaN(index) || index >= this.state.panels.length) return
    this.actions.switchToPanel(parseInt(name.slice(-1)))
  }
}

/**
 * Handle shortcut 'activate'
 */
function onKeyActivate() {
  if (this.state.panelIndex === -5) {
    this.eventBus.$emit('chooseWindow')
    return
  }

  if (this.state.panelIndex === this.state.panels.length) {
    this.eventBus.$emit('createTabInHiddenPanel')
    return
  }

  if (this.state.ctxMenu) {
    this.eventBus.$emit('activateOption')
    return
  }

  this.eventBus.$emit('updatePanelBounds')

  // Get type
  if (!this.state.itemSlots || !this.state.itemSlots.length) return
  const type = this.state.itemSlots[0].type

  // Get target
  let targetId
  if (!this.state.selected || !this.state.selected.length) {
    if (type !== 'tab') return

    const activePanel = this.state.panels[this.state.panelIndex]
    if (!activePanel || !activePanel.tabs) return
    const activeTab = activePanel.tabs.find(t => t.active)
    if (!activeTab) return

    targetId = activeTab.id
  } else {
    targetId = this.state.selected[0]
  }

  if (type === 'tab') {
    const tab = this.state.tabsMap[targetId]
    if (!tab) return
    if (tab.active) {
      this.actions.resetSelection()
      if (tab.isParent) this.actions.toggleBranch(tab.id)
    }
    browser.tabs.update(targetId, { active: true })
  }

  if (type === 'bookmark') {
    const target = this.state.bookmarksMap[targetId]
    if (!target) return

    if (target.type === 'folder') {
      if (target.expanded) this.actions.foldBookmark(target.id)
      else this.actions.expandBookmark(target.id)
    }

    if (target.type === 'bookmark') {
      if (this.state.activateOpenBookmarkTab && target.isOpen) {
        let tab = this.state.tabs.find(t => t.url === target.url)
        if (tab) {
          browser.tabs.update(tab.id, { active: true })
          return
        }
      }

      if (target.parentId === 'unfiled_____' && this.state.autoRemoveOther) {
        browser.bookmarks.remove(target.id)
      }

      if (this.state.openBookmarkNewTab) {
        let index = this.state.panelsMap[DEFAULT_CTX_ID].endIndex + 1
        browser.tabs.create({ index, url: target.url, active: true })
      } else {
        browser.tabs.update({ url: target.url })
        if (this.state.openBookmarkNewTab && !this.state.panels[0].lockedPanel) {
          this.actions.goToActiveTabPanel()
        }
      }
    }
  }
}

/**
 * New tab in active panel
 */
function onKeyNewTabInPanel() {
  let panel = this.state.panels[this.state.lastPanelIndex]
  if (!panel) return
  this.actions.createTabInPanel(panel)
}

/**
 * New tab after active
 */
function onKeyNewTabAfter() {
  let activeTab = this.state.tabs.find(t => t.active)
  if (!activeTab) return

  let index = activeTab.index + 1
  for (let t; index < this.state.tabs.length; index++) {
    t = this.state.tabs[index]
    if (t.lvl <= activeTab.lvl) break
  }

  this.actions.setNewTabPosition(index, activeTab.parentId, activeTab.panelId)

  let conf = {
    index,
    cookieStoreId: activeTab.cookieStoreId,
    windowId: this.state.windowId,
  }

  if (activeTab.parentId > -1) {
    conf.openerTabId = activeTab.parentId
  }

  browser.tabs.create(conf)
}

/**
 * Change selection
 */
function onKeySelect(dir) {
  if (!dir) return

  if (this.state.panelIndex === -5) {
    this.eventBus.$emit('selectWindow', dir)
    return
  }

  if (this.state.ctxMenu) {
    this.eventBus.$emit('selectOption', dir)
    return
  }

  this.eventBus.$emit('updatePanelBounds')
  if (!this.state.itemSlots || !this.state.itemSlots.length) return

  let target

  // Change current selection
  if (this.state.selected.length) {
    const selId = this.state.selected[0]
    const selIndex = this.state.itemSlots.findIndex(s => s.id === selId)
    target = this.state.itemSlots[selIndex + dir]
    if (target) {
      this.actions.resetSelection()
      this.actions.selectItem(target.id)
    }
  }

  // No selected items -> select first/last
  if (!this.state.selected.length) {
    const panel = this.state.panels[this.state.panelIndex]
    let activeTab, activeSlot
    if (panel && panel.tabs) activeTab = panel.tabs.find(t => t.active)
    if (activeTab) activeSlot = this.state.itemSlots.find(s => s.id === activeTab.id)
    // From start / end
    if (dir > 0) {
      target = activeSlot ? activeSlot : this.state.itemSlots[0]
      this.actions.selectItem(target.id)
    } else {
      target = activeSlot ? activeSlot : this.state.itemSlots[this.state.itemSlots.length - 1]
      this.actions.selectItem(target.id)
    }
  }

  // Update scroll position
  if (target) {
    const h = this.state.panelScrollEl.offsetHeight
    const s = this.state.panelScrollEl.scrollTop
    if (target.start < s + 64) {
      this.state.panelScrollEl.scrollTop = target.start - 64
    }
    if (target.end > h + s - 64) {
      this.state.panelScrollEl.scrollTop = target.end - h + 64
    }
  }
}

/**
 * Expand selection to provided direction
 */
function onKeySelectExpand(dir) {
  if (!dir) return
  this.eventBus.$emit('updatePanelBounds')
  if (!this.state.itemSlots || !this.state.itemSlots.length) return

  let target

  // No selected items -> select first/last
  if (!this.state.selected.length) {
    // From start / end
    if (dir > 0) {
      target = this.state.itemSlots[0]
      this.actions.selectItem(target.id)
    } else {
      target = this.state.itemSlots[this.state.itemSlots.length - 1]
      this.actions.selectItem(target.id)
    }
  }

  // Change current selection
  if (this.state.selected.length) {
    if (this.state.selected.length === 1) {
      const selId = this.state.selected[0]
      let index = this.state.itemSlots.findIndex(t => t.id === selId)
      this.selStartIndex = index
      this.selEndIndex = index + dir
    } else {
      this.selEndIndex = this.selEndIndex + dir
    }
    if (this.selEndIndex < 0) this.selEndIndex = 0
    if (this.selEndIndex >= this.state.itemSlots.length) {
      this.selEndIndex = this.state.itemSlots.length - 1
    }

    let minIndex = Math.min(this.selStartIndex, this.selEndIndex)
    let maxIndex = Math.max(this.selStartIndex, this.selEndIndex)

    const all = []
    for (let i = minIndex; i <= maxIndex; i++) {
      const id = this.state.itemSlots[i].id
      if (!this.state.selected.includes(id)) {
        this.actions.selectItem(id)
        target = this.state.itemSlots[i]
      }
      all.push(id)
    }

    const toDeselect = this.state.selected.filter(id => !all.includes(id))
    toDeselect.forEach(id => this.actions.deselectItem(id))
  }

  // Update scroll position
  if (target) {
    const h = this.state.panelScrollEl.offsetHeight
    const s = this.state.panelScrollEl.scrollTop
    if (target.start < s + 64) {
      this.state.panelScrollEl.scrollTop = target.start - 64
    }
    if (target.end > h + s - 64) {
      this.state.panelScrollEl.scrollTop = target.end - h + 64
    }
  }
}

/**
 * Select all items on current panel
 */
function onKeySelectAll() {
  this.eventBus.$emit('updatePanelBounds')
  if (!this.state.itemSlots || !this.state.itemSlots.length) return

  this.actions.resetSelection()
  for (let s of this.state.itemSlots) {
    this.actions.selectItem(s.id)
  }
}

/**
 * Open context menu
 */
function onKeyMenu() {
  this.eventBus.$emit('updatePanelBounds')
  if (!this.state.itemSlots || !this.state.itemSlots.length) return
  if (!this.state.selected || !this.state.selected.length) return

  // Tabs or Bookmarks?
  const type = typeof this.state.selected[0] === 'number' ? 'tab' : 'bookmark'
  const targetId = this.state.selected[0]
  const targetSlot = this.state.itemSlots.find(s => s.id === targetId)
  let target
  if (type === 'tab') target = this.state.tabsMap[targetId]
  if (type === 'bookmark') target = this.state.bookmarksMap[targetId]

  if (!target) return
  const offset = this.state.panelTopOffset - this.state.panelScrollEl.scrollTop
  const start = targetSlot.start + offset
  this.actions.openCtxMenu(type, 16, start + 15)
}

/**
 * Handler removing selected items or active tab
 */
function onKeyRmSelection() {
  let selected = [...this.state.selected]
  if (selected.length > 0) {
    this.actions.resetSelection()
    if (typeof selected[0] === 'number') this.actions.removeTabs(selected)
    else if (typeof selected[0] === 'string') this.actions.removeBookmarks(selected)
  } else {
    let activeTab = this.state.tabs.find(t => t && t.active)
    this.actions.removeTabs([activeTab.id])
  }
}

/**
 * Switch panel to the next
 */
function onKeyNextPanel() {
  if (this.state.hideEmptyPanels) {
    // Check next panel
    let panel
    let i = this.state.panelIndex
    if (this.state.panelIndex < this.state.panels.length) {
      for (i = this.state.panelIndex + 1; i < this.state.panels.length; i++) {
        panel = this.state.panels[i]
        if (!panel.inactive) break
      }
    }

    // If current panel is the last open hidden panels dashboard
    if (i === this.state.panels.length) {
      let hiddenPanels = this.state.panels.filter(b => !b.bookmarks && b.inactive)
      if (!hiddenPanels.length) return

      this.state.panelIndex = i
      this.state.hiddenPanelsBar = true
      EventBus.$emit('selectHiddenPanel', 1)
      return
    }
  }

  this.actions.switchPanel(1)
}

/**
 * Switch panel to the prev
 */
function onKeyPrevPanel() {
  if (this.state.hideEmptyPanels) {
    if (this.state.panelIndex === this.state.panels.length) {
      EventBus.$emit('selectHiddenPanel', -1)
      return
    }
  }

  this.actions.switchPanel(-1)
}

function onKeyFoldBranch() {
  let selected = [...this.state.selected]
  if (this.state.selected.length) selected = [...this.state.selected]
  else selected = [this.state.activeTabId]

  let firstItem = selected[0]
  if (typeof firstItem === 'number') {
    for (let tabId of selected) {
      let tab = this.state.tabsMap[tabId]
      if (!tab || !tab.isParent || tab.folded) continue
      this.actions.foldTabsBranch(tabId)
    }
  }
  if (typeof firstItem === 'string') {
    for (let bookmarkId of selected) {
      let bookmark = this.state.bookmarksMap[bookmarkId]
      if (!bookmark || !bookmark.expanded) continue
      this.actions.foldBookmark(bookmarkId)
    }
  }
}

function onKeyExpandBranch() {
  let selected = [...this.state.selected]
  if (this.state.selected.length) selected = [...this.state.selected]
  else selected = [this.state.activeTabId]

  let firstItem = selected[0]
  if (typeof firstItem === 'number') {
    for (let tabId of selected) {
      let tab = this.state.tabsMap[tabId]
      if (!tab || !tab.isParent || !tab.folded) continue
      this.actions.expTabsBranch(tabId)
    }
  }
  if (typeof firstItem === 'string') {
    for (let bookmarkId of selected) {
      let bookmark = this.state.bookmarksMap[bookmarkId]
      if (!bookmark || bookmark.expanded) continue
      this.actions.expandBookmark(bookmarkId)
    }
  }
}

function onKeyFoldInactiveBranches() {
  let activePanel = this.state.panels[this.state.panelIndex]
  if (!activePanel || !activePanel.tabs) return

  this.actions.foldAllInactiveBranches(activePanel.tabs)
}

function onKeyActivatePrevActTab(scope = 'state', dir) {
  let box
  if (scope === 'state') box = this.state
  if (scope === 'panel') box = this.state.panels[this.state.panelIndex]

  if (!box || !box.actTabs || !box.actTabs.length) return

  if (
    box.actTabOffset === undefined ||
    box.actTabOffset < 0 ||
    box.actTabOffset > box.actTabs.length
  ) {
    box.actTabOffset = box.actTabs.length
  }

  let targetTabId, targetIdIndex, tabId
  for (let i = box.actTabOffset + dir; i >= 0 && i < box.actTabs.length; i += dir) {
    tabId = box.actTabs[i]
    if (this.state.tabsMap[tabId] && tabId !== this.state.activeTabId) {
      targetIdIndex = i
      targetTabId = tabId
      break
    }
  }

  if (targetTabId !== undefined) {
    if (dir < 0 && targetIdIndex === box.actTabs.length - 1) {
      let actTab = this.state.tabsMap[this.state.activeTabId]
      if (scope === 'state' || (scope === 'panel' && actTab && actTab.panelId === box.id)) {
        box.actTabs.push(this.state.activeTabId)
      }
    }
    box.actTabOffset = targetIdIndex
    this.state.skipActTabsCollecting = true
    browser.tabs.update(tabId, { active: true })
  }
}

function onKeyMoveTabsToAct() {
  if (!this.state.selected.length) return
  if (typeof this.state.selected[0] !== 'number') return

  let meh
  let tabs = this.state.selected
    .map(id => {
      if (id === this.state.activeTabId) meh = true
      let tab = this.state.tabsMap[id]
      return {
        ...Utils.cloneObject(tab),
        type: 'tab',
        ctx: tab.cookieStoreId,
        windowId: this.state.windowId,
        panel: this.state.panelIndex,
        incognito: this.state.private,
      }
    })
    .sort((a, b) => a.index - b.index)
  if (meh) return

  let activeTab = this.state.tabsMap[this.state.activeTabId]
  if (!activeTab || activeTab.pinned) return

  this.actions.dropToTabs({}, activeTab.index + 1, activeTab.id, tabs, false)
}

function onKeyTabsIndent() {
  let selected
  if (this.state.selected.length) selected = [...this.state.selected]
  else selected = [this.state.activeTabId]

  if (!this.state.tabsMap[selected[0]]) return

  selected.sort((a, b) => {
    return this.state.tabsMap[a].index - this.state.tabsMap[b].index
  })

  let align = []

  for (let id of selected) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue

    let parentTab
    for (let t, i = tab.index; i--; ) {
      t = this.state.tabs[i]
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

  this.actions.updateTabsTree()
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    selected.forEach(id => this.actions.saveTabData(id))
  }
}

function onKeyTabsOutdent() {
  let selected
  if (this.state.selected.length) selected = [...this.state.selected]
  else selected = [this.state.activeTabId]

  if (!this.state.tabsMap[selected[0]]) return

  selected.sort((a, b) => {
    return this.state.tabsMap[a].index - this.state.tabsMap[b].index
  })

  for (let id of selected) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue
    if (tab.parentId === -1) continue

    let parentTab
    for (let t, i = tab.index; i--; ) {
      t = this.state.tabs[i]
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

  this.actions.updateTabsTree()
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    selected.forEach(id => this.actions.saveTabData(id))
  }
}

function onKeyMoveTabsUp() {
  let selected = [...this.state.selected]
  if (this.state.selected.length) {
    selected = [...this.state.selected]
    this._preserveSelection = true
  } else {
    selected = [this.state.activeTabId]
  }

  let toMove = []

  for (let id of selected) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue

    toMove.push(tab)

    if (tab.isParent) {
      for (let t, i = tab.index + 1; i < this.state.tabs.length; i++) {
        t = this.state.tabs[i]
        if (t.lvl <= tab.lvl) break
        if (!selected.includes(t.id)) toMove.push(t)
      }
    }
  }

  toMove = toMove.sort((a, b) => a.index - b.index)

  let firstTab = toMove[0]
  if (firstTab.index === 0) return
  let panel = this.state.panelsMap[firstTab.panelId]
  if (panel && panel.startIndex === firstTab.index) return

  for (let tab of toMove) {
    if (panel) panel.tabs.splice(tab.index - panel.startIndex, 1)
    this.state.tabs.splice(tab.index, 1)
    tab.index--
    this.state.tabs.splice(tab.index, 0, tab)
    if (panel) panel.tabs.splice(tab.index - panel.startIndex, 0, tab)

    browser.tabs.move(tab.id, { index: tab.index })
  }

  for (let i = 0; i < this.state.tabs.length; i++) {
    this.state.tabs[i].index = i
  }

  this.actions.updateTabsTree()
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    toMove.forEach(t => this.actions.saveTabData(t))
  }

  if (this._preserveSelectionTimeout) {
    clearTimeout(this._preserveSelectionTimeout)
  }
  this._preserveSelectionTimeout = setTimeout(() => {
    this._preserveSelectionTimeout = null
    this._preserveSelection = false
  }, 256)
}

function onKeyMoveTabsDown() {
  let selected = [...this.state.selected]
  if (this.state.selected.length) {
    selected = [...this.state.selected]
    this._preserveSelection = true
  } else {
    selected = [this.state.activeTabId]
  }

  let toMove = []

  for (let id of selected) {
    let tab = this.state.tabsMap[id]
    if (!tab) continue

    toMove.push(tab)

    if (tab.isParent) {
      for (let t, i = tab.index + 1; i < this.state.tabs.length; i++) {
        t = this.state.tabs[i]
        if (t.lvl <= tab.lvl) break
        if (!selected.includes(t.id)) toMove.push(t)
      }
    }
  }

  toMove = toMove.sort((a, b) => a.index - b.index)

  let lastTab = toMove[toMove.length - 1]
  if (lastTab.index === this.state.tabs.length) return
  let panel = this.state.panelsMap[lastTab.panelId]
  if (panel && panel.endIndex === lastTab.index) return

  for (let tab, i = toMove.length; i--; ) {
    tab = toMove[i]

    if (panel) panel.tabs.splice(tab.index - panel.startIndex, 1)
    this.state.tabs.splice(tab.index, 1)
    tab.index++
    this.state.tabs.splice(tab.index, 0, tab)
    if (panel) panel.tabs.splice(tab.index - panel.startIndex, 0, tab)

    browser.tabs.move(tab.id, { index: tab.index })
  }

  for (let i = 0; i < this.state.tabs.length; i++) {
    this.state.tabs[i].index = i
  }

  this.actions.updateTabsTree()
  if (this.state.stateStorage === 'global') this.actions.saveTabsData()
  if (this.state.stateStorage === 'session') {
    toMove.forEach(t => this.actions.saveTabData(t))
  }

  if (this._preserveSelectionTimeout) {
    clearTimeout(this._preserveSelectionTimeout)
  }
  this._preserveSelectionTimeout = setTimeout(() => {
    this._preserveSelectionTimeout = null
    this._preserveSelection = false
  }, 256)
}

function onKeyNewTabAsFirstChild() {
  let activeTab = this.state.tabs.find(t => t.active)
  if (!activeTab) return

  this.actions.setNewTabPosition(activeTab.index + 1, activeTab.id, activeTab.panelId)
  browser.tabs.create({
    index: activeTab.index + 1,
    cookieStoreId: activeTab.cookieStoreId,
    windowId: this.state.windowId,
    openerTabId: activeTab.id,
  })
}

function onKeyNewTabAsLastChild() {
  let activeTab = this.state.tabs.find(t => t.active)
  if (!activeTab) return

  let index = activeTab.index + 1
  for (let t; index < this.state.tabs.length; index++) {
    t = this.state.tabs[index]
    if (t.lvl <= activeTab.lvl) break
  }

  this.actions.setNewTabPosition(activeTab.index + 1, activeTab.id, activeTab.panelId)
  browser.tabs.create({
    index,
    cookieStoreId: activeTab.cookieStoreId,
    windowId: this.state.windowId,
    openerTabId: activeTab.id,
  })
}

/**
 * Setup keybinding listeners
 */
function setupKeybindingListeners() {
  browser.commands.onCommand.addListener(Handlers.onCmd)
}

/**
 * Remove keybindings listeners
 */
function resetKeybindingListeners() {
  browser.commands.onCommand.removeListener(Handlers.onCmd)
}

export default {
  onCmd,
  onKeyActivate,
  onKeyNewTabInPanel,
  onKeyNewTabAfter,
  onKeySelect,
  onKeySelectExpand,
  onKeySelectAll,
  onKeyMenu,
  onKeyRmSelection,
  onKeyNextPanel,
  onKeyPrevPanel,
  onKeyFoldBranch,
  onKeyExpandBranch,
  onKeyFoldInactiveBranches,
  onKeyActivatePrevActTab,
  onKeyMoveTabsToAct,
  onKeyTabsIndent,
  onKeyTabsOutdent,
  onKeyMoveTabsUp,
  onKeyMoveTabsDown,
  onKeyNewTabAsFirstChild,
  onKeyNewTabAsLastChild,
  setupKeybindingListeners,
  resetKeybindingListeners,
}
