import type * as T from 'src/types'
import { InstanceType } from 'src/enums'
import * as IPPC from 'src/services/ippc'
import { initBC, sendBCMsg } from 'src/services/ippc.page.bc'
import { initHM, sendHashMsg } from 'src/services/ippc.page.hm'

export { sendBCMsg, hashSuffix } from 'src/services/ippc.page.bc'

interface PendingMsg {
  timeout: number
  ok: (v?: any) => void
  meh: (err?: any) => void
}

export class ProcessedUrls {
  static #urlEndings: string[] = []
  static add(url: string) {
    this.#urlEndings.push(url.slice(-25))
    if (this.#urlEndings.length > 100) this.#urlEndings.shift()
  }
  static has(url: string) {
    const ending = url.slice(-25)
    return this.#urlEndings.lastIndexOf(ending) !== -1
  }
}

let inDefaultContainer = false
let actions: T.Actions | undefined
export let setHash: (h: string) => void
export let localType = InstanceType.unknown
export const localMark = 'p'
export const pending: Map<ID, PendingMsg> = new Map()

export async function init<R, I extends InstanceType>(
  type: I,
  hashSetter: (h: string) => void,
  a: T.ActionsType<I>
): Promise<R> {
  localType = type
  actions = a
  setHash = hashSetter
  inDefaultContainer = isInDefaultContainer()

  if (inDefaultContainer) {
    initBC()
  } else {
    await initHM()
  }

  return req({ dstType: InstanceType.bg, action: 'init' })
}

export function isInDefaultContainer() {
  return !!localStorage.getItem('sdbr')
}

export function onMsg<T extends InstanceType, A extends keyof T.Actions>(msg: T.Message<T, A>) {
  // Handle response
  if (msg.id !== undefined) {
    const pm = pending.get(msg.id)
    if (pm) {
      clearTimeout(pm.timeout)
      if (msg.error) pm.meh(msg.error)
      else pm.ok(msg.result)
      return
    }
  }

  // Run an action
  if (msg.action && actions) {
    const action = actions[msg.action] as T.AnyFunc
    const args = msg.args
    if (args?.length) action(...args)
    else action()
  }
}

async function req<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>
): Promise<ReturnType<T.ActionsType<T>[A]>> {
  let id: ID
  if (inDefaultContainer) {
    id = await sendBCMsg(msg)
  } else {
    try {
      id = await sendHashMsg(msg)
    } catch (err) {
      setHash('')
      throw err
    }
  }

  return new Promise<ReturnType<T.ActionsType<T>[A]>>((ok, meh) => {
    // Set timeout
    const timeout = setTimeout(() => {
      meh(`timeout: msgId: ${id}, action: ${msg.action}`)
      pending.delete(id)

      if (!inDefaultContainer) setHash('')
    }, IPPC.REQUEST_TIMEOUT)

    pending.set(id, { timeout, ok, meh })
  })
}

export async function bg<T extends InstanceType.bg, A extends T.ActionsKeys<T>>(
  action: A,
  ...args: Parameters<T.ActionsType<T>[A]>
): Promise<ReturnType<T.ActionsType<T>[A]>> {
  const msg: T.Message<T, A> = { dstType: InstanceType.bg, action }
  if (args.length) msg.args = args
  return req(msg)
}
