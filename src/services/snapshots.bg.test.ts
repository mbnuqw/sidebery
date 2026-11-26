import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as Snapshots from './snapshots.bg'

describe('Snapshots.getSnapshotFileName <-> Snapshots.parseSnapshotFileName', () => {
  test('empty', () => {
    const info = Snapshots.TESTING.parseSnapshotFileName('')
    expect(info).toBe(undefined)
  })
  test('snapshot 1', () => {
    const time = Date.now()
    const id = '123'
    const name = Snapshots.TESTING.getSnapshotFileName({
      containers: {},
      id,
      sidebar: { nav: [], panels: {} },
      tabs: [],
      time,
    })
    const info = Snapshots.TESTING.parseSnapshotFileName(name)
    expect(info?.id).toBe(id)
    expect(info?.time).toBe(time)
    expect(info?.tabCount).toBe(0)
    expect(info?.winCount).toBe(0)
    expect(info?.auto).toBe(undefined)
  })
  test('snapshot 2', () => {
    const time = Date.now()
    const id = '123'
    const name = Snapshots.TESTING.getSnapshotFileName({
      containers: {},
      id,
      sidebar: { nav: [], panels: {} },
      tabs: [],
      time,
      auto: true,
    })
    const info = Snapshots.TESTING.parseSnapshotFileName(name)
    expect(info?.id).toBe(id)
    expect(info?.time).toBe(time)
    expect(info?.tabCount).toBe(0)
    expect(info?.winCount).toBe(0)
    expect(info?.auto).toBe(true)
  })
})

describe('Snapshots.SnapshotFileList', () => {
  test('add/remove', async () => {
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '0-123-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 123, name: '0-123-0-0-m.json', lastModified: 0 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(1)
    Snapshots.TESTING.SnapshotFileList.clear()
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(0)
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '0-123-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 123, name: '0-123-0-0-m.json', lastModified: 0 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(1)
    Snapshots.TESTING.SnapshotFileList.removeById('123')
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(0)
  })

  test('add multiple, sorting', async () => {
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '0-123-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 123, name: '0-123-0-0-m.json', lastModified: 0 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(1)
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '8-234-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 321, name: '3-234-0-0-m.json', lastModified: 8 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(2)
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '4-345-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 32, name: '2-345-0-0-m.json', lastModified: 4 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.files[0].id).toBe('234')
    expect(Snapshots.TESTING.SnapshotFileList.files[1].id).toBe('345')
    expect(Snapshots.TESTING.SnapshotFileList.files[2].id).toBe('123')
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(3)
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '1-abc-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 328, name: '1-abc-0-0-m.json', lastModified: 1 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.files[0].id).toBe('234')
    expect(Snapshots.TESTING.SnapshotFileList.files[1].id).toBe('345')
    expect(Snapshots.TESTING.SnapshotFileList.files[2].id).toBe('abc')
    expect(Snapshots.TESTING.SnapshotFileList.files[3].id).toBe('123')
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(4)
    Snapshots.TESTING.SnapshotFileList.add(
      new Snapshots.TESTING.SnapshotFile({
        kind: 'file',
        name: '7-ddd-0-0-m.json',
        getFile: () =>
          new Promise(ok => ok({ size: 328, name: '7-ddd-0-0-m.json', lastModified: 7 } as File)),
      } as FileSystemFileHandle)
    )
    expect(Snapshots.TESTING.SnapshotFileList.files[0].id).toBe('234')
    expect(Snapshots.TESTING.SnapshotFileList.files[1].id).toBe('ddd')
    expect(Snapshots.TESTING.SnapshotFileList.files[2].id).toBe('345')
    expect(Snapshots.TESTING.SnapshotFileList.files[3].id).toBe('abc')
    expect(Snapshots.TESTING.SnapshotFileList.files[4].id).toBe('123')
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(5)
    Snapshots.TESTING.SnapshotFileList.clear()
    expect(Snapshots.TESTING.SnapshotFileList.len).toBe(0)
  })
})
