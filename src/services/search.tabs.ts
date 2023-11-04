import * as Utils from 'src/utils'
import { Panel, Tab, TabsPanel } from 'src/types'
import { Tabs } from 'src/services/tabs.fg'
import { Selection } from 'src/services/selection'
import { Search } from 'src/services/search'
import { Sidebar } from 'src/services/sidebar'

let prevActivePanelId: ID | undefined
export function onTabsSearch(activePanel: Panel, noSel?: boolean): void {
  if (!Utils.isTabsPanel(activePanel)) return

  const value = Search.reactive.value
  const samePanel = prevActivePanelId === activePanel.id
  prevActivePanelId = activePanel.id

  const combined = activePanel.tabs.concat(activePanel.pinnedTabs)

  if (combined.length) {
    // Filter tabs
    if (value) {
      const prevValue = Search.prevValue
      const moreSpecific = value.length > prevValue.length

      let tabs: Tab[] | undefined
      if (prevValue && moreSpecific && value.startsWith(prevValue) && samePanel) {
        tabs = activePanel.filteredTabs
      }
      if (!tabs) tabs = combined

      const filtered: Tab[] = []
      const filteredIds: ID[] = []
      const filteredInvisible: Tab[] = []
      const filteredInvisibleIds: ID[] = []
      for (const tab of tabs) {
        if (Search.check(tab.title) || Search.check(tab.url)) {
          if (!tab.invisible) {
            filtered.push(tab)
            filteredIds.push(tab.id)
          } else {
            filteredInvisible.push(tab)
            filteredInvisibleIds.push(tab.id)
          }
        }
      }
      activePanel.filteredTabs = filtered.concat(filteredInvisible)
      activePanel.reactive.filteredLen = activePanel.filteredTabs.length
      activePanel.reactive.visibleTabIds = filteredIds.concat(filteredInvisibleIds)
      activePanel.reactive.pinnedTabIds = []
    } else {
      activePanel.filteredTabs = undefined
      activePanel.reactive.filteredLen = undefined
      activePanel.reactive.pinnedTabIds = activePanel.pinnedTabs.map(t => t.id)
      Sidebar.recalcVisibleTabs(activePanel.id)
    }

    // Select and scroll to the first target
    if (value && !noSel) {
      const firstTab = activePanel.filteredTabs?.[0]
      if (firstTab) {
        Selection.resetSelection()
        Selection.selectTab(firstTab.id)
        Tabs.scrollToTab(firstTab.id)
      }
    }

    // Search end
    if (Search.prevValue && !value) {
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
  if (Search.reactive.value && !panel.filteredTabs?.length) return findInAnotherPanel()

  const selId = Selection.getFirst()
  const tab = Tabs.byId[selId]
  if (tab) browser.tabs.update(tab.id, { active: true })

  Search.stop()
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
    return !t.pinned && (Search.check(t.title) || Search.check(t.url))
  })
  if (!firstMatch) return

  const panel = Sidebar.panelsById[firstMatch.panelId]
  if (!Utils.isTabsPanel(panel)) return

  // panel.filteredTabs = panel.tabs.filter(t => Search.check(t.title) || Search.check(t.url))
  // panel.filteredLen = panel.filteredTabs.length

  panel.filteredTabs = undefined
  panel.reactive.filteredLen = undefined

  Sidebar.recalcVisibleTabs(panel.id)
  Sidebar.activatePanel(firstMatch.panelId)
}
