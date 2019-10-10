import { DEFAULT_CTX_ID } from '../../defaults'
import EventBus from '../../event-bus'
import Handlers from '../handlers'

/**
 * Keybindings router
 */
function onCmd(name) {
  if (!this.state.windowFocused) return

  switch (name) {
  case 'next_panel':
    this.handlers.onKeyNextPanel()
    break
  case 'prev_panel':
    this.handlers.onKeyPrevPanel()
    break
  case 'new_tab_on_panel':
    this.handlers.onKeyNewTabInPanel()
    break
  case 'new_tab_in_group':
    this.handlers.onKeyNewTabInGroup()
    break
  case 'rm_tab_on_panel':
    this.handlers.onKeyRmSelection()
    break
  case 'activate':
    this.handlers.onKeyActivate()
    break
  case 'reset_selection':
    this.actions.resetSelection()
    this.actions.closeCtxMenu()
    break
  case 'select_all':
    this.handlers.onKeySelectAll()
    break
  case 'up':
    this.handlers.onKeySelect(-1)
    break
  case 'down':
    this.handlers.onKeySelect(1)
    break
  case 'up_shift':
    this.handlers.onKeySelectExpand(-1)
    break
  case 'down_shift':
    this.handlers.onKeySelectExpand(1)
    break
  case 'menu':
    this.handlers.onKeyMenu()
    break
  }
}

/**
 * Handle shortcut 'activate'
 */
function onKeyActivate() {
  if (this.state.panelIndex === this.state.panels.length) {
    EventBus.$emit('createTabInHiddenPanel')
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
  if (panel.cookieStoreId) {
    this.actions.createTab(panel.cookieStoreId)
  }
}

/**
 * New tab in group
 */
function onKeyNewTabInGroup() {
  const panel = this.state.panels[this.state.panelIndex]
  const tabs = this.state.tabs
  if (!panel || !panel.tabs) return

  // Find active/selected tab
  let activeTab
  if (this.state.selected.length > 0) {
    const lastIndex = this.state.selected.length - 1
    activeTab = this.state.tabsMap[this.state.selected[lastIndex]]
  } else {
    activeTab = panel.tabs.find(t => t.active)
  }

  // Get index and parentId for new tab
  let index, parentId
  if (!activeTab) {
    index = panel.tabs.length ? panel.endIndex + 1 : panel.startIndex
  } else {
    index = activeTab.index + 1
    if (activeTab.isParent && !activeTab.folded) {
      parentId = activeTab.id
    } else {
      parentId = activeTab.parentId
      while (tabs[index] && tabs[index].lvl > activeTab.lvl) {
        index++
      }
    }
    if (parentId < 0) parentId = undefined
  }

  browser.tabs.create({
    index,
    cookieStoreId: panel.cookieStoreId,
    windowId: this.state.windowId,
    openerTabId: parentId,
  })
}

/**
 * Change selection
 */
function onKeySelect(dir) {
  if (!dir) return

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
    if (this.selEndIndex >= this.state.itemSlots.length) this.selEndIndex = this.state.itemSlots.length - 1

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
    let panel, i = this.state.panelIndex
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
  onKeyNewTabInGroup,
  onKeySelect,
  onKeySelectExpand,
  onKeySelectAll,
  onKeyMenu,
  onKeyRmSelection,
  onKeyNextPanel,
  onKeyPrevPanel,
  setupKeybindingListeners,
  resetKeybindingListeners,
}