jest.mock('../event-bus', () => {
  return { $emit: jest.fn() }
})
import EventBus from '../event-bus'
import PanelsActions from './panels'

describe('Panels actions', () => {
  test('createContext', async () => {
    browser.contextualIdentities.create = jest.fn()
    await PanelsActions.createContext({}, { name: 'a', color: 'b', icon: 'c' })
    expect(browser.contextualIdentities.create).toHaveBeenCalledWith({
      name: 'a',
      color: 'b',
      icon: 'c',
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
})
