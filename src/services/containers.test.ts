import { describe, expect, test } from 'vitest'
import * as Containers from 'src/services/containers'
import * as Utils from 'src/utils'
import { DEFAULT_CONTAINER } from 'src/defaults'

describe('Containers.getCPID and Containers.parseCPID', () => {
  test('norm container', () => {
    const container = Utils.clone(DEFAULT_CONTAINER)
    container.color = 'blue'
    container.icon = 'fingerprint'
    container.name = '123'
    const cpid = Containers.getCPID(container)
    const info = Containers.parseCPID(cpid)
    expect(info?.color).toBe('blue')
    expect(info?.icon).toBe('fingerprint')
    expect(info?.name).toBe('123')
  })
  test('convert cyan to turquoise', () => {
    const container = Utils.clone(DEFAULT_CONTAINER)
    container.color = 'cyan'
    container.icon = 'fingerprint'
    container.name = '123'
    const cpid = Containers.getCPID(container)
    const info = Containers.parseCPID(cpid)
    expect(info?.color).toBe('turquoise')
    expect(info?.icon).toBe('fingerprint')
    expect(info?.name).toBe('123')
  })
  test('convert gray to toolbar', () => {
    const container = Utils.clone(DEFAULT_CONTAINER)
    container.color = 'gray'
    container.icon = 'fingerprint'
    container.name = '123'
    const cpid = Containers.getCPID(container)
    const info = Containers.parseCPID(cpid)
    expect(info?.color).toBe('toolbar')
    expect(info?.icon).toBe('fingerprint')
    expect(info?.name).toBe('123')
  })
})
