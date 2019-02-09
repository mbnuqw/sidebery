import { DEFAULT_CTX, PRIVATE_CTX, DEFAULT_PANELS } from './store.state'
import TabsPanel from './components/panels/tabs.vue'

export default {
  bgNoise: s => s.bgNoise,
  fontSize: s => s.fontSize,
  isPrivate: s => s.private,
  ctxMenu: s => s.ctxMenu,
  ctxMenuOpened: s => !!s.ctxMenu,
  tabs: s => s.tabs,
  pinnedTabs: s => s.tabs.filter(t => t.pinned),
  defaultCtxId: s => (s.private ? PRIVATE_CTX : DEFAULT_CTX),

  /**
   * Get list of panels
   */
  panels(state, getters) {
    const panels = DEFAULT_PANELS.concat(state.ctxs)
    let lastIndex = getters.pinnedTabs.length
    const out = panels.map(p => {
      if (!p.panel) p.panel = TabsPanel

      if (p.cookieStoreId) {
        p.tabs = []
        for (let t of state.tabs) {
          if (t.cookieStoreId === p.cookieStoreId && !t.pinned) {
            p.tabs.push(t)
          }
          if (p.tabs.length && t.cookieStoreId !== p.cookieStoreId) {
            break
          }
        }
        if (p.tabs.length) {
          lastIndex = p.tabs[p.tabs.length - 1].index
          p.startIndex = p.tabs[0].index
          p.endIndex = lastIndex++
        } else {
          p.startIndex = lastIndex
          p.endIndex = p.startIndex
        }
      }

      return p
    })

    return out
  },
  activePanel: (s, g) => g.panels[s.panelIndex],
  defaultPanel: (_, g) => g.panels.find(p => p.cookieStoreId === g.defaultCtxId),
}
