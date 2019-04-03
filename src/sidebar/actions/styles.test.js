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

describe('loadStyles', () => {
  test('load empty styles', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return {}
    })

    await StylesActions.loadStyles({ state })
    expect(state.customStyles).toBeUndefined()
  })

  test('load styles', async () => {
    const state = {
      customStyles: {
        bg: null,
      },
    }
    browser.storage.local.get = jest.fn(() => {
      return { styles: { bg: '#123456' } }
    })
    document.getElementById = jest.fn()

    await StylesActions.loadStyles({ state })
    expect(state.customStyles).toEqual({ bg: '#123456' })
  })
})

describe('saveStyles', () => {
  test('save styles', async () => {
    const state = {
      customStyles: {},
    }
    browser.storage.local.set = jest.fn()

    await StylesActions.saveStyles({ state })
    expect(browser.storage.local.set).toBeCalledWith({ styles: {} })
  })
})

describe('applyStyles', () => {
  test('apply styles', async () => {
    const state = {
      customStyles: {
        bg: '#123456',
      },
    }
    const rootEl = {
      style: {
        setProperty: jest.fn(),
      },
    }
    document.getElementById = jest.fn(() => rootEl)

    await StylesActions.applyStyles({ state }, { bg: '#456789' })
    expect(rootEl.style.setProperty).toBeCalledWith('--bg', '#456789')
  })
})

describe('setStyle', () => {
  test('set style', async () => {
    const state = {
      customStyles: {},
    }
    const rootEl = {
      style: { setProperty: jest.fn() },
    }
    document.getElementById = jest.fn(() => rootEl)

    await StylesActions.setStyle({ state }, { key: 'bg', val: '#456789' })
    expect(rootEl.style.setProperty).toBeCalledWith('--bg', '#456789')
  })
})

describe('removeStyle', () => {
  test('remove style', async () => {
    const state = {
      customStyles: {},
    }
    const rootEl = {
      style: { removeProperty: jest.fn() },
    }
    document.getElementById = jest.fn(() => rootEl)

    await StylesActions.removeStyle({ state }, 'bg')
    expect(rootEl.style.removeProperty).toBeCalledWith('--bg')
  })
})
