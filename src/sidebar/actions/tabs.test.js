jest.mock('../event-bus', () => {
  return { $emit: jest.fn() }
})
import TabsActions from './tabs'
import EventBus from '../event-bus'

beforeEach(() => {
  browser.bookmarks = {}
  browser.commands = {}
  browser.cookies = {}
  browser.contextualIdentities = {}
  browser.extension = {}
  browser.i18n = {}
  browser.proxy = {}
  browser.permissions = {}
  browser.storage = { local: {}, sync: {} }
  browser.tabs = {}
  browser.windows = {}
})

describe('loadTabs', () => {
  test('initial tabs loading with normalization', async () => {
    const state = {
      containers: [],
      tabs: [],
    }
    const getters = {
      defaultCtxId: 'firefox-default',
    }
    browser.windows.WINDOW_ID_CURRENT = 1
    browser.tabs.query = jest.fn(() => {
      return [
        { id: 1, index: 0, cookieStoreId: 'firefox-default', pinned: true, url: 'aaa' },
        { id: 2, index: 1, cookieStoreId: 'firefox-default', pinned: false, url: 'bbb' },
      ]
    })
    browser.tabs.move = jest.fn()

    await TabsActions.loadTabs({ state, getters })
    expect(state.tabs.length).toBe(2)
    expect(state.tabs[0].isParent).toBe(false)
    expect(state.tabs[0].folded).toBe(false)
    expect(state.tabs[0].parentId).toBe(-1)
    expect(state.tabs[0].invisible).toBe(false)
    expect(state.tabs[0].lvl).toBe(0)
    expect(browser.tabs.move).not.toBeCalled()
  })

  test('tabs loading with ordering correction', async () => {
    const state = {
      containers: [
        { type: 'ctx', cookieStoreId: 'container-A' },
        { type: 'ctx', cookieStoreId: 'container-B' },
      ],
      tabs: [],
    }
    const getters = {
      defaultCtxId: 'firefox-default',
    }
    browser.windows.WINDOW_ID_CURRENT = 1
    browser.tabs.query = jest.fn(() => {
      return [
        { id: 1, index: 0, cookieStoreId: 'firefox-default', pinned: true, url: 'aaa' },
        { id: 2, index: 1, cookieStoreId: 'firefox-default', pinned: false, url: 'bbb' },
        { id: 3, index: 2, cookieStoreId: 'container-B', pinned: false, url: 'ccc' },
        { id: 4, index: 3, cookieStoreId: 'container-A', pinned: false, url: 'ddd' },
        { id: 5, index: 4, cookieStoreId: 'firefox-default', pinned: false, url: 'eee' },
      ]
    })
    browser.tabs.move = jest.fn()

    await TabsActions.loadTabs({ state, getters })
    expect(state.tabs.length).toBe(5)
    expect(browser.tabs.move).toBeCalledTimes(2)
    expect(browser.tabs.move).toBeCalledWith(5, { index: 2 })
    expect(browser.tabs.move).toBeCalledWith(4, { index: 3 })
  })

  test('load tabs tree', async () => {
    const state = {
      tabsTree: true,
      containers: [
        { type: 'ctx', cookieStoreId: 'container-A' },
        { type: 'ctx', cookieStoreId: 'container-B' },
      ],
      tabs: [],
    }
    const getters = {
      defaultCtxId: 'firefox-default',
    }
    browser.windows.WINDOW_ID_CURRENT = 1
    browser.tabs.query = jest.fn(() => {
      return [
        { id: 1, index: 0, cookieStoreId: 'firefox-default', pinned: true, url: 'aaa' },
        { id: 2, index: 1, cookieStoreId: 'firefox-default', pinned: false, url: 'bbb' },
        { id: 5, index: 2, cookieStoreId: 'firefox-default', pinned: false, url: 'eee' },
        { id: 4, index: 3, cookieStoreId: 'container-A', pinned: false, url: 'ddd' },
        { id: 6, index: 4, cookieStoreId: 'container-A', pinned: false, url: 'kkk' },
        { id: 7, index: 5, cookieStoreId: 'container-A', pinned: false, url: '999' },
        { id: 3, index: 6, cookieStoreId: 'container-B', pinned: false, url: 'ccc' },
      ]
    })
    browser.tabs.move = jest.fn()
    browser.storage.local.get = jest.fn(() => {
      return {
        tabsTreeState: [
          {
            id: 12,
            index: 1,
            ctx: 'firefox-default',
            pinned: false,
            url: 'bbb',
            isParent: true,
            folded: false,
            parentId: -1,
          },
          {
            id: 15,
            index: 2,
            ctx: 'firefox-default',
            pinned: false,
            url: 'eee',
            isParent: false,
            folded: false,
            parentId: 12,
          },
          {
            id: 14,
            index: 3,
            ctx: 'container-A',
            pinned: false,
            url: 'ddd',
            isParent: true,
            folded: false,
            parentId: -1,
          },
          {
            id: 148,
            index: 4,
            ctx: 'container-A',
            pinned: false,
            url: 'kkk',
            isParent: true,
            folded: true,
            parentId: 14,
          },
          {
            id: 5486,
            index: 5,
            ctx: 'container-A',
            pinned: false,
            url: '999',
            isParent: false,
            folded: false,
            parentId: 148,
          },
        ],
      }
    })

    // tab       -
    //   tab
    // tab       -
    //   tab     < (folded)
    //    ~tab~    (invisible)

    await TabsActions.loadTabs({ state, getters })
    expect(state.tabs.length).toBe(7)

    expect(state.tabs[1].isParent).toBe(true)
    expect(state.tabs[1].folded).toBe(false)
    expect(state.tabs[2].parentId).toBe(2)
    expect(state.tabs[2].invisible).toBe(false)

    expect(state.tabs[3].isParent).toBe(true)
    expect(state.tabs[3].folded).toBe(false)
    expect(state.tabs[4].parentId).toBe(4)
    expect(state.tabs[4].folded).toBe(true)
    expect(state.tabs[4].invisible).toBe(false)
    expect(state.tabs[5].parentId).toBe(6)
    expect(state.tabs[5].invisible).toBe(true)
  })
})

