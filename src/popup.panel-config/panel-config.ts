import { createApp, reactive } from 'vue'
import * as E from 'src/enums'
import * as Info from 'src/services/info'
import * as Sync from 'src/services/sync.fg'
import * as SidebarConfig from 'src/services/sidebar-config'
import * as Popups from 'src/services/popups.fg'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as Windows from 'src/services/windows.fg'
import * as Settings from 'src/services/settings.fg'
import * as Styles from 'src/services/styles.fg'
import * as Notifications from 'src/services/notifications.fg'
import * as Containers from 'src/services/containers.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as Favicons from 'src/services/favicons.fg'
import * as Store from 'src/services/storage.fg'
import * as Bookmarks from 'src/services/bookmarks.fg'
import Root from './panel-config.vue'

async function main(): Promise<void> {
  Info.setInstanceType(E.InstanceType.panelConfig)
  IPC.setInstanceType(E.InstanceType.panelConfig)
  Logs.setInstanceType(E.InstanceType.panelConfig)

  Logs.info('Init start')

  Settings.reactivate(reactive)
  Sync.reactivate(reactive)
  Styles.reactivate(reactive)
  Notifications.reactivate(reactive)
  SidebarConfig.reactivate(reactive)
  Containers.reactivate(reactive)
  Popups.reactivate(reactive)
  Permissions.reactivate(reactive)
  Bookmarks.reactivate(reactive)

  IPC.registerActions({
    storageChanged: Store.storageChangeListener,
    connectTo: IPC.connectTo,
  })

  await Promise.all([Settings.load(), Windows.load(), SidebarConfig.loadSidebarConfig()])

  IPC.setWinId(Windows.id)
  Logs.setWinId(Windows.id)

  IPC.setupGlobalMessageListener()
  IPC.setupConnectionListener()
  IPC.connectTo(E.InstanceType.bg)

  const app = createApp(Root)
  app.mount('#root_container')

  Containers.load()
  Styles.load()

  Settings.setupSettingsChangeListener()
  SidebarConfig.setupSidebarConfigListeners()

  Permissions.load()
  Permissions.setupListeners()

  Favicons.load()
}
main()
