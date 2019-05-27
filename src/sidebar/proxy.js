import State from './store/state'

export default function reqHandler(info) {
  if (!State.tabsMap) return
  let tab = State.tabsMap[info.tabId]
  if (!tab) return

  // Check hosts rules
  if (info.type === 'main_frame') {
    // Inlude rules
    for (let rule of State.includeHostsRules) {
      let ok
      if ((typeof rule.value)[0] === 's') ok = info.url.indexOf(rule.value) !== -1
      else ok = rule.value.test(info.url)

      if (ok && tab.cookieStoreId !== rule.ctx) {
        browser.tabs.create({
          windowId: State.windowId,
          url: info.url,
          cookieStoreId: rule.ctx,
          active: tab.active,
          pinned: tab.pinned,
        })
        browser.tabs.remove(tab.id)
        return
      }
    }

    // Exclude rules
    if (State.excludeHostsRules[tab.cookieStoreId]) {
      for (let rule of State.excludeHostsRules[tab.cookieStoreId]) {
        let ok
        if ((typeof rule)[0] === 's') ok = info.url.indexOf(rule) !== -1
        else ok = rule.test(info.url)

        if (ok) {
          browser.tabs.create({
            windowId: State.windowId,
            url: info.url,
            active: tab.active,
            pinned: tab.pinned,
          })
          browser.tabs.remove(tab.id)
          return
        }
      }
    }
  }

  // Check proxy
  if (State.proxies[tab.cookieStoreId]) return State.proxies[tab.cookieStoreId]
}