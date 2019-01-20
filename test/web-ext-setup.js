const MsgHandlers = []

const browser = {
  bookmarks: {},
  extension: {
    inIncognitoContext: false,
  },
  i18n: {
    getUILanguage: () => 'en',
  },
  runtime: {
    sendMessage: msg => {
      MsgHandlers.map(h => h(msg))
    },
    onMessage: {
      addListener: handler => {
        MsgHandlers.push(handler)
      },
    },
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
  },
  tabs: {
    captureTab: () => 'tab image',
  },
  windows: {
    getCurrent() {
      return new Promise(res => {
        res({
          id: 123,
        })
      })
    },

    getAll({ populate } = {}) {
      return new Promise(res => {
        res([
          {
            id: 123,
            title: 'one',
            tabs: populate ? [{ id: 11, active: true }, { id: 12 }] : undefined,
          },
          {
            id: 1,
            title: 'two',
            focused: true,
            tabs: populate ? [{ id: 21, active: true }] : undefined,
          },
          {
            id: 2,
            title: 'three',
            tabs: populate ? [{ id: 31, active: true }] : undefined,
          },
        ])
      })
    },
  },
}

global.browser = browser
