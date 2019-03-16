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
    State.tabsMap = []
    State.tabsMap[12] = State.tabs[0]
    State.tabsMap[100] = State.tabs[1]
    State.proxies = {
      olala: 'proxy-settings',
    }

    let proxy = ProxyReqHandler({ tabId: -1 })
    expect(proxy).toBeUndefined()

    proxy = ProxyReqHandler({ tabId: 5 })
    expect(proxy).toBeUndefined()

    proxy = ProxyReqHandler({ tabId: 100 })
    expect(proxy).toBeUndefined()

    proxy = ProxyReqHandler({ tabId: 12 })
    expect(proxy).toBe('proxy-settings')
  })
})