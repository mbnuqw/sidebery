import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as Utils from 'src/utils'
import * as Tabs from 'src/services/tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import * as Windows from 'src/services/windows.fg'
import { addMPanel, resetMSidebar } from 'src/defaults/mocks.sidebar.fg'
import { addMTab, resetMTabs, setDefaultMTabPanel } from 'src/defaults/mocks.tabs.fg'
import { PanelType } from 'src/enums'

describe('moveByRule(): position in target panel', () => {
  let srcPanelId: ID
  let dstPanelId: ID

  beforeEach(() => {
    Windows.setCurrentId(1)

    // Source panel
    const srcPanel = addMPanel({ type: PanelType.tabs, id: 'src-panel' })!
    srcPanelId = srcPanel.id

    // Destination panel
    const dstPanel = addMPanel({ type: PanelType.tabs, id: 'dst-panel' })!
    dstPanelId = dstPanel.id

    // Three existing tabs in the destination panel (indices 0, 1, 2)
    setDefaultMTabPanel(dstPanelId)
    addMTab({ id: 100, url: 'https://example.com/1' })
    addMTab({ id: 101, url: 'https://example.com/2' })
    addMTab({ id: 102, url: 'https://example.com/3' })

    // One tab in the source panel that will be moved by rule (index 3)
    setDefaultMTabPanel(srcPanelId)
    addMTab({ id: 200, url: 'https://work.com/task' })

    // Manually reflect tab layout in panel index ranges:
    // dst: tabs at indices 0..2 → start=0, next=3
    // src: tab at index 3       → start=3, next=4
    const dstPanel_ = Sidebar.panelsById[dstPanelId]
    const srcPanel_ = Sidebar.panelsById[srcPanelId]
    if (Utils.isTabsPanel(dstPanel_)) {
      dstPanel_.startTabIndex = 0
      dstPanel_.nextTabIndex = 3
      dstPanel_.endTabIndex = 2
    }
    if (Utils.isTabsPanel(srcPanel_)) {
      srcPanel_.startTabIndex = 3
      srcPanel_.nextTabIndex = 4
      srcPanel_.endTabIndex = 3
    }

    // Register a URL-based move rule targeting dstPanel
    Tabs.moveRules.splice(0)
    Tabs.moveRules.push({ panelId: dstPanelId, urlStr: 'work.com' })
  })

  afterEach(() => {
    Settings.resetSettings()
    resetMTabs()
    resetMSidebar()
    Tabs.moveRules.splice(0)
    vi.restoreAllMocks()
  })

  test('moveNewTab="start" → tab is placed at startTabIndex of target panel', async () => {
    Settings.state.moveNewTab = 'start'
    // moveNewTabParent='last_child' would result in nextTabIndex without the fix
    Settings.state.moveNewTabParent = 'last_child'

    const queueSpy = vi.spyOn(Utils.GLOBAL_QUEUE, 'add').mockImplementation(() => Promise.resolve())

    Tabs.moveByRule(200, 0)
    await new Promise(r => setTimeout(r, 20))

    expect(queueSpy).toHaveBeenCalledOnce()
    const dst = queueSpy.mock.calls[0][3] as { panelId: ID; index: number }
    expect(dst.panelId).toBe(dstPanelId)
    // moveNewTab='start' → startTabIndex=0
    expect(dst.index).toBe(0)
  })

  test('moveNewTab="end" → tab is placed at nextTabIndex of target panel', async () => {
    Settings.state.moveNewTab = 'end'
    // moveNewTabParent='start' would result in startTabIndex without the fix
    Settings.state.moveNewTabParent = 'start'

    const queueSpy = vi.spyOn(Utils.GLOBAL_QUEUE, 'add').mockImplementation(() => Promise.resolve())

    Tabs.moveByRule(200, 0)
    await new Promise(r => setTimeout(r, 20))

    expect(queueSpy).toHaveBeenCalledOnce()
    const dst = queueSpy.mock.calls[0][3] as { panelId: ID; index: number }
    expect(dst.panelId).toBe(dstPanelId)
    // moveNewTab='end' → nextTabIndex=3
    expect(dst.index).toBe(3)
  })

  test('moveNewTabParent is ignored: moveNewTab wins when moving by rule', async () => {
    // Before the fix: moveNewTabParent='start' → startTabIndex=0
    // After the fix:  moveNewTab='end' → nextTabIndex=3
    Settings.state.moveNewTab = 'end'
    Settings.state.moveNewTabParent = 'start'

    const queueSpy = vi.spyOn(Utils.GLOBAL_QUEUE, 'add').mockImplementation(() => Promise.resolve())

    Tabs.moveByRule(200, 0)
    await new Promise(r => setTimeout(r, 20))

    expect(queueSpy).toHaveBeenCalledOnce()
    const dst = queueSpy.mock.calls[0][3] as { panelId: ID; index: number }
    // Must be nextTabIndex=3 (moveNewTab), NOT startTabIndex=0 (moveNewTabParent)
    expect(dst.index).toBe(3)
  })
})
