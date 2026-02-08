import { createApp, reactive } from 'vue'
import Root from './sync.vue'
import { InstanceType } from 'src/enums'
import * as Info from 'src/services/info'
import * as IPC from 'src/services/ipc'
import * as Logs from 'src/services/logs'
import * as Sync from 'src/services/sync.fg'
import * as Windows from 'src/services/windows.fg'
import * as Settings from 'src/services/settings.fg'
import * as Styles from 'src/services/styles.fg'
import * as Notifications from 'src/services/notifications.fg'

async function main(): Promise<void> {
  Info.setInstanceType(InstanceType.sync)
  IPC.setInstanceType(InstanceType.sync)
  Logs.setInstanceType(InstanceType.sync)

  Logs.info('Init start')

  Settings.reactivate(reactive)
  Sync.reactivate(reactive)
  Styles.reactivate(reactive)
  Notifications.reactivate(reactive)

  await Promise.all([
    Settings.load().then(() => {
      Styles.load()
      Styles.updateGlobalFontSize()
      Styles.udpateGlobalFontFamily()
    }),
    Windows.load(),
  ])

  IPC.setWinId(Windows.id)
  Logs.setWinId(Windows.id)

  IPC.setupGlobalMessageListener()
  IPC.setupConnectionListener()

  const app = createApp(Root)
  app.mount('#root_container')

  await Sync.load()
}
main()
