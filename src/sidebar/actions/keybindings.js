import EventBus from '../event-bus'

export default {
  /**
   * Load keybindings
   */
  async loadKeybindings({ state }) {
    let commands = await browser.commands.getAll()
    state.keybindings = commands
  },

  /**
   * Update keybindings
   */
  async updateKeybinding(_, { name, shortcut }) {
    try {
      await browser.commands.update({ name, shortcut })
    } catch (err) {
      // ...
    }
  },

  /**
   * Reset addon's keybindings
   */
  async resetKeybindings({ state, dispatch }) {
    state.keybindings.map(async k => {
      await browser.commands.reset(k.name)
    })

    setTimeout(() => {
      dispatch('loadKeybindings')
    }, 120)
  },

  // --- Commands ---
  kb_next_panel({ dispatch }) {
    dispatch('switchPanel', 1)
  },
  kb_prev_panel({ dispatch }) {
    dispatch('switchPanel', -1)
  },
  kb_new_tab_on_panel({ state, dispatch, getters }) {
    let panel = getters.panels[state.lastPanelIndex]
    if (panel.cookieStoreId) {
      dispatch('createTab', panel.cookieStoreId)
    }
  },
  kb_new_tab_in_group({ state, getters }) {
    const panel = getters.panels[state.panelIndex]
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
  },
  kb_rm_tab_on_panel({ state, dispatch }) {
    if (state.selected.length > 0) {
      dispatch('removeTabs', state.selected)
    } else {
      let activeTab = state.tabs.find(t => t && t.active)
      dispatch('removeTabs', [activeTab.id])
    }
  },
  kb_activate() {
    EventBus.$emit('keyActivate')
  },
  kb_reset_selection({ commit }) {
    commit('resetSelection')
    commit('closeCtxMenu')
  },
  kb_select_all() {
    EventBus.$emit('selectAll')
  },
  kb_up() {
    EventBus.$emit('keyUp')
  },
  kb_down() {
    EventBus.$emit('keyDown')
  },
  kb_up_shift() {
    EventBus.$emit('keyUpShift')
  },
  kb_down_shift() {
    EventBus.$emit('keyDownShift')
  },
  kb_menu() {
    EventBus.$emit('keyMenu')
  },
}
