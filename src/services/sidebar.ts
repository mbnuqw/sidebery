import { BookmarksPanel, Panel, SubPanelType, TabsPanel } from 'src/types'
import { NOID } from 'src/defaults'
import * as SidebarActions from 'src/services/sidebar.actions'

export interface SidebarReactiveState {
  nav: ID[]

  activePanelId: ID
  lastActivePanelId: ID

  horNavWidth: number
  navBtnWidth: number

  hiddenPanelsPopup: boolean
  hiddenPanelsPopupOffset: number
  hiddenPanelsPopupOffsetSide: 'start' | 'end'

  selectedNavId: ID
  selectedHeader: ID

  subPanelActive: boolean
  subPanelType: SubPanelType
}

export const enum GroupConfigResult {
  Ok = 1,
  Cancel = 2,
}

export interface SubPanels {
  bookmarks?: BookmarksPanel
}

export const Sidebar = {
  reactive: {
    nav: [],

    activePanelId: NOID,
    lastActivePanelId: NOID,

    horNavWidth: 0,
    navBtnWidth: 0,

    hiddenPanelsPopup: false,
    hiddenPanelsPopupOffset: 0,
    hiddenPanelsPopupOffsetSide: 'start',

    selectedNavId: NOID,
    selectedHeader: NOID,

    subPanelActive: false,
    subPanelType: SubPanelType.Null,
  } as SidebarReactiveState,

  panelsById: {} as Record<ID, Panel>,
  panels: [] as Panel[],
  ready: false,
  hasTabs: false,
  hasBookmarks: false,
  hasHistory: false,
  lastTabsPanelId: NOID,
  scrollPositions: {} as Record<ID, number>,
  convertingPanelLock: false,

  subPanelActive: false,
  subPanelType: SubPanelType.Null,
  subPanelHost: null as TabsPanel | null,
  subPanels: {} as SubPanels,

  width: 0,
  height: 0,
  scrollAreaRightX: 0,
  scrollAreaLeftX: 0,
  panelsTop: 0,
  tabHeight: 0,
  tabMargin: 0,
  bookmarkHeight: 0,
  folderHeight: 0,
  separatorHeight: 0,
  bookmarkMargin: 0,
  switchingLock: false,
  switchOnMouseLeave: false,

  reMountSidebar: null as null | (() => void),

  ...SidebarActions,
}
