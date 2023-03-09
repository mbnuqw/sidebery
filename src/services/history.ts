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

  ...HistoryActions,
}
