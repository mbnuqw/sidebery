import SavedStateActions from './saved-state'

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

describe('SavedState actions', () => {
  test('load empty state', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return {}
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith('state')
    expect(state.panelIndex).toBeUndefined()
    expect(state.stateLoaded).toBe(true)
  })

  test('load state in private window', async () => {
    const state = {
      private: true,
    }
    browser.storage.local.get = jest.fn(() => {
      return { state: { panelIndex: 5 } }
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith('state')
    expect(state.panelIndex).toBeUndefined()
    expect(state.stateLoaded).toBe(true)
  })

  test('load state with negative panelIndex', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return { state: { panelIndex: -2 } }
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith('state')
    expect(state.panelIndex).toBeUndefined()
    expect(state.stateLoaded).toBe(true)
  })

  test('loadState', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return { state: { panelIndex: 0, synced: {} } }
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith('state')
    expect(state.panelIndex).toBe(0)
    expect(state.stateLoaded).toBe(true)
  })

  test('save unloaded state', async () => {
    const state = { stateLoaded: false }
    browser.storage.local.set = jest.fn()
    await SavedStateActions.saveState({ state })
    expect(browser.storage.local.set).not.toBeCalled()
  })

  test('saveState', async () => {
    const state = {
      panelIndex: 123,
      synced: 'asdf',
      stateLoaded: true,
    }
    browser.storage.local.set = jest.fn()

    await SavedStateActions.saveState({ state })
    expect(browser.storage.local.set).toBeCalledWith({
      state: {
        panelIndex: 123,
        synced: 'asdf',
      },
    })
  })
})