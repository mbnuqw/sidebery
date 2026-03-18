import type * as T from 'src/types'
import * as D from 'src/defaults'
import { InstanceType } from 'src/enums'
import { uid } from 'src/utils'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as IPPC from 'src/services/ippc'
import { sendHashMsg } from 'src/services/ippc.addon.hm'
import { Channels, sendBCMsg } from 'src/services/ippc.addon.bc'

export * from 'src/services/ippc.addon.bc'
export * from 'src/services/ippc.addon.hm'

export interface TabCtx {
  id: ID
  url: string
  discarded?: boolean
  cookieStoreId: string
  isGroup?: boolean
  isPlaceholder?: boolean
}

export class ProcessedUrls {
  static #urlEndings = new WeakMap<TabCtx, string[]>()
  static add(tab: TabCtx, url: string) {
    let endings = this.#urlEndings.get(tab)
    if (!endings) this.#urlEndings.set(tab, (endings = []))
    endings.push(url.slice(-25))
    if (endings.length > 100) endings.shift()
  }
  static has(tab: TabCtx, url: string) {
    const endings = this.#urlEndings.get(tab)
    if (!endings) return false
    const ending = url.slice(-25)
    return endings.lastIndexOf(ending) !== -1
  }
}

export let localType = InstanceType.unknown
export let localMark = '_'

export function setInstanceType(t: InstanceType) {
  localType = t
  localMark = IPPC.getInstanceTypeMark(t) ?? '_'
}

export async function onMsg<T extends InstanceType, A extends keyof T.Actions>(
  msg: T.Message<T, A>,
  tab: TabCtx
) {
  if (msg.dstType !== undefined && msg.dstType !== localType) return

  // Ping (BroadcastChannel-specific request)
  if (msg.action === 'ping') {
    sendBCMsg({ action: 'ready' }, tab, true)
    return
  }

  // Init
  if (msg.action === 'init') {
    if (tab.isGroup) {
      msg.action = 'getGroupPageInitData' as A
      msg.args = [tab.id] as Parameters<T.ActionsType<T>[A]>
    } else if (tab.isPlaceholder) {
      msg.action = 'getPlaceholderPageInitData' as A
      msg.args = [tab.id] as Parameters<T.ActionsType<T>[A]>
    } else {
      return
    }
  }

  // Run an action
  let result, error
  if (msg.action) {
    try {
      result = await IPC.runActionFor(msg)
    } catch (err) {
      error = String(err)
      Logs.err(`IPC.onMsg: Error on running "${String(msg.action)}" action:`, err)
    }
  }

  // Send a response
  if (msg.id !== undefined) {
    const dstType = tab.isGroup ? InstanceType.group : InstanceType.url
    answer({ id: msg.id, dstType, result, error }, tab)
  }
}

async function answer<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>,
  tab: TabCtx
) {
  if (tab.cookieStoreId === D.DEFAULT_CONTAINER_ID) {
    await sendBCMsg(msg, tab, true)
  } else {
    await sendHashMsg(msg, tab)
  }
}

export async function send<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>,
  tab: TabCtx
) {
  if (tab.cookieStoreId === D.DEFAULT_CONTAINER_ID) {
    await sendBCMsg(msg, tab)
  } else {
    await sendHashMsg(msg, tab)
  }
}

export async function callGroupPage<T extends InstanceType.group, A extends T.ActionsKeys<T>>(
  tab: TabCtx,
  action: A,
  ...args: Parameters<T.ActionsType<T>[A]>
) {
  const id = uid()
  const msg: T.Message<InstanceType.group, any> = { id, dstType: InstanceType.group, action }
  if (args.length) msg.args = args
  await send(msg, tab)
}

export function reset(tab: TabCtx) {
  Channels.delete(tab)
}

export function resetAll() {
  Channels.clear()
}
