jest.mock('../event-bus', () => {
  return { $emit: jest.fn() }
})
import EventBus from '../event-bus'
import PanelsActions from './panels'

describe('Panels actions', () => {
  test('loadContexts', async () => {
    browser.contextualIdentities.query = jest.fn(() => [1, 2])
    const state = { ctxs: [] }
    await PanelsActions.loadContexts({ state })
    expect(browser.contextualIdentities.query).toHaveBeenCalled()
    expect(state.ctxs[0]).toBe(1)
    expect(state.ctxs[1]).toBe(2)
  })

  test('createContext', async () => {
    browser.contextualIdentities.create = jest.fn()
    await PanelsActions.createContext({}, { name: 'a', color: 'b', icon: 'c' })
    expect(browser.contextualIdentities.create).toHaveBeenCalledWith({
      name: 'a',
      color: 'b',
      icon: 'c',
    })
  })

  describe('checkContextBindings', () => {
    test('without any contexts', async () => {
      browser.tabs.create = jest.fn()
      const state = { ctxs: [] }
      await PanelsActions.checkContextBindings({ state }, 'x')
      expect(browser.tabs.create).not.toHaveBeenCalled()
    })

    test('without @rule in name', async () => {
      browser.tabs.create = jest.fn()
      const state = { ctxs: [{ cookieStoreId: 'x', name: 'just' }] }
      await PanelsActions.checkContextBindings({ state }, 'x')
      expect(browser.tabs.create).not.toHaveBeenCalled()
    })

    test('without bookmarks dir', async () => {
      browser.tabs.create = jest.fn()
      const state = {
        ctxs: [{ cookieStoreId: 'x', name: 'a@some' }],
        bookmarks: [{ title: 'n' }],
      }
      await PanelsActions.checkContextBindings({ state }, 'x')
      expect(browser.tabs.create).not.toHaveBeenCalled()
    })

    test('open urls of matched bookmarks dir', async () => {
      browser.tabs.create = jest.fn()
      const state = {
        ctxs: [{ cookieStoreId: 'x', name: 'a@some', tabs: [{ url: 'a' }] }],
        bookmarks: [
          {
            title: 'some',
            children: [{ url: 'a' }, { url: 'b' }],
          },
        ],
      }
      await PanelsActions.checkContextBindings({ state }, 'x')
      expect(browser.tabs.create).toHaveBeenCalledWith({
        cookieStoreId: 'x',
        url: 'b',
      })
    })
  })

  describe('switchToPanel', () => {
    test('without any special settings', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = {}
      const getters = {}
      await PanelsActions.switchToPanel({ state, getters, commit, dispatch }, 2)
      expect(commit).toHaveBeenCalledTimes(4)
      expect(commit).toHaveBeenCalledWith('closeSettings')
      expect(commit).toHaveBeenCalledWith('closeCtxMenu')
      expect(commit).toHaveBeenCalledWith('resetSelection')
      expect(commit).toHaveBeenCalledWith('setPanel', 2)
      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith('recalcPanelScroll')
    })

    test('with opened dashboard', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { dashboardOpened: true, panelIndex: 123 }
      const getters = {}
      await PanelsActions.switchToPanel({ state, getters, commit, dispatch }, 2)
      expect(EventBus.$emit).toHaveBeenCalledWith('openDashboard', 123)
    })

    test('with createNewTabOnEmptyPanel setting', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { createNewTabOnEmptyPanel: true, panelIndex: 1 }
      const getters = {
        panels: [{}, { cookieStoreId: 'a', tabs: [] }],
      }
      await PanelsActions.switchToPanel({ state, getters, commit, dispatch }, 1)
      expect(dispatch).toHaveBeenCalledWith('createTab', 'a')
    })

    test('with activateLastTabOnPanelSwitching setting', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { activateLastTabOnPanelSwitching: true, panelIndex: 123 }
      const getters = {}
      await PanelsActions.switchToPanel({ state, getters, commit, dispatch }, 123)
      expect(dispatch).toHaveBeenCalledWith('activateLastActiveTabOf', 123)
    })

    test('with hideInact setting', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { hideInact: true, panelIndex: 12 }
      const getters = {}
      await PanelsActions.switchToPanel({ state, getters, commit, dispatch }, 123)
      expect(dispatch).toHaveBeenCalledWith('hideInactPanelsTabs')
    })
  })

  describe('switchPanel', () => {
    test('to next, without any special settings', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 0 }
      const getters = { panels: [{}, {}, {}] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, 1)
      expect(commit).toHaveBeenCalledWith('closeCtxMenu')
      expect(commit).toHaveBeenCalledWith('resetSelection')
      expect(state.panelIndex).toBe(1)
    })

    test('to next, skipping inactive panel', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 0 }
      const getters = { panels: [{}, { inactive: true }, {}, {}] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, 1)
      expect(state.panelIndex).toBe(2)
    })

    test('to next, skipping empty panel', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 0, skipEmptyPanels: true }
      const getters = { panels: [{ tabs: [1] }, { tabs: [] }, { tabs: [2] }] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, 1)
      expect(state.panelIndex).toBe(2)
    })

    test('to next, from the last', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 1 }
      const getters = { panels: [{}, {}] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, 1)
      expect(state.panelIndex).toBe(1)
    })

    test('to prev, without any special settings', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 1 }
      const getters = { panels: [{}, {}, {}] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, -1)
      expect(commit).toHaveBeenCalledWith('closeCtxMenu')
      expect(commit).toHaveBeenCalledWith('resetSelection')
      expect(state.panelIndex).toBe(0)
    })

    test('to prev, skipping inactive panel', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 2 }
      const getters = { panels: [{}, { inactive: true }, {}, {}] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, -1)
      expect(state.panelIndex).toBe(0)
    })

    test('to prev, skipping empty panel', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 2, skipEmptyPanels: true }
      const getters = { panels: [{ tabs: [1] }, { tabs: [] }, { tabs: [2] }] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, -1)
      expect(state.panelIndex).toBe(0)
    })

    test('to prev, from the first', async () => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const state = { panelIndex: 0 }
      const getters = { panels: [{}, {}] }
      await PanelsActions.switchPanel({ state, getters, commit, dispatch }, -1)
      expect(state.panelIndex).toBe(0)
    })
  })

  test('goToActiveTabPanel', async () => {
    const dispatch = jest.fn()
    const getters = {
      panels: [{ tabs: [] }, { tabs: [{ active: true }] }],
    }
    await PanelsActions.goToActiveTabPanel({ getters, dispatch })
    expect(dispatch).toHaveBeenCalledWith('switchToPanel', 1)
  })

  describe('updateProxiedTabs', () => {
    test('Turn off proxy if there are no proxied panels', () => {
      const dispatch = jest.fn()
      const state = { proxiedPanels: [] }
      PanelsActions.updateProxiedTabs({ state, dispatch })
      expect(dispatch).toHaveBeenCalledWith('turnOffProxy')
    })

    test('Turn on proxy if there are some proxied panels', () => {
      const dispatch = jest.fn()
      const state = { proxiedPanels: [ 1 ] }
      PanelsActions.updateProxiedTabs({ state, dispatch })
      expect(dispatch).toHaveBeenCalledWith('turnOnProxy')
    })
  })

  test('turnOnProxy', () => {
    browser.proxy.onRequest.hasListener = jest.fn(() => false)
    browser.proxy.onRequest.addListener = jest.fn()
    PanelsActions.turnOnProxy()
    expect(browser.proxy.onRequest.hasListener).toHaveBeenCalled()
    expect(browser.proxy.onRequest.addListener).toHaveBeenCalled()
  })

  test('turnOffProxy', () => {
    browser.proxy.onRequest.hasListener = jest.fn(() => true)
    browser.proxy.onRequest.removeListener = jest.fn()
    PanelsActions.turnOffProxy()
    expect(browser.proxy.onRequest.hasListener).toHaveBeenCalled()
    expect(browser.proxy.onRequest.removeListener).toHaveBeenCalled()
  })
})
