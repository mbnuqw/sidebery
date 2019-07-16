import Actions from './index.js'

let currentSnapshot, snapWinLayersBuf = {}, snapGlobLayersBuf = []
let baseSnapshotTimeout, appendSnapLayersTimeout
let snapshotsReady = true

/**
 * Create base snapshot
 */
async function createBaseSnapshot() {
  snapshotsReady = false

  // Get containers info
  const containersById = []
  for (let containerId in this.containers) {
    if (!this.containers.hasOwnProperty(containerId)) continue
    containersById[this.containers[containerId].cookieStoreId] = {
      id: this.containers[containerId].cookieStoreId,
      color: this.containers[containerId].color,
      icon: this.containers[containerId].icon,
      name: this.containers[containerId].name,
    }
  }

  // Update tree structure
  if (this.settings.tabsTree) await Actions.updateTabsTree()

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
        items.push({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          ctr: tab.cookieStoreId,
        })
        continue
      }

      // Add container id
      if (containerId !== tab.cookieStoreId) {
        containerId = tab.cookieStoreId
        items.push(containerId)
      }

      // Add tab
      items.push({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        lvl: tab.lvl,
      })
    }

    windows[windowId] = {
      layers: [],
      items,
    }
  }

  currentSnapshot = {
    id: Math.random().toString(16).replace('0.', Date.now().toString(16)),
    time: Date.now(),
    containersById,
    windows,
  }

  let { snapshots, snapLayers } = await browser.storage.local.get({
    snapshots: [],
    snapLayers: { global: [], windows: {} },
  })

  // Append snapLayers of previous base-snapshot
  const prevSnapshot = snapshots[snapshots.length - 1]
  if (prevSnapshot) {
    if (!prevSnapshot.layers) prevSnapshot.layers = snapLayers.global
    else prevSnapshot.layers = prevSnapshot.layers.concat(snapLayers.global)

    for (let winId in snapLayers.windows) {
      if (!snapLayers.windows.hasOwnProperty(winId)) continue
      const prevSnapWin = prevSnapshot.windows[winId]
      if (!prevSnapWin) continue
      if (!prevSnapWin.layers) prevSnapWin.layers = snapLayers.windows[winId]
      else prevSnapWin.layers = prevSnapWin.layers.concat(snapLayers.windows[winId])
    }
  }

  snapshots.push(currentSnapshot)

  // Save snapshots and reset snapLayers
  browser.storage.local.set({ lastSnapTime: currentSnapshot.time })
  await browser.storage.local.set({ snapshots, snapLayers: { global: [], windows: {} } })
  snapshotsReady = true

  // Return snapshot
  return currentSnapshot
}
function createBaseSnapshotDebounced(delay = 750) {
  if (baseSnapshotTimeout) clearTimeout(baseSnapshotTimeout)
  baseSnapshotTimeout = setTimeout(Actions.createBaseSnapshot, delay)
}

/**
 * Append snapshot layers
 */
function appendSnapLayers(windowId, layers) {
  if (!currentSnapshot) {
    Actions.createBaseSnapshot()
    return
  }

  if (windowId === -1) {
    if (!Array.isArray(layers)) snapGlobLayersBuf.push(layers)
    else snapGlobLayersBuf = snapGlobLayersBuf.concat(layers)
  } else {
    if (!snapWinLayersBuf[windowId]) snapWinLayersBuf[windowId] = layers
    else snapWinLayersBuf[windowId] = snapWinLayersBuf[windowId].concat(layers)
  }

  if (appendSnapLayersTimeout) clearTimeout(appendSnapLayersTimeout)
  appendSnapLayersTimeout = setTimeout(() => {
    appendSnapLayersTimeout = null
    Actions.saveSnapLayers()
  }, 500)
}

/**
 * Save snapshot layers
 */
async function saveSnapLayers() {
  if (!snapshotsReady) return

  let { snapLayers } = await browser.storage.local.get({
    snapLayers: { global: [], windows: {} }
  })

  // Globaly
  snapLayers.global = snapLayers.global.concat(snapGlobLayersBuf)

  // Per-window
  for (let winId in snapWinLayersBuf) {
    if (!snapWinLayersBuf.hasOwnProperty(winId)) continue
    
    if (!snapLayers.windows[winId]) {
      snapLayers.windows[winId] = snapWinLayersBuf[winId]
    } else {
      snapLayers.windows[winId] = snapLayers.windows[winId].concat(snapWinLayersBuf[winId])
    }
  }

  browser.storage.local.set({ snapLayers })
  snapGlobLayersBuf = []
  snapWinLayersBuf = {}
}

/**
 * Schedule snapshots
 */
async function scheduleSnapshots() {
  const currentTime = Date.now()
  let elapsed, nextTimeout = this.settings.snapInterval
  if (currentSnapshot) elapsed = currentTime - currentSnapshot.time
  else elapsed = currentTime - await Actions.getLastSnapTime()

  if (elapsed >= this.settings.snapInterval) Actions.createBaseSnapshot()
  else nextTimeout = this.settings.snapInterval - elapsed

  Actions.scheduleNextSnapshot(nextTimeout)
}

/**
 * Schedule next snapshot with given delay time
 */
function scheduleNextSnapshot(nextTimeout) {
  setTimeout(() => {
    nextTimeout = this.settings.snapInterval
    Actions.createBaseSnapshot()
    Actions.scheduleNextSnapshot(nextTimeout)
  }, nextTimeout)
}

/**
 * Get the last snapshot time
 */
async function getLastSnapTime() {
  const ans = await browser.storage.local.get('lastSnapTime')
  if (ans && typeof ans.lastSnapTime === 'number') return ans.lastSnapTime
}

/**
 * Apply snapshot
 */
async function applySnapshot(snapshot) {
  for (let winId in snapshot.windowsById) {
    if (!snapshot.windowsById.hasOwnProperty(winId)) continue
    const winInfo = snapshot.windowsById[winId]

    // Create window
    const noUrlUrl = browser.runtime.getURL('url/url.html')
    const urls = []
    for (let tab of winInfo.tabs) {
      if (
        tab.url.startsWith('about:') ||
        tab.url.startsWith('data:') ||
        tab.url.startsWith('file:')
      ) {
        urls.push(noUrlUrl + '#' + tab.url)
      } else {
        urls.push(tab.url)
      }
    }
    await browser.windows.create({ url: urls })
  }
}

export default {
  createBaseSnapshot,
  createBaseSnapshotDebounced,
  appendSnapLayers,
  saveSnapLayers,
  scheduleSnapshots,
  scheduleNextSnapshot,
  getLastSnapTime,
  applySnapshot,
}