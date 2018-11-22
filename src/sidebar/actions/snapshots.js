export default {
  /**
   * Make snapshot
   */
  async makeSnapshot({ state, dispatch, getters }) {
    const time = ~~(Date.now() / 1000)

    // Gather tabs and containers
    const tabs = []
    const ctxs = []
    for (let t of state.tabs) {
      const p = state.snapshotsTargets[0] !== t.pinned
      const d = state.snapshotsTargets[1] !== (t.cookieStoreId === getters.defaultCtxId)
      const c = !state.snapshotsTargets.includes(t.cookieStoreId)
      if (p && d && c) continue
      if (!t.url.indexOf('about')) continue
      if (tabs.find(pt => {
        return pt.url === t.url
          && pt.cookieStoreId === t.cookieStoreId
          && pt.pinned === t.pinned
      })) {
        continue
      }

      tabs.push({
        title: t.title,
        url: t.url,
        pinned: t.pinned,
        cookieStoreId: t.cookieStoreId,
      })
    }
    for (let c of state.ctxs) {
      if (!state.snapshotsTargets.includes(c.cookieStoreId)) continue

      ctxs.push({
        cookieStoreId: c.cookieStoreId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        colorCode: c.colorCode,
      })
    }
    console.log('[DEBUG] length of tabs', tabs.length);
    if (tabs.length === 0) return
    const snapshot = { tabs, ctxs, time }

    // Check if there are changes from last five snapshots
    for (let s of state.snapshots) {
      let same = snapshot.tabs.length === s.tabs.length
      for (let t of snapshot.tabs) {
        if (!same) break
        same = same && !!s.tabs.find(pt => {
          return pt.url === t.url
            && pt.cookieStoreId === t.cookieStoreId
            && pt.pinned === t.pinned
        })
      }
      if (same) return
    }

    // Put to store
    state.snapshots.unshift(snapshot)
    if (state.snapshots.length > 5) {
      state.snapshots = state.snapshots.slice(0, 5)
    }

    // Get all snapshots and remove all beyond limit
    const snapshots = await dispatch('loadAllSnapshots')
    let limit = 0
    if (state.snapshotsLimit === '1d') limit = 86400
    if (state.snapshotsLimit === '1w') limit = 604800
    if (state.snapshotsLimit === '1m') limit = 18144000

    let i = 0
    for (; i < snapshots.length; i++) {
      if (time - limit < snapshots[i].time) break
    }
    snapshots.splice(0, i)
    snapshots.push(JSON.parse(JSON.stringify(state.snapshots[0])))
    await browser.storage.local.set({ snapshots })
  },

  /**
   * Restore contexs and tabs from snapshot
   */
  async applySnapshot({ state, dispatch }, snapshot) {
    if (!snapshot) return

    // Restore contexts
    const ctxIdMap = {}
    for (let c of snapshot.ctxs) {
      const lctx = state.ctxs.find(lc => lc.cookieStoreId === c.cookieStoreId)
      if (lctx) continue
      let nc = await dispatch('createContext', { name: c.name, color: c.color, icon: c.icon })
      ctxIdMap[c.cookieStoreId] = nc.cookieStoreId
    }

    // Restore tabs
    for (let t of snapshot.tabs) {
      const ltab = state.tabs.find(lt => {
        return lt.id === t.id
          && lt.url === t.url
          && lt.cookieStoreId === t.cookieStoreId
      })
      if (ltab) continue
      await browser.tabs.create({
        url: t.url,
        pinned: t.pinned,
        cookieStoreId: ctxIdMap[t.cookieStoreId] || t.cookieStoreId,
      })
    }
    dispatch('loadTabs')
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
  async loadSnapshots({ state }) {
    const ans = await browser.storage.local.get('snapshots')
    if (!ans.snapshots) return []
    state.snapshots = ans.snapshots.slice(-5).reverse()
  },

  /**
   * Load all snapshots.
   */
  async loadAllSnapshots() {
    const ans = await browser.storage.local.get('snapshots')
    return ans.snapshots || []
  },
}