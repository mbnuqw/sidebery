jest.mock('../event-bus', () => {
  return { $emit: jest.fn() }
})
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
