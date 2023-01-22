import { HistoryItem } from 'src/types'
import * as HistoryActions from 'src/services/history.actions'

export interface HistoryState {
  list: HistoryItem[]
  filtered?: HistoryItem[]
}

export const History = {
  reactive: { list: [] } as HistoryState,
  ready: false,
  allLoaded: false,

  ...HistoryActions,
}
