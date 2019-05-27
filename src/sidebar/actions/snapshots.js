import { DEFAULT_CTX } from '../store/state'
import Actions from '.'

/**
 * Make snapshot
 */
async function makeSnapshot(state, panels, pinnedTabs) {
  const time = ~~(Date.now() / 1000)

  // Gather tabs and containers
  const tabs = []
  const ctxs = []
  // Pinned tabs
  if (state.snapshotsTargets.pinned) {
    for (let tab of pinnedTabs) {
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
  for (let panel of panels) {
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
async function applySnapshot(state, panels, defaultPanel, snapshot) {
  if (!snapshot) return

  // Restore tabs
  const tabsMap = {}
  for (let tab of snapshot.tabs) {
    let panelIndex = panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
    let panel = panels[panelIndex]
    if (!panel) {
      panel = defaultPanel
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
      windowId: state.windowId,
      url: tab.url,
      pinned: tab.pinned,
      cookieStoreId: panel.cookieStoreId,
      openerTabId: tabsMap[tab.parentId],
      active: false,
    })
    if (tab.id !== undefined) tabsMap[tab.id] = createdTab.id

    // Switch to panel
    if (!tab.pinned && panelIndex !== state.panelIndex) {
      Actions.setPanel(state, panelIndex)
    }
  }
}

/**
 * Load snapshots.
 */
async function loadSnapshots(state) {
  const ans = await browser.storage.local.get('snapshots')
  if (ans && ans.snapshots) state.snapshots = ans.snapshots
  state.snapshots.reverse()
}

export default {
  makeSnapshot,
  applySnapshot,
  loadSnapshots,
}