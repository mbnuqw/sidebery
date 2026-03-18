import type * as T from 'src/types'
import { InstanceType } from 'src/enums'
import { uid } from 'src/utils'
import * as IPPC from 'src/services/ippc'
import * as PageIPPC from 'src/services/ippc.page'

export async function initHM() {
  window.addEventListener('hashchange', onUrlHashChange)
}

async function onUrlHashChange(e: HashChangeEvent) {
  const url = e.newURL
  if (!url.endsWith('!p!~')) return

  if (PageIPPC.ProcessedUrls.has(url)) {
    console.warn('ippc.page.onUrlHashChange: old hash msg:', url.slice(-32))
    PageIPPC.setHash('')
    return
  }
  PageIPPC.ProcessedUrls.add(url)

  const recvChunk = IPPC.parseHMChunk(url)
  if (!recvChunk) return console.warn('ippc.page.onUrlHashChange: no recvChunk:', url.slice(-32))
  if (recvChunk.chunk === '+') return IPPC.confirmReceivingHMChunk(recvChunk)

  sendHashChunkReceivingConfirmation(recvChunk)
  const pendingMsg = IPPC.convertHMChunkToMsgAndRememberIt(recvChunk)
  if (pendingMsg.chunkIndex !== 0) return

  IPPC.dropRememberedHashMsg(pendingMsg.msgId)

  let msg
  try {
    msg = await IPPC.decodeHashMsg(pendingMsg)
  } catch {
    return
  }

  PageIPPC.onMsg(msg)
}

export async function sendHashMsg<T extends InstanceType, A extends T.ActionsKeys<T>>(
  msg: T.Message<T, A>
): Promise<ID> {
  const id = uid()
  msg.id = id

  const chunks = await IPPC.encodeHashMsg(msg, PageIPPC.localType)
  if (chunks.length === 0) throw 'no chunks'

  let chunk = chunks.pop()
  if (chunk) PageIPPC.setHash(chunk)
  await IPPC.waitForHMReceivingConfirmation(msg.id, chunks.length)
  while (chunks.length > 0) {
    chunk = chunks.pop()
    if (chunk) PageIPPC.setHash(chunk)
    await IPPC.waitForHMReceivingConfirmation(msg.id, chunks.length)
  }

  return id
}

function sendHashChunkReceivingConfirmation(chunk: IPPC.ReceivedHashChunk) {
  const m = IPPC.getRecvdHashMsg(chunk.chunkIndex, chunk.msgId, PageIPPC.localMark, chunk.srcMark)
  PageIPPC.setHash(m)
}
