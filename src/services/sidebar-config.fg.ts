import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import * as Store from 'src/services/storage.fg'

import * as SidebarConfig from 'src/services/sidebar-config'
export * from 'src/services/sidebar-config'

export async function saveSidebarConfig(delay?: number) {
  Logs.info('SidebarConfig.saveSidebarConfig')
  return Store.set({ sidebar: Utils.cloneObject(SidebarConfig.reactive) }, delay)
}
