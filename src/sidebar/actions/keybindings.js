import EventBus from '../../event-bus'
import CommonActions from '../../actions/keybindings'
import Actions from '.'

function kb_next_panel() {
  Actions.switchPanel(1)
}

function kb_prev_panel() {
  Actions.switchPanel(-1)
}

function kb_new_tab_on_panel() {
  let panel = this.state.panels[this.state.lastPanelIndex]
  if (panel.cookieStoreId) {
    Actions.createTab(panel.cookieStoreId)
  }
}

function kb_new_tab_in_group() {
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

function kb_rm_tab_on_panel() {
  if (this.state.selected.length > 0) {
    Actions.removeTabs(this.state.selected)
  } else {
    let activeTab = this.state.tabs.find(t => t && t.active)
    Actions.removeTabs([activeTab.id])
  }
}

function kb_activate() {
  EventBus.$emit('keyActivate')
}

function kb_reset_selection() {
  Actions.resetSelection()
  Actions.closeCtxMenu()
}

function kb_select_all() {
  EventBus.$emit('selectAll')
}

function kb_up() {
  EventBus.$emit('keyUp')
}

function kb_down() {
  EventBus.$emit('keyDown')
}

function kb_up_shift() {
  EventBus.$emit('keyUpShift')
}

function kb_down_shift() {
  EventBus.$emit('keyDownShift')
}

function kb_menu() {
  EventBus.$emit('keyMenu')
}

export default {
  ...CommonActions,

  kb_next_panel,
  kb_prev_panel,
  kb_new_tab_on_panel,
  kb_new_tab_in_group,
  kb_rm_tab_on_panel,
  kb_activate,
  kb_reset_selection,
  kb_select_all,
  kb_up,
  kb_down,
  kb_up_shift,
  kb_down_shift,
  kb_menu,
}
