import type * as T from 'src/types'
import * as D from 'src/defaults'
import { InstanceType } from 'src/enums'
import { uid } from 'src/utils'
import * as Logs from 'src/services/logs'
import * as AddonIPPC from 'src/services/ippc.addon'
import { onMsg } from 'src/services/ippc.addon'

export class Channels {
  static #byTabId: Partial<Record<ID, BroadcastChannel>> = {}
  static create(tab: AddonIPPC.TabCtx, chId: string) {
    for (const tabId of Object.keys(this.#byTabId)) {
      if (tabId === tab.id) continue
      const ch = this.#byTabId[tabId]
      if (ch?.name === chId) {
        ch.close()
        delete this.#byTabId[tabId]
        break
      }
    }
    const ch = new BroadcastChannel(chId)
    this.#byTabId[tab.id]?.close()
    this.#byTabId[tab.id] = ch
    return ch
  }
  static get(tab: AddonIPPC.TabCtx) {
    return this.#byTabId[tab.id]
  }
  static delete(tab: AddonIPPC.TabCtx) {
    const ch = this.#byTabId[tab.id]
    if (!ch) return
    ch.close()
    delete this.#byTabId[tab.id]
  }
  static clear() {
    Object.values(this.#byTabId).forEach(ch => ch?.close())
    this.#byTabId = {}
  }
}

export function bcInitNeeded(tab: AddonIPPC.TabCtx, url?: string) {
  if (!url) url = tab.url
  const ch = Channels.get(tab)
  return !ch?.name || !url.endsWith(ch.name, url.length - 5)
}

export function initBC(tab: AddonIPPC.TabCtx, url?: string) {
  if (!url) url = tab.url

  const chId = getChannelIdFromUrl(url)
  if (!chId) return Logs.warn('IPPC.initBC: no id:', chId)

  const ch = Channels.create(tab, chId)
  setupBCListener(tab, ch)

  // Send a welcome msg
  if (AddonIPPC.localType === InstanceType.bg) {
    if (tab.isGroup) {
      ch.postMessage({ dstType: InstanceType.group, action: 'ready' })
    } else if (tab.isPlaceholder) {
      ch.postMessage({ dstType: InstanceType.url, action: 'ready' })
    }
  }
}

function setupBCListener(tab: AddonIPPC.TabCtx, ch: BroadcastChannel) {
  ch.addEventListener(
    'message',
    <T extends InstanceType, A extends keyof T.Actions>(e: MessageEvent<T.Message<T, A>>) => {
      onMsg(e.data, tab)
    }
  )
}

export async function sendBCMsg<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>,
  tab: AddonIPPC.TabCtx,
  skipIfNoChan?: boolean
) {
  let ch = Channels.get(tab)
  if (!skipIfNoChan) {
    const chId = getChannelIdFromUrl(tab.url)
    if (!chId) return Logs.warn('IPPC.sendBCMsg: no id')
    // Create channel for communication
    if (!ch || ch.name !== chId) {
      ch = Channels.create(tab, chId)
      setupBCListener(tab, ch)
    }
  }
  if (!ch) return

  if (msg.id === undefined) {
    const id = uid()
    msg.id = id
  }
  ch.postMessage(msg)

  return msg.id
}

function getChannelIdFromUrl(url: string): string {
  return D.PAGE_CH_ID_RE.exec(url)?.groups?.chId || ''
}
