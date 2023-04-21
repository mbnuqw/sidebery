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

  exportDialog: boolean
  importedData: BackupData | null

  permissions: string | boolean
}

export const nav = [
  { active: false, name: 'settings' },
  { active: false, name: 'settings_general', sub: true },
  { active: false, name: 'settings_menu', sub: true },
  { active: false, name: 'settings_nav', sub: true },
  { active: false, name: 'settings_group', sub: true },
  { active: false, name: 'settings_containers', sub: true },
  { active: false, name: 'settings_dnd', sub: true },
  { active: false, name: 'settings_search', sub: true },
  { active: false, name: 'settings_tabs', sub: true },
  { active: false, name: 'settings_bookmarks', sub: true },
  { active: false, name: 'settings_history', sub: true },
  { active: false, name: 'settings_appearance', sub: true },
  { active: false, name: 'settings_mouse', sub: true },
  { active: false, name: 'settings_snapshots', sub: true },
  { active: false, name: 'settings_sync', sub: true },
  { active: false, name: 'settings_help', sub: true },
  { active: false, name: 'keybindings' },
  { active: false, name: 'menu_editor' },
  { active: false, name: 'menu_editor_tabs', sub: true },
  { active: false, name: 'menu_editor_tabs_panel', sub: true },
  { active: false, name: 'menu_editor_bookmarks', sub: true },
  { active: false, name: 'menu_editor_bookmarks_panel', sub: true },
  { active: false, name: 'styles_editor' },
  { active: false, name: 'snapshots' },
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
    navLock: false,
    exportDialog: false,
    importedData: null,
    permissions: false,
  } as SetupPageState,

  ...SetupPageActions,
}
