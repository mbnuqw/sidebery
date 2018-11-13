import Mutations from './store.mutations'

describe('Vuex store mutations', () => {
  // setSetting
  describe('setSetting()', () => {
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
})