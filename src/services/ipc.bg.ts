import { ActionsKeys, ActionsType } from 'src/types'
import { InstanceType } from 'src/enums'
import * as Logs from 'src/services/logs'
import * as Windows from './windows.bg'

import * as IPC from 'src/services/ipc'
export * from 'src/services/ipc'

export function sendToLastFocusedSidebar<T extends InstanceType.sidebar, A extends ActionsKeys<T>>(
  action: A,
  ...args: Parameters<ActionsType<T>[A]>
): void {
  if (IPC.state.sidebarConnections.size === 1) {
    const [connection] = IPC.state.sidebarConnections.values()
    if (connection) IPC.sidebar(connection.id, action, ...args)
    return
  }

  if (Windows.lastFocusedId === undefined) {
    IPC.sendToSidebars(action, ...args)
    return
  }

  const win = Windows.byId.get(Windows.lastFocusedId)
  if (win) {
    IPC.sidebar(Windows.lastFocusedId, action, ...args)
  }
}
