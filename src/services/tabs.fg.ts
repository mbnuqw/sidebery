import { Tab, ActiveTabsHistory, NewTabPosition, ReactiveTab } from 'src/types'
import { NOID } from 'src/defaults'
import * as TabsActions from 'src/services/tabs.fg.actions'
import * as TabsHandlers from 'src/services/tabs.fg.handlers'
import * as TabsGroups from 'src/services/tabs.fg.actions.groups'
import * as TabsShadow from 'src/services/tabs.fg.shadow'

export interface TabsReactiveState {
  byId: Partial<Record<ID, ReactiveTab>>
  pinned: ReactiveTab[]
}

export interface RemovedTabInfo {
  id: ID
  index: number
  title: string
  parentId: ID
  panelId: ID
  children?: ID[]
}

export const Tabs = {
  reactive: { byId: {}, pinned: [] } as TabsReactiveState,
  list: [] as Tab[],
  byId: {} as Partial<Record<ID, Tab>>,

  urlsInUse: {} as Record<string, number>,
  shadowMode: false,

  tabsReinitializing: false,
  removedTabs: [] as RemovedTabInfo[],
  newTabsPosition: {} as Record<number, NewTabPosition>,
  movingTabs: [] as ID[],
  attachingTabs: [] as Tab[],
  normTabsMoving: false,

  activeTabsGlobal: { id: 'global', actTabOffset: -1, actTabs: [] } as ActiveTabsHistory,
  activeTabsPerPanel: {} as Record<string, ActiveTabsHistory>,

  deferredEventHandling: [] as (() => void)[],
  removingTabs: [] as ID[],
  ignoreTabsEvents: false,
  activeId: NOID,

  ...TabsActions,
  ...TabsHandlers,
  ...TabsGroups,
  ...TabsShadow,
}
