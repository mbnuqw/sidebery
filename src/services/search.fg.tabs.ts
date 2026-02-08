import * as Utils from 'src/utils'
import { Panel, Tab, TabsPanel } from 'src/types'
import * as Tabs from 'src/services/tabs.fg'
import * as Selection from 'src/services/selection.fg'
import * as Search from 'src/services/search.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'

let prevActivePanelId: ID | undefined
export function onTabsSearch(activePanel: Panel): void {
  if (!Utils.isTabsPanel(activePanel)) return

  const query = Search.query
  const samePanel = prevActivePanelId === activePanel.id
  prevActivePanelId = activePanel.id

  if (activePanel.tabs.length) {
    // Filter tabs
    if (query) {
      const prevQuery = Search.prevQuery
      const moreSpecific = query.length > prevQuery.length

      let tabs: Tab[] | undefined
      if (prevQuery && moreSpecific && query.startsWith(prevQuery) && samePanel) {
        tabs = activePanel.filteredTabs
      }
      if (!tabs) tabs = activePanel.tabs

      const filtered: Tab[] = []
      const filteredIds: ID[] = []
      for (const tab of tabs) {
        if (Search.check(tab.title) || Search.check(tab.customTitle) || Search.check(tab.url)) {
          filtered.push(tab)
          filteredIds.push(tab.id)
        }
      }
      activePanel.filteredTabs = filtered
      activePanel.reactive.filteredLen = activePanel.filteredTabs.length
      activePanel.reactive.visibleTabIds = filteredIds
    } else {
      activePanel.filteredTabs = undefined
      activePanel.reactive.filteredLen = undefined
      Sidebar.recalcVisibleTabs(activePanel.id)
    }

    // Scroll to the first target
    if (query) {
      Selection.resetSelection()
      const firstTab = activePanel.filteredTabs?.[0]
      if (firstTab) Tabs.scrollToTab(firstTab.id)
    }

    // Search end
    if (Search.prevQuery && !query) {
      Selection.resetSelection()
    }
  } else {
    Search.reset(activePanel)
  }
}

export function onTabsSearchNext(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.filteredTabs) return

  const selId = Selection.getFirst()
  let index = panel.filteredTabs.findIndex(t => t.id === selId)

  index += 1
  if (index < 0 || index >= panel.filteredTabs.length) return

  Selection.resetSelection()
  const tab = panel.filteredTabs[index]
  if (tab) {
    Selection.selectTab(tab.id)
    Tabs.scrollToTab(tab.id, true)
  }
}

export function onTabsSearchPrev(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.filteredTabs) return

  const selId = Selection.getFirst()
  let index = panel.filteredTabs.findIndex(t => t.id === selId)

  if (index === -1 && panel.filteredTabs.length) {
    index = panel.filteredTabs.length
  }

  index -= 1
  if (index < 0 || index >= panel.filteredTabs.length) return

  Selection.resetSelection()
  const tab = panel.filteredTabs[index]
  if (tab) {
    Selection.selectTab(tab.id)
    Tabs.scrollToTab(tab.id, true)
  }
}

export function onTabsSearchEnter(panel?: Panel): void {
  if (!Utils.isTabsPanel(panel)) return

  // Try to find in another panel
  if (Search.query && !panel.filteredTabs?.length) return findInAnotherPanel()

  const selId = Selection.getFirst()
  const tab = Tabs.byId[selId]
  if (tab) browser.tabs.update(tab.id, { active: true })

  if (!Settings.state.searchTabSwitch) Search.stop()
}

export function onTabsSearchSelectAll(panel: TabsPanel): void {
  if (!panel.filteredTabs) return

  const ids: ID[] = []
  let allSelected = true
  for (const tab of panel.filteredTabs) {
    if (allSelected && !tab.sel) allSelected = false
    ids.push(tab.id)
  }

  Selection.resetSelection()
  if (!allSelected && ids.length) Selection.selectTabs(ids)
}

function findInAnotherPanel(): void {
  const firstMatch = Tabs.list.find(t => {
    return (
      !t.pinned && (Search.check(t.title) || Search.check(t.customTitle) || Search.check(t.url))
    )
  })
  if (!firstMatch) return

  const panel = Sidebar.panelsById[firstMatch.panelId]
  if (!Utils.isTabsPanel(panel)) return

  // panel.filteredTabs = panel.tabs.filter(t => Search.check(t.title) || Search.check(t.customTitle) || Search.check(t.url))
  // panel.filteredLen = panel.filteredTabs.length

  panel.filteredTabs = undefined
  panel.reactive.filteredLen = undefined

  Sidebar.recalcVisibleTabs(panel.id)
  Sidebar.activatePanel(firstMatch.panelId)
}
