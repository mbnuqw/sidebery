import * as MouseActions from 'src/services/mouse.actions'

export type ResizingMode = 'x' | 'y' | null

export const Mouse = {
  multiSelectionMode: false,
  resizing: null as ResizingMode,
  longClickApplied: false,
  mouseIn: false,

  ...MouseActions,
}
