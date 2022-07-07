import Utils from 'src/utils'
import { createApp, reactive } from 'vue'
import { InstanceType } from 'src/types'
import { IPC } from 'src/services/ipc'
import { Logs } from 'src/services/logs'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Favicons } from 'src/services/favicons'
import { Containers } from 'src/services/containers'
import { Keybindings } from 'src/services/keybindings'
import { Styles } from 'src/services/styles'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Store } from 'src/services/storage'
import { DnD } from 'src/services/drag-and-drop'
import { Permissions } from 'src/services/permissions'
import { Notifications } from 'src/services/notifications'
import { History } from 'src/services/history'
import { Search } from 'src/services/search'
import { Info } from 'src/services/info'
import SidebarRoot from './sidebar.vue'
import { Snapshots } from 'src/services/snapshots'
import { NOID } from 'src/defaults'

async function main(): Promise<void> {
  Info.setInstanceType(InstanceType.sidebar)

  // Reactivate data for vue
  Containers.reactive = reactive(Containers.reactive)
  Sidebar.reactive = reactive(Sidebar.reactive)
  Windows.reactive = reactive(Windows.reactive)
  Favicons.reactive = reactive(Favicons.reactive)
  Bookmarks.reactive = reactive(Bookmarks.reactive)
  Tabs.reactive = reactive(Tabs.reactive)
  DnD.reactive = reactive(DnD.reactive)
  Permissions.reactive = reactive(Permissions.reactive)
  Notifications.reactive = reactive(Notifications.reactive)
  History.reactive = reactive(History.reactive)
  Search.reactive = reactive(Search.reactive)
  Styles.reactive = reactive(Styles.reactive)

  Logs.info('Initialization start')
  IPC.registerActions({
    reloadTab: Tabs.reloadTab,
    queryTab: Tabs.queryTab,
    getTabs: Tabs.getTabs,
    getTabsTreeData: Tabs.getTabsTreeData,
    moveTabsToThisWin: Tabs.moveToThisWin,
    openTabs: Tabs.open,
    handleReopening: Tabs.handleReopening,
    getActivePanelInfo: Sidebar.getActivePanelInfo,
    stopDrag: DnD.reset,
    getGroupInfo: Tabs.getGroupInfo,
    loadFavicons: Favicons.loadFavicons,
    setFavicon: Favicons.set,
    onOutsideSearchInput: Search.onOutsideSearchInput,
    onOutsideSearchNext: Search.next,
    onOutsideSearchPrev: Search.prev,
    onOutsideSearchEnter: Search.enter,
    onOutsideSearchSelectAll: Search.selectAll,
    onOutsideSearchMenu: Search.menu,
    onOutsideSearchExit: Search.onOutsideSearchExit,
    notifyAboutNewSnapshot: Snapshots.notifyAboutNewSnapshot,
    notify: Notifications.notify,
    isDropEventConsumed: DnD.isDropEventConsumed,
  })
  IPC.setupGlobalMessageListener()
  IPC.setupConnectionListener()

  await Promise.all([
    Windows.loadWindowInfo(),
    Settings.loadSettings(),
    Containers.load(),
    Permissions.loadPermissions(),
    Info.loadVersionInfo(),
  ])

  const app = createApp(SidebarRoot)
  app.mount('#root_container')

  Sidebar.reMountSidebar = () => {
    createApp(SidebarRoot).mount('#root_container')
    Styles.initColorScheme()
  }

  if (Info.isMajorUpgrade()) {
    Logs.info('Upgrade needed')
    await Sidebar.upgrade()
    return
  }

  Sidebar.updateFontSize()
  Settings.setupSettingsChangeListener()

  Permissions.setupListeners()
  Windows.setupWindowsListeners()
  Containers.setupContainersListeners()
  Store.setupStorageListeners()
  Sidebar.setupListeners()

  if (Settings.reactive.theme !== 'proton') Styles.initTheme()
  if (Settings.reactive.sidebarCSS) Styles.loadCustomSidebarCSS()
  Styles.initColorScheme()

  await Sidebar.loadPanels()

  const actPanel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
  const initBookmarks = !Settings.reactive.loadBookmarksOnDemand || Utils.isBookmarksPanel(actPanel)
  const initHistory = !Settings.reactive.loadHistoryOnDemand || Utils.isHistoryPanel(actPanel)

  IPC.connectTo(InstanceType.bg, NOID)

  if (Sidebar.hasTabs) await Tabs.load()
  else await Tabs.loadInShadowMode()
  if (Sidebar.hasBookmarks && initBookmarks) Bookmarks.load()
  if (Sidebar.hasHistory && initHistory) History.load()

  Menu.loadCtxMenu()
  Menu.setupListeners()

  Styles.setupListeners()

  Favicons.loadFavicons()

  Keybindings.loadKeybindings()
  Keybindings.setupListeners()

  Search.init()

  if (Settings.reactive.updateSidebarTitle) Sidebar.updateSidebarTitle(0)
}
main()
