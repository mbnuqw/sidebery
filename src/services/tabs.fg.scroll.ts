import { Tab, TabsPanel } from 'src/types'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import { NOID, PRE_SCROLL } from 'src/defaults'

const scrollConf: ScrollToOptions = { behavior: 'auto', top: 0 }
export function scrollToTab(id: ID, smooth?: boolean): void {
  if (Tabs.byId[id]?.pinned) return scrollToPinnedTab(id, smooth)

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

// Pinned tabs live in .PinnedTabsBar, outside the panel's ScrollBox, in up to
// four different places (per-panel, top, left, right) - so resolve the bar
// from the DOM rather than from any registered panel/scroll state.
const pinnedScrollConf: ScrollToOptions = { behavior: 'auto' }
export function scrollToPinnedTab(id: ID, smooth?: boolean): void {
  const el = document.getElementById('tab' + id.toString())
  // .Tab's offsetParent is .tab-wrapper (position: relative), so offsets must
  // be read off the wrapper - the wrapper's offsetParent is .PinnedTabsBar.
  const wrapperEl = el?.parentElement
  const barEl = wrapperEl?.parentElement
  if (!el || !wrapperEl || !barEl || !barEl.classList.contains('PinnedTabsBar')) return

  const vertical = Settings.pinnedTabsBarVertical
  const scrollSize = vertical ? barEl.scrollHeight : barEl.scrollWidth
  const clientSize = vertical ? barEl.clientHeight : barEl.clientWidth
  if (!clientSize || scrollSize - clientSize <= 1) return

  const offset = vertical ? barEl.scrollTop : barEl.scrollLeft
  const tPos = vertical ? wrapperEl.offsetTop : wrapperEl.offsetLeft
  const tSize = vertical ? wrapperEl.offsetHeight : wrapperEl.offsetWidth

  // PRE_SCROLL (64) is tuned for a tall scrollable tab list; a pinned bar is a
  // much narrower strip, so scale the margin to the pin's own size instead.
  const pre = Math.min(tSize, Math.floor(clientSize / 4))

  let target: number | undefined
  if (tPos < offset + pre) {
    target = Math.max(0, tPos - pre)
  } else if (tPos + tSize > offset + clientSize - pre) {
    target = tPos + tSize - clientSize + pre
  }
  if (target === undefined) return

  pinnedScrollConf.behavior = smooth ? 'smooth' : 'auto'
  delete pinnedScrollConf.top
  delete pinnedScrollConf.left
  if (vertical) pinnedScrollConf.top = target
  else pinnedScrollConf.left = target
  barEl.scroll(pinnedScrollConf)
}

const stickyBranch: Tab[] = []
const stickyTopOffsets: (number | undefined)[] = []
let prevStickyTabsTopLen = 0
let prevStickyTabsTopLimit = 0
let prevStickyTabsBottomLen = 0
let prevStickyTabsActId = NOID

export function calcStickyTabs(panel: TabsPanel): void {
  if (!panel.scrollEl) {
    return resetStickyTabs(panel)
  }

  const activeTab = Tabs.byId[Tabs.activeId]
  if (!activeTab || activeTab.pinned || activeTab.panelId !== panel.id) {
    return resetStickyTabs(panel)
  }

  const reactive = panel.reactive
  const scrollTop = panel.scrollEl.scrollTop
  const scrollBottom = panel.scrollEl.offsetHeight + scrollTop
  if (scrollBottom === scrollTop) return
  const ntbbHeight = Settings.newTabBarPositionAfterTabs ? (panel.ntbbEl?.offsetHeight ?? 0) : 0
  const stack = Settings.stickyAncestorTabsLayoutCol
  const limit = Settings.stickyAncestorTabsLimit + (Settings.state.stickyActiveTab ? 1 : 0)
  let topLen = 0
  let bottomLen = 0
  let top: ID[] | undefined
  let bottom: ID[] | undefined
  let guard = limit
  let topOffset = 0
  let bottomOffset = 0
  let tab = Settings.state.stickyActiveTab ? activeTab : Tabs.byId[activeTab.parentId]
  while (tab && guard-- > 0 && bottomLen < limit) {
    if (
      tab.el &&
      !tab.removing &&
      !tab.invisible &&
      scrollBottom <
        tab.el.offsetTop +
          (stack
            ? (bottomOffset += Sidebar.tabMinHeight + Sidebar.tabMargin)
            : Sidebar.tabMinHeight + Sidebar.tabMargin) +
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
  const topLimit = limit >= bottomLen ? limit - bottomLen : 0
  for (let i = stickyBranch.length; i-- > 0;) {
    tab = stickyBranch[i]
    if (!tab.el || tab.removing || tab.invisible) continue
    if (scrollTop > tab.el.offsetTop - topOffset) {
      topLen++
      if (stack) {
        const h = Sidebar.tabMinHeight + Sidebar.tabMargin
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

export function resetStickyTabs(panel: TabsPanel) {
  prevStickyTabsTopLen = 0
  if (panel.reactive.stickyTabIdsTop.length) {
    panel.reactive.stickyTabIdsTop.length = 0
  }
  prevStickyTabsBottomLen = 0
  if (panel.reactive.stickyTabIdsBottom.length) {
    panel.reactive.stickyTabIdsBottom.length = 0
  }
}
