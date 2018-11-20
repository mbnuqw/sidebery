import State from './store.state'
import ProxyReqHandler from './proxy'

jest.mock('./store.state')

describe('Request handler for proxy', () => {
  test('', () => {
    State.tabs = [
      {
        id: 12,
        cookieStoreId: 'olala',
      },
      {
        id: 100,
        cookieStoreId: 'pumpurum',
      }
    ]
    State.proxiedPanels = [
      {
        id: 'olala',
        proxy: 'settings',
      },
    ]

    let proxy = ProxyReqHandler({ tabId: -1 })
    expect(proxy).toBeUndefined()

    proxy = ProxyReqHandler({ tabId: 5 })
    expect(proxy).toBeUndefined()

    proxy = ProxyReqHandler({ tabId: 100 })
    expect(proxy).toBeUndefined()

    proxy = ProxyReqHandler({ tabId: 12 })
    expect(proxy).toEqual(expect.objectContaining({
      id: expect.stringMatching('olala'),
      proxy: expect.stringMatching('settings'),
    }))
  })
})