describe('saveTabsTree', () => {
  test('save tabs tree', async () => {
    const state = {
      tabs: [
        { id: 1, index: 0, cookieStoreId: 'asdf', url: 'a' },
        { id: 2, index: 0, cookieStoreId: 'asdf', url: 'a', isParent: true, folded: false },
        {
          id: 3,
          index: 0,
          cookieStoreId: 'asdf',
          url: 'a',
          isParent: true,
          parentId: 2,
          folded: true,
        },
        { id: 4, index: 0, cookieStoreId: 'asdf', url: 'a', isParent: false, parentId: 3 },
      ],
    }
    browser.storage.local.set = jest.fn()

    await TabsActions.saveTabsTree({ state }, 1)
    await new Promise(r => setTimeout(r, 100))
    expect(browser.storage.local.set).toBeCalledWith({
      tabsTreeState: [
        { id: 2, index: 0, url: 'a', ctx: 'asdf', isParent: true, folded: false },
        { id: 3, index: 0, url: 'a', ctx: 'asdf', isParent: true, parentId: 2, folded: true },
        { id: 4, index: 0, url: 'a', ctx: 'asdf', isParent: false, parentId: 3 },
      ],
    })
  })
})

describe('createTab', () => {
  test('create tab without ctx', async () => {
    const state = {}
    const getters = {}
    browser.tabs.create = jest.fn()

    await TabsActions.createTab({ state, getters })
    expect(browser.tabs.create).not.toBeCalled()
  })

  test('create tab in wrong panel', async () => {
    const state = {}
    const getters = { panels: [] }
    browser.tabs.create = jest.fn()

    await TabsActions.createTab({ state, getters }, 'bbb')
    expect(browser.tabs.create).not.toBeCalled()
  })

  test('create tab in panel without tabs', async () => {
    const state = {}
    const getters = {
      panels: [
        {
          cookieStoreId: 'bbb',
          tabs: undefined,
        },
      ],
    }
    browser.tabs.create = jest.fn()

    await TabsActions.createTab({ state, getters }, 'bbb')
    expect(browser.tabs.create).not.toBeCalled()
  })

  test('create tab', async () => {
    const state = {
      windowId: 2,
    }
    const getters = {
      panels: [
        {
          cookieStoreId: 'bbb',
          startIndex: 0,
          endIndex: 0,
          tabs: [],
        },
      ],
    }
    browser.tabs.create = jest.fn()

    await TabsActions.createTab({ state, getters }, 'bbb')
    expect(browser.tabs.create).toBeCalledWith({
      index: 0,
      cookieStoreId: 'bbb',
      windowId: 2,
    })
  })
})

