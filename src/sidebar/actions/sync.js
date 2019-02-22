import Vue from 'vue'
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
      id: state.localID,
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
      // console.log('[DEBUG] SYNC ACTION saveSyncPanels');
      const syncPanels = []
      let syncPinnedTabs = []
      if (state.pinnedTabsSync) {
        syncPinnedTabs = getters.pinnedTabs.map(t => {
          const p = getters.panels.find(p => p.cookieStoreId === t.cookieStoreId)
          const ctx = p.type === 'default' ? p.type : p.name
          return { url: t.url, ctx }
        }).filter(t => !t.url.startsWith('about:'))
      }
      for (let p of getters.panels) {
        if (!p.sync) continue
        syncPanels.push({
          cookieStoreId: p.cookieStoreId,
          default: p.cookieStoreId === getters.defaultCtxId,
          name: p.name,
          icon: p.icon,
          color: p.color,
          urls: p.tabs.map(t => t.url).filter(u => !u.startsWith('about:')),
        })
      }

      const syncPanelsData = {
        id: state.localID,
        time: ~~(Date.now() / 1000),
        panels: syncPanels,
        pinnedTabs: syncPinnedTabs,
      }

      if (syncPanels.length > 0 || syncPinnedTabs.length > 0) {
        browser.storage.sync.set({ [state.localID]: JSON.stringify(syncPanelsData) })
      } else {
        browser.storage.sync.remove(state.localID)
      }
    }, 500)
  },

  /**
   * Load sync panels state.
   */
  async loadSyncPanels({ state, dispatch }) {
    // console.log('[DEBUG] SYNC ACTION loadSyncPanels');
    let ans = await browser.storage.sync.get()
    Object.keys(ans).filter(id => id !== state.localID)

    let ids = Object.keys(ans).filter(id => id !== state.localID)
    const syncData = ids.reduce((syncData, id) => {
      if (!ans[id]) return syncData

      let data
      try {
        data = JSON.parse(ans[id])
      } catch (err) {
        // ERROR
        return syncData
      }

      // Check if there are some tabs for sync
      let syncPanels = data.panels ? data.panels : []
      let syncPinnedTabs = data.pinnedTabs ? data.pinnedTabs : []
      if (!syncPanels.length && !syncPinnedTabs.length) return syncData

      if (syncData && syncData.time > data.time) return syncData
      else syncData = data

      return syncData
    }, null)

    if (!syncData) return
    state.lastSyncPanels = syncData
    dispatch('saveState')
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
    if (!synced) return
    if (synced.id === state.localID) return
    // console.log('[DEBUG] SYNC ACTION updateSyncPanels');

    // Check if this data already used
    if (state.synced[synced.id] && state.synced[synced.id] >= synced.time) return
    else Vue.set(state.synced, synced.id, synced.time)

    // Update pinned tabs
    if (state.pinnedTabsSync && synced.pinnedTabs) {
      for (let st of synced.pinnedTabs) {
        // Check if tab is internal
        if (st.url.startsWith('about:')) continue

        // Check cookieStoreId
        const locPanel = getters.panels.find(p => {
          if (st.ctx === 'default') {
            return p.cookieStoreId === getters.defaultCtxId
          } else {
            return p.name === st.ctx
          }
        })
        if (!locPanel) continue

        // Check if there are same tabs
        let double = getters.pinnedTabs
          .find(t => t.url === st.url && t.cookieStoreId === locPanel.cookieStoreId)
        if (double) continue

        browser.tabs.create({
          windowId: state.windowId,
          cookieStoreId: locPanel.cookieStoreId,
          pinned: true,
          url: st.url,
          active: false,
        })
      }
    }

    synced.panels.map((syncPanel, i) => {
      if (!syncPanel) return

      // Check if there is panel with this name and everything ok
      const locPanel = getters.panels.find(p => {
        if (syncPanel.default) {
          return p.cookieStoreId === getters.defaultCtxId
        } else {
          return p.name === syncPanel.name
        }
      })
      if (!locPanel || !locPanel.sync) return
      if (!syncPanel.urls || !locPanel.tabs) return

      // Reset last sync panel data
      if (state.lastSyncPanels) {
        state.lastSyncPanels.panels[i] = null
      }

      // Update container
      if (locPanel.color !== syncPanel.color || locPanel.icon !== syncPanel.icon) {
        browser.contextualIdentities.update(locPanel.cookieStoreId, {
          color: syncPanel.color,
          icon: syncPanel.icon,
        })
      }

      // Create missing tabs
      syncPanel.urls.map(syncUrl => {
        if (locPanel.tabs.find(t => t.url === syncUrl)) return
        if (syncUrl.startsWith('about:')) return

        browser.tabs.create({
          windowId: state.windowId,
          cookieStoreId: locPanel.cookieStoreId || getters.defaultCtxId,
          url: syncUrl,
          active: false,
        })
      })
    })
  },
}
