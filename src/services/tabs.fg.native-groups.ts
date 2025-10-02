import { NOID } from 'src/defaults'
import { Tabs } from './tabs.fg'
import * as Logs from './logs'

/**
 * Firefox Native Tab Groups Support
 *
 * Handles events and operations for Firefox's native tab groups.
 * Hidden tabs are created to represent native groups in Sidebery's tree.
 */
export function getHiddenGroupTabId(groupId: ID): ID {
  const hiddenTab = Tabs.list.find(t => t.nativeGroupId === groupId)
  return hiddenTab ? hiddenTab.id : NOID
}

/**
 * Handle native group change events from Firefox
 * Called when a tab joins or leaves a native group
 */
export async function handleTabGroupChanged(tabId: ID, newGroupId?: ID | null): Promise<void> {
  const tab = Tabs.byId[tabId]
  if (!tab) {
    Logs.warn('Tabs.handleTabGroupChanged: Tab not found:', tabId)
    return
  }

  const oldGroupId = tab.nativeGroupId ?? NOID
  newGroupId ??= NOID

  // No change
  if (oldGroupId === newGroupId) return

  Logs.info('Tabs.handleTabGroupChanged:', tabId, 'from', oldGroupId, 'to', newGroupId)

  if (newGroupId !== NOID) {
    // Tab joined a group - set parent to hidden group tab
    const group = await browser.tabGroups.get(newGroupId)
    await Tabs.parentToNativeGroupTab(group, tab)
  } else if (oldGroupId !== NOID) {
    // Tab left a group - remove parent
    tab.parentId = NOID
  }

  Tabs.updateTabsTree()
}

/**
 * Setup event listeners for native group changes
 */
export function setupNativeGroupListeners(): void {
  if (!browser.tabGroups) {
    Logs.info('Tabs.setupNativeGroupListeners: tabGroups API not available')
    return
  }

  Logs.info('Tabs.setupNativeGroupListeners: Setting up listeners')

  browser.tabGroups.onUpdated.addListener(onGroupUpdated)
  browser.tabGroups.onRemoved.addListener(onGroupRemoved)
  browser.tabGroups.onMoved.addListener(onGroupMoved)
}

/**
 * Reset/remove event listeners for native group changes
 */
export function resetNativeGroupListeners(): void {
  if (!browser.tabGroups) return

  Logs.info('Tabs.resetNativeGroupListeners: Removing listeners')

  browser.tabGroups.onUpdated.removeListener(onGroupUpdated)
  browser.tabGroups.onRemoved.removeListener(onGroupRemoved)
  browser.tabGroups.onMoved.removeListener(onGroupMoved)
}

/**
 * Handle native group update
 * Updates the hidden tab properties
 */
export function onGroupUpdated(group: browser.tabGroups.TabGroup): void {
  const { id: groupId, title, color, collapsed } = group
  Logs.info('Tabs.onGroupUpdated:', groupId, title, color, collapsed)

  const hiddenTabId = Tabs.getHiddenGroupTabId(groupId)
  const hiddenTab = Tabs.byId[hiddenTabId]

  if (!hiddenTab) {
    Logs.warn('Tabs.onGroupUpdated: Hidden group tab not found for:', groupId)
    return
  }

  let changed = false

  // Update title
  if (title !== undefined) {
    hiddenTab.title = title
    hiddenTab.customTitle = title
    changed = true
  }

  // Update color
  if (color !== undefined) {
    hiddenTab.customColor = color
    hiddenTab.reactive.customColor = color
    changed = true
  }

  // Update collapsed state
  if (collapsed !== undefined) {
    hiddenTab.folded = collapsed
    hiddenTab.reactive.folded = collapsed
    changed = true
  }

  if (changed) {
    Tabs.cacheTabsData()
  }
}

/**
 * Handle native group removal
 * Removes the hidden tab and updates children
 */
export async function onGroupRemoved(group: browser.tabGroups.TabGroup): Promise<void> {
  Logs.info('Tabs.onGroupRemoved:', group)

  const hiddenTabId = Tabs.getHiddenGroupTabId(group.id)
  const hiddenTab = Tabs.byId[hiddenTabId]

  if (!hiddenTab) {
    Logs.warn('Tabs.onGroupRemoved: Hidden group tab not found for:', group)
    return
  }

  // Remove the hidden tab
  try {
    await browser.tabs.remove(hiddenTabId)
  } catch (err) {
    Logs.err('Tabs.onGroupRemoved: Failed to remove hidden tab:', err)
  }

  // Update tree and cache
  Tabs.updateTabsTree()
  Tabs.cacheTabsData()
}

/**
 * Event handler for group moves
 */
function onGroupMoved(group: browser.tabGroups.TabGroup): void {
  Logs.info('Tabs.onGroupMoved:', group)
  // Group position in tab list should be handled by tab move events
  // This event is primarily for metadata tracking
  // We may need to reorder the hidden tab if needed
  const hiddenTabId = Tabs.getHiddenGroupTabId(group.id)
  const hiddenTab = Tabs.byId[hiddenTabId]

  if (hiddenTab) {
    // The hidden tab position should match the first tab in the group
    // This will be handled naturally by the tab tree update
    Tabs.updateTabsTree()
  }
}
