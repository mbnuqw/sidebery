import { Panel, TabsPanel, ConfirmDialog, UpgradingState, Dialog, GroupConfig } from 'src/types'
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

  panelConfigPopup: PanelConfigPopup | null
  containerConfigPopup: ContainerConfigPopup | null
  groupConfigPopup: GroupConfigPopup | null
  newTabShortcutsPopup: NewTabShortcutsPopup | null
  confirm: ConfirmDialog | null
  hiddenPanelsBar: boolean
  hiddenPanelsBarOffset: number
  hiddenPanelsBarOffsetSide: 'start' | 'end'
  dialog: Dialog | null

  selectedHeader: ID
  upgrading: UpgradingState | null
}

interface UrlRule {
  panelId: ID
  value: string | RegExp
}

export interface PanelConfigPopup {
  id: ID
  name: string
  iconSVG: string
  color: browser.ColorName
  removeOnCancel: boolean
  done: (result: boolean) => void
}

export interface ContainerConfigPopup {
  id: ID
  name: string
  icon: string
  color: browser.ColorName
  done: (result: ID | null) => void
}

export const enum GroupConfigResult {
  Ok = 1,
  Cancel = 2,
}

export interface GroupConfigPopup {
  config: GroupConfig
  done: (result: GroupConfigResult) => void
}

export interface NewTabShortcutsPopup {
  panel: TabsPanel
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

    panelConfigPopup: null,
    containerConfigPopup: null,
    groupConfigPopup: null,
    newTabShortcutsPopup: null,
    confirm: null,
    hiddenPanelsBar: false,
    hiddenPanelsBarOffset: 0,
    hiddenPanelsBarOffsetSide: 'start',
    dialog: null,

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
  convertingPanelLock: false,

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

  reMountSidebar: null as null | (() => void),

  ...SidebarActions,
}
