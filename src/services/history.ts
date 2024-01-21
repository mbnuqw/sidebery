import { HistoryDay, Visit } from 'src/types'
import * as HistoryActions from 'src/services/history.actions'

export interface HistoryState {
  loading: boolean
  days: HistoryDay[]
}

export const History = {
  reactive: { days: [], loading: false } as HistoryState,

  visits: [] as Visit[],
  filtered: undefined as Visit[] | undefined,
  byId: {} as Record<ID, Visit>,

  ready: false,
  allLoaded: false,

  panelScrollEl: null as HTMLElement | null,
  subPanelScrollEl: null as HTMLElement | null,

  ...HistoryActions,
}
