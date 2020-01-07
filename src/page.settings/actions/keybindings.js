import CommonActions from '../../actions/keybindings'

/**
 * Update keybindings
 */
async function updateKeybinding(name, shortcut) {
  await browser.commands.update({ name, shortcut })
}

/**
 * Save keybindings
 */
async function saveKeybindings() {
  let disabledKeybindings = {}
  for (let k of this.state.keybindings) {
    if (!k.active) disabledKeybindings[k.name] = true
  }
  await browser.storage.local.set({ disabledKeybindings })
}

/**
 * Reset addon's keybindings
 */
async function resetKeybindings() {
  this.state.keybindings.map(async k => {
    await browser.commands.reset(k.name)
  })

  setTimeout(() => {
    this.actions.loadKeybindings(this.state)
  }, 120)
}

export default {
  ...CommonActions,

  updateKeybinding,
  saveKeybindings,
  resetKeybindings,
}
