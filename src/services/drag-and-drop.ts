import { NOID } from 'src/defaults'
import { DragItem, DragType, DropType } from 'src/types'
import * as DndActions from 'src/services/drag-and-drop.actions'

export const enum DndPointerMode {
  None = 0,
  Between = 1,
  Inside = 2,
}

export const DndPointerModeNames = {
  [DndPointerMode.None]: 'none',
  [DndPointerMode.Between]: 'between',
  [DndPointerMode.Inside]: 'inside',
}

export interface DragAndDropState {
  isStarted: boolean

  pointerExpanding: boolean
  pointerMode: DndPointerMode
  pointerLvl: number
  pointerHover: boolean

  dstType: DropType
  dstIndex: number
  dstParentId: ID
  dstPin: boolean
  dstPanelId: ID

  dragTooltipTitle: string
  dragTooltipInfo: string
}

export const DnD = {
  reactive: {
    isStarted: false,
    pointerExpanding: false,
    pointerMode: DndPointerMode.None,
    pointerLvl: 0,
    pointerHover: false,
    dstType: DropType.Nowhere,
    dstIndex: -1,
    dstParentId: NOID,
    dstPanelId: NOID,
    dstPin: false,
    dragTooltipTitle: '',
    dragTooltipInfo: '',
  } as DragAndDropState,

  droppedInside: false,
  items: [] as DragItem[],
  isExternal: false,
  goOutside: false,
  startX: 0,
  startY: 0,

  srcType: DragType.Nothing,
  srcIncognito: false,
  srcPin: false,
  srcWinId: NOID,
  srcPanelId: NOID,
  srcIndex: -1,

  ...DndActions,
}
