import StylesActions from './styles'

beforeEach(() => {
  browser.bookmarks = {}
  browser.commands = {}
  browser.contextualIdentities = {}
  browser.extension = {}
  browser.i18n = {}
  browser.proxy = {}
  browser.permissions = {}
  browser.storage = { local: {} }
  browser.tabs = {}
  browser.windows = {}
})

describe('loadCSSVars', () => {
  test('load empty styles', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return {}
    })

    await StylesActions.loadCSSVars({ state })
    expect(state.cssVars).toBeUndefined()
  })
})

describe('saveCSSVars', () => {
  test('save styles', async () => {
    const state = {
      cssVars: {},
    }
    browser.storage.local.set = jest.fn()

    await StylesActions.saveCSSVars({ state })
    expect(browser.storage.local.set).toBeCalledWith({ styles: {} })
  })
})

describe('applyCSSVars', () => {
  test('apply styles', async () => {
    const state = {
      cssVars: {
        bg: '#123456',
      },
    }
    const rootEl = {
      style: {
        setProperty: jest.fn(),
      },
    }
    document.getElementById = jest.fn(() => rootEl)

    await StylesActions.applyCSSVars({ state }, { bg: '#456789' })
    expect(rootEl.style.setProperty).toBeCalledWith('--bg', '#456789')
  })
})

describe('setStyle', () => {
  test('set style', async () => {
    const state = {
      cssVars: {},
    }
    const rootEl = {
      style: { setProperty: jest.fn() },
    }
    document.getElementById = jest.fn(() => rootEl)

    await StylesActions.setCSSVar({ state }, { key: 'bg', val: '#456789' })
    expect(rootEl.style.setProperty).toBeCalledWith('--bg', '#456789')
  })
})

describe('removeCSSVar', () => {
  test('remove style', async () => {
    const state = {
      cssVars: {},
    }
    const rootEl = {
      style: { removeProperty: jest.fn() },
    }
    document.getElementById = jest.fn(() => rootEl)

    await StylesActions.removeCSSVar({ state }, 'bg')
    expect(rootEl.style.removeProperty).toBeCalledWith('--bg')
  })
})
