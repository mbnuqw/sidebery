import State from './store.state'

export default function reqHandler(info) {
  let ts = Date.now()
  for (let tab of State.tabs) {
    if (tab.id === info.tabId) {
      for (let proxy of State.proxiedPanels) {
        if (tab.cookieStoreId === proxy.id) {
          console.log('[DEBUG] proxyfied', info.tabId, Date.now() - ts)
          return proxy
        }
      }
      break
    }
  }
  console.log('[DEBUG] direct', info.tabId, Date.now() - ts)
}