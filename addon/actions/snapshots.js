import Actions from './index.js'

let currentSnapshot
let baseSnapshotTimeout

/**
 * Create base snapshot
 */
async function createSnapshot() {
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

  let { snapshots } = await browser.storage.local.get({ snapshots: [] })
  snapshots.push(currentSnapshot)

  // Save snapshots and reset snapLayers
  await browser.storage.local.set({ snapshots, lastSnapTime: currentSnapshot.time })

  // Return snapshot
  return currentSnapshot
}
function createSnapshotDebounced(delay = 750) {
  if (baseSnapshotTimeout) clearTimeout(baseSnapshotTimeout)
  baseSnapshotTimeout = setTimeout(Actions.createSnapshot, delay)
}

/**
 * Schedule snapshots
 */
async function scheduleSnapshots() {
  let interval = this.settings.snapInterval
  const unit = this.settings.snapIntervalUnit
  if (!interval || typeof interval !== 'number') return
  if (unit === 'min') interval = this.settings.snapInterval * 60000
  if (unit === 'hr') interval = this.settings.snapInterval * 3600000
  if (unit === 'day') interval = this.settings.snapInterval * 86400000
  if (interval < 5000) return

  const currentTime = Date.now()
  let elapsed, nextTimeout = interval
  if (currentSnapshot) elapsed = currentTime - currentSnapshot.time
  else elapsed = currentTime - await Actions.getLastSnapTime()

  if (elapsed >= interval) Actions.createSnapshot()
  else nextTimeout = interval - elapsed

  Actions.scheduleNextSnapshot(nextTimeout)
}

/**
 * Schedule next snapshot with given delay time
 */
function scheduleNextSnapshot(nextTimeout) {
  setTimeout(() => {
    nextTimeout = this.settings.snapInterval
    Actions.createSnapshot()
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
  createSnapshot,
  createSnapshotDebounced,
  scheduleSnapshots,
  scheduleNextSnapshot,
  getLastSnapTime,
  applySnapshot,
}