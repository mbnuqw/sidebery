import type * as T from 'src/types'
import { InstanceType } from 'src/enums'
import { uid } from 'src/utils'
import * as PageIPPC from 'src/services/ippc.page'

let ready = false
let ch: BroadcastChannel | undefined
let chId = ''

export let hashSuffix = ''

export function initBC() {
  chId = uid()
  hashSuffix = `~!${chId}!ch!~`
  PageIPPC.setHash(`~!${chId}!ch!~`)
  ch = new BroadcastChannel(chId)
  ch.addEventListener('message', onBCMsg)
}

function onBCMsg<T extends InstanceType, A extends keyof T.Actions>(
  e: MessageEvent<T.Message<T, A>>
) {
  const msg = e.data

  if (msg.dstType !== undefined && msg.dstType !== PageIPPC.localType) return

  // Welcome msg
  if (msg.action === 'ready') {
    ready = true
    waitingForConnection.forEach(cb => cb())
    waitingForConnection = []
    return
  }

  PageIPPC.onMsg(msg)
}

let waitingForConnection: (() => void)[] = []
async function waitForConnection(): Promise<void> {
  if (ready) return

  ch?.postMessage({ id: -1, action: 'ping' })
  return new Promise(ok => {
    waitingForConnection.push(ok)
  })
}

export async function sendBCMsg<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>
): Promise<ID> {
  if (!ch) throw 'no channel'
  if (!ready) await waitForConnection()

  const id = uid()
  msg.id = id
  ch.postMessage(msg)

  return id
}
