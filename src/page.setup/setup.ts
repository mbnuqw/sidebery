import { createApp, reactive } from 'vue'
import Root from './setup.vue'
import { InstanceType } from 'src/types'
import { Settings } from 'src/services/settings'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Keybindings } from 'src/services/keybindings'
import { Bookmarks } from 'src/services/bookmarks'
import { Store } from 'src/services/storage'
import { Permissions } from 'src/services/permissions'
import { Info } from 'src/services/info'
import { SetupPage, Utils } from 'src/services/_services'
import { Styles } from 'src/services/styles'
import * as Favicons from 'src/services/favicons.fg'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import { initSidebarConfig, loadSidebarConfig } from 'src/services/sidebar-config'
import { setupSidebarConfigListeners } from 'src/services/sidebar-config'
import { initPopups } from 'src/services/popups'
import { Notifications } from 'src/services/notifications'

async function main(): Promise<void> {
  const ts = performance.now()

  Info.setInstanceType(InstanceType.setup)
  IPC.setInstanceType(InstanceType.setup)
  Logs.setInstanceType(InstanceType.setup)

  Settings.state = reactive(Settings.state)
  Containers.reactive = reactive(Containers.reactive)
  Windows.reactive = reactive(Windows.reactive)
  Favicons.initFavicons(reactive)
  Keybindings.reactive = reactive(Keybindings.reactive)
  Bookmarks.reactive = reactive(Bookmarks.reactive)
  initSidebarConfig(reactive)
  initPopups(reactive)
  Permissions.reactive = reactive(Permissions.reactive)
  SetupPage.initSetupPage(reactive)
  Info.reactive = reactive(Info.reactive)
  Styles.reactive = reactive(Styles.reactive)
  Notifications.reactive = reactive(Notifications.reactive)

  IPC.registerActions({
    storageChanged: Store.storageChangeListener,
    connectTo: IPC.connectTo,
    reloadFavicons: Favicons.loadFavicons,
  })

  SetupPage.updateActiveView()
  SetupPage.setupListeners()

  await Promise.all([
    Windows.loadWindowInfo(),
    Settings.loadSettings().then(() => Styles.initColorScheme()),
    Containers.load(),
    Keybindings.loadKeybindings(),
    Info.loadVersionInfo(),
    Info.loadCurrentTabInfo(),
  ])
  Logs.info(`Init: base services loaded: ${performance.now() - ts}ms`)

  IPC.setWinId(Windows.id)
  IPC.setTabId(Info.currentTabId)
  Logs.setWinId(Windows.id)
  Logs.setTabId(Info.currentTabId)

  const app = createApp(Root)
  app.mount('#root_container')
  Logs.info(`Init: app.mount: ${performance.now() - ts}ms`)

  Settings.setupSettingsChangeListener()

  await loadSidebarConfig()
  setupSidebarConfigListeners()
  Styles.loadCustomCSS()
  Info.loadPlatformInfo()
  Info.loadVersionInfo()
  Permissions.loadPermissions()
  Permissions.setupListeners()
  Favicons.loadFavicons()
  IPC.connectTo(InstanceType.bg)
  IPC.setupGlobalMessageListener()

  SetupPage.finishInitialization()
  SetupPage.calcStorageInfo()

  Logs.info(`Init end: ${performance.now() - ts}ms`)
}
main()