describe('removeTab', () => {
  test('remove tab from wrong panel', async () => {
    const state = {}
    const getters = {
      panels: [],
    }
    const dispatch = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.removeTab({ state, getters, dispatch }, { id: 1, cookieStoreId: 'a' })
    expect(browser.tabs.remove).not.toBeCalled()
  })

  test('remove tab from panel with locked tabs', async () => {
    const state = {}
    const getters = {
      panels: [
        {
          cookieStoreId: 'a',
          lockedTabs: true,
          tabs: [
            {
              id: 1,
              cookieStoreId: 'a',
              url: 'abc',
            },
          ],
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.removeTab(
      { state, getters, dispatch },
      {
        id: 1,
        cookieStoreId: 'a',
        url: 'abc',
      }
    )
    expect(browser.tabs.remove).not.toBeCalled()
  })

  test('remove tab', async () => {
    const state = {}
    const getters = {
      panels: [
        {},
        {
          id: 'a',
          cookieStoreId: 'a',
          noEmpty: true,
          tabs: [
            {
              id: 1,
              cookieStoreId: 'a',
              url: 'abc',
              isParent: true,
              folded: true,
            },
          ],
        },
      ],
    }
    browser.tabs.remove = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.update = jest.fn()

    await TabsActions.removeTab(
      { state, getters },
      {
        id: 1,
        cookieStoreId: 'a',
        url: 'abc',
        isParent: true,
        folded: true,
      }
    )
    // Create new tab if remove the last one in noEmpty panel
    expect(browser.tabs.create).toBeCalledWith({ cookieStoreId: 'a' })
    // No activation
    expect(browser.tabs.update).not.toBeCalled()
    // Remove tabs
    expect(browser.tabs.remove).toBeCalledWith(1)
  })
})

describe('removeTabs', () => {
  test('remove tabs (without panel)', async () => {
    const state = {
      tabs: [
        {
          id: 1,
          cookieStoreId: 'a',
          url: 'abc',
        },
        {
          id: 2,
          cookieStoreId: 'a',
          url: '456',
        },
      ],
    }
    const getters = {
      panels: [],
    }
    browser.tabs.remove = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.update = jest.fn()

    await TabsActions.removeTabs({ state, getters }, [1, 2])
    expect(browser.tabs.remove).toBeCalledWith([1, 2])
  })

  test('remove tabs', async () => {
    const state = {
      tabs: [
        {
          id: 1,
          cookieStoreId: 'a',
          url: 'abc',
          folded: true,
        },
        {
          id: 2,
          cookieStoreId: 'a',
          url: '456',
        },
      ],
    }
    const getters = {
      panels: [
        {
          id: 'a',
          cookieStoreId: 'a',
          noEmpty: true,
          tabs: state.tabs,
        },
      ],
    }
    browser.tabs.remove = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.update = jest.fn()

    await TabsActions.removeTabs({ state, getters }, [1, 2])
    expect(browser.tabs.remove).toBeCalledWith([1, 2])
    expect(browser.tabs.create).toBeCalledWith({ active: true })
    expect(browser.tabs.update).not.toBeCalled()
  })

  test('remove locked tabs', async () => {
    const state = {
      tabs: [
        {
          id: 1,
          cookieStoreId: 'a',
          url: 'abc',
          folded: true,
        },
        {
          id: 2,
          cookieStoreId: 'a',
          url: '456',
        },
      ],
    }
    const getters = {
      panels: [
        {
          id: 'a',
          cookieStoreId: 'a',
          lockedTabs: true,
          tabs: state.tabs,
        },
      ],
    }
    browser.tabs.remove = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.update = jest.fn()

    await TabsActions.removeTabs({ state, getters }, [1, 2])
    expect(browser.tabs.remove).toBeCalledWith([])
  })
})

describe('switchTab', () => {
  test('switch tab in the middle of pause', async () => {
    const state = { switchTabPause: 123 }
    const getters = {}
    browser.tabs.update = jest.fn()

    await TabsActions.switchTab({ state, getters }, {})
    expect(browser.tabs.update).not.toBeCalled()
  })

  test('switch to next tab', async () => {
    const state = {
      tabs: [
        { id: 1, cookieStoreId: 'a', url: 'abc' },
        { id: 2, cookieStoreId: 'a', url: '456', active: true },
        { id: 3, cookieStoreId: 'a', url: '123' },
      ],
    }
    const getters = {
      panels: [
        {
          id: 'a',
          cookieStoreId: 'a',
          lockedTabs: true,
          tabs: state.tabs,
        },
      ],
    }
    const ctx = { state, getters }

    browser.tabs.update = jest.fn()
    await TabsActions.switchTab(ctx, { globaly: true, cycle: true, step: 1, pinned: false })
    expect(browser.tabs.update).toBeCalledWith(3, { active: true })
  })

  test('switch to prev tab', async () => {
    const state = {
      tabs: [
        { id: 1, cookieStoreId: 'a', url: 'abc' },
        { id: 2, cookieStoreId: 'a', url: '456', active: true },
        { id: 3, cookieStoreId: 'a', url: '123' },
      ],
    }
    const getters = {
      panels: [
        {
          id: 'a',
          cookieStoreId: 'a',
          lockedTabs: true,
          tabs: state.tabs,
        },
      ],
    }
    const ctx = { state, getters }

    browser.tabs.update = jest.fn()
    await TabsActions.switchTab(ctx, { globaly: true, cycle: true, step: -1, pinned: false })
    expect(browser.tabs.update).toBeCalledWith(1, { active: true })
  })

  test('switch cycled to next tab with step 2', async () => {
    const state = {
      tabs: [
        { id: 1, cookieStoreId: 'a', url: 'abc' },
        { id: 2, cookieStoreId: 'a', url: '456', active: true },
        { id: 3, cookieStoreId: 'a', url: '123' },
      ],
    }
    const getters = {
      panels: [
        {
          id: 'a',
          cookieStoreId: 'a',
          lockedTabs: true,
          tabs: state.tabs,
        },
      ],
    }
    const ctx = { state, getters }

    browser.tabs.update = jest.fn()
    await TabsActions.switchTab(ctx, { globaly: true, cycle: true, step: 2, pinned: false })
    expect(browser.tabs.update).toBeCalledWith(1, { active: true })
  })
})

describe('reloadTabs', () => {
  test('reload tabs', async () => {
    const state = {
      tabs: [{ id: 1 }, { id: 2 }, { id: 3 }],
    }
    browser.tabs.reload = jest.fn()

    await TabsActions.reloadTabs({ state }, [2, 3, 4])
    expect(browser.tabs.reload).toBeCalledTimes(2)
  })
})

describe('discardTabs', () => {
  test('discard tabs', async () => {
    browser.tabs.discard = jest.fn()

    await TabsActions.discardTabs({}, [2, 3])
    expect(browser.tabs.discard).toBeCalledWith([2, 3])
  })
})

describe('activateLastActiveTabOf', () => {
  test('no panel', async () => {
    const getters = {
      panels: [],
    }
    browser.tabs.update = jest.fn()

    await TabsActions.activateLastActiveTabOf({ getters }, 0)
    expect(browser.tabs.update).not.toBeCalled()
  })

  test('activate invisible tab', async () => {
    const getters = {
      panels: [
        {
          lastActiveTab: 2,
          tabs: [{ id: 1 }, { id: 2, invisible: true }],
        },
      ],
    }
    browser.tabs.update = jest.fn()

    await TabsActions.activateLastActiveTabOf({ getters }, 0)
    expect(browser.tabs.update).toBeCalledWith(2, { active: true })
  })
})

describe('pinTabs', () => {
  test('pin tabs', async () => {
    browser.tabs.update = jest.fn()
    await TabsActions.pinTabs({}, [1, 2, 3])
    expect(browser.tabs.update).toBeCalledTimes(3)
    expect(browser.tabs.update).toHaveBeenLastCalledWith(3, { pinned: true })
  })

  test('unpin tabs', async () => {
    browser.tabs.update = jest.fn()
    await TabsActions.unpinTabs({}, [1, 2, 3])
    expect(browser.tabs.update).toBeCalledTimes(3)
    expect(browser.tabs.update).toHaveBeenLastCalledWith(3, { pinned: false })
  })

  test('pin or unpin tabs', async () => {
    const state = {
      tabs: [{ id: 1, pinned: false }, { id: 2, pinned: true }],
    }
    browser.tabs.update = jest.fn()
    await TabsActions.repinTabs({ state }, [1, 2, 3])
    expect(browser.tabs.update).toBeCalledTimes(2)
    expect(browser.tabs.update.mock.calls[0][1]).toEqual({ pinned: true })
    expect(browser.tabs.update).toHaveBeenLastCalledWith(2, { pinned: false })
  })
})

describe('muteTabs', () => {
  test('mute tabs', async () => {
    browser.tabs.update = jest.fn()
    await TabsActions.muteTabs({}, [1, 2, 3])
    expect(browser.tabs.update).toBeCalledTimes(3)
    expect(browser.tabs.update).toHaveBeenLastCalledWith(3, { muted: true })
  })

  test('unmute tabs', async () => {
    browser.tabs.update = jest.fn()
    await TabsActions.unmuteTabs({}, [1, 2, 3])
    expect(browser.tabs.update).toBeCalledTimes(3)
    expect(browser.tabs.update).toHaveBeenLastCalledWith(3, { muted: false })
  })

  test('mute or unmute tabs', async () => {
    const state = {
      tabs: [{ id: 1, mutedInfo: { muted: false } }, { id: 2, mutedInfo: { muted: true } }],
    }
    browser.tabs.update = jest.fn()
    await TabsActions.remuteTabs({ state }, [1, 2, 3])
    expect(browser.tabs.update).toBeCalledTimes(2)
    expect(browser.tabs.update.mock.calls[0][1]).toEqual({ muted: true })
    expect(browser.tabs.update).toHaveBeenLastCalledWith(2, { muted: false })
  })
})

describe('duplicateTabs', () => {
  test('duplicate tabs', async () => {
    const state = {
      tabs: [{ id: 1 }, { id: 2 }, { id: 3 }],
    }
    browser.tabs.duplicate = jest.fn()
    await TabsActions.duplicateTabs({ state }, [2, 3, 4])
    expect(browser.tabs.duplicate).toBeCalledTimes(2)
    expect(browser.tabs.duplicate).toHaveBeenLastCalledWith(3)
  })
})

describe('bookmarkTabs', () => {
  test('bookmark tabs', async () => {
    const state = {
      tabs: [{ id: 1 }, { id: 2, title: 'a', url: 'b' }, { id: 3, title: 'c', url: 'd' }],
    }
    browser.bookmarks.create = jest.fn()
    await TabsActions.bookmarkTabs({ state }, [2, 3, 4])
    expect(browser.bookmarks.create).toBeCalledTimes(2)
    expect(browser.bookmarks.create).toHaveBeenLastCalledWith({ title: 'c', url: 'd' })
  })
})

describe('clearTabsCookies', () => {
  test('clear cookies', async () => {
    const state = {
      tabs: [
        { id: 1 },
        { id: 2, title: 'a', url: 'http://some.com' },
        { id: 3, title: 'c', url: 'https://just.com' },
        { id: 4, title: 'd', url: 'about:newtab' },
      ],
    }
    EventBus.$emit = jest.fn()
    browser.permissions.contains = jest.fn(() => true)
    browser.cookies.getAll = jest.fn(() => [{ name: 'abc' }])
    browser.cookies.remove = jest.fn()

    await TabsActions.clearTabsCookies({ state }, [2, 3, 4, 5])
    await new Promise(r => setTimeout(r, 500))
    expect(browser.cookies.getAll).toBeCalledTimes(4)
    expect(browser.cookies.remove).toBeCalledTimes(4)
    expect(EventBus.$emit).toBeCalledTimes(6)
    expect(EventBus.$emit.mock.calls[0][0]).toBe('tabLoadingStart')
    expect(EventBus.$emit.mock.calls[1][0]).toBe('tabLoadingStart')
    expect(EventBus.$emit.mock.calls[2][0]).toBe('tabLoadingStart')
    expect(EventBus.$emit.mock.calls[3][0]).toBe('tabLoadingErr')
    expect(EventBus.$emit.mock.calls[4][0]).toBe('tabLoadingOk')
    expect(EventBus.$emit.mock.calls[5][0]).toBe('tabLoadingOk')
  })
})

describe('moveTabsToNewWin', () => {
  test('do nothing if cannot find tab', async () => {
    const state = {
      tabs: [],
    }
    browser.windows.create = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.moveTabsToNewWin({ state }, { tabIds: [2, 3, 4, 5] })
    expect(browser.windows.create).not.toBeCalled()
    expect(browser.tabs.move).not.toBeCalled()
    expect(browser.tabs.create).not.toBeCalled()
    expect(browser.tabs.remove).not.toBeCalled()
  })

  test('move tabs to new window with same private status', async () => {
    const state = {
      private: false,
      tabs: [{ id: 1, url: 'asdf' }, { id: 2, url: 'asdf' }],
    }
    browser.windows.create = jest.fn(() => {
      return { id: 123 }
    })
    browser.tabs.move = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.moveTabsToNewWin({ state }, { tabIds: [1, 2, 3], incognito: false })

    expect(browser.windows.create).toBeCalledWith({ tabId: 1, incognito: false })
    expect(browser.tabs.move).toBeCalledWith([2, 3], { windowId: 123, index: -1 })
  })

  test('move tabs to new window with different private status', async () => {
    const state = {
      private: false,
      tabs: [{ id: 1, url: 'asdf' }, { id: 2, url: 'qwer' }],
    }
    browser.windows.create = jest.fn(() => {
      return { id: 123 }
    })
    browser.tabs.move = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.moveTabsToNewWin({ state }, { tabIds: [1, 2, 3], incognito: true })

    expect(browser.windows.create).toBeCalledWith({ url: 'asdf', incognito: true })
    expect(browser.tabs.create).toBeCalledWith({ windowId: 123, url: 'qwer' })
    expect(browser.tabs.remove).toBeCalledTimes(2)
    expect(browser.tabs.remove.mock.calls[0][0]).toBe(1)
    expect(browser.tabs.remove.mock.calls[1][0]).toBe(2)
  })
})

describe('moveTabsToWin', () => {
  test('move tabs to window with same private status', async () => {
    const state = {
      private: false,
      tabs: [{ id: 1, url: 'asdf' }, { id: 2, url: 'qwer' }],
    }
    const dispatch = jest.fn(name => {
      if (name === 'chooseWin') return 123
      if (name === 'getAllWindows') return [{ id: 1 }, { id: 12 }, { id: 123, incognito: false }]
    })
    browser.tabs.move = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.moveTabsToWin({ state, dispatch }, { tabIds: [1, 2, 3] })
    expect(browser.tabs.move).toBeCalledWith([1, 2, 3], { windowId: 123, index: -1 })
    expect(browser.tabs.create).not.toBeCalled()
    expect(browser.tabs.remove).not.toBeCalled()
  })

  test('move tabs to window with different private status', async () => {
    const state = {
      private: false,
      tabs: [{ id: 1, url: 'asdf' }, { id: 2, url: 'qwer' }],
    }
    const dispatch = jest.fn(name => {
      if (name === 'chooseWin') return 123
      if (name === 'getAllWindows') return [{ id: 1 }, { id: 12 }, { id: 123, incognito: true }]
    })
    browser.tabs.move = jest.fn()
    browser.tabs.create = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.moveTabsToWin({ state, dispatch }, { tabIds: [1, 2, 3] })
    expect(browser.tabs.move).not.toBeCalled()
    expect(browser.tabs.create).toBeCalledTimes(2)
    expect(browser.tabs.create.mock.calls[0][0]).toEqual({ url: 'asdf', windowId: 123 })
    expect(browser.tabs.create.mock.calls[1][0]).toEqual({ url: 'qwer', windowId: 123 })
    expect(browser.tabs.remove).toBeCalledTimes(2)
    expect(browser.tabs.remove.mock.calls[0][0]).toEqual(1)
    expect(browser.tabs.remove.mock.calls[1][0]).toEqual(2)
  })
})

describe('moveTabsToCtx', () => {
  test('move tabs to context', async () => {
    const state = {
      private: false,
      tabs: [{ id: 1, url: 'http://asdf.com' }, { id: 2, url: 'qwer' }],
    }
    browser.tabs.create = jest.fn()
    browser.tabs.remove = jest.fn()

    await TabsActions.moveTabsToCtx({ state }, { tabIds: [1, 2, 3], ctxId: 'b' })
    expect(browser.tabs.create).toBeCalledTimes(2)
    expect(browser.tabs.create.mock.calls[0][0]).toEqual({
      cookieStoreId: 'b',
      url: 'http://asdf.com',
    })
    expect(browser.tabs.create.mock.calls[1][0]).toEqual({
      cookieStoreId: 'b',
      url: null,
    })
    expect(browser.tabs.remove).toBeCalledTimes(2)
  })
})

describe('showAllTabs', () => {
  test('nothing to show', async () => {
    const state = {
      tabs: [{ id: 1, url: 'http://asdf.com' }, { id: 2, url: 'qwer', hidden: false }],
    }
    browser.tabs.show = jest.fn()

    await TabsActions.showAllTabs({ state })
    expect(browser.tabs.show).not.toBeCalled()
  })

  test('show tab', async () => {
    const state = {
      tabs: [{ id: 1, url: 'http://asdf.com' }, { id: 2, url: 'qwer', hidden: true }],
    }
    browser.tabs.show = jest.fn()

    await TabsActions.showAllTabs({ state })
    expect(browser.tabs.show).toBeCalledWith([2])
  })
})

describe('hideInactPanelsTabs', () => {
  test('cannot find active panel', async () => {
    const state = {
      panelIndex: -1,
      lastPanelIndex: 2,
    }
    const getters = {
      panels: [],
    }
    browser.tabs.show = jest.fn()
    browser.tabs.hide = jest.fn()

    await TabsActions.hideInactPanelsTabs({ state, getters })
    expect(browser.tabs.show).not.toBeCalled()
    expect(browser.tabs.hide).not.toBeCalled()
  })

  test('hide some tabs', async () => {
    const state = {
      panelIndex: -1,
      lastPanelIndex: 2,
    }
    const getters = {
      panels: [
        {}, // bookmarks
        {}, // private
        {
          tabs: [{ id: 1, hidden: true, invisible: false }],
        },
        {
          tabs: [
            { id: 2, hidden: false, invisible: false },
            { id: 3, hidden: true, invisible: true },
            { id: 4, hidden: false, invisible: true },
          ],
        },
      ],
    }
    browser.tabs.show = jest.fn()
    browser.tabs.hide = jest.fn()

    await TabsActions.hideInactPanelsTabs({ state, getters })
    expect(browser.tabs.show).toBeCalledWith([1])
    expect(browser.tabs.hide).toBeCalledWith([2])
  })
})

describe('foldTabsBranch', () => {
  test('fold tabs branch', async () => {
    const state = {
      hideFoldedTabs: false,
      autoExpandTabs: false,
      tabs: [
        { id: 1, isParent: true, folded: false },
        { id: 2, parentId: 1, invisible: false, active: true },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.hide = jest.fn()

    await TabsActions.foldTabsBranch({ state, dispatch }, 1)
    await new Promise(r => setTimeout(r, 500))
    expect(browser.tabs.update).toBeCalledWith(1, { active: true })
    expect(browser.tabs.hide).not.toBeCalled()
    expect(state.tabs[0].folded).toBe(true)
    expect(state.tabs[1].invisible).toBe(true)
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('fold tabs branch with auto expanding', async () => {
    const state = {
      hideFoldedTabs: false,
      autoExpandTabs: true,
      tabs: [
        { id: 1, isParent: true, folded: false },
        { id: 2, parentId: 1, invisible: false, active: true },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.hide = jest.fn()

    await TabsActions.foldTabsBranch({ state, dispatch }, 1)
    await new Promise(r => setTimeout(r, 500))
    expect(browser.tabs.update).not.toBeCalled()
    expect(browser.tabs.hide).not.toBeCalled()
    expect(state.tabs[0].folded).toBe(true)
    expect(state.tabs[1].invisible).toBe(true)
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('fold tabs branch with auto hidding', async () => {
    const state = {
      hideFoldedTabs: true,
      autoExpandTabs: false,
      ffVer: 123,
      tabs: [{ id: 1, isParent: true, folded: false }, { id: 2, parentId: 1, invisible: false }],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.hide = jest.fn()

    await TabsActions.foldTabsBranch({ state, dispatch }, 1)
    await new Promise(r => setTimeout(r, 500))
    expect(browser.tabs.update).not.toBeCalled()
    expect(browser.tabs.hide).toBeCalledWith([2])
    expect(state.tabs[0].folded).toBe(true)
    expect(state.tabs[1].invisible).toBe(true)
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })
})

describe('expTabsBranch', () => {
  test('expand tabs', async () => {
    const state = {
      hideFoldedTabs: false,
      autoFoldTabs: false,
      ffVer: 123,
      tabs: [
        { id: 1, isParent: true, folded: true, parentId: 456, invisible: true },
        { id: 2, isParent: true, folded: true, parentId: 1, invisible: true },
        { id: 3, parentId: 2, invisible: true },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.show = jest.fn()

    await TabsActions.expTabsBranch({ state, dispatch }, 1)
    await new Promise(r => setTimeout(r, 500))

    expect(browser.tabs.show).not.toBeCalled()
    expect(state.tabs[0].folded).toBe(false)
    expect(state.tabs[1].invisible).toBe(false)
    expect(dispatch.mock.calls[0][0]).toBe('expTabsBranch')
    expect(dispatch.mock.calls[0][1]).toBe(456)
    expect(dispatch.mock.calls[1][0]).toBe('saveTabsTree')
  })

  test('expand tabs and show them', async () => {
    const state = {
      hideFoldedTabs: true,
      autoFoldTabs: false,
      ffVer: 123,
      tabs: [
        { id: 1, isParent: true, folded: true },
        { id: 2, parentId: 1, invisible: true },
        { id: 3, isParent: true, folded: true, parentId: 1, invisible: true },
        { id: 4, parentId: 3, invisible: true },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.show = jest.fn()

    await TabsActions.expTabsBranch({ state, dispatch }, 1)
    await new Promise(r => setTimeout(r, 500))

    expect(browser.tabs.show).toBeCalledWith([2, 3])
    expect(state.tabs[0].folded).toBe(false)
    expect(state.tabs[1].invisible).toBe(false)
    expect(state.tabs[2].invisible).toBe(false)
    expect(state.tabs[2].folded).toBe(true)
    expect(state.tabs[3].invisible).toBe(true)
    expect(dispatch.mock.calls[0][0]).toBe('saveTabsTree')
  })

  test('expand tabs and autofold group on the same lvl', async () => {
    const state = {
      hideFoldedTabs: false,
      autoFoldTabs: true,
      ffVer: 123,
      tabs: [
        { id: 1, lvl: 0, isParent: true, folded: true },
        { id: 2, lvl: 1, parentId: 1, invisible: true },
        { id: 3, lvl: 0, isParent: true, folded: false },
        { id: 4, lvl: 1, parentId: 3, invisible: false },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.show = jest.fn()

    await TabsActions.expTabsBranch({ state, dispatch }, 1)
    await new Promise(r => setTimeout(r, 500))

    expect(browser.tabs.show).not.toBeCalled()
    expect(state.tabs[0].folded).toBe(false)
    expect(state.tabs[1].invisible).toBe(false)
    expect(dispatch.mock.calls[0][0]).toBe('foldTabsBranch')
    expect(dispatch.mock.calls[0][1]).toBe(3)
    expect(dispatch.mock.calls[1][0]).toBe('saveTabsTree')
  })
})

describe('toggleBranch', () => {
  test('target not found', async () => {
    const state = {
      tabs: [],
    }
    const dispatch = jest.fn()

    await TabsActions.toggleBranch({ state, dispatch }, 1)
    expect(dispatch).not.toBeCalled()
  })

  test('expand', async () => {
    const state = {
      tabs: [
        {
          id: 1,
          folded: true,
        },
      ],
    }
    const dispatch = jest.fn()

    await TabsActions.toggleBranch({ state, dispatch }, 1)
    expect(dispatch).toBeCalledWith('expTabsBranch', 1)
  })

  test('fold', async () => {
    const state = {
      tabs: [
        {
          id: 1,
          folded: false,
        },
      ],
    }
    const dispatch = jest.fn()

    await TabsActions.toggleBranch({ state, dispatch }, 1)
    expect(dispatch).toBeCalledWith('foldTabsBranch', 1)
  })
})

describe('dropToTabs', () => {
  test('drop tabs from the same panel to the same place', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabs: [{ id: 1, index: 0 }, { id: 2, index: 1 }, { id: 3, index: 2 }],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 3,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 3,
        parentId: -1,
        lvl: 0,
        index: 2,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: 2, dropParent: -1, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.update).toBeCalledWith(3, { active: true })
    expect(browser.tabs.move).not.toBeCalled()
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('drop tabs from the same panel to the same place (with shift)', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabs: [{ id: 1, index: 0 }, { id: 2, index: 1 }, { id: 3, index: 2 }],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 3,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 3,
        parentId: -1,
        lvl: 0,
        index: 2,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: 3, dropParent: -1, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.update).toBeCalledWith(3, { active: true })
    expect(browser.tabs.move).not.toBeCalled()
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('drop to the end of panel if dropIndex is not defined', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabs: [{ id: 1, index: 0 }, { id: 2, index: 1 }, { id: 3, index: 2 }],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 2,
        parentId: -1,
        lvl: 0,
        index: 1,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: -1, dropParent: -1, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).toBeCalledWith([2], { windowId: 1, index: 2 })
    expect(browser.tabs.update).toBeCalledWith(2, { active: true })
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('move multiple tabs', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabs: [{ id: 1, index: 0 }, { id: 2, index: 1 }, { id: 3, index: 2 }],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 2,
        parentId: -1,
        lvl: 0,
        index: 1,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
      {
        type: 'tab',
        id: 3,
        parentId: -1,
        lvl: 0,
        index: 2,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: 0, dropParent: -1, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).toBeCalledWith([2, 3], { windowId: 1, index: 0 })
    expect(browser.tabs.update).toBeCalledWith(2, { active: true })
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('move multiple tabs to pinned dock', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabs: [
        { id: 1, index: 0, url: 'asdf' },
        { id: 2, index: 1, url: 'asdf' },
        { id: 3, index: 2, url: 'asdf' },
      ],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 2,
        parentId: -1,
        lvl: 0,
        index: 1,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
      {
        type: 'tab',
        id: 3,
        parentId: -1,
        lvl: 0,
        index: 2,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: 0, dropParent: -1, nodes, pin: true }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).toBeCalledWith([2, 3], { windowId: 1, index: 0 })
    expect(browser.tabs.update).toBeCalledTimes(3)
    expect(browser.tabs.update.mock.calls[0][0]).toBe(2)
    expect(browser.tabs.update.mock.calls[0][1]).toEqual({ pinned: true })
    expect(browser.tabs.update.mock.calls[1][0]).toBe(3)
    expect(browser.tabs.update.mock.calls[1][1]).toEqual({ pinned: true })
    expect(browser.tabs.update.mock.calls[2][0]).toBe(2)
    expect(browser.tabs.update.mock.calls[2][1]).toEqual({ active: true })
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('drop tab to folded parent', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabsTree: true,
      tabs: [
        { id: 1, index: 0, url: 'asdf' },
        { id: 2, index: 1, url: 'asdf', folded: true },
        { id: 3, index: 2, url: 'asdf' },
      ],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 3,
        parentId: -1,
        lvl: 0,
        index: 2,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: 2, dropParent: 2, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).not.toBeCalled()
    expect(state.tabs[2].invisible).toBe(true)
    expect(browser.tabs.update).not.toBeCalled()
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  test('drop tab to expanded parent', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabsTree: true,
      tabs: [
        { id: 1, index: 0, url: 'asdf' },
        { id: 2, index: 1, url: 'asdf', folded: false },
        { id: 3, index: 2, url: 'asdf', invisible: true },
      ],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      {
        type: 'tab',
        id: 3,
        parentId: -1,
        lvl: 0,
        index: 2,
        ctx: 'container-A',
        incognito: false,
        windowId: 1,
        panel: 1,
        url: 'asdf',
        title: 'ASDF',
      },
    ]
    const args = { event, dropIndex: 2, dropParent: 2, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).not.toBeCalled()
    expect(state.tabs[2].invisible).toBe(false)
    expect(browser.tabs.update).toBeCalledWith(3, { active: true })
    expect(browser.tabs.hide).not.toBeCalled()
    expect(dispatch).toBeCalledWith('saveTabsTree')
  })

  // 0 1 2 3       0 1 2 3 4
  // tab           tab
  //   tab           tab
  //     ====          TAB
  //     tab             TAB
  //>  TAB                 TAB
  //>    TAB           TAB
  //>      TAB         tab
  //>TAB
  // 0 1 2 3       0 1 2 3
  test('drop tabs tree', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabsTree: true,
      tabs: [
        { id: 1, index: 0, url: 'a', lvl: 0, isParent: true, parentId: -1 },
        { id: 2, index: 1, url: 'a', lvl: 1, isParetn: true, parentId: 1 },
        { id: 3, index: 2, url: 'a', lvl: 2, isParent: false, parentId: 2 },
        { id: 4, index: 3, url: 'a', lvl: 1, isParent: true, parentId: 1 },
        { id: 5, index: 4, url: 'a', lvl: 2, isParent: true, parentId: 4 },
        { id: 6, index: 5, url: 'a', lvl: 3, isParent: false, parentId: 5 },
        { id: 7, index: 6, url: 'a', lvl: 0, isParent: false, parentId: -1 },
      ],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      { type: 'tab', id: 4, panel: 1, index: 3, parentId: 1, ctx: 'container-A' },
      { type: 'tab', id: 5 },
      { type: 'tab', id: 6 },
      { type: 'tab', id: 7 },
    ]
    const args = { event, dropIndex: 2, dropParent: 2, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).toBeCalledWith([4, 5, 6, 7], { windowId: 1, index: 2 })
    expect(state.tabs[1].id).toBe(2)
    expect(state.tabs[3].parentId).toBe(2)
    expect(state.tabs[4].parentId).toBe(4)
    expect(state.tabs[5].parentId).toBe(5)
    expect(state.tabs[6].parentId).toBe(2)
    expect(state.tabs[2].parentId).toBe(2)
  })

  // 0 1 2 3       0 1 2 3<
  // tab           tab
  //   tab           tab
  //     ====          TAB
  //     tab             TAB
  //>  TAB               TAB
  //>    TAB           TAB
  //>      TAB         tab
  //>TAB
  // 0 1 2 3       0 1 2 3
  test('drop tabs tree with limit 3', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabsTree: true,
      tabsTreeLimit: 3,
      tabs: [
        { id: 1, index: 0, url: 'a', lvl: 0, isParent: true, parentId: -1 },
        { id: 2, index: 1, url: 'a', lvl: 1, isParetn: true, parentId: 1 },
        { id: 3, index: 2, url: 'a', lvl: 2, isParent: false, parentId: 2 },
        { id: 4, index: 3, url: 'a', lvl: 1, isParent: true, parentId: 1 },
        { id: 5, index: 4, url: 'a', lvl: 2, isParent: true, parentId: 4 },
        { id: 6, index: 5, url: 'a', lvl: 3, isParent: false, parentId: 5 },
        { id: 7, index: 6, url: 'a', lvl: 0, isParent: false, parentId: -1 },
      ],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      { type: 'tab', id: 4, panel: 1, index: 3, parentId: 1, ctx: 'container-A' },
      { type: 'tab', id: 5 },
      { type: 'tab', id: 6 },
      { type: 'tab', id: 7 },
    ]
    const args = { event, dropIndex: 2, dropParent: 2, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).toBeCalledWith([4, 5, 6, 7], { windowId: 1, index: 2 })
    expect(state.tabs[1].id).toBe(2)
    expect(state.tabs[3].parentId).toBe(2)
    expect(state.tabs[4].parentId).toBe(4)
    expect(state.tabs[5].parentId).toBe(4)
    expect(state.tabs[6].parentId).toBe(2)
    expect(state.tabs[2].parentId).toBe(2)
  })

  // 0 1 2 3       0 1<
  // tab           tab
  //   tab           tab
  //     ====        TAB
  //     tab         TAB
  //>  TAB           TAB
  //>    TAB         TAB
  //>      TAB       tab
  //>TAB
  // 0 1 2 3       0 1 2 3
  test('drop tabs tree with limit 1', async () => {
    const state = {
      windowId: 1,
      panelIndex: 1,
      private: false,
      tabsTree: true,
      tabsTreeLimit: 1,
      tabs: [
        { id: 1, index: 0, url: 'a', lvl: 0, isParent: true, parentId: -1 },
        { id: 2, index: 1, url: 'a', lvl: 1, isParetn: true, parentId: 1 },
        { id: 3, index: 2, url: 'a', lvl: 2, isParent: false, parentId: 2 },
        { id: 4, index: 3, url: 'a', lvl: 1, isParent: true, parentId: 1 },
        { id: 5, index: 4, url: 'a', lvl: 2, isParent: true, parentId: 4 },
        { id: 6, index: 5, url: 'a', lvl: 3, isParent: false, parentId: 5 },
        { id: 7, index: 6, url: 'a', lvl: 0, isParent: false, parentId: -1 },
      ],
    }
    const getters = {
      panels: [
        {},
        {
          id: 'container-A',
          cookieStoreId: 'container-A',
          endIndex: 2,
        },
      ],
    }
    const dispatch = jest.fn()
    browser.tabs.update = jest.fn()
    browser.tabs.move = jest.fn()
    browser.tabs.hide = jest.fn()
    const ctx = { state, getters, dispatch }
    const event = { ctrlKey: false }
    const nodes = [
      { type: 'tab', id: 4, panel: 1, index: 3, parentId: 1, ctx: 'container-A' },
      { type: 'tab', id: 5 },
      { type: 'tab', id: 6 },
      { type: 'tab', id: 7 },
    ]
    const args = { event, dropIndex: 2, dropParent: 2, nodes, pin: false }

    await TabsActions.dropToTabs(ctx, args)
    expect(browser.tabs.move).toBeCalledWith([4, 5, 6, 7], { windowId: 1, index: 2 })
    expect(state.tabs[1].id).toBe(2)
    expect(state.tabs[3].parentId).toBe(1)
    expect(state.tabs[4].parentId).toBe(1)
    expect(state.tabs[5].parentId).toBe(1)
    expect(state.tabs[6].parentId).toBe(1)
    expect(state.tabs[2].parentId).toBe(2)
  })
})
