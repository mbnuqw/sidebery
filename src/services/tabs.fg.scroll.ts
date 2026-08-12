import { Tab, TabsPanel } from 'src/types'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import { NOID, PRE_SCROLL } from 'src/defaults'

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

const stickyBranch: Tab[] = []
const stickyTopOffsets: (number | undefined)[] = []
let prevStickyTabsTopLen = 0
let prevStickyTabsTopLimit = 0
let prevStickyTabsBottomLen = 0
let prevStickyTabsActId = NOID

export function calcStickyTabs(panel: TabsPanel): void {
  if (!Settings.state.tabsTree || !Settings.stickyTabs || !panel.scrollEl) {
    return resetStickyTabs(panel)
  }

  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab || activeTab.pinned || activeTab.panelId !== panel.id) {
    return resetStickyTabs(panel)
  }

  const reactive = panel.reactive
  const scrollTop = panel.scrollEl.scrollTop
  const scrollBottom = panel.scrollEl.offsetHeight + scrollTop
  const ntbbHeight = Settings.newTabBarPositionAfterTabs ? (panel.ntbbEl?.offsetHeight ?? 0) : 0
  const stack = Settings.stickyAncestorTabsLayoutCol
  const limit = Settings.stickyAncestorTabsLimit + (Settings.state.stickyActiveTab ? 1 : 0)
  let topLimit = limit
  let topLen = 0
  let bottomLen = 0
  let top: ID[] | undefined
  let bottom: ID[] | undefined
  let guard = Settings.state.stickyAncestorTabs ? 16 : 1
  let topOffset = 0
  let bottomOffset = 0
  let tab = Settings.state.stickyActiveTab ? activeTab : Tabs.byId[activeTab.parentId]
  while (tab && guard-- > 0 && bottomLen < limit) {
    if (
      tab.el &&
      scrollBottom <
        tab.el.offsetTop +
          (stack ? (bottomOffset += tab.el.offsetHeight) : tab.el.offsetHeight) +
          ntbbHeight
    ) {
      bottomLen++
      if (!bottom) bottom = [tab.id]
      else bottom.unshift(tab.id)
      tab = Tabs.byId[tab.parentId]
      continue
    }
    stickyBranch.push(tab)
    tab = Tabs.byId[tab.parentId]
  }
  topLimit = limit >= bottomLen ? limit - bottomLen : 0
  for (let i = stickyBranch.length; i-- > 0;) {
    tab = stickyBranch[i]
    if (!tab.el) continue
    if (scrollTop > tab.el.offsetTop - topOffset) {
      topLen++
      if (stack) {
        const h = tab.el.offsetHeight
        topOffset += h
        stickyTopOffsets[i] = h
        if (topLen >= topLimit) topOffset -= stickyTopOffsets.pop() ?? 0
      }
      if (!top) top = [tab.id]
      else top.push(tab.id)
    }
  }
  stickyTopOffsets.length = 0
  stickyBranch.length = 0

  if (prevStickyTabsBottomLen !== bottomLen || prevStickyTabsActId !== Tabs.activeId) {
    prevStickyTabsBottomLen = bottomLen
    if (bottom) reactive.stickyTabIdsBottom = bottom
    else reactive.stickyTabIdsBottom.length = 0
  }

  if (
    prevStickyTabsTopLen !== topLen ||
    prevStickyTabsTopLimit !== topLimit ||
    prevStickyTabsActId !== Tabs.activeId
  ) {
    prevStickyTabsTopLimit = topLimit
    prevStickyTabsTopLen = topLen
    if (top && topLimit) {
      if (topLen > topLimit) reactive.stickyTabIdsTop = top.slice(-topLimit)
      else reactive.stickyTabIdsTop = top
    } else {
      reactive.stickyTabIdsTop.length = 0
    }
  }

  prevStickyTabsActId = Tabs.activeId
}

function resetStickyTabs(panel: TabsPanel) {
  prevStickyTabsTopLen = 0
  if (panel.reactive.stickyTabIdsTop.length) {
    panel.reactive.stickyTabIdsTop.length = 0
  }
  prevStickyTabsBottomLen = 0
  if (panel.reactive.stickyTabIdsBottom.length) {
    panel.reactive.stickyTabIdsBottom.length = 0
  }
}
