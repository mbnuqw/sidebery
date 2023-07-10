import { TabsPanel } from 'src/types'
import { Tabs } from './tabs.fg'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { Sidebar } from './sidebar'
import { PRE_SCROLL } from 'src/defaults'

const scrollConf: ScrollToOptions = { behavior: 'auto', top: 0 }
export function scrollToTab(id: ID): void {
  const panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.scrollEl) return

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
    Tabs.blockedScrollPosition = true
  } else {
    panel.scrollRetainer += count
    panel.reactive.scrollRetainerHeight += count * tabFullHeight
    Tabs.blockedScrollPosition = true
  }
}

export function decrementScrollRetainer(panel: TabsPanel, count = 1): void {
  if (panel.scrollRetainer <= 0) {
    Tabs.blockedScrollPosition = false
    return
  }

  const scrollRetainerHeight = panel.reactive.scrollRetainerHeight
  const tabFullHeight = Sidebar.tabHeight + Sidebar.tabMargin
  let decrHeight = count * tabFullHeight
  if (decrHeight > scrollRetainerHeight) decrHeight = scrollRetainerHeight

  panel.scrollRetainer -= count
  if (panel.scrollRetainer < 0) panel.scrollRetainer = 0
  panel.reactive.scrollRetainerHeight -= decrHeight
  Tabs.blockedScrollPosition = true
}

export function resetScrollRetainer(panel: TabsPanel) {
  panel.scrollRetainer = 0
  panel.reactive.scrollRetainerHeight = 0
  Tabs.blockedScrollPosition = false
}
