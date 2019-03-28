import SyncActions from './sync'

beforeEach(() => {
  browser.bookmarks = {}
  browser.commands = {}
  browser.contextualIdentities = {}
  browser.extension = {}
  browser.i18n = {}
  browser.proxy = {}
  browser.permissions = {}
  browser.storage = { local: {}, sync: {} }
  browser.tabs = {}
  browser.windows = {}
})

describe('loadLocalID', () => {
  test('load local id for the first time', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return {}
    })
    browser.storage.local.set = jest.fn()

    await SyncActions.loadLocalID({ state })
    expect(state.localID).toBeDefined()
    expect(browser.storage.local.set).toBeCalledWith({ id: state.localID })
  })

  test('load local id', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return { id: 'asdf' }
    })

    await SyncActions.loadLocalID({ state })
    expect(state.localID).toBe('asdf')
  })
})

describe('clearSyncData', () => {
  test('clear syncronization data', async () => {
    const state = {
      localID: 'asd',
    }
    browser.storage.sync.set = jest.fn()

    await SyncActions.clearSyncData({ state })
    expect(browser.storage.sync.set).toBeCalled()
  })
})

describe('saveSyncPanels', () => {
  test('try to save sync panels in private mode', async () => {
    const state = { private: true }
    browser.storage.sync.set = jest.fn()
    browser.storage.sync.remove = jest.fn()
    await SyncActions.saveSyncPanels({ state })
    expect(browser.storage.sync.set).not.toBeCalled()
    expect(browser.storage.sync.remove).not.toBeCalled()
  })

  test('save pinned tabs to sync storage', async () => {
    const state = {
      localID: '123',
      pinnedTabsSync: true,
    }
    const getters = {
      pinnedTabs: [
        {
          url: 'JKLUIOJKLM<>',
          cookieStoreId: 'firefox-default',
        },
        {
          url: 'about:newtab',
          cookieStoreId: 'firefox-default',
        },
        {
          url: '123456789654321',
          cookieStoreId: 'container-9999',
        },
      ],
      panels: [
        {
          type: 'default',
          id: 'firefox-default',
          cookieStoreId: 'firefox-default',
        },
        {
          type: 'ctx',
          id: 'container-9999',
          name: 'Some container',
          cookieStoreId: 'container-9999',
        },
      ],
    }
    let stored
    browser.storage.sync.set = jest.fn(data => {
      stored = JSON.parse(data['123'])
    })

    // Debouced call...
    await SyncActions.saveSyncPanels({ state, getters })
    await new Promise(r => setTimeout(r, 1000))

    expect(browser.storage.sync.set).toBeCalled()
    expect(stored.id).toBe('123')
    expect(stored.pinnedTabs[0].url).toBe('JKLUIOJKLM<>')
    expect(stored.pinnedTabs[0].ctx).toBe('default')
    expect(stored.pinnedTabs[1].url).toBe('123456789654321')
    expect(stored.pinnedTabs[1].ctx).toBe('Some container')
  })

  test('save panels to sync storage', async () => {
    const state = {
      localID: '123',
    }
    const getters = {
      pinnedTabs: [],
      panels: [
        {
          type: 'default',
          id: 'firefox-default',
          cookieStoreId: 'firefox-default',
          sync: true,
          tabs: [
            {
              url: 'JKLUIOJKLM<>',
              cookieStoreId: 'firefox-default',
            },
            {
              url: 'about:newtab',
              cookieStoreId: 'firefox-default',
            },
          ],
        },
        {
          type: 'ctx',
          id: 'container-9999',
          name: 'Some container',
          color: 'collllllllor',
          icon: 'bubibum',
          cookieStoreId: 'container-9999',
          sync: true,
          tabs: [
            {
              url: '123456789654321',
              cookieStoreId: 'container-9999',
            },
          ],
        },
      ],
    }
    let stored
    browser.storage.sync.set = jest.fn(data => {
      stored = JSON.parse(data['123'])
    })

    // Debouced call...
    await SyncActions.saveSyncPanels({ state, getters })
    await new Promise(r => setTimeout(r, 1000))

    expect(browser.storage.sync.set).toBeCalled()
    expect(stored.id).toBe('123')
    expect(stored.panels[0].cookieStoreId).toBe('firefox-default')
    expect(stored.panels[0].urls.length).toBe(1)
    expect(stored.panels[0].urls[0]).toBe('JKLUIOJKLM<>')
    expect(stored.panels[1].cookieStoreId).toBe('container-9999')
    expect(stored.panels[1].name).toBe('Some container')
    expect(stored.panels[1].color).toBe('collllllllor')
    expect(stored.panels[1].icon).toBe('bubibum')
    expect(stored.panels[1].urls.length).toBe(1)
    expect(stored.panels[1].urls[0]).toBe('123456789654321')
  })
})

