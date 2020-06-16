declare namespace browser.runtime {
  function sendMessage<T>(msg: T): void
}

declare type WEPort = {
  name: string
  disconnect: () => void
  error: { message: string }
  onDisconnect: WEEventTarget<WEPortDisconnectListener>
  onMessage: WEEventTarget<WEPortMessageListener>
  postMessage: <T>(msg: T) => void
  sender?: { id?: string }
}

interface WEEventTarget<T> {
  addListener: <T>(listener: T) => void
  removeListener: <T>(listener: T) => void
}

type WEPortDisconnectListener = (port: WEPort) => void

type WEPortMessageListener = <T>(msg: T) => void
