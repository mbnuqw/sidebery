import EventBus from '../../event-bus'
import CommonActions from '../../actions/keybindings'
import Getters from '../store/getters'
import Actions from '.'

function kb_next_panel(state) {
  Actions.switchPanel(state, 1)
}

function kb_prev_panel(state) {
  Actions.switchPanel(state, -1)
}

function kb_new_tab_on_panel(state) {
  let panel = Getters.panels[state.lastPanelIndex]
  if (panel.cookieStoreId) {
    Actions.createTab(panel.cookieStoreId)
  }
}

function kb_new_tab_in_group(state) {
  const panel = Getters.panels[state.panelIndex]
  if (!panel || !panel.tabs) return

  // Find active/selected tab
  let activeTab
  if (state.selected.length > 0) {
    activeTab = state.tabsMap[state.selected[state.selected.length - 1]]
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
      while (state.tabs[index] && state.tabs[index].lvl > activeTab.lvl) {
        index++
      }
    }
    if (parentId < 0) parentId = undefined
  }

  browser.tabs.create({
    index,
    cookieStoreId: panel.cookieStoreId,
    windowId: state.windowId,
    openerTabId: parentId,
  })
}

function kb_rm_tab_on_panel(state) {
  if (state.selected.length > 0) {
    Actions.removeTabs(state, state.selected)
  } else {
    let activeTab = state.tabs.find(t => t && t.active)
    Actions.removeTabs(state, [activeTab.id])
  }
}

function kb_activate() {
  EventBus.$emit('keyActivate')
}

function kb_reset_selection(state) {
  Actions.resetSelection(state)
  Actions.closeCtxMenu(state)
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
