export default {
  /**
   * Try to load saved sidebar state
   */
  async loadState({ state }) {
    let ans = await browser.storage.local.get(['panelIndex', 'synced'])
    if (!ans) return

    if (!state.private && ans.panelIndex !== 1) {
      if (ans.panelIndex >= 0) {
        state.panelIndex = ans.panelIndex
      }
    }

    if (ans.synced) {
      state.synced = ans.synced
    }
  },

  /**
   * Save panel index
   */
  savePanelIndex({ state }) {
    if (!state.windowFocused || state.private) return
    browser.storage.local.set({ panelIndex: state.panelIndex })
  },

  /**
   * Save synced data
   */
  saveSynced({ state }) {
    if (!state.windowFocused) return
    browser.storage.local.set({ synced: JSON.parse(JSON.stringify(state.synced)) })
  },
}
