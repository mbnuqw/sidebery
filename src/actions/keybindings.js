/**
 * Load keybindings
 */
async function loadKeybindings() {
  let [commands, storage] = await Promise.all([
    browser.commands.getAll(),
    browser.storage.local.get({ disabledKeybindings: {} }),
  ])

  this.state.kbMap = {}

  for (let k of commands) {
    k.active = !storage.disabledKeybindings[k.name]
    this.state.kbMap[k.name] = k
  }

  this.state.keybindings = commands
}

export default {
  loadKeybindings,
}
