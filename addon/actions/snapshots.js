import Actions from '../actions.js'

const MIN_SNAP_INTERVAL = 5000

let currentSnapshot
let baseSnapshotTimeout

/**
 * Create base snapshot
 */
async function createSnapshot() {
  // Get containers info
  const containersById = {}
  for (let containerId of Object.keys(this.containers)) {
    containersById[containerId] = {
      id: containerId,
      color: this.containers[containerId].color,
      icon: this.containers[containerId].icon,
      name: this.containers[containerId].name,
    }
  }

  // Update tree structure
  if (this.settings.tabsTree) await Actions.updateTabsTree()

  // Get tabs info per window
  const windows = {}
  for (let windowId of Object.keys(this.windows)) {
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

    windows[windowId] = { items }
  }

  currentSnapshot = {
    id: Math.random().toString(16).replace('0.', Date.now().toString(16)),
    time: Date.now(),
    containersById,
    windows,
  }

  let { snapshots } = await browser.storage.local.get({ snapshots: [] })

  const lastSnapshot = snapshots[snapshots.length - 1]
  if (lastSnapshot && compareSnapshots(lastSnapshot, currentSnapshot)) return

  snapshots.push(currentSnapshot)

  snapshots = await Actions.limitSnapshots(snapshots)

  await browser.storage.local.set({ snapshots, lastSnapTime: currentSnapshot.time })

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
  let interval = Actions.getSnapInterval()
  if (interval < MIN_SNAP_INTERVAL) return

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
    nextTimeout = Actions.getSnapInterval()
    if (nextTimeout < MIN_SNAP_INTERVAL) return
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
  for (let winId of Object.keys(snapshot.windowsById)) {
    await Actions.openSnapshotWindow(snapshot, winId)
  }
}

/**
 * Open window
 */
async function openSnapshotWindow(snapshot, winId) {
  let winInfo = snapshot.windowsById[winId]
  if (!winInfo) return

  let containers = {}
  let tabs = []
  for (let tab of winInfo.tabs) {
    containers[tab.ctr] = tab.ctr
    tabs.push(tab)
  }

  let newWindow = await browser.windows.create()
  let firstTab = newWindow.tabs[0]
  let tabIndex = newWindow.tabs.length

  await this.actions.waitForSidebarConnect(newWindow.id, 5000)

  for (let ctrId of Object.keys(containers)) {
    if (ctrId === 'firefox-default') continue

    let snapCtr = snapshot.containersById[ctrId]
    if (!snapCtr) {
      containers[ctrId] = false
      continue
    }

    let localCtrs = Object.values(this.containers)
    let localCtr = localCtrs.find(c => c.name === snapCtr.name)
    if (!localCtr) {
      let newCtr = await browser.contextualIdentities.create({
        name: snapCtr.name,
        color: snapCtr.color,
        icon: snapCtr.icon,
      })
      containers[ctrId] = newCtr.cookieStoreId
    } else {
      containers[ctrId] = localCtr.cookieStoreId
    }
  }

  let parents = [], oldNewMap = []
  for (let i = 0; i < tabs.length; i++) {
    let tab = tabs[i]

    parents[tab.lvl] = tab.id

    let createdTab = await browser.tabs.create({
      windowId: newWindow.id,
      index: tabIndex,
      url: normalizeUrl(tab.url),
      active: false,
      pinned: tab.pinned,
      discarded: !tab.pinned,
      title: !tab.pinned ? tab.title : undefined,
      cookieStoreId: containers[tab.ctr],
      openerTabId: oldNewMap[parents[tab.lvl - 1]],
    })
    oldNewMap[tab.id] = createdTab.id
    tabIndex++
  }

  if (firstTab) browser.tabs.remove(firstTab.id)
}

/**
 * Prepare url to be opened by sidebery
 */
function normalizeUrl(url) {
  if (!url) return url
  if (
    url.startsWith('about:') ||
    url.startsWith('data:') ||
    url.startsWith('file:')
  ) {
    return browser.runtime.getURL('url/url.html') + '#' + url
  } else {
    return url
  }
}

/**
 * Limit snapshots
 */
async function limitSnapshots(snapshots) {
  const resultToStore = !snapshots
  const limit = this.settings.snapLimit
  const unit = this.settings.snapLimitUnit

  if (!limit) return snapshots

  let normLimit = limit
  if (unit === 'day') normLimit = Date.now() - limit * 86400000
  if (unit === 'kb') normLimit = limit * 1024

  if (!snapshots) {
    const ans = await browser.storage.local.get({ snapshots: [] })
    snapshots = ans.snapshots
    if (!snapshots.length) return
  }

  let i, accum = 0
  for (i = snapshots.length; i--;) {
    let snapshot = snapshots[i]

    if (unit === 'snap') {
      accum++
      if (accum > normLimit) break
    }

    if (unit === 'kb') {
      accum += new Blob([JSON.stringify(snapshot)]).size
      if (accum > normLimit) break
    }

    if (unit === 'day') {
      accum = snapshot.time
      if (accum < normLimit) break
    }
  }

  i++

  if (!resultToStore) return snapshots.slice(i)
  else await browser.storage.local.set({ snapshots: snapshots.slice(i) })
}

/**
 * Get normalized snapshot interval in ms
 */
function getSnapInterval() {
  let interval = this.settings.snapInterval
  const unit = this.settings.snapIntervalUnit
  if (!interval || typeof interval !== 'number') return 0
  if (unit === 'min') interval = this.settings.snapInterval * 60000
  if (unit === 'hr') interval = this.settings.snapInterval * 3600000
  if (unit === 'day') interval = this.settings.snapInterval * 86400000
  return interval
}

/**
 * Compare two snapshots
 */
function compareSnapshots(s1, s2) {
  const s1WinJSON = JSON.stringify(s1.windows)
  const s2WinJSON = JSON.stringify(s2.windows)
  if (s1WinJSON === s2WinJSON) {
    const s1CtrJSON = JSON.stringify(s1.containersById)
    const s2CtrJSON = JSON.stringify(s2.containersById)
    if (s1CtrJSON === s2CtrJSON) return true
  }
}

export default {
  createSnapshot,
  createSnapshotDebounced,
  scheduleSnapshots,
  scheduleNextSnapshot,
  getLastSnapTime,
  applySnapshot,
  openSnapshotWindow,
  limitSnapshots,
  getSnapInterval,
}