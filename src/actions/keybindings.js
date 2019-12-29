/**
 * Load keybindings
 */
async function loadKeybindings() {
  let commands = await browser.commands.getAll()
  this.state.keybindings = commands
}

export default {
  loadKeybindings,
}
