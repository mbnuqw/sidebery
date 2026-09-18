import { beforeEach, describe, expect, test, vi } from 'vitest'
import { InstanceType } from 'src/enums'
import { EXTERNAL_API_MESSAGE_TYPE, EXTERNAL_API_VERSION } from 'src/types'
import * as IPC from 'src/services/ipc'
import { handleMessage } from 'src/services/external-api.bg'

const request = {
  type: EXTERNAL_API_MESSAGE_TYPE,
  version: EXTERNAL_API_VERSION,
  method: 'get-state' as const,
  windowId: 12,
}
const sender = { id: 'consumer@example.com' }

describe('ExternalApi.handleMessage()', () => {
  beforeEach(() => {
    vi.mocked(IPC.isConnected).mockReturnValue(true)
    vi.mocked(IPC.sidebar).mockResolvedValue({
      result: { windowId: 12, panels: [], tabs: [] },
    })
  })

  test('ignores messages for other APIs', async () => {
    expect(await handleMessage({ type: 'other' }, sender)).toBeUndefined()
    expect(IPC.sidebar).not.toHaveBeenCalled()
  })

  test('rejects unsupported versions', async () => {
    const response = await handleMessage({ ...request, version: 2 }, sender)
    expect(response).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_VERSION' } })
  })

  test('reports unavailable sidebar windows', async () => {
    vi.mocked(IPC.isConnected).mockReturnValue(false)
    const response = await handleMessage(request, sender)
    expect(response).toMatchObject({ ok: false, error: { code: 'SIDEBAR_UNAVAILABLE' } })
    expect(IPC.isConnected).toHaveBeenCalledWith(InstanceType.sidebar, 12)
  })

  test('routes valid requests to the matching sidebar', async () => {
    const response = await handleMessage(request, sender)
    expect(IPC.sidebar).toHaveBeenCalledWith(12, 'externalApiRequest', request)
    expect(response).toEqual({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      ok: true,
      result: { windowId: 12, panels: [], tabs: [] },
    })
  })

  test('preserves errors returned by the sidebar handler', async () => {
    vi.mocked(IPC.sidebar).mockResolvedValue({
      error: { code: 'PANEL_NOT_FOUND', message: 'Cannot find tabs panel missing' },
    })

    const response = await handleMessage(request, sender)
    expect(response).toEqual({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      ok: false,
      error: { code: 'PANEL_NOT_FOUND', message: 'Cannot find tabs panel missing' },
    })
  })
})
