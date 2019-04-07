import Actions from './store.actions'
import EventBus from './event-bus'

beforeEach(() => {
  browser.bookmarks = {}
  browser.commands = {}
  browser.contextualIdentities = {}
  browser.extension = {}
  browser.i18n = {}
  browser.proxy = {}
  browser.permissions = {}
  browser.storage = {}
  browser.tabs = {}
  browser.windows = {}
})

describe('Common actions', () => {
  describe('chooseWin', () => {
    const state = {
      winChoosing: false
    }
  
    test('Choosing window', async () => {
      browser.windows.getAll = () => {
        return new Promise(res => {
          res([
            {
              id: 123,
              title: 'one',
              tabs: [{ id: 11, active: true }, { id: 12 }],
            },
            {
              id: 1,
              title: 'two',
              focused: true,
              tabs: [{ id: 21, active: true }],
            },
            {
              id: 2,
              title: 'three',
              tabs: [{ id: 31, active: true }],
            },
          ])
        })
      }
      browser.tabs.captureTab = jest.fn()

      const choosing = Actions.chooseWin({ state })
      await new Promise(res => setTimeout(res, 10))
  
      // Two windows to choose
      expect(state.winChoosing).toHaveLength(2)
      expect(browser.tabs.captureTab).toBeCalled()
  
      // Choose the first one
      state.winChoosing[0].choose()
  
      const win = await choosing
      expect(win).toBe(123)
    })
  })

  describe('recalcPanelScroll', () => {
    test('just emit global event after 33ms', async () => {
      let counter = 0
      EventBus.$on('recalcPanelScroll', () => counter++)
      Actions.recalcPanelScroll()
      await new Promise(res => setTimeout(res, 40))
      expect(counter).toBe(0)
    })
  })

  describe('broadcast', () => {
    test('just emit global message', async () => {
      let ans = ''
      EventBus.$on('some-msg', arg => ans = arg)
      Actions.broadcast(null, { name: 'some-msg', arg: 'some-arg' })
      expect(ans).toBe('some-arg')
    })
  })

  describe('loadPermissions', () => {
    test('load permissions', async () => {
      const state = {
        hideInact: true
      }
      const dispatch = jest.fn()
      browser.permissions.getAll = () => {
        return { permissions: ['perm'], origins: ['orig'] }
      }
      browser.permissions.contains = wut => {
        if (wut.origins && wut.origins[0] === '<all_urls>') return true
        if (wut.permissions && wut.permissions[0] === 'tabHide') return true
      }

      await Actions.loadPermissions({ state, dispatch })
      expect(state.permissions[0]).toBe('perm')
      expect(state.permissions[1]).toBe('orig')
      expect(state.permAllUrls).toBe(true)
      expect(state.permTabHide).toBe(true)
      expect(dispatch).toBeCalledWith('hideInactPanelsTabs')
    })
  })

  describe('getAllWindows', () => {
    test('gets all windows and check which current', async () => {
      browser.windows.getCurrent = jest.fn(() => {
        return new Promise(res => {
          res({ id: 123 })
        })
      })

      browser.windows.getAll = jest.fn(({ populate } = {}) => {
        return new Promise(res => {
          res([
            {
              id: 123,
              title: 'one',
              tabs: populate ? [{ id: 11, active: true }, { id: 12 }] : undefined,
            },
            {
              id: 1,
              title: 'two',
              focused: true,
              tabs: populate ? [{ id: 21, active: true }] : undefined,
            },
            {
              id: 2,
              title: 'three',
              tabs: populate ? [{ id: 31, active: true }] : undefined,
            },
          ])
        })
      })

      const windows = await Actions.getAllWindows()
      expect(windows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 123,
            current: true,
          })
        ])
      )
    })
  })
})