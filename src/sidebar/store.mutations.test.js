import Mutations from './store.mutations'
import { DEFAULT_SETTINGS } from './settings'

describe('Vuex store mutations', () => {
  // setSetting
  describe('setSetting', () => {
    test('set some setting value', () => {
      const state = {}
      Mutations.setSetting(state, { key: 'theme', val: 'blue' })
      expect(state).toEqual(
        expect.objectContaining({
          theme: 'blue',
        })
      )
    })
    test('cannot set non-setting value', () => {
      const state = {}
      Mutations.setSetting(state, { key: 'some', val: 123 })
      expect(state).toEqual({})
    })
  })

  // openSettings
  test('resetSettings', () => {
    const state = {}
    Mutations.setSetting(state, { key: 'theme', val: 'blue' })
    Mutations.resetSettings(state)
    expect(state).toEqual(
      expect.objectContaining({
        theme: DEFAULT_SETTINGS.theme,
      })
    )
  })

  // openSettings
  test('openSettings', () => {
    const state = {
      lastPanelIndex: 3,
      panelIndex: 2,
      settingsOpened: false,
    }
    Mutations.openSettings(state)
    expect(state).toEqual(expect.objectContaining({
      lastPanelIndex: 2,
      panelIndex: -2,
      settingsOpened: true,
    }))
  })

  // closeSettings
  test('closeSettings', () => {
    const state = {
      lastPanelIndex: 2,
      panelIndex: -2,
      settingsOpened: true,
    }
    Mutations.closeSettings(state)
    expect(state).toEqual(expect.objectContaining({
      lastPanelIndex: 2,
      panelIndex: 2,
      settingsOpened: false,
    }))
  })

  // setPanel
  test('setPanel', () => {
    const state = {
      lastPanelIndex: 2,
      panelIndex: 1,
    }
    Mutations.setPanel(state, 0)
    expect(state).toEqual(expect.objectContaining({
      lastPanelIndex: 0,
      panelIndex: 0,
    }))
  })

  // resetSelection
  test('resetSelection', () => {
    const state = {
      selectedTabs: [1, 2, 3],
    }
    Mutations.resetSelection(state)
    expect(state.selectedTabs.length).toBe(0)
  })

  // closeCtxMenu
  test('closeCtxMenu', () => {
    const offHandler = jest.fn()
    const state = {
      ctxMenu: {
        off: offHandler,
      },
    }
    Mutations.closeCtxMenu(state)
    expect(offHandler).toBeCalled()
    expect(state.ctxMenu).toBe(null)
  })
})