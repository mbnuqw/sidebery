import { createApp, reactive } from 'vue'
import Root from './panel-config.vue'
import { InstanceType } from 'src/types'
import { Info } from 'src/services/info'
import { IPC, Logs, Popups, SidebarConfig, Sync } from 'src/services/_services'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import { Windows } from 'src/services/windows'
import { Notifications } from 'src/services/notifications'
import { Containers } from 'src/services/containers'
import { Permissions } from 'src/services/permissions'
import { Favicons } from 'src/services/_services.fg'
import { Store } from 'src/services/storage'
import { Bookmarks } from 'src/services/bookmarks'

async function main(): Promise<void> {
  Info.setInstanceType(InstanceType.panelConfig)
  IPC.setInstanceType(InstanceType.panelConfig)
  Logs.setInstanceType(InstanceType.panelConfig)

  Logs.info('Init start')

  Settings.state = reactive(Settings.state)
  Sync.initSync(reactive)
  Styles.reactive = reactive(Styles.reactive)
  Notifications.reactive = reactive(Notifications.reactive)
  SidebarConfig.initSidebarConfig(reactive)
  Containers.reactive = reactive(Containers.reactive)
  Popups.initPopups(reactive)
  Permissions.reactive = reactive(Permissions.reactive)
  Bookmarks.reactive = reactive(Bookmarks.reactive)

  IPC.registerActions({
    storageChanged: Store.storageChangeListener,
    connectTo: IPC.connectTo,
  })

  await Promise.all([
    Settings.loadSettings(),
    Windows.loadWindowInfo(),
    Containers.load(),
    SidebarConfig.loadSidebarConfig(),
  ])

  IPC.setWinId(Windows.id)
  Logs.setWinId(Windows.id)

  IPC.setupGlobalMessageListener()
  IPC.setupConnectionListener()

  const app = createApp(Root)
  app.mount('#root_container')

  Styles.initColorScheme()

  Settings.setupSettingsChangeListener()
  SidebarConfig.setupSidebarConfigListeners()

  Permissions.loadPermissions()
  Permissions.setupListeners()

  Favicons.loadFavicons()

  IPC.connectTo(InstanceType.bg)
}
main()
