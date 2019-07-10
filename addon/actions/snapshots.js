import Actions from './index.js'

let snapshotNeeded, currentSnapshot, snapLayersBuf = {}
let baseSnapshotTimeout, appendSnapLayersTimeout

/**
 * Create base snapshot
 */
async function createBaseSnapshot() {
  // Get containers info
  const containers = []
  for (let containerId in this.containers) {
    if (!this.containers.hasOwnProperty(containerId)) continue
    containers.push([
      this.containers[containerId].cookieStoreId,
      this.containers[containerId].color,
      this.containers[containerId].icon,
      this.containers[containerId].name,
    ])
  }

  // Get tabs info per window
  const windows = {}
  for (let windowId in this.windows) {
    if (!this.windows.hasOwnProperty(windowId)) continue
    const window = this.windows[windowId]
    const items = []

    let containerId
    for (let tab of window.tabs) {
      // Add pinned tab
      if (tab.pinned) {
        items.push([ tab.id, tab.url, tab.title, tab.cookieStoreId ])
        continue
      }

      // Add container id
      if (containerId !== tab.cookieStoreId) {
        containerId = tab.cookieStoreId
        items.push(containerId)
      }

      // Add tab
      items.push([ tab.id, tab.url, tab.title, tab.lvl ])
    }

    windows[windowId] = {
      layers: [],
      items,
    }
  }

  currentSnapshot = {
    id: Math.random().toString(16).replace('0.', Date.now().toString(16)),
    time: Math.trunc(Date.now()/1000),
    containers,
    windows,
  }

  let { snapshots, snapLayers } = await browser.storage.local.get({
    snapshots: [],
    snapLayers: {},
  })

  // Append snapLayers of previous base-snapshot
  if (snapLayers) {
    for (let winId in snapLayers) {
      if (!snapLayers.hasOwnProperty(winId)) continue
      const prevSnapshot = snapshots[snapshots.length - 1]
      const prevSnapWin = prevSnapshot.windows[winId]
      if (!prevSnapWin) continue
      if (!prevSnapWin.layers) prevSnapWin.layers = snapLayers[winId]
      else prevSnapWin.layers = prevSnapWin.layers.concat(snapLayers[winId])
    }
  }

  snapshots.push(currentSnapshot)

  // Save snapshots and reset snapLayers
  browser.storage.local.set({ snapshots, snapLayers: {} })
}
function createBaseSnapshotDebounced(delay = 750) {
  if (baseSnapshotTimeout) clearTimeout(baseSnapshotTimeout)
  baseSnapshotTimeout = setTimeout(Actions.createBaseSnapshot, delay)
}

/**
 * Append snapshot layers
 */
function appendSnapLayers(windowId, layers) {
  if (!currentSnapshot) return

  if (!snapLayersBuf[windowId]) snapLayersBuf[windowId] = layers
  else snapLayersBuf[windowId] = snapLayersBuf[windowId].concat(layers)

  if (appendSnapLayersTimeout) clearTimeout(appendSnapLayersTimeout)
  appendSnapLayersTimeout = setTimeout(async () => {
    appendSnapLayersTimeout = null

    let { snapLayers } = await browser.storage.local.get({ snapLayers: {} })
    for (let winId in snapLayersBuf) {
      if (!snapLayersBuf.hasOwnProperty(winId)) continue
      
      if (!snapLayers[winId]) snapLayers[winId] = snapLayersBuf[winId]
      else snapLayers[winId] = snapLayers[winId].concat(snapLayersBuf[winId])
    }

    browser.storage.local.set({ snapLayers })
    snapLayersBuf = {}
  }, 500)
}

/**
 * Schedule snapshots
 */
function scheduleSnapshots() {
  if (this.settings.snapIntervalID) clearInterval(this.settings.snapIntervalID)
  if (this.settings.snapInterval) {
    this.settings.snapIntervalID = setInterval(() => {
      // Hm, 'snapshotNeeded' flag is not in this instance...
      // This flag can be set only in sidebar instance
      // 
      if (snapshotNeeded) {
        createBaseSnapshot(this.windows)
        snapshotNeeded = false
      }
    }, this.settings.snapInterval)
  }
}

export default {
  createBaseSnapshot,
  createBaseSnapshotDebounced,
  appendSnapLayers,
  // createSnapLayer,
  scheduleSnapshots,
}