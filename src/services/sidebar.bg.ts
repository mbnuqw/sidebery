import * as T from 'src/types'
import * as E from 'src/enums'
import * as D from 'src/defaults'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage.bg'
import * as Logs from 'src/services/logs'
import * as SidebarConfig from 'src/services/sidebar-config'
import * as Windows from 'src/services/windows.bg'
import * as Omnibox from 'src/services/omnibox.bg'
import * as Settings from 'src/services/settings'

export let nav: ID[] = []
export let panelConfById: Partial<Record<ID, T.PanelConfig>> = {}
export let panelConfigs: T.PanelConfig[] = []
export let hasTabs = false
export let hasBookmarks = false
export let hasHistory = false
export let hasSync = false

export async function load(): Promise<void> {
  let storage = await browser.storage.managed.get<T.Stored>('sidebar').catch(() => {})
  if (!storage?.sidebar) {
    storage = await browser.storage.local.get<T.Stored>('sidebar')
  }

  let saveNeeded = false
  if (!storage.sidebar?.nav?.length) {
    Logs.warn('Sidebar.loadNav: Creating default sidebar config and saving it')
    storage.sidebar = SidebarConfig.createDefaultSidebarConfig()
    saveNeeded = true
  }

  updateSidebar(storage.sidebar)

  if (saveNeeded) await Store.set({ sidebar: storage.sidebar }, 300)
}

function parseNav(config: T.SidebarConfig): void {
  hasTabs = false
  hasBookmarks = false
  hasHistory = false
  hasSync = false

  for (const id of config.nav) {
    const panel = config.panels[id]
    if (!panel) continue

    if (!hasTabs && panel.type === E.PanelType.tabs) hasTabs = true
    if (!hasBookmarks && panel.type === E.PanelType.bookmarks) hasBookmarks = true
    if (!hasHistory && panel.type === E.PanelType.history) hasHistory = true
    if (!hasSync && panel.type === E.PanelType.sync) hasSync = true
  }
}

export function setupListeners(): void {
  Store.onKeyChange('sidebar', updateSidebar)
}

function updateSidebar(newConfig?: T.SidebarConfig | null): void {
  if (!newConfig) return
  parseNav(newConfig)
  nav = newConfig.nav
  panelConfById = newConfig.panels

  panelConfigs = []
  for (const id of nav) {
    const panelConfig = panelConfById[id]
    if (panelConfig) panelConfigs.push(panelConfig)
  }

  if (Settings.state.omniMoveToPanel || Settings.state.omniSwitchToPanel) {
    Omnibox.updateCommandsDebounced(500)
  }
}

let prevSavedFocusedActivePanelId = D.NOID
function saveFocusedActivePanelId() {
  if (Windows.lastFocusedId === D.NOID) return
  const win = Windows.byId.get(Windows.lastFocusedId)
  if (!win) {
    Logs.warn('Sidebar.saveFocusedActivePanelId: No win', Windows.lastFocusedId)
    return
  }

  if (prevSavedFocusedActivePanelId === win.activePanelId) return

  prevSavedFocusedActivePanelId = win.activePanelId
  Store.set({ lastFocusedActivePanelId: win.activePanelId })
}
export const saveFocusedActivePanelIdDebounced = Utils.debounce(saveFocusedActivePanelId)

export function setActivePanelId(winId: ID, panelId: ID) {
  const win = Windows.byId.get(winId)
  if (!win) {
    Logs.warn('Sidebar.setActivePanelId: No win', winId, panelId)
    return
  }

  win.activePanelId = panelId

  saveFocusedActivePanelIdDebounced(1000)
}
