import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as Tabs from 'src/services/tabs.fg'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import { addMTab, resetMTabs, setDefaultMTabPanel } from 'src/defaults/mocks.tabs.fg'
import { PanelType } from 'src/enums'
import { addMPanel, resetMSidebar } from 'src/defaults/mocks.sidebar.fg'
import { TabsPanel } from 'src/types'

describe('Tabs.getIndexForNewTab(): active tab is pinned', () => {
  beforeEach(() => {
    Sidebar.setReadyState(true)
    addMPanel({ type: PanelType.tabs, id: 'a' })
    setDefaultMTabPanel('a')
    Sidebar.setActivePanelId('a')
  })

  afterEach(() => {
    Settings.resetSettings()
    resetMTabs()
    resetMSidebar()
  })

  // Tabs: [0]: pinned+active, [1]: normal, [2]: normal
  // Panel 'a': startTabIndex: 1, nextTabIndex: 3
  function setupSinglePanel() {
    addMTab({ id: 1, pinned: true, active: true })
    addMTab({ id: 2 })
    addMTab({ id: 3 })
    Sidebar.recalcTabsPanels()
    return Sidebar.panelsById['a'] as TabsPanel
  }

  test('general rule: end: override to the panel start', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTab = 'end'
    Settings.state.moveNewTabActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panel, { index: 3 })).toBe(1)
  })

  test('general rule: end: override to the panel end', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTab = 'end'
    Settings.state.moveNewTabActivePin = 'end'

    expect(Tabs.getIndexForNewTab(panel, { index: 3 })).toBe(3)
  })

  test('general rule: start: override to the panel end', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTab = 'start'
    Settings.state.moveNewTabActivePin = 'end'

    expect(Tabs.getIndexForNewTab(panel, { index: 3 })).toBe(3)
  })

  test('general rule: after: override to the panel start', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTab = 'after'
    Settings.state.moveNewTabActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panel, { index: 3 })).toBe(1)
  })

  test('general rule: none: keep the original position', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTab = 'none'
    Settings.state.moveNewTabActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panel, { index: 3 })).toBe(3)
  })

  test('new tab button: override to the panel start', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTabButton = 'end'
    Settings.state.moveNewTabButtonActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panel, { index: 3, fromNewTabButton: true })).toBe(1)
  })

  test('opened from the pinned tab: use its own rule', () => {
    const panel = setupSinglePanel()
    Settings.state.moveNewTab = 'end'
    Settings.state.moveNewTabActivePin = 'end'
    Settings.state.moveNewTabPin = 'start'

    expect(Tabs.getIndexForNewTab(panel, { index: 3, openerTabId: 1 })).toBe(1)
  })

  test('active tab is not pinned: use the general rule', () => {
    addMTab({ id: 1, pinned: true })
    addMTab({ id: 2, active: true })
    addMTab({ id: 3 })
    Sidebar.recalcTabsPanels()
    const panel = Sidebar.panelsById['a'] as TabsPanel

    Settings.state.moveNewTab = 'after'
    Settings.state.moveNewTabActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panel, { index: 3 })).toBe(2)
  })

  test('globally pinned tab of another panel: override is used', () => {
    addMPanel({ type: PanelType.tabs, id: 'b' })
    addMTab({ id: 1, pinned: true, active: true, panelId: 'a' })
    addMTab({ id: 2, panelId: 'a' })
    addMTab({ id: 3, panelId: 'b' })
    Sidebar.setActivePanelId('b')
    Sidebar.recalcTabsPanels()
    const panelB = Sidebar.panelsById['b'] as TabsPanel

    Settings.state.moveNewTab = 'after'
    Settings.state.moveNewTabActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panelB, { index: 3 })).toBe(2)
  })

  test('pinned tab of another panel (pinned tabs in panels): general rule', () => {
    addMPanel({ type: PanelType.tabs, id: 'b' })
    Settings.state.pinnedTabsPosition = 'panel'
    addMTab({ id: 1, pinned: true, active: true, panelId: 'a' })
    addMTab({ id: 2, panelId: 'a' })
    addMTab({ id: 3, panelId: 'b' })
    Sidebar.setActivePanelId('b')
    Sidebar.recalcTabsPanels()
    const panelB = Sidebar.panelsById['b'] as TabsPanel

    Settings.state.moveNewTab = 'after'
    Settings.state.moveNewTabActivePin = 'start'

    expect(Tabs.getIndexForNewTab(panelB, { index: 3 })).toBe(3)
  })
})
