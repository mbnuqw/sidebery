import type * as T from 'src/types'
import * as D from 'src/defaults'
import { InstanceType } from 'src/enums'
import * as Logs from 'src/services/logs'
import * as Store from 'src/services/storage'
import * as IPPC from 'src/services/ippc'
import * as AddonIPPC from 'src/services/ippc.addon'
import { uid } from 'src/utils'

export async function onHashMsg(tab: AddonIPPC.TabCtx, url: string) {
  if (AddonIPPC.ProcessedUrls.has(tab, url)) {
    Logs.warn('IPPC.onHashMsg: old hash msg')
    return
  }
  AddonIPPC.ProcessedUrls.add(tab, url)

  const recvChunk = IPPC.parseHMChunk(url)
  if (!recvChunk) return
  if (recvChunk.chunk === '+') {
    IPPC.confirmReceivingHMChunk(recvChunk)
    return
  }

  sendHashChunkReceivingConfirmation(recvChunk, tab)
  const pendingMsg = IPPC.convertHMChunkToMsgAndRememberIt(recvChunk)
  if (pendingMsg.chunkIndex !== 0) return

  IPPC.dropRememberedHashMsg(pendingMsg.msgId)

  let msg
  try {
    msg = await IPPC.decodeHashMsg(pendingMsg)
  } catch {
    return
  }

  AddonIPPC.onMsg(msg, tab)
}

function sendHashChunkReceivingConfirmation(chunk: IPPC.ReceivedHashChunk, tab: AddonIPPC.TabCtx) {
  const lm = AddonIPPC.localMark
  setHashMsg(IPPC.getRecvdHashMsg(chunk.chunkIndex, chunk.msgId, lm, chunk.srcMark), tab)
}

export async function sendHashMsg<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>,
  tab: AddonIPPC.TabCtx
) {
  if (msg.id === undefined) msg.id = uid()

  const chunks = await IPPC.encodeHashMsg(msg, AddonIPPC.localType)
  if (chunks.length === 0) throw 'encerr'

  let chunk = chunks.pop()
  if (chunk) setHashMsg(chunk, tab)
  await IPPC.waitForHMReceivingConfirmation(msg.id, chunks.length)
  while (chunks.length > 0) {
    chunk = chunks.pop()
    if (chunk) setHashMsg(chunk, tab)
    await IPPC.waitForHMReceivingConfirmation(msg.id, chunks.length)
  }
}

function setHashMsg(chunk: string, tab: AddonIPPC.TabCtx) {
  const reResult = D.PAGE_HASH_RE.exec(tab.url)
  if (!reResult) return
  const prefix = reResult.groups?.prefix
  const url = D.GROUP_URL + '#' + prefix + chunk
  return browser.tabs.update(tab.id, { url })
}
