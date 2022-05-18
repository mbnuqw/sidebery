import { Command } from 'src/types'
import * as KeybindingsActions from 'src/services/keybindings.actions'

export interface KBState {
  list: Command[]
  byName: Record<string, Command>
}

export const Keybindings = {
  reactive: { list: [], byName: {} } as KBState,

  ...KeybindingsActions,
}
