import Mutations from './store.mutations'
import { DEFAULT_SETTINGS } from './settings'

describe('Vuex store mutations', () => {
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
})