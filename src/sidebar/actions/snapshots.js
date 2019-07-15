import { DEFAULT_CTX } from '../store/state'
import { DEFAULT_CTX_ID } from '../../defaults'
import Actions from '.'
import Utils from '../../utils'

let createSnapLayerTimeout, snapshotNeeded, snapLayersBuf = []

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
 * Schedule snapshots
 */
function scheduleSnapshots() {
  if (this.state.snapIntervalID) clearInterval(this.state.snapIntervalID)
  if (this.state.snapInterval) {
    this.state.snapIntervalID = setInterval(() => {
      if (snapshotNeeded) {
        Actions.createBaseSnapshot()
        snapshotNeeded = false
      }
    }, this.state.snapInterval)
  }
}

/**
 * Create base snapshot
 */
async function createBaseSnapshot() {
  // Gather snapshot data
  let items = []
  for (let tab of this.getters.pinnedTabs) {
    items.push([ tab.id, tab.url, tab.title, tab.lvl, tab.cookieStoreId ])
  }
  for (let panel of this.state.panels) {
    if (!panel.tabs || panel.private) continue
    // Add panel info
    items.push([ panel.cookieStoreId, panel.color, panel.icon, panel.name ])

    // Go through tabs
    for (let tab of panel.tabs) {
      items.push([ tab.id, tab.url, tab.title, tab.lvl ])
    }
  }

  // Create snapshot
  const snapshot = {
    id: Utils.uid(),
    time: Date.now(),
    windowId: this.state.windowId,
    items,
  }
  this.state.snapshot = snapshot

  // Retrieve base-snapshots and snapLayers
  let snapshots = []
  const ans = await browser.storage.local.get(['snapshots', 'snapLayers'])

  // Append current base snapshot
  if (ans && ans.snapshots) snapshots = ans.snapshots
  snapshots.push(snapshot)

  // Set snapLayers of previous base-snapshot
  if (ans && ans.snapLayers && ans.snapLayers.length) {
    for (let i = snapshots.length; i--;) {
      if (snapshots[i].id === ans.snapLayers[0][0]) {
        snapshots[i].layers = ans.snapLayers
        break
      }
    }
  }
  this.state.snapLayers = []

  // Save snapshots and reset snapLayers
  browser.storage.local.set({ snapshots, snapLayers: [] })
}

/**
 * Create snapshot layer
 */
function createSnapLayer(id, key, val) {
  const layer = { id, t: Date.now() }
  if (key !== undefined) layer.key = key

  if (key === 'tab') {
    layer.index = val.index
    layer.url = val.url
    layer.title = val.title
    layer.lvl = val.lvl
    layer.pinned = val.pinned
    layer.ctr = val.cookieStoreId
  } else if (key === 'tab-mv') {
    layer.index = val
    layer.lvl = this.state.tabsMap[id].lvl
  } else if (val !== undefined) {
    layer.val = val
  }

  snapLayersBuf.push(layer)

  if (createSnapLayerTimeout) clearTimeout(createSnapLayerTimeout)
  createSnapLayerTimeout = setTimeout(async () => {
    createSnapLayerTimeout = null

    this.state.bg.postMessage({
      action: 'appendSnapLayers',
      args: [this.state.windowId, snapLayersBuf],
    })
    snapLayersBuf = []
  }, 750)
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

/**
 * Retrieve snapshots data
 */
async function gimmeSnapshotData() {
  return Promise.resolve(this.state.windowId)
}

export default {
  makeSnapshot,
  scheduleSnapshots,
  createBaseSnapshot,
  createSnapLayer,
  applySnapshot,
  loadSnapshots,

  gimmeSnapshotData,
}