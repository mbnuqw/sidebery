import { createApp, reactive } from 'vue'
import Root from './sync.vue'
import { InstanceType } from 'src/types'
import { Info } from 'src/services/info'
import { IPC, Logs, Sync } from 'src/services/_services'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import { Windows } from 'src/services/windows'
import { Notifications } from 'src/services/notifications'

async function main(): Promise<void> {
  Info.setInstanceType(InstanceType.sync)
  IPC.setInstanceType(InstanceType.sync)
  Logs.setInstanceType(InstanceType.sync)

  Logs.info('Init start')

  Settings.state = reactive(Settings.state)
  Sync.initSync(reactive)
  Styles.reactive = reactive(Styles.reactive)
  Notifications.reactive = reactive(Notifications.reactive)

  await Promise.all([
    Settings.loadSettings().then(() => {
      Styles.initColorScheme()
      Styles.updateGlobalFontSize()
      Styles.udpateGlobalFontFamily()
    }),
    Windows.loadWindowInfo(),
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
