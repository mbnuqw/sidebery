/// <reference types="../src/types/web-ext.d.ts" />

import manifest from '../src/manifest.json'

class EventTarget<T> {
  addListener: (listener: T) => void
  removeListener: (listener: T) => void
  hasListener: (listener: T) => boolean
  constructor(conf?: Partial<EventTarget<T>>) {
    this.addListener = conf?.addListener ?? (() => {})
    this.removeListener = conf?.removeListener ?? (() => {})
    this.hasListener = conf?.hasListener ?? (() => false)
  }
}

void (function () {
  const MsgHandlers: ((a: any) => void)[] = []
  let StorageLocalData: Record<string, any> = {}

  ;(globalThis.browser as any) = {
    extension: {
      inIncognitoContext: false,
    },
    i18n: {
      getUILanguage: () => 'en_US',
    },
    bookmarks: {
      onCreated: new EventTarget(),
      onChanged: new EventTarget(),
      onMoved: new EventTarget(),
      onRemoved: new EventTarget(),
    },
    commands: {
      cmds: [],
      getAll: () => Promise.resolve([]),
    },
    cookies: {},
    contextualIdentities: {},
    proxy: {
      onRequest: {},
    },
    permissions: {},
    runtime: {
      getURL: (path: string) => {
        const base = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579'
        if (path.startsWith('/')) return base + path
        else return base + '/' + path
      },
      sendMessage: (msg: any) => MsgHandlers.map(h => h(msg)),
      getManifest: () => manifest,
      connect: (connectInfo: browser.runtime.ConnectInfo): browser.runtime.Port => {
        return {
          name: '',
          disconnect: () => {},
          onDisconnect: {
            addListener: (listener: any) => {},
            removeListener: (listener: any) => {},
          },
          onMessage: {
            addListener: (listener: any) => {},
            removeListener: (listener: any) => {},
          },
          postMessage: (msg: any) => {},
        }
      },
      onMessage: { addListener: (handler: any) => MsgHandlers.push(handler) },
    },
    sidebarAction: {
      setTitle: (conf: any) => {},
    },
    storage: {
      local: {
        data: {},
        set: (obj: {}) => {
          StorageLocalData = { ...StorageLocalData, ...obj }
          return Promise.resolve()
        },
        get: (key: any) => Promise.resolve({ [key]: StorageLocalData[key] }),
      },
      sync: {},
    },
    tabs: {
      create: () => Promise.resolve({}),
      captureTab: () => 'tab image',
    },
    windows: {},
  }
})()
