import { Tab, ActiveTabsHistory, NewTabPosition, RecentlyClosedTabInfo } from 'src/types'
import { TabToPanelMoveRule, RemovedTabInfo } from 'src/types'
import { NOID } from 'src/defaults'
import * as TabsActions from 'src/services/tabs.fg.actions'
import * as TabsHandlers from 'src/services/tabs.fg.handlers'
import * as TabsGroups from 'src/services/tabs.fg.groups'
import * as TabsShadow from 'src/services/tabs.fg.shadow'
import * as TabsScroll from 'src/services/tabs.fg.scroll'
import * as TabsEditTitle from 'src/services/tabs.fg.edit-title'
import * as TabsColors from 'src/services/tabs.fg.colors'
import * as TabsRm from 'src/services/tabs.fg.rm'
import * as TabsMove from 'src/services/tabs.fg.move'
import * as TabsCreate from 'src/services/tabs.fg.create'
import * as TabsMedia from 'src/services/tabs.fg.media'

export interface TabsReactiveState {
  pinnedIds: ID[]
  recentlyRemovedLen: number
  inlinePreviewTabId: ID
  inlinePreviewPinnedImg: string
}

export const Tabs = {
  ready: false,
  reactive: {
    pinnedIds: [],
    recentlyRemovedLen: 0,
    inlinePreviewTabId: NOID,
    inlinePreviewPinnedImg: '',
  } as TabsReactiveState,
  list: [] as Tab[],
  byId: {} as Partial<Record<ID, Tab>>,
  pinned: [] as Tab[],
  recentlyRemoved: [] as RecentlyClosedTabInfo[],

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
  activateSelectedOnMouseLeave: false,
  sorting: false,

  ...TabsActions,
  ...TabsHandlers,
  ...TabsGroups,
  ...TabsShadow,
  ...TabsScroll,
  ...TabsEditTitle,
  ...TabsColors,
  ...TabsRm,
  ...TabsMove,
  ...TabsCreate,
  ...TabsMedia,
}
