import { DEFAULT_CTX } from '../store/state'
import { DEFAULT_CTX_ID } from '../../defaults'
import Actions from '.'

/**
 * Make snapshot
 */
async function makeSnapshot() {
  const time = ~~(Date.now() / 1000)

  // Gather tabs and containers
  const tabs = []
  const ctxs = []
  // Pinned tabs
  if (this.state.snapshotsTargets.pinned) {
    for (let tab of this.getters.pinnedTabs) {
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
  for (let panel of this.state.panels) {
    // Filter empty, non-tabs and turned-off panels
    if (!panel.tabs || !panel.tabs.length) continue
    if (panel.cookieStoreId === DEFAULT_CTX) {
      if (!this.state.snapshotsTargets.default) continue
    } else {
      if (panel.cookieStoreId && !this.state.snapshotsTargets[panel.cookieStoreId]) continue
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
    if (this.state.snapshotsTargets[panel.cookieStoreId]) {
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

  // Load snapshots
  const ans = await browser.storage.local.get('snapshots') || {}
  const snapshots = ans.snapshots || []
  snapshots.reverse()

  // Check if there are changes from last three snapshots
  const shape = JSON.stringify({ tabs: snapshot.tabs, ctxs: snapshot.ctxs })
  const existed = snapshots
    .slice(-3)
    .some(s => JSON.stringify({ tabs: s.tabs, ctxs: s.ctxs }) === shape)
  if (existed) return

  // Put new one to store
  snapshots.push(snapshot)

  // Remove last snapshots if there are too many of them
  const size = new Blob([JSON.stringify(snapshots)]).size
  if (size > 655360) {
    snapshots.splice(-5, 5)
  }

  // Store snapshots and unload from mem
  await browser.storage.local.set({ snapshots })
}

/**
 * Restore contexs and tabs from snapshot
 */
async function applySnapshot(snapshot) {
  if (!snapshot) return

  // Restore tabs
  const tabsMap = {}
  for (let tab of snapshot.tabs) {
    let panel = this.state.panelsMap[tab.cookieStoreId]
    let panelIndex = panel ? panel.index : this.state.private ? 1 : 2
    if (!panel) panel = this.state.panelsMap[DEFAULT_CTX_ID]

    // Get group url
    if (tab.url.startsWith('moz') && tab.url.includes('/group.html')) {
      const idIndex = tab.url.indexOf('/group.html') + 12
      const groupId = tab.url.slice(idIndex)
      tab.url = browser.runtime.getURL('group/group.html') + `#${groupId}`
    }

    // Create tabs
    const createdTab = await browser.tabs.create({
      windowId: this.state.windowId,
      url: tab.url,
      pinned: tab.pinned,
      cookieStoreId: panel.cookieStoreId,
      openerTabId: tabsMap[tab.parentId],
      active: false,
    })
    if (tab.id !== undefined) tabsMap[tab.id] = createdTab.id

    // Switch to panel
    if (!tab.pinned && panelIndex !== this.state.panelIndex) {
      Actions.setPanel(panelIndex)
    }
  }
}

/**
 * Load snapshots.
 */
async function loadSnapshots() {
  const ans = await browser.storage.local.get('snapshots')
  if (ans && ans.snapshots) this.state.snapshots = ans.snapshots
  this.state.snapshots.reverse()
}

export default {
  makeSnapshot,
  applySnapshot,
  loadSnapshots,
}