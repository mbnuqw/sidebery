import { Command } from 'src/types'
import * as KeybindingsActions from 'src/services/keybindings.actions'

export interface KBState {
  list: Command[]
}

export const Keybindings = {
  reactive: { list: [] } as KBState,
  byName: {} as Record<string, Command>,

  ...KeybindingsActions,
}
