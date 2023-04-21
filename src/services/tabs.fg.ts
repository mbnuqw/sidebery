import { Tab, ActiveTabsHistory, NewTabPosition, ReactiveTab } from 'src/types'
import { TabToPanelMoveRule } from 'src/types'
import { NOID } from 'src/defaults'
import * as TabsActions from 'src/services/tabs.fg.actions'
import * as TabsHandlers from 'src/services/tabs.fg.handlers'
import * as TabsGroups from 'src/services/tabs.fg.groups'
import * as TabsShadow from 'src/services/tabs.fg.shadow'
import * as TabsScroll from 'src/services/tabs.fg.scroll'
import * as TabsEditTitle from 'src/services/tabs.fg.edit-title'
import * as TabsColors from 'src/services/tabs.fg.colors'

export interface TabsReactiveState {
  byId: Partial<Record<ID, ReactiveTab>>
  pinned: ReactiveTab[]
  recentlyRemoved: RecentlyRemovedTabInfo[]
}

export interface RemovedTabInfo {
  id: ID
  index: number
  title: string
  parentId: ID
  panelId: ID
  children?: ID[]
}

export interface RecentlyRemovedTabInfo {
  id: ID
  url: string
  title: string
  parentId: ID
  isParent: boolean
  lvl: number
  time: number
  containerId: string
  containerColor?: string
  favIconUrl?: string
  favPlaceholder?: string
}

export const Tabs = {
  ready: false,
  reactive: { byId: {}, pinned: [], recentlyRemoved: [] } as TabsReactiveState,
  list: [] as Tab[],
  byId: {} as Partial<Record<ID, Tab>>,
  pinned: [] as Tab[],

  urlsInUse: {} as Record<string, number>,
  shadowMode: false,

  tabsReinitializing: false,
  removedTabs: [] as RemovedTabInfo[],
  newTabsPosition: {} as Record<number, NewTabPosition>,
  movingTabs: [] as ID[],
  attachingTabs: [] as Tab[],
  detachingTabIds: [] as ID[],
  normTabsMoving: false,
  editableTabId: NOID,

  moveRules: [] as TabToPanelMoveRule[],

  activeTabsGlobal: { id: 'global', actTabOffset: -1, actTabs: [] } as ActiveTabsHistory,
  activeTabsPerPanel: {} as Record<string, ActiveTabsHistory>,

  deferredEventHandling: [] as (() => void)[],
  removingTabs: [] as ID[],
  ignoreTabsEvents: false,
  activeId: NOID,
  blockedScrollPosition: false,

  ...TabsActions,
  ...TabsHandlers,
  ...TabsGroups,
  ...TabsShadow,
  ...TabsScroll,
  ...TabsEditTitle,
  ...TabsColors,
}
