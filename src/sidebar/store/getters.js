export default {
  bgNoise: s => s.bgNoise,
  fontSize: s => s.fontSize,
  isPrivate: s => s.private,
  ctxMenu: s => s.ctxMenu,
  ctxMenuOpened: s => !!s.ctxMenu,
  pinnedTabs: s => s.tabs.filter(t => t.pinned),

  /**
   * Update panel's tabs and startIndex and return list of panels
   */
  // panels(state, getters) {
  //   console.log('[DEBUG] panels getter');
  //   let lastIndex = getters.pinnedTabs.length
  //   for (let c of state.panels) {
  //     if (c.panel !== 'TabsPanel') continue

  //     c.tabs = []
  //     for (let t of state.tabs) {
  //       if (t.pinned) continue
  //       if (t.cookieStoreId === c.cookieStoreId) c.tabs.push(t)
  //     }
  //     if (c.tabs.length) {
  //       lastIndex = c.tabs[c.tabs.length - 1].index
  //       c.startIndex = c.tabs[0].index
  //       c.endIndex = lastIndex++
  //     } else {
  //       c.startIndex = lastIndex
  //       c.endIndex = c.startIndex
  //     }
  //   }

  //   return state.panels
  // },
  activePanel: (s, g) => g.panels[s.panelIndex],
  defaultPanel: (_, g) => g.panels.find(p => p.cookieStoreId === g.defaultCtxId),
}
