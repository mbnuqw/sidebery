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
  let { disabledKeybindings } = await browser.storage.local.get({ disabledKeybindings: {} })
  let disabled = {}
  for (let k of this.state.keybindings) {
    if (!k.active) {
      disabled[k.name] = k.shortcut
      browser.commands.update({ name: k.name, shortcut: '' })
    } else if (typeof disabledKeybindings[k.name] === 'string') {
      browser.commands.update({ name: k.name, shortcut: disabledKeybindings[k.name] })
    }
  }
  await browser.storage.local.set({ disabledKeybindings: disabled })
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
