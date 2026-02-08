import { createApp, reactive } from 'vue'
import * as E from 'src/enums'
import * as Settings from 'src/services/settings.fg'
import * as Windows from 'src/services/windows.fg'
import * as Containers from 'src/services/containers.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Store from 'src/services/storage.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as Info from 'src/services/info'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import * as SetupPage from 'src/services/setup-page.fg'
import * as Keybindings from 'src/services/keybindings.fg'
import * as Favicons from 'src/services/favicons.fg'
import * as Styles from 'src/services/styles.fg'
import * as SidebarConfig from 'src/services/sidebar-config'
import * as Popups from 'src/services/popups.fg'
import * as Notifications from 'src/services/notifications.fg'
import Root from './setup.vue'

async function main(): Promise<void> {
  const ts = performance.now()

  Info.setInstanceType(E.InstanceType.setup)
  IPC.setInstanceType(E.InstanceType.setup)
  Logs.setInstanceType(E.InstanceType.setup)

  Settings.reactivate(reactive)
  Containers.reactivate(reactive)
  Windows.reactivate(reactive)
  Favicons.reactivate(reactive)
  Keybindings.reactivate(reactive)
  Bookmarks.reactivate(reactive)
  SidebarConfig.reactivate(reactive)
  Popups.reactivate(reactive)
  Permissions.reactivate(reactive)
  SetupPage.reactivate(reactive)
  Info.reactivate(reactive)
  Styles.reactivate(reactive)
  Notifications.reactivate(reactive)

  IPC.registerActions({
    storageChanged: Store.storageChangeListener,
    connectTo: IPC.connectTo,
    reloadFavicons: Favicons.load,
  })

  SetupPage.updateActiveView()
  SetupPage.setupListeners()

  Styles.setupListeners()

  await Promise.all([
    Windows.load(),
    Settings.load().then(() => Styles.load()),
    Containers.load(),
    Keybindings.load(),
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

  await SidebarConfig.loadSidebarConfig()
  SidebarConfig.setupSidebarConfigListeners()
  Styles.loadCustomCSS()
  Info.loadPlatformInfo()
  Permissions.load()
  Permissions.setupListeners()
  Favicons.load()
  IPC.connectTo(E.InstanceType.bg)
  IPC.setupGlobalMessageListener()

  SetupPage.finishInitialization()
  SetupPage.calcStorageInfo()

  Logs.info(`Init end: ${performance.now() - ts}ms`)
}
main()
