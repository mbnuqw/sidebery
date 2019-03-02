import SnapshotsActions from './snapshots'

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

describe('makeSnapshot', () => {
  test('make empty snapshot', async () => {
    const state = {}
    const getters = {
      panels: [
        { tabs: [] }
      ]
    }
    const dispatch = jest.fn(name => {
      if (name === 'loadSnapshots') return []
    })

    await SnapshotsActions.makeSnapshot({ state, dispatch, getters })
    expect(state.snapshots).toBeUndefined()
  })
})