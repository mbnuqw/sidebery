const MsgHandlers = []

const browser = {
  extension: {
    inIncognitoContext: false,
  },
  i18n: {
    getUILanguage: () => 'en',
  },
  runtime: {
    sendMessage: (msg) => {
      MsgHandlers.map(h => h(msg))
    },
    onMessage: {
      addListener: handler => {
        MsgHandlers.push(handler)
      },
    },
  },
  windows: {
    getCurrent() {
      return new Promise(res => {
        res({
          id: 123,
        })
      })
    },

    getAll() {
      return new Promise(res => {
        res([
          {
            id: 123,
          },
          {
            id: 1,
          },
          {
            id: 2,
          },
        ])
      })
    },
  },
}

global.browser = browser
