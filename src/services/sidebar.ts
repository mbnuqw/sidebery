import { Panel, ConfirmDialog, TabsPanelRemoving, UpgradingState } from 'src/types'
import { NOID } from 'src/defaults'
import * as SidebarActions from 'src/services/sidebar.actions'

export interface SidebarReactiveState {
  nav: ID[]
  panels: Panel[]
  panelsById: Record<ID, Panel>
  activePanelId: ID
  lastActivePanelId: ID
  selectedNavId: ID

  width: number
  horNavWidth: number
  navBtnWidth: number

  fastPanelConfig: FastPanelConfig | null
  fastContainerConfig: FastContainerConfig | null
  confirm: ConfirmDialog | null
  hiddenPanelsBar: boolean
  tabsPanelRemoving: TabsPanelRemoving | null

  selectedHeader: ID
  upgrading: UpgradingState | null
}

interface UrlRule {
  panelId: ID
  value: string | RegExp
}

export interface FastPanelConfig {
  id: ID
  name: string
  iconSVG: string
  color: browser.ColorName
  removeOnCancel: boolean
  done: (result: boolean) => void
}

export interface FastContainerConfig {
  id: ID
  name: string
  icon: string
  color: browser.ColorName
  removeOnCancel: boolean
  done: (result: boolean) => void
}

export const Sidebar = {
  reactive: {
    nav: [],
    panels: [],
    panelsById: {},
    activePanelId: NOID,
    lastActivePanelId: NOID,
    selectedNavId: NOID,

    width: 0,
    height: 0,
    horNavWidth: 0,
    navBtnWidth: 0,

    fastPanelConfig: null,
    fastContainerConfig: null,
    confirm: null,
    hiddenPanelsBar: false,
    tabsPanelRemoving: null,

    selectedHeader: NOID,
    upgrading: null,
  } as SidebarReactiveState,

  ready: false,
  hasTabs: false,
  hasBookmarks: false,
  hasHistory: false,
  urlRules: [] as UrlRule[],
  lastTabsPanelId: NOID,
  scrollPositions: {} as Record<ID, number>,

  panelsTop: 0,
  tabHeight: 0,
  bookmarkHeight: 0,
  folderHeight: 0,
  separatorHeight: 0,

  ...SidebarActions,
}
