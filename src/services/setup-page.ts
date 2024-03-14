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

export const nav: SetupPageNavOption[] = [
  { active: false, name: 'settings', lvl: 0 },
  { active: false, name: 'settings_general', lvl: 1 },
  { active: false, name: 'settings_menu', lvl: 1 },
  { active: false, name: 'settings_nav', lvl: 1 },
  { active: false, name: 'settings_group', lvl: 1 },
  { active: false, name: 'settings_containers', lvl: 1 },
  { active: false, name: 'settings_dnd', lvl: 1 },
  { active: false, name: 'settings_search', lvl: 1 },
  { active: false, name: 'settings_tabs', lvl: 1 },
  { active: false, name: 'settings_new_tab_position', lvl: 2 },
  { active: false, name: 'settings_pinned_tabs', lvl: 2 },
  { active: false, name: 'settings_tabs_tree', lvl: 2 },
  { active: false, name: 'settings_tabs_colorization', lvl: 2 },
  { active: false, name: 'settings_tabs_preview', lvl: 2 },
  { active: false, name: 'settings_tabs_native', lvl: 2 },
  { active: false, name: 'settings_bookmarks', lvl: 1 },
  { active: false, name: 'settings_history', lvl: 1 },
  { active: false, name: 'settings_appearance', lvl: 1 },
  { active: false, name: 'settings_mouse', lvl: 1 },
  { active: false, name: 'settings_mouse_nav', lvl: 2 },
  { active: false, name: 'settings_mouse_tabs', lvl: 2 },
  { active: false, name: 'settings_mouse_tabs_panel', lvl: 2 },
  { active: false, name: 'settings_mouse_new_tab_button', lvl: 2 },
  { active: false, name: 'settings_mouse_bookmarks', lvl: 2 },
  { active: false, name: 'settings_mouse_history', lvl: 2 },
  { active: false, name: 'settings_snapshots', lvl: 1 },
  { active: false, name: 'settings_sync', lvl: 1 },
  { active: false, name: 'settings_help', lvl: 1 },
  { active: false, name: 'keybindings', lvl: 0 },
  { active: false, name: 'menu_editor', lvl: 0 },
  { active: false, name: 'menu_editor_tabs', lvl: 1 },
  { active: false, name: 'menu_editor_tabs_panel', lvl: 1 },
  { active: false, name: 'menu_editor_bookmarks', lvl: 1 },
  { active: false, name: 'menu_editor_bookmarks_panel', lvl: 1 },
  { active: false, name: 'styles_editor', lvl: 0 },
  { active: false, name: 'snapshots', lvl: 0 },
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
