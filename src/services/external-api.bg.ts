import type * as T from 'src/types'
import { EXTERNAL_API_MESSAGE_TYPE, EXTERNAL_API_VERSION } from 'src/types'
import { InstanceType } from 'src/enums'
import * as IPC from 'src/services/ipc'

function error(code: string, message: string): T.ExternalApiResponse {
  return {
    type: EXTERNAL_API_MESSAGE_TYPE,
    version: EXTERNAL_API_VERSION,
    ok: false,
    error: { code, message },
  }
}

function isExternalApiRequest(value: unknown): value is T.ExternalApiRequest {
  if (!value || typeof value !== 'object') return false
  return (value as { type?: unknown }).type === EXTERNAL_API_MESSAGE_TYPE
}

export async function handleMessage(
  message: unknown,
  sender: browser.runtime.Sender
): Promise<T.ExternalApiResponse | undefined> {
  if (!isExternalApiRequest(message)) return
  if (!sender.id) return error('INVALID_SENDER', 'The request must come from another extension')
  if (message.version !== EXTERNAL_API_VERSION) {
    return error(
      'UNSUPPORTED_VERSION',
      `Unsupported API version ${String(message.version)}; expected ${EXTERNAL_API_VERSION}`
    )
  }
  if (!Number.isInteger(message.windowId)) {
    return error('INVALID_WINDOW', 'windowId must be an integer')
  }
  if (!IPC.isConnected(InstanceType.sidebar, message.windowId)) {
    return error('SIDEBAR_UNAVAILABLE', `Sidebery is not connected to window ${message.windowId}`)
  }

  try {
    const response = await IPC.sidebar(message.windowId, 'externalApiRequest', message)
    if (response.error) return error(response.error.code, response.error.message)
    return {
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      ok: true,
      result: response.result,
    }
  } catch (err) {
    return error('REQUEST_FAILED', String(err))
  }
}

export function setupListener(): void {
  browser.runtime.onMessageExternal.addListener(handleMessage)
}
