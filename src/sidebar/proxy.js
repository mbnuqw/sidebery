import State from './store.state'

export default function reqHandler(info) {
  for (let tab of State.tabs) {
    if (tab.id === info.tabId) {
      for (let proxy of State.proxiedPanels) {
        if (tab.cookieStoreId === proxy.id) return proxy
      }
      break
    }
  }
}