export default {
  /**
   * Load all tabs for current window
   */
  async loadTabs({ state, getters }) {
    const windowId = browser.windows.WINDOW_ID_CURRENT
    const tabs = await browser.tabs.query({ windowId })

    // Check order of tabs and get moves for normalizing
    const ctxs = [getters.defaultCtxId].concat(state.ctxs.map(ctx => ctx.cookieStoreId))
    const moves = []
    let index = 0
    let offset = 0
    for (let i = 0; i < ctxs.length; i++) {
      const ctx = ctxs[i]
      for (let j = 0; j < tabs.length; j++) {
        const tab = tabs[j]
        if (tab.cookieStoreId !== ctx) continue

        if (tab.pinned) {
          index++
          continue
        }

        if (index !== tab.index + offset) {
          moves.push([tab.id, index])
          offset++
        }
        index++
      }
    }

    // Ask user for normalizing
    // ...

    state.tabs = tabs

    // Normalize order
    moves.map(async move => {
      await browser.tabs.move(move[0], { index: move[1] })
    })
  },

  /**
   * Create new tab
   */
  createTab({ getters }, ctxId) {
    if (!ctxId) return
    let p = getters.panels.find(p => p.cookieStoreId === ctxId)
    if (!p || !p.tabs) return
    let index = p.tabs.length ? p.endIndex + 1 : p.startIndex
    browser.tabs.create({ index, cookieStoreId: ctxId })
  },

  /**
   * Remove tab.
   */
  async removeTab({ state, getters }, tab) {
    let p = getters.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
    if (!p || !p.tabs) return
    if (tab.index === p.endIndex && p.tabs.length > 1) {
      let prevTab = state.tabs[p.endIndex - 1]
      await browser.tabs.update(prevTab.id, { active: true })
      browser.tabs.remove(tab.id)
    } else {
      browser.tabs.remove(tab.id)
    }
  },

  /**
   * Remove all tabs underneath.
   */
  closeTabsDown({ getters }, tabId) {
    let tabIndex
    const panel = getters.panels.find(p => {
      if (!p.tabs) return false
      tabIndex = p.tabs.findIndex(t => t.id === tabId)
      if (tabIndex !== -1) return true
    })
    if (!panel) return

    if (!panel.tabs || !panel.tabs[tabIndex]) return
    const tabs = panel.tabs.slice(tabIndex)
    if (panel.tabs[tabIndex - 1] && tabs.find(t => t.active)) {
      browser.tabs.update(panel.tabs[tabIndex - 1].id, { active: true })
    }

    browser.tabs.remove(tabs.map(t => t.id))
  },

  /**
   * Activate tab relatively current active tab.
   */
  switchTab({ state, getters }, { globaly, cycle, step }) {
    if (state.switchTabPause) return
    state.switchTabPause = setTimeout(() => {
      clearTimeout(state.switchTabPause)
      state.switchTabPause = null
    }, 50)

    let tabs = globaly ? state.tabs : getters.panels[state.panelIndex].tabs
    if (!tabs || !tabs.length) return

    let index = tabs.findIndex(t => t.active)
    if (step > 0) {
      index = index + step
      if (index >= tabs.length) {
        if (cycle) index = 0
        else return
      }
    }
    if (step < 0) {
      if (index < 0) index = tabs.length
      index = index + step
      if (index < 0) {
        if (cycle) index = tabs.length - 1
        else return
      }
    }

    browser.tabs.update(tabs[index].id, { active: true })
  },

  /**
   * Activate last active tab on the panel
   */
  activateLastActiveTabOf({ state, getters }, panelIndex) {
    const tabId = state.activeTabs[panelIndex]
    const p = getters.panels[panelIndex]
    if (!p || !p.tabs) return

    // Last active tab
    if (typeof tabId === 'number' && p.tabs.find(t => t.id === tabId)) {
      browser.tabs.update(tabId, { active: true })
      return
    }

    // Or just last
    const lastTab = p.tabs[p.tabs.length - 1]
    if (lastTab) browser.tabs.update(lastTab.id, { active: true })
  },
}
