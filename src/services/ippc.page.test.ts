import { describe, expect, test } from 'vitest'
import { InstanceType } from 'src/enums'
import * as IPPC from './ippc'

describe('IPPC.parseHashMsgChunk()', () => {
  test('empty string', () => {
    const chunk = IPPC.TESTING.parseHashMsgChunk('')
    expect(chunk).toBe(undefined)
  })
  test('prefix,legacy,msg', () => {
    const url =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/url.html#some:id:legacy~!MSG-BASE_64==.0.123456789abc!b!p!~'
    const chunk = IPPC.TESTING.parseHashMsgChunk(url)
    expect(chunk?.chunk).toBe('MSG-BASE_64==')
    expect(chunk?.chunkIndex).toBe(0)
    expect(chunk?.msgId).toBe('123456789abc')
  })
  test('only message', () => {
    const url =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/url.html#~!MSG/BASE+64.654.-23456789_ab!s!p!~'
    const chunk = IPPC.TESTING.parseHashMsgChunk(url)
    expect(chunk?.chunk).toBe('MSG/BASE+64')
    expect(chunk?.chunkIndex).toBe(654)
    expect(chunk?.msgId).toBe('-23456789_ab')
  })
  test('hash part', () => {
    const url = '#~!MSG/BASE+64.654.abc123_-_jkl!p!b!~'
    const chunk = IPPC.TESTING.parseHashMsgChunk(url)
    expect(chunk?.chunk).toBe('MSG/BASE+64')
    expect(chunk?.chunkIndex).toBe(654)
    expect(chunk?.msgId).toBe('abc123_-_jkl')
  })
})

describe('IPPC.base64ToStr() / strToBase64()', () => {
  test('empty string', async () => {
    const b64 = await IPPC.TESTING.strToBase64('')
    const str = await IPPC.TESTING.base64ToStr(b64)
    expect(str).toBe('')
  })
  test('stuff', async () => {
    const b64 = await IPPC.TESTING.strToBase64('abc Ā 𐀀 文 🦄')
    const str = await IPPC.TESTING.base64ToStr(b64)
    expect(str).toBe('abc Ā 𐀀 文 🦄')
  })
})

describe('IPPC.encodeHashMsg() / decodeHashMsg()', () => {
  const reducer = (a: any, v: any) => {
    if (!v) return a
    a.chunkIndex = v.chunkIndex
    a.chunks.push(v.chunk)
    return a
  }
  test('one small chunk', async () => {
    const msgTo = { dstType: InstanceType.bg, action: 'test' }
    const chunks = await IPPC.TESTING.encodeHashMsg(msgTo, InstanceType.group)
    chunks.reverse()
    expect(chunks.length).toBe(1)
    const chunksInfo = chunks
      .map(c => IPPC.TESTING.parseHashMsgChunk('#' + c))
      .reduce(reducer, { msgId: 0, chunks: [] as string[], chunkIndex: 0 })
    expect(chunksInfo.chunkIndex).toBe(0)
    const msgFrom = await IPPC.TESTING.decodeHashMsg(chunksInfo)
    expect(msgFrom.action).toBe('test')
  })
  test('multiple chunks', async () => {
    let data = ''
    const dlen = IPPC.HASH_CHUNK_SIZE * 2
    while (data.length < dlen) {
      data += Math.random().toString()
    }
    const msgTo = { dstType: InstanceType.group, result: data }
    const chunks = await IPPC.TESTING.encodeHashMsg(msgTo, InstanceType.bg)
    chunks.reverse()
    expect(chunks.length).toBeGreaterThan(1)
    const chunksInfo = chunks
      .map(c => IPPC.TESTING.parseHashMsgChunk('#' + c))
      .reduce(reducer, { msgId: 0, chunks: [] as string[], chunkIndex: 0 })
    expect(chunksInfo.chunkIndex).toBe(0)
    const msgFrom = await IPPC.TESTING.decodeHashMsg(chunksInfo)
    expect(msgFrom.result).toBe(data)
  })
})
