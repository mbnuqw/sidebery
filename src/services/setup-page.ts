import { Container, BackupData, PanelConfig } from 'src/types'
import * as SetupPageActions from 'src/services/setup-page.actions'

export type SetupPageView =
  | 'settings'
  | 'menu_editor'
  | 'styles_editor'
  | 'snapshots'
  | 'storage'
  | 'keybindings'

export interface SetupPageNavOption {
  active: boolean
  name: string
  lvl: number
  sub?: boolean
}

export interface SetupPageState {
  nav: SetupPageNavOption[]
  activeView: SetupPageView
  activeSection: string
  navLock: boolean

  selectedContainer: Container | null
  selectedPanelConfig: PanelConfig | null

  detailsText: string
  detailsEdit?: (newValue: string) => void
  detailsTitle?: string
  detailsMode?: 'view' | 'edit'

  exportDialog: boolean
  importedData: BackupData | null

  permissions: string | boolean
}

export const nav = [
  { active: false, name: 'settings', lvl: 0 },
  { active: false, name: 'settings_general', sub: true, lvl: 1 },
  { active: false, name: 'settings_menu', sub: true, lvl: 1 },
  { active: false, name: 'settings_nav', sub: true, lvl: 1 },
  { active: false, name: 'settings_group', sub: true, lvl: 1 },
  { active: false, name: 'settings_containers', sub: true, lvl: 1 },
  { active: false, name: 'settings_dnd', sub: true, lvl: 1 },
  { active: false, name: 'settings_search', sub: true, lvl: 1 },
  { active: false, name: 'settings_tabs', sub: true, lvl: 1 },
  { active: false, name: 'settings_new_tab_position', sub: true, lvl: 2 },
  { active: false, name: 'settings_pinned_tabs', sub: true, lvl: 2 },
  { active: false, name: 'settings_tabs_tree', sub: true, lvl: 2 },
  { active: false, name: 'settings_tabs_colorization', sub: true, lvl: 2 },
  { active: false, name: 'settings_tabs_preview', sub: true, lvl: 2 },
  { active: false, name: 'settings_tabs_native', sub: true, lvl: 2 },
  { active: false, name: 'settings_bookmarks', sub: true, lvl: 1 },
  { active: false, name: 'settings_history', sub: true, lvl: 1 },
  { active: false, name: 'settings_appearance', sub: true, lvl: 1 },
  { active: false, name: 'settings_mouse', sub: true, lvl: 1 },
  { active: false, name: 'settings_snapshots', sub: true, lvl: 1 },
  { active: false, name: 'settings_sync', sub: true, lvl: 1 },
  { active: false, name: 'settings_help', sub: true, lvl: 1 },
  { active: false, name: 'keybindings', class: 'option' },
  { active: false, name: 'menu_editor', class: 'option' },
  { active: false, name: 'menu_editor_tabs', sub: true, lvl: 1 },
  { active: false, name: 'menu_editor_tabs_panel', sub: true, lvl: 1 },
  { active: false, name: 'menu_editor_bookmarks', sub: true, lvl: 1 },
  { active: false, name: 'menu_editor_bookmarks_panel', sub: true, lvl: 1 },
  { active: false, name: 'styles_editor', class: 'option' },
  { active: false, name: 'snapshots', class: 'option' },
]

export const SetupPage = {
  reactive: {
    nav,
    activeView: 'settings',
    activeSection: 'settings_general',
    selectedContainer: null,
    selectedPanelConfig: null,
    detailsText: '',
    detailsTitle: '',
    exportDialog: false,
    importedData: null,
    permissions: false,
  } as SetupPageState,

  navLock: false,

  ...SetupPageActions,
}
