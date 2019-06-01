import Logs from '../logs'

/**
 * Load keybindings
 */
async function loadKeybindings() {
  let commands = await browser.commands.getAll()
  this.state.keybindings = commands
  Logs.push('[INFO] Keybindings loaded')
}

export default {
  loadKeybindings,
}
