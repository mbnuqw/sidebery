import { DEFAULT_CTX } from '../store.state'

export default {
  /**
   * Make snapshot
   */
  async makeSnapshot({ state, dispatch, getters }) {
    const time = ~~(Date.now() / 1000)

    // Gather tabs and containers
    const tabs = []
    const ctxs = []
    // Pinned tabs
    if (state.snapshotsTargets.pinned) {
      for (let tab of getters.pinnedTabs) {
        if (tab.url.startsWith('about')) continue
        tabs.push({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          pinned: tab.pinned,
          cookieStoreId: tab.cookieStoreId,
        })
      }
    }

    // Tabs on panels
    for (let panel of getters.panels) {
      // Filter empty, non-tabs and turned-off panels
      if (!panel.tabs || !panel.tabs.length) continue
      if (panel.cookieStoreId === DEFAULT_CTX) {
        if (!state.snapshotsTargets.default) continue
      } else {
        if (panel.cookieStoreId && !state.snapshotsTargets[panel.cookieStoreId]) continue
      }

      for (let tab of panel.tabs) {
        if (tab.url.startsWith('about')) continue
        tabs.push({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          pinned: tab.pinned,
          cookieStoreId: tab.cookieStoreId,
          parentId: tab.parentId,
          lvl: tab.lvl,
        })
      }

      // Gather context panels
      if (state.snapshotsTargets[panel.cookieStoreId]) {
        ctxs.push({
          cookieStoreId: panel.cookieStoreId,
          name: panel.name,
          icon: panel.icon,
          color: panel.color,
          colorCode: panel.colorCode,
        })
      }
    }

    // If all ok, create snapshot and load
    if (tabs.length === 0) return
    const snapshot = { tabs, ctxs, time }
    state.snapshots = await dispatch('loadSnapshots')

    // Check if there are changes from last five snapshots
    const shape = JSON.stringify({ tabs: snapshot.tabs, ctxs: snapshot.ctxs })
    const existed = state.snapshots
      .slice(0, 5)
      .some(s => JSON.stringify({ tabs: s.tabs, ctxs: s.ctxs }) === shape)
    if (existed) return

    // Put new one to store
    state.snapshots.unshift(snapshot)

    // Remove last snapshots if there are too many of them
    const size = new Blob([JSON.stringify(state.snapshots)]).size
    if (size > 655360) {
      state.snapshots.splice(-5, 5)
    }

    // Store snapshots and unload from mem
    const snapshots = JSON.parse(JSON.stringify(state.snapshots)).reverse()
    await browser.storage.local.set({ snapshots })
    dispatch('unloadSnapshots')
  },

  /**
   * Restore contexs and tabs from snapshot
   */
  async applySnapshot({ state, commit, getters }, snapshot) {
    if (!snapshot) return

    // Restore tabs
    const tabsMap = {}
    for (let tab of snapshot.tabs) {
      let panelIndex = getters.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
      let panel = getters.panels[panelIndex]
      if (!panel) {
        panel = getters.defaultPanel
        panelIndex = state.private ? 1 : 2
      }

      // Get group url
      if (tab.url.startsWith('moz') && tab.url.includes('/group.html')) {
        const idIndex = tab.url.indexOf('/group.html') + 12
        const groupId = tab.url.slice(idIndex)
        tab.url = browser.runtime.getURL('group/group.html') + `#${groupId}`
      }

      // Create tabs
      const createdTab = await browser.tabs.create({
        url: tab.url,
        pinned: tab.pinned,
        cookieStoreId: panel.cookieStoreId,
        openerTabId: tabsMap[tab.parentId],
        active: false,
      })
      if (tab.id !== undefined) tabsMap[tab.id] = createdTab.id

      // Switch to panel
      if (!tab.pinned && panelIndex !== state.panelIndex) {
        commit('setPanel', panelIndex)
      }
    }
  },

  /**
   * Remove snapshot
   */
  async removeSnapshot({ state }, index) {
    if (index < 0) return

    // Remove
    if (state.snapshots[index]) {
      state.snapshots.splice(index, 1)
    }

    // Store snapshots
    const snapshots = JSON.parse(JSON.stringify(state.snapshots)).reverse()
    await browser.storage.local.set({ snapshots })
  },

  /**
   * Remove all snapshots.
   */
  async removeAllSnapshot({ state }) {
    state.snapshots = []
    await browser.storage.local.set({ snapshots: [] })
  },

  /**
   * Load snapshots.
   */
  async loadSnapshots() {
    const ans = await browser.storage.local.get('snapshots')
    if (!ans.snapshots) return []
    return ans.snapshots.reverse() || []
  },

  /**
   * Unload snapshots.
   */
  unloadSnapshots({ state }) {
    state.snapshots = []
  },

  /**
   * Open snapshots viewer
   */
  async openSnapshotsViewer({ state, dispatch }) {
    state.snapshots = await dispatch('loadSnapshots')
    if (state.panelIndex >= 0) state.lastPanelIndex = state.panelIndex
    state.panelIndex = -4
  },

  /**
   * Close snapshots viewer
   */
  async closeSnapshotsViewer({ state }) {
    state.lastPanelIndex = state.panelIndex
    state.panelIndex = state.lastPanelIndex
  },
}
