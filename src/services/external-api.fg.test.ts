import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { PanelType } from 'src/enums'
import { EXTERNAL_API_MESSAGE_TYPE, EXTERNAL_API_VERSION } from 'src/types'
import { addMPanel, resetMSidebar } from 'src/defaults/mocks.sidebar.fg'
import { addMTTab, resetMTabs } from 'src/defaults/mocks.tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Windows from 'src/services/windows.fg'
import { handleRequest } from 'src/services/external-api.fg'

describe('ExternalApi.handleRequest()', () => {
  beforeEach(() => {
    vi.spyOn(Tabs, 'waitForTabsReady').mockResolvedValue()
    Windows.setCurrentId(12)
    addMPanel({ id: 'work', type: PanelType.tabs, name: 'Work', nextTabIndex: 2 })
    addMPanel({ id: 'research', type: PanelType.tabs, name: 'Research', nextTabIndex: 10 })
    Sidebar.setActivePanelId('work')
    addMTTab({ id: 1, panelId: 'work' })
    addMTTab(1, { id: 2, panelId: 'work' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetMTabs()
    resetMSidebar()
  })

  test('returns panel and hierarchy state without native tab metadata', async () => {
    const state = await handleRequest({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      method: 'get-state',
      windowId: 12,
    })

    expect(state).toMatchObject({
      windowId: 12,
      activePanelId: 'work',
      panels: [
        { id: 'work', type: 'tabs', name: 'Work' },
        { id: 'research', type: 'tabs', name: 'Research' },
      ],
      tabs: [
        { id: 1, panelId: 'work', parentId: null, childIds: [2], ancestorIds: [] },
        { id: 2, panelId: 'work', parentId: 1, childIds: [], ancestorIds: [1] },
      ],
    })
  })

  test('moves complete branches between panels through Sidebery', async () => {
    const move = vi.spyOn(Tabs, 'move').mockResolvedValue()
    await handleRequest({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      method: 'move-tabs',
      windowId: 12,
      params: { tabIds: [1], panelId: 'research', parentId: null },
    })

    expect(move).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })],
      { windowId: 12, panelId: 'work', pinned: false },
      { windowId: 12, panelId: 'research', parentId: -1, index: 10 }
    )
  })

  test('rejects an anchor outside the requested parent', async () => {
    addMTTab(1, { id: 3, panelId: 'work' })
    await expect(
      handleRequest({
        type: EXTERNAL_API_MESSAGE_TYPE,
        version: EXTERNAL_API_VERSION,
        method: 'move-tabs',
        windowId: 12,
        params: { tabIds: [2], parentId: null, beforeTabId: 3 },
      })
    ).rejects.toMatchObject({ code: 'INVALID_DESTINATION' })
  })

  test('renames groups through the existing group service', async () => {
    const groupTab = Tabs.byId[1]
    if (!groupTab) throw new Error('Missing test group')
    groupTab.isGroup = true
    const setGroupName = vi.spyOn(Tabs, 'setGroupName').mockResolvedValue()

    await handleRequest({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      method: 'rename-group',
      windowId: 12,
      params: { groupTabId: 1, title: 'References' },
    })

    expect(setGroupName).toHaveBeenCalledWith(1, 'References')
  })

  test('flattens hierarchy through the existing tree service', async () => {
    const flattenTabs = vi.spyOn(Tabs, 'flattenTabs').mockReturnValue()

    await handleRequest({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      method: 'flatten-tabs',
      windowId: 12,
      params: { tabIds: [2] },
    })

    expect(flattenTabs).toHaveBeenCalledWith([2])
  })

  test('removes a group while promoting its descendants', async () => {
    const groupTab = Tabs.byId[1]
    if (!groupTab) throw new Error('Missing test group')
    groupTab.isGroup = true
    const move = vi.spyOn(Tabs, 'move').mockResolvedValue()
    const removeTabs = vi.spyOn(Tabs, 'removeTabs').mockResolvedValue()

    await handleRequest({
      type: EXTERNAL_API_MESSAGE_TYPE,
      version: EXTERNAL_API_VERSION,
      method: 'remove-group',
      windowId: 12,
      params: { groupTabId: 1 },
    })

    expect(move).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 2 })],
      { windowId: 12, panelId: 'work' },
      { windowId: 12, panelId: 'work', parentId: -1, index: 1 }
    )
    expect(removeTabs).toHaveBeenCalledWith([1], true)
  })
})
