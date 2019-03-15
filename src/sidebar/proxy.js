import State from './store.state'

export default function reqHandler(info) {
  let tab = State.tabsMap[info.tabId]
  if (!tab) return
  if (State.proxies[tab.cookieStoreId]) return State.proxies[tab.cookieStoreId]
}