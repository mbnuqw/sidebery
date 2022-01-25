import { DomainsStats } from 'src/types'
import * as StatsActions from 'src/services/stats.actions'

export interface StatsState {
  list: DomainsStats[]
}

export const Stats = {
  reactive: { list: [] } as StatsState,

  lastStats: undefined as DomainsStats | undefined,
  readyCB: undefined as (() => void) | undefined,
  idle: 'active' as browser.idle.IdleState,
  ready: false,

  ...StatsActions,
}
