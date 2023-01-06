import { TabsPanel } from 'src/types'
import { Tabs } from './tabs.fg'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { Sidebar } from './sidebar'
import { PRE_SCROLL } from 'src/defaults'

const scrollConf: ScrollToOptions = { behavior: 'auto', top: 0 }
export function scrollToTab(id: ID): void {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.activePanelId]
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
  panel.scrollRetainer += count
  Tabs.blockedScrollPosition = true
}

export function decrementScrollRetainer(panel: TabsPanel): void {
  if (panel.scrollRetainer <= 0) {
    Tabs.blockedScrollPosition = false
    return
  }
  panel.scrollRetainer--
  Tabs.blockedScrollPosition = true
}

export function resetScrollRetainer(panel: TabsPanel): void {
  panel.scrollRetainer = 0
  Tabs.blockedScrollPosition = false
}
