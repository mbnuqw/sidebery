const MsgHandlers = []

const browser = {
  bookmarks: {},
  commands: {
    cmds: [],
    getAll: () => Promise.resolve(browser.commands.cmds),
  },
  cookies: {},
  contextualIdentities: {},
  extension: {
    inIncognitoContext: false,
  },
  i18n: {
    getUILanguage: () => 'en',
  },
  proxy: {
    onRequest: {},
  },
  permissions: {},
  runtime: {
    sendMessage: msg => MsgHandlers.map(h => h(msg)),
    onMessage: { addListener: handler => MsgHandlers.push(handler) },
  },
  storage: {
    local: {
      data: {},
      set: obj => {
        browser.storage.local.data = { ...browser.storage.local.data, ...obj }
        return Promise.resolve()
      },
      get: key => Promise.resolve({ [key]: browser.storage.local.data[key] }),
    },
    sync: {},
  },
  tabs: {
    captureTab: () => 'tab image',
  },
  windows: {},
}

global.browser = browser
