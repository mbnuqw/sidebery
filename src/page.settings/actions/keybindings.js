// import Logs from '../../libs/logs'
import CommonActions from '../../actions/keybindings'

/**
 * Update keybindings
 */
async function updateKeybinding(name, shortcut) {
  await browser.commands.update({ name, shortcut })
}

/**
 * Reset addon's keybindings
 */
async function resetKeybindings() {
  this.state.keybindings.map(async k => {
    await browser.commands.reset(k.name)
  })

  setTimeout(() => {
    CommonActions.loadKeybindings(this.state)
  }, 120)
}

export default {
  ...CommonActions,

  updateKeybinding,
  resetKeybindings,
}
