import { Tab, TabCache } from 'src/types'
import * as TabsActions from 'src/services/tabs.bg.actions'

export const Tabs = {
  ready: false,
  byId: {} as Record<ID, Tab>,
  cacheByWin: {} as Record<ID, TabCache[]>,
  deferredEventHandling: [] as (() => void)[],

  ...TabsActions,
}
