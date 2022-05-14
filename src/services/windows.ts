import { NOID } from 'src/defaults'
import { Window, WindowChooseOption } from 'src/types'
import * as WindowsActions from 'src/services/windows.actions'
import * as WindowsHandlers from 'src/services/windows.handlers'

export interface WindowsState {
  choosing: WindowChooseOption[] | null
  choosingTitle: string
}

export const Windows = {
  byId: {} as Record<ID, Window>,

  reactive: { choosing: null, choosingTitle: '' } as WindowsState,
  id: NOID,
  incognito: false,
  lastFocusedId: NOID,
  focused: false,
  lastFocused: false,
  otherWindows: [] as Window[],

  lastFocusedWinId: NOID as ID | undefined,

  ...WindowsActions,
  ...WindowsHandlers,
}
