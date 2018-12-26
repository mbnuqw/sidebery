import Utils from '../../libs/utils'

export default {
  /**
   * Load local id or create new
   */
  async loadLocalID({ state }) {
    let ans = await browser.storage.local.get('id')
    if (ans.id) {
      state.localID = ans.id
    } else {
      state.localID = Utils.Uid()
      browser.storage.local.set({ id: state.localID })
    }
  },

  /**
   * Clear sync data.
   */
  async clearSyncData({ state }) {
    const syncPanelsData = {
      time: ~~(Date.now() / 1000),
      panels: [],
    }
    await browser.storage.sync.set({ [state.localID]: JSON.stringify(syncPanelsData) })
  },

  /**
   * Put sync panels data to sync storage.
   */
  async saveSyncPanels({ state, getters }) {
    if (state.private) return

    if (state.savePanelsTimeout) clearTimeout(state.savePanelsTimeout)
    state.savePanelsTimeout = setTimeout(() => {
      const syncPanels = []
      state.syncedPanels.map((sync, index) => {
        if (!sync) return
        let panel = getters.panels[index]
        if (!panel) return

        syncPanels.push({
          cookieStoreId: panel.cookieStoreId,
          name: panel.name,
          icon: panel.icon,
          color: panel.color,
          urls: panel.tabs.map(t => t.url),
        })
      })
      const syncPanelsData = {
        time: ~~(Date.now() / 1000),
        panels: syncPanels,
      }
      browser.storage.sync.set({ [state.localID]: JSON.stringify(syncPanelsData) })
    }, 500)
  },

  /**
   * Load sync panels state.
   */
  async loadSyncPanels({ state, dispatch }) {
    let ans = await browser.storage.sync.get()
    Object.keys(ans).filter(id => id !== state.localID)

    let ids = Object.keys(ans).filter(id => id !== state.localID)
    if (!ids.length) return
    let syncData
    ids.map(id => {
      if (!ans[id] || !ans[id].newValue) return
      try {
        let a = JSON.parse(ans[id].newValue)
        if (syncData && syncData.time > a.time) return
        else syncData = a
      } catch (err) {
        // it's ok
      }
    })
    if (!syncData) return
    state.lastSyncPanels = syncData
    dispatch('updateSyncPanels', syncData)
  },

  /**
   * ReSync panels from last loaded state.
   */
  resyncPanels({ state, dispatch }) {
    if (state.lastSyncPanels) dispatch('updateSyncPanels', state.lastSyncPanels)
  },

  /**
   * Update current panels state.
   */
  updateSyncPanels({ state, getters }, synced) {
    synced.panels.map((syncPanel, i) => {
      if (!syncPanel) return

      // Check if there is such panel and everything ok
      const locPanelIndex = getters.panels.findIndex(p => p.name === syncPanel.name)
      const locPanel = getters.panels[locPanelIndex]
      if (locPanelIndex === -1) return
      if (!state.syncedPanels[locPanelIndex]) return
      if (!syncPanel.urls || !locPanel.tabs) return

      // Reset last sync panel data
      if (state.lastSyncPanels) {
        state.lastSyncPanels.panels[i] = null
      }

      // Update container
      if (!locPanel.pinned) {
        if (locPanel.color !== syncPanel.color || locPanel.icon !== syncPanel.icon) {
          browser.contextualIdentities.update(locPanel.cookieStoreId, {
            color: syncPanel.color,
            icon: syncPanel.icon,
          })
        }
      }

      // Create missing tabs
      syncPanel.urls.map(syncUrl => {
        if (locPanel.tabs.find(t => t.url === syncUrl)) return

        browser.tabs.create({
          windowId: state.windowId,
          cookieStoreId: locPanel.cookieStoreId || getters.defaultCtxId,
          pinned: locPanel.pinned,
          url: syncUrl,
          active: false,
        })
      })
    })
  },
}
