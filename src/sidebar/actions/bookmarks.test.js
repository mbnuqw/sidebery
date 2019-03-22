import BookmarksActions from './bookmarks'

describe('Bookmarks actions', () => {
  /**
   * loadBookmarks
   */
  test('Loading bookmarks tree', async () => {
    // Prepare env
    browser.storage.local.get = key => {
      if (key === 'expandedBookmarks') return Promise.resolve([])
    }
    browser.bookmarks.getTree = () => {
      return Promise.resolve([
        {
          id: 'root________',
          children: [
            {
              id: 'sdfaislej',
              index: 0,
              parentId: 'root________',
              title: 'A',
              type: 'folder',
            },
          ],
        },
      ])
    }
    const state = {
      bookmarks: [],
      private: false,
    }

    // Checks
    await BookmarksActions.loadBookmarks({ state })
    expect(state.bookmarks[0].id).toBe('sdfaislej')
  })

  /**
   * saveBookmarksTree
   */
  test('Saving bookmarks tree state', async () => {
    // Prepare env
    let expandedBookmarks
    browser.storage.local.set = kv => {
      expandedBookmarks = kv.expandedBookmarks
      return Promise.resolve(null)
    }
    const state = {
      bookmarks: [],
    }

    // Checks
    await BookmarksActions.saveBookmarksTree({ state })
    expect(expandedBookmarks.length).toBe(0)
  })

  /**
   * reloadBookmarks
   */
  test('Bookmarks reloading', async () => {
    // Prepare env
    browser.bookmarks.getTree = () => {
      return Promise.resolve([
        {
          id: 'root________',
          children: [
            {
              id: 'sdfaislej',
              index: 0,
              parentId: 'root________',
              title: 'A',
              type: 'folder',
            },
          ],
        },
      ])
    }
    const state = {
      bookmarks: [],
    }

    // Checks
    await BookmarksActions.reloadBookmarks({ state })
    expect(state.bookmarks.length).toBe(1)
  })
})
