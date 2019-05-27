import Logs from '../libs/logs'

/**
 * Load keybindings
 */
async function loadKeybindings(state) {
  let commands = await browser.commands.getAll()
  state.keybindings = commands
  Logs.push('[INFO] Keybindings loaded')
}

export default {
  loadKeybindings,
}