describe('loadSyncPanels', () => {
  test('load sync panels', async () => {
    const state = {
      localID: '123',
    }
    const dispatch = jest.fn()
    const data456 = {
      id: '456',
      time: 1500,
      panels: [
        {
          cookieStoreId: 'firefox-default',
          urls: ['qwert']
        },
      ],
      pinnedTabs: [],
    }
    browser.storage.sync.get = jest.fn(() => {
      return { '456': JSON.stringify(data456) }
    })

    await SyncActions.loadSyncPanels({ state, dispatch })
    expect(state.lastSyncPanels).toEqual(data456)
    expect(dispatch).toBeCalledWith('updateSyncPanels', data456)
    expect(dispatch).toBeCalledWith('saveSynced')
  })
})

describe('resyncPanels', () => {
  test('resync panels', async () => {
    const state = {
      windowFocused: true,
      lastSyncPanels: '123456789',
    }
    const dispatch = jest.fn()

    await SyncActions.resyncPanels({ state, dispatch })
    expect(dispatch).toBeCalledWith('updateSyncPanels', '123456789')
  })
})

describe('updateSyncPanels', () => {
  test('update sync panels without sync data', async () => {
    const state = {}
    const getters = {
      panels: [],
    }
    browser.tabs.create = jest.fn()

    await SyncActions.updateSyncPanels({ state, getters })
    expect(browser.tabs.create).not.toBeCalled()
  })

  test('syncronized data is already used', async () => {
    const state = {
      localID: '123',
      synced: {
        '456': 1500,
      },
    }
    const getters = {
      panels: [],
    }
    browser.tabs.create = jest.fn()

    await SyncActions.updateSyncPanels({ state, getters }, { id: '456', time: 1500 })
    expect(browser.tabs.create).not.toBeCalled()
  })

  test('syncronize pinned tabs', async () => {
    const state = {
      windowId: 1,
      localID: '123',
      synced: {},
      pinnedTabsSync: true,
    }
    const getters = {
      pinnedTabs: [],
      defaultCtxId: 'firefox-default',
      panels: [
        {
          type: 'default',
          cookieStoreId: 'firefox-default',
          sync: false,
          tabs: [],
        },
        {
          type: 'ctx',
          cookieStoreId: 'container-456',
          name: 'Wah',
          sync: false,
          tabs: [],
        },
      ],
    }
    browser.tabs.create = jest.fn()

    await SyncActions.updateSyncPanels({ state, getters }, {
      id: '456',
      time: 1500,
      panels: [],
      pinnedTabs: [
        {
          url: 'asdf',
          ctx: 'default',
        },
        {
          url: 'about:newtab',
          ctx: 'default',
        },
        {
          url: '789',
          ctx: 'Wah',
        },
      ],
    })
    expect(state.synced['456']).toBe(1500)
    expect(browser.tabs.create).toBeCalledTimes(2)
    expect(browser.tabs.create).toBeCalledWith({
      windowId: 1,
      cookieStoreId: 'firefox-default',
      pinned: true,
      url: 'asdf',
      active: false,
    })
    expect(browser.tabs.create).toBeCalledWith({
      windowId: 1,
      cookieStoreId: 'container-456',
      pinned: true,
      url: '789',
      active: false,
    })
  })

  test('syncronize panels', async () => {
    const state = { windowId: 1, localID: '123', synced: {} }
    const getters = {
      pinnedTabs: [],
      defaultCtxId: 'firefox-default',
      panels: [
        {
          type: 'default',
          cookieStoreId: 'firefox-default',
          sync: true,
          tabs: [{ url: 'jkl' }],
        },
        {
          type: 'ctx',
          cookieStoreId: 'container-456',
          name: 'Wah',
          sync: true,
          tabs: [],
        },
        {
          type: 'ctx',
          cookieStoreId: 'container-999',
          name: 'MMM',
          sync: false,
          tabs: [],
        },
      ],
    }
    browser.tabs.create = jest.fn()
    browser.contextualIdentities.update = jest.fn()

    await SyncActions.updateSyncPanels({ state, getters }, {
      id: '456',
      time: 1500,
      panels: [
        {
          cookieStoreId: 'firefox-default',
          urls: ['jkl', 'uio'],
        },
        {
          cookieStoreId: 'container-h',
          name: 'Wah',
          color: 'collorw',
          icon: 'wicon',
          urls: ['yui'],
        },
        {
          cookieStoreId: 'container-g',
          name: 'MMM',
          color: 'aaa',
          icon: 'aaa',
          urls: ['oiu', 'pok'],
        },
      ],
      pinnedTabs: [],
    })
    expect(state.synced['456']).toBe(1500)
    expect(browser.contextualIdentities.update).toBeCalledTimes(1)
    expect(browser.tabs.create).toBeCalledTimes(2)
    expect(browser.tabs.create).toBeCalledWith({
      windowId: 1,
      cookieStoreId: 'firefox-default',
      url: 'uio',
      active: false,
    })
    expect(browser.tabs.create).toBeCalledWith({
      windowId: 1,
      cookieStoreId: 'container-456',
      url: 'yui',
      active: false,
    })
  })
})