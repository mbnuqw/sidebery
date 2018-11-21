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
    if (tabs.length === 0 && ctxs.length === 0) return
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

    const snapshots = await dispatch('loadAllSnapshots')
    snapshots.push(JSON.parse(JSON.stringify(state.snapshots[0])))
    await browser.storage.local.set({ snapshots })
  },

  /**
   * Restore contexs and tabs from snapshot
   */
  applySnapshot({ state, dispatch }, index) {
    const snapshot = state.snapshots[index]
    if (!snapshot) return

    // Restore contexts
    snapshot.ctxs.map(c => {
      const lctx = state.ctxs.find(lc => lc.cookieStoreId === c.cookieStoreId)
      if (lctx) return
      dispatch('createContext', { name: c.name, color: c.color, icon: c.icon })
    })

    // Restore tabs
    snapshot.tabs.map(t => {
      const ltab = state.ctxs.find(lt => lt.id === t.id && lt.url === t.url)
      if (ltab) return
      browser.tabs.create({
        url: t.url,
        active: t.active,
        pinned: t.pinned,
        cookieStoreId: t.cookieStoreId,
      })
    })
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