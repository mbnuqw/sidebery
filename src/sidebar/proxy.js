import State from './store.state'

export default function reqHandler(info) {
  for (let tab of State.tabs) {
    if (tab.id === info.tabId) {
      if (State.proxies[tab.cookieStoreId]) return State.proxies[tab.cookieStoreId]
      break
    }
  }
}