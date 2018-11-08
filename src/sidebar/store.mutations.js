import Logs from '../libs/logs'

export default {
  /**
   * Save settings to local storage
   */
  setSetting(state, keyVal) {
    state[keyVal.key] = keyVal.val
  },

  /**
   * Close context menu
   */
  closeCtxMenu(state) {
    if (state.ctxMenu) {
      Logs.D('Close context menu')
      if (state.ctxMenu.off) state.ctxMenu.off()
      state.ctxMenu = null
    }
  },
}