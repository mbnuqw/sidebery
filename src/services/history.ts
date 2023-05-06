import { HistoryItem } from 'src/types'
import * as HistoryActions from 'src/services/history.actions'

export interface HistoryState {
  list: HistoryItem[]
  ready: boolean
  filtered?: HistoryItem[]
}

export const History = {
  reactive: { list: [], ready: false } as HistoryState,
  ready: false,
  allLoaded: false,

  panelScrollEl: null as HTMLElement | null,
  subPanelScrollEl: null as HTMLElement | null,

  ...HistoryActions,
}
