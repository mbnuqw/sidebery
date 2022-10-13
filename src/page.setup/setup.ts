import { createApp, reactive } from 'vue'
import Root from './setup.vue'
import { InstanceType } from 'src/types'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Favicons } from 'src/services/favicons'
import { Containers } from 'src/services/containers'
import { Keybindings } from 'src/services/keybindings'
import { Bookmarks } from 'src/services/bookmarks'
import { Menu } from 'src/services/menu'
import { Sidebar } from 'src/services/sidebar'
import { Store } from 'src/services/storage'
import { Permissions } from 'src/services/permissions'
import { Info } from 'src/services/info'
import { SetupPage } from 'src/services/setup-page'
import { Styles } from 'src/services/styles'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'

async function main(): Promise<void> {
  Info.setInstanceType(InstanceType.setup)
  IPC.setType(InstanceType.setup)
  Logs.setType(InstanceType.setup)

  Settings.state = reactive(Settings.state)
  Containers.reactive = reactive(Containers.reactive)
  Windows.reactive = reactive(Windows.reactive)
  Favicons.reactive = reactive(Favicons.reactive)
  Keybindings.reactive = reactive(Keybindings.reactive)
  Bookmarks.reactive = reactive(Bookmarks.reactive)
  Sidebar.reactive = reactive(Sidebar.reactive)
  Permissions.reactive = reactive(Permissions.reactive)
  SetupPage.reactive = reactive(SetupPage.reactive)
  Info.reactive = reactive(Info.reactive)
  Styles.reactive = reactive(Styles.reactive)

  IPC.registerActions({
    storageChanged: Store.storageChangeListener,
    connectTo: IPC.connectTo,
  })

  SetupPage.updateActiveView()
  SetupPage.setupListeners()

  const app = createApp(Root)

  await Promise.all([
    Windows.loadWindowInfo(),
    Settings.loadSettings(),
    Containers.load(),
    Keybindings.loadKeybindings(),
    Info.loadVersionInfo(),
    Info.loadCurrentTabInfo(),
  ])

  IPC.setWinId(Windows.id)
  IPC.setTabId(Info.currentTabId)
  Logs.setWinId(Windows.id)
  Logs.setTabId(Info.currentTabId)

  app.mount('#root_container')

  if (Info.isMajorUpgrade()) {
    Sidebar.upgrade()
    return
  }

  Settings.setupSettingsChangeListener()

  await Sidebar.loadPanels()
  Sidebar.setupListeners()
  Styles.initColorScheme()
  Styles.loadCustomCSS()
  Info.loadPlatformInfo()
  Info.loadBrowserInfo()
  Info.loadVersionInfo()
  Permissions.loadPermissions()
  Permissions.setupListeners()
  Menu.loadCtxMenu()
  Menu.setupListeners()
  SetupPage.initialized()
  Favicons.loadFavicons()
  IPC.connectTo(InstanceType.bg)
  IPC.setupGlobalMessageListener()
}
main()
