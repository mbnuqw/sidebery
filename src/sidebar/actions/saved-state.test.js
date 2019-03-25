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
    expect(browser.storage.local.get).toBeCalledWith(['panelIndex', 'synced'])
    expect(state.panelIndex).toBeUndefined()
  })

  test('load state in private window', async () => {
    const state = {
      private: true,
    }
    browser.storage.local.get = jest.fn(() => {
      return { panelIndex: 5 }
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith(['panelIndex', 'synced'])
    expect(state.panelIndex).toBeUndefined()
  })

  test('load state with negative panelIndex', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return {  panelIndex: -2 }
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith(['panelIndex', 'synced'])
    expect(state.panelIndex).toBeUndefined()
  })

  test('loadState', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return { panelIndex: 0, synced: {} }
    })

    await SavedStateActions.loadState({ state })
    expect(browser.storage.local.get).toBeCalledWith(['panelIndex', 'synced'])
    expect(state.panelIndex).toBe(0)
  })
})