import Logs from '../../libs/logs'

export default {
  /**
   * Load keybindings
   */
  async loadKebindings({ state }) {
    let commands = await browser.commands.getAll()
    state.keybindings = commands
  },

  /**
   * Update keybindings
   */
  async updateKeybinding(_, { name, shortcut }) {
    Logs.D(`Update keybinding: '${name}' to '${shortcut}'`)
    try {
      await browser.commands.update({ name, shortcut })
    } catch (err) {
      Logs.E(`Cannot find command '${name}'`, err)
    }
  },

  /**
   * Reset addon's keybindings
   */
  async resetKeybindings({ state, dispatch }) {
    Logs.D('Reset keybindings')
    state.keybindings.map(async k => {
      await browser.commands.reset(k.name)
    })

    setTimeout(() => {
      dispatch('loadKebindings')
    }, 120)
  },
}
