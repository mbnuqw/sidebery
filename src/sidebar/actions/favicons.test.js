import FaviconsActions from './favicons'

describe('Favicons actions', () => {
  //
  // --- Load favicons
  //
  test('loadFavicons', async () => {
    // Prepare env
    browser.storage.local.data.favicons = { host: 'favicon' }
    const state = {
      favicons: {},
    }

    await FaviconsActions.loadFavicons({ state })
    expect(state.favicons.host).toBe('favicon')
  })

  //
  // --- Set favicon
  //
  describe('setFavicon', () => {
    // Prepare env
    const state = {}
    beforeEach(() => {
      browser.storage.local.data.favicons = {}
      state.favicons = {}
      state.private = false
    })

    // ---

    test('Do nothing if hostname field is empty', async () => {
      await FaviconsActions.setFavicon({ state }, { hostname: undefined })
      expect(Object.keys(state.favicons).length).toBe(0)
      expect(Object.keys(browser.storage.local.data.favicons).length).toBe(0)
    })

    test('Set big favicon only in state', async () => {
      await FaviconsActions.setFavicon(
        { state },
        {
          hostname: 'bigOne',
          icon: 'bigvalue..'.repeat(10001),
        }
      )
      expect(Object.keys(state.favicons).length).toBe(1)
      expect(state.favicons.bigOne.length).toBe(100010)
      expect(Object.keys(browser.storage.local.data.favicons).length).toBe(0)
    })

    test('Do not save favicons in store in Private mode', async () => {
      state.private = true

      await FaviconsActions.setFavicon({ state }, { hostname: 'host', icon: 'fav' })
      expect(Object.keys(state.favicons).length).toBe(1)
      expect(Object.keys(browser.storage.local.data.favicons).length).toBe(0)
    })
  })

  //
  // --- Clear Favi Cache
  //
  describe('clearFaviCache', () => {
    // Prepare env
    const state = {
      favicons: {},
      tabs: [{ url: 'https://two.com/123' }],
      bookmarks: [{ url: 'https://one.com/' }],
    }
    beforeEach(() => {
      browser.storage.local.data.favicons = {
        'one.com': 'favOne',
        'two.com': 'favTwo',
        bigOne: 'yeap',
      }
      state.favicons = {
        'one.com': 'favOne',
        'two.com': 'favTwo',
        bigOne: 'yeap',
      }
    })

    // ---

    test('Remove all favicons', async () => {
      await FaviconsActions.clearFaviCache({ state }, { all: true })
      expect(Object.keys(state.favicons).length).toBe(0)
      expect(Object.keys(browser.storage.local.data.favicons).length).toBe(0)
    })

    test('Remove unused favicons', async () => {
      await FaviconsActions.clearFaviCache({ state })
      expect(Object.keys(state.favicons).length).toBe(2)
      expect(Object.keys(browser.storage.local.data.favicons).length).toBe(2)
    })
  })

  //
  // --- Try to clear favicons cache (unused favs)
  //
  describe('tryClearFaviCache', () => {
    // Prepare env
    const state = {
      favicons: {},
      tabs: [{ url: 'https://two.com/123' }],
      bookmarks: [{ url: 'https://one.com/' }],
    }
    beforeEach(() => {
      browser.storage.local.data.favAutoCleanTime = ~~(Date.now() / 1000)
      browser.storage.local.data.favicons = {
        'one.com': 'favOne',
        'two.com': 'favTwo',
        bigOne: 'yeap',
      }
      state.favicons = {
        'one.com': 'favOne',
        'two.com': 'favTwo',
        bigOne: 'yeap',
      }
    })

    // ---

    test('Try to clear cache before limit time', async () => {
      await FaviconsActions.tryClearFaviCache({ state }, 100)
      expect(Object.keys(state.favicons).length).toBe(3)
      expect(Object.keys(browser.storage.local.data.favicons).length).toBe(3)
    })
  })
})
