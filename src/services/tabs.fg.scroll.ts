import { TabsPanel } from 'src/types'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import { PRE_SCROLL } from 'src/defaults'

export let blockedScrollPosition = false

const scrollConf: ScrollToOptions = { behavior: 'auto', top: 0 }
export function scrollToTab(id: ID, smooth?: boolean): void {
  const panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.scrollEl) return

  scrollConf.behavior = smooth ? 'smooth' : 'auto'

  const isLastTab = panel.tabs[panel.tabs.length - 1]?.id === id
  if (isLastTab) {
    const scrolableEl = panel.scrollComponent?.getScrollableBox()
    if (!scrolableEl) return
    const pH = panel.scrollEl.offsetHeight
    scrollConf.top = scrolableEl.offsetHeight - pH
    panel.scrollEl.scroll(scrollConf)
    return
  }

  const elId = 'tab' + id.toString()
  const el = document.getElementById(elId)
  if (!el) return Logs.warn('Tabs.scrollToTab: Cannot find tab element')

  const pH = panel.scrollEl.offsetHeight
  const pS = panel.scrollEl.scrollTop
  const tH = el.offsetHeight
  const tY = el.offsetTop

  if (tY < pS + PRE_SCROLL) {
    if (pS > 0) {
      let y = tY - PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      panel.scrollEl.scroll(scrollConf)
    }
  } else if (tY + tH > pS + pH - PRE_SCROLL) {
    scrollConf.top = tY + tH - pH + PRE_SCROLL
    panel.scrollEl.scroll(scrollConf)
  }
}
export const scrollToTabDebounced = Utils.debounce(scrollToTab)

export function incrementScrollRetainer(panel: TabsPanel, count: number): void {
  if (!panel.scrollEl) return

  const scrollTop = panel.scrollEl.scrollTop
  if (scrollTop === 0) return

  const tabFullHeight = Sidebar.tabHeight + Sidebar.tabMargin

  if (panel.scrollRetainer === 0) {
    const scrollHeight = panel.scrollEl.offsetHeight
    const scrollableHeight = panel.scrollEl.scrollHeight
    const changedHeight = count * tabFullHeight

    const dy = scrollableHeight - scrollHeight - scrollTop - changedHeight
    if (dy >= 0) return

    panel.scrollRetainer = count
    panel.reactive.scrollRetainerHeight = Math.abs(dy)
    blockedScrollPosition = true
  } else {
    panel.scrollRetainer += count
    panel.reactive.scrollRetainerHeight += count * tabFullHeight
    blockedScrollPosition = true
  }
}

export function decrementScrollRetainer(panel: TabsPanel, count = 1): void {
  if (panel.scrollRetainer <= 0) {
    blockedScrollPosition = false
    return
  }

  const scrollRetainerHeight = panel.reactive.scrollRetainerHeight
  const tabFullHeight = Sidebar.tabHeight + Sidebar.tabMargin
  let decrHeight = count * tabFullHeight
  if (decrHeight > scrollRetainerHeight) decrHeight = scrollRetainerHeight

  panel.scrollRetainer -= count
  if (panel.scrollRetainer < 0) panel.scrollRetainer = 0
  panel.reactive.scrollRetainerHeight -= decrHeight
  blockedScrollPosition = true
}

export function resetScrollRetainer(panel: TabsPanel) {
  panel.scrollRetainer = 0
  panel.reactive.scrollRetainerHeight = 0
  blockedScrollPosition = false
}

/**
 * Recalculate the sticky tab hierarchy: the ancestor chain of the active tab, but only
 * the ancestors whose row has scrolled above the top of the viewport (so an ancestor
 * stops being sticky once it's visible in the list again), capped by the configured
 * depth limit. Pinned only on the panel that contains the active tab. Writes the result
 * to `panel.reactive.stickyTabIds` (only when it actually changes).
 */
export function calcStickyTabs(panel: TabsPanel): void {
  const reactive = panel.reactive

  const reset = () => {
    if (reactive.stickyTabIds.length) reactive.stickyTabIds = []
  }

  if (!Settings.state.tabsTree || !Settings.state.tabsStickyHierarchy || !panel.scrollEl) {
    return reset()
  }

  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab || activeTab.pinned || activeTab.panelId !== panel.id) return reset()

  const tabFullHeight = Sidebar.tabHeight + Sidebar.tabMargin
  if (tabFullHeight <= 0) return reset()

  // Build the ancestor chain (root-most first) of the active tab via parentId.
  const ancestors: ID[] = []
  let parent = Tabs.byId[activeTab.parentId]
  let guard = 0
  while (parent && guard++ < 256) {
    ancestors.unshift(parent.id)
    parent = Tabs.byId[parent.parentId]
  }

  // Keep only ancestors that are hidden: either scrolled above the viewport top, or
  // covered by the sticky rows already pinned above them. Each sticky row we add pushes
  // the cutoff down by one row height (it hides the tab beneath it), so the bottom of
  // the accumulated sticky stack is the real cutoff. Ancestors are ordered root -> active
  // with increasing row position, so stop at the first one still fully visible below the
  // stack.
  const visibleIds = reactive.visibleTabIds
  const scrollTop = panel.scrollEl.scrollTop
  const sticky: ID[] = []
  let stackBottom = 0 // viewport-Y of the bottom of the accumulated sticky stack
  for (const id of ancestors) {
    const idx = visibleIds.indexOf(id)
    if (idx === -1) continue
    const rowViewportTop = idx * tabFullHeight - scrollTop
    if (rowViewportTop < stackBottom) {
      sticky.push(id)
      stackBottom += tabFullHeight
    } else break
  }

  // Apply the depth cap (keep the deepest N ancestors, closest to the active tab).
  const limit = Settings.state.tabsStickyHierarchyLimit
  let result = sticky
  if (typeof limit === 'number' && sticky.length > limit) {
    result = sticky.slice(sticky.length - limit)
  }

  // Skip the reactive write when nothing changed.
  const cur = reactive.stickyTabIds
  if (cur.length === result.length && cur.every((id, i) => id === result[i])) return
  reactive.stickyTabIds = result
}
