import type * as T from 'src/types'
import { InstanceType } from 'src/enums'
import { PAGE_HASH_RE } from 'src/defaults'
import { uid } from 'src/utils'

export interface ReceivedHashMsg {
  msgId: ID
  chunks: string[]
  chunkIndex: number
  srcMark: string
}

export interface ReceivedHashChunk {
  msgId: ID
  chunk: string
  chunkIndex: number
  srcMark: string
}

interface AwatingHashChunkReceiving {
  chunkN: number
  timeout: number
  ok: () => void
  meh: () => void
}

export const REQUEST_TIMEOUT = 60_000
export const HASH_CHUNK_SIZE = 10_000

const pendingReceivedHashMsg = new Map<ID, ReceivedHashMsg>()
const sentHashMsgChunks = new Map<ID, AwatingHashChunkReceiving>()

export function getInstanceTypeMark(t?: InstanceType): string | undefined {
  switch (t) {
    case InstanceType.bg:
      return 'b'
    case InstanceType.group:
      return 'p'
    case InstanceType.url:
      return 'p'
    case InstanceType.sidebar:
      return 's'
  }
}

export function getRecvdHashMsg(chN: number, msgId: ID, srcMark: string, dstMark: string) {
  return `~!+.${chN}.${msgId}!${srcMark}!${dstMark}!~`
}

export async function encodeHashMsg(
  msg: T.Message<any, any>,
  srcType: InstanceType
): Promise<string[]> {
  const chunks: string[] = []
  const msgId = msg.id ?? uid()
  const hashMsgData = await compressStrToBase64(JSON.stringify(msg))
  const srcMark = getInstanceTypeMark(srcType)
  const dstMark = getInstanceTypeMark(msg.dstType)
  if (!srcMark) throw 'no src'
  if (!dstMark) throw 'no dst'

  let iStart = 0
  for (let i = 0; iStart < hashMsgData.length; i++) {
    const body = hashMsgData.substring(iStart, (iStart += HASH_CHUNK_SIZE))
    chunks.push(`~!${body}.${i}.${msgId}!${srcMark}!${dstMark}!~`)
  }
  return chunks
}

async function compressStrToBase64(s: string): Promise<string> {
  const cs = new CompressionStream('deflate-raw')
  const compressing = new Response(s).body?.pipeThrough(cs)
  const compressedBuf = await new Response(compressing).arrayBuffer()
  const compressedBytes = new Uint8Array(compressedBuf)
  const binString = Array.from(compressedBytes, byte => String.fromCodePoint(byte)).join('')
  return btoa(binString)
}

export async function decodeHashMsg<T extends InstanceType, A extends keyof T.Actions>(
  chunksInfo: ReceivedHashMsg
): Promise<T.Message<T, A>> {
  const msgBody = chunksInfo.chunks.reverse().join('')
  const msg = JSON.parse(await decompressBase64ToStr(msgBody)) as T.Message<T, A>
  msg.id = chunksInfo.msgId
  return msg
}

async function decompressBase64ToStr(base64: string): Promise<string> {
  const binString = atob(base64)
  const bytes = Uint8Array.from(binString, m => {
    const c = m.codePointAt(0)
    if (c === undefined) throw `"${m}".codePointAt() === undefined`
    return c
  })
  const ds = new DecompressionStream('deflate-raw')
  const decompressing = new Response(bytes).body?.pipeThrough(ds)
  const decompressedBuf = await new Response(decompressing).arrayBuffer()
  return new TextDecoder().decode(decompressedBuf)
}

export function parseHMChunk(url: string): ReceivedHashChunk | undefined {
  const reResult = PAGE_HASH_RE.exec(url)
  const chunkBody = reResult?.groups?.chunkBody
  const chunkNStr = reResult?.groups?.chunkN
  const srcMark = reResult?.groups?.srcMark
  const msgId = reResult?.groups?.msgId
  if (!chunkBody || !chunkNStr || !msgId || !srcMark) return

  let chunkN
  try {
    chunkN = parseInt(chunkNStr)
  } catch {
    return
  }

  return { msgId, chunk: chunkBody, chunkIndex: chunkN, srcMark }
}

export async function waitForHMReceivingConfirmation(msgId: ID, chunkN: number) {
  const s = sentHashMsgChunks.get(msgId)
  if (s) clearTimeout(s.timeout)

  return new Promise<void>((ok, meh) => {
    const timeout = setTimeout(() => {
      sentHashMsgChunks.delete(msgId)
      meh(`waitForHMReceivingConfirmation: timeout: msgId: ${msgId}, chunkN: ${chunkN}`)
    }, REQUEST_TIMEOUT)

    sentHashMsgChunks.set(msgId, { chunkN, timeout, ok, meh })
  })
}

export function confirmReceivingHMChunk(chunk: ReceivedHashChunk) {
  const c = sentHashMsgChunks.get(chunk.msgId)
  if (!c) return console.warn('confirmReceivingHMChunk: no such req, msgId:', chunk.msgId)

  clearTimeout(c.timeout)
  if (c.chunkN === chunk.chunkIndex) c.ok()
  else c.meh()

  sentHashMsgChunks.delete(chunk.msgId)
}

export function convertHMChunkToMsgAndRememberIt(chunk: ReceivedHashChunk): ReceivedHashMsg {
  let pendingMsg = pendingReceivedHashMsg.get(chunk.msgId)
  if (!pendingMsg) {
    pendingMsg = {
      msgId: chunk.msgId,
      chunks: [chunk.chunk],
      chunkIndex: chunk.chunkIndex,
      srcMark: chunk.srcMark,
    }
    if (chunk.chunkIndex > 0) pendingReceivedHashMsg.set(chunk.msgId, pendingMsg)
  } else {
    pendingMsg.chunkIndex = chunk.chunkIndex
    pendingMsg.chunks.push(chunk.chunk)
  }
  return pendingMsg
}

export function dropRememberedHashMsg(msgId: ID) {
  pendingReceivedHashMsg.delete(msgId)
}

export const TESTING = {
  encodeHashMsg,
  strToBase64: compressStrToBase64,
  decodeHashMsg,
  base64ToStr: decompressBase64ToStr,
  parseHashMsgChunk: parseHMChunk,
}
