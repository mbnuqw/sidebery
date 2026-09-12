import type * as T from 'src/types'
import { ExternalApiRequestError } from 'src/types'
import { PanelType } from 'src/enums'
import { NOID } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Windows from 'src/services/windows.fg'

function fail(code: string, message: string): never {
  throw new ExternalApiRequestError(code, message)
}

function isId(value: unknown): value is ID {
  return typeof value === 'number' || typeof value === 'string'
}

function getObjectParams(request: T.ExternalApiRequest): Record<string, unknown> {
  if (!request.params || typeof request.params !== 'object' || Array.isArray(request.params)) {
    return fail('INVALID_PARAMS', `Method "${request.method}" requires object params`)
  }
  return request.params as Record<string, unknown>
}

function getTabIds(value: unknown): ID[] {
  if (!Array.isArray(value) || !value.length || !value.every(isId)) {
    return fail('INVALID_PARAMS', 'tabIds must be a non-empty array of tab IDs')
  }

  const tabIds = [...new Set(value)]
  for (const tabId of tabIds) {
    if (!Tabs.byId[tabId]) fail('TAB_NOT_FOUND', `Cannot find tab ${String(tabId)}`)
  }
  return tabIds
}

function getTitle(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return fail('INVALID_PARAMS', 'title must be a non-empty string')
  }
  return value.trim().slice(0, 256)
}

function getPanelType(panel: T.Panel): T.ExternalApiPanelType {
  if (panel.type === PanelType.tabs) return 'tabs'
  if (panel.type === PanelType.bookmarks) return 'bookmarks'
  if (panel.type === PanelType.history) return 'history'
  return 'sync'
}

function serializePanels(): T.ExternalApiPanel[] {
  return Sidebar.panels.map(panel => ({
    id: panel.id,
    index: panel.index,
    type: getPanelType(panel),
    name: panel.name,
    color: panel.color,
  }))
}

function serializeTabs(tabIds?: Set<ID>): T.ExternalApiTab[] {
  const childIds = new Map<ID, ID[]>()
  for (const tab of Tabs.list) {
    if (tab.parentId === NOID) continue
    const children = childIds.get(tab.parentId)
    if (children) children.push(tab.id)
    else childIds.set(tab.parentId, [tab.id])
  }

  const result: T.ExternalApiTab[] = []
  for (const tab of Tabs.list) {
    if (tabIds && !tabIds.has(tab.id)) continue

    const ancestorIds: ID[] = []
    const visited = new Set<ID>()
    let parent = Tabs.byId[tab.parentId]
    while (parent && !visited.has(parent.id)) {
      ancestorIds.unshift(parent.id)
      visited.add(parent.id)
      parent = Tabs.byId[parent.parentId]
    }

    result.push({
      id: tab.id,
      index: tab.index,
      panelId: tab.panelId,
      parentId: tab.parentId === NOID ? null : tab.parentId,
      ancestorIds,
      childIds: childIds.get(tab.id) ?? [],
      level: tab.lvl,
      pinned: tab.pinned,
      folded: tab.folded,
      isParent: tab.isParent,
      isGroup: tab.isGroup,
    })
  }
  return result
}

function getState(): T.ExternalApiState {
  return {
    windowId: Windows.id,
    activePanelId: Sidebar.activePanelId,
    panels: serializePanels(),
    tabs: serializeTabs(),
  }
}

function getMovingTabs(tabIds: ID[]): T.Tab[] {
  const selected = new Set(tabIds)
  const roots = tabIds
    .map(id => Tabs.byId[id])
    .filter((tab): tab is T.Tab => {
      if (!tab) return false
      let parent = Tabs.byId[tab.parentId]
      while (parent) {
        if (selected.has(parent.id)) return false
        parent = Tabs.byId[parent.parentId]
      }
      return true
    })
    .sort((a, b) => a.index - b.index)

  const movingTabs: T.Tab[] = []
  const added = new Set<ID>()
  for (const root of roots) {
    for (const tab of Tabs.getBranch(root)) {
      if (added.has(tab.id)) continue
      movingTabs.push(tab)
      added.add(tab.id)
    }
  }
  return movingTabs
}

function getDestination(params: T.ExternalApiMoveTabsParams, movingTabs: T.Tab[]): T.DstPlaceInfo {
  const firstMovingTab = movingTabs[0]
  if (!firstMovingTab) return fail('INVALID_PARAMS', 'No tabs to move')

  if (params.beforeTabId !== undefined && params.afterTabId !== undefined) {
    return fail('INVALID_PARAMS', 'Use either beforeTabId or afterTabId, not both')
  }

  const anchorId = params.beforeTabId ?? params.afterTabId
  const anchor = anchorId === undefined ? undefined : Tabs.byId[anchorId]
  if (anchorId !== undefined && !anchor) {
    return fail('TAB_NOT_FOUND', `Cannot find anchor tab ${String(anchorId)}`)
  }

  const requestedParentId = params.parentId === null ? NOID : params.parentId
  const parent = requestedParentId === undefined ? undefined : Tabs.byId[requestedParentId]
  if (requestedParentId !== undefined && requestedParentId !== NOID && !parent) {
    return fail('TAB_NOT_FOUND', `Cannot find parent tab ${String(requestedParentId)}`)
  }

  const movingIds = new Set(movingTabs.map(tab => tab.id))
  if (parent && movingIds.has(parent.id)) {
    return fail('INVALID_DESTINATION', 'A tab cannot be moved below itself or its descendant')
  }
  if (anchor && movingIds.has(anchor.id)) {
    return fail('INVALID_DESTINATION', 'The destination anchor cannot be one of the moved tabs')
  }

  let panelId = params.panelId
  if (panelId === undefined) panelId = parent?.panelId ?? anchor?.panelId ?? firstMovingTab.panelId

  const panel = Sidebar.panelsById[panelId]
  if (!Utils.isTabsPanel(panel)) {
    return fail('PANEL_NOT_FOUND', `Cannot find tabs panel ${String(panelId)}`)
  }
  if (parent && parent.panelId !== panelId) {
    return fail('INVALID_DESTINATION', 'The destination parent belongs to another panel')
  }
  if (anchor && anchor.panelId !== panelId) {
    return fail('INVALID_DESTINATION', 'The destination anchor belongs to another panel')
  }
  if (anchor && requestedParentId !== undefined && anchor.parentId !== requestedParentId) {
    return fail('INVALID_DESTINATION', 'The destination anchor belongs to another parent')
  }

  let parentId = requestedParentId
  if (parentId === undefined) {
    if (anchor) parentId = anchor.parentId
    else if (panelId === firstMovingTab.panelId) parentId = firstMovingTab.parentId
    else parentId = NOID
  }
  if (parentId !== NOID && movingTabs.some(tab => tab.pinned)) {
    return fail('INVALID_DESTINATION', 'Pinned tabs cannot be placed in a tab tree')
  }

  let index: number
  if (params.beforeTabId !== undefined && anchor) {
    index = anchor.index
  } else if (params.afterTabId !== undefined && anchor) {
    index = anchor.index + (Tabs.getBranchLen(anchor.id) ?? 0) + 1
  } else if (parent) {
    index = parent.index + (Tabs.getBranchLen(parent.id) ?? 0) + 1
  } else {
    index = panel.nextTabIndex
  }

  return { windowId: Windows.id, panelId, parentId, index }
}

async function moveTabs(request: T.ExternalApiRequest): Promise<T.ExternalApiMutationResult> {
  const params = getObjectParams(request) as unknown as T.ExternalApiMoveTabsParams
  const tabIds = getTabIds(params.tabIds)
  const movingTabs = getMovingTabs(tabIds)
  const firstMovingTab = movingTabs[0]
  if (!firstMovingTab) return fail('INVALID_PARAMS', 'No tabs to move')
  const destination = getDestination(params, movingTabs)
  const source: T.SrcPlaceInfo = {
    windowId: Windows.id,
    panelId: firstMovingTab.panelId,
    pinned: firstMovingTab.pinned,
  }

  await Utils.GLOBAL_QUEUE.add(Tabs.move, movingTabs, source, destination)
  return { tabs: serializeTabs(new Set(movingTabs.map(tab => tab.id))) }
}

async function createGroup(request: T.ExternalApiRequest): Promise<T.ExternalApiMutationResult> {
  const params = getObjectParams(request) as unknown as T.ExternalApiCreateGroupParams
  const tabIds = getTabIds(params.tabIds)
  const title = getTitle(params.title)
  const firstTabId = tabIds[0]
  const firstTab = firstTabId === undefined ? undefined : Tabs.byId[firstTabId]
  if (!firstTab) return fail('TAB_NOT_FOUND', 'Cannot find the first grouped tab')
  if (tabIds.some(id => Tabs.byId[id]?.panelId !== firstTab.panelId)) {
    return fail('INVALID_PARAMS', 'All grouped tabs must belong to the same panel')
  }
  if (tabIds.some(id => Tabs.byId[id]?.pinned)) {
    return fail('INVALID_PARAMS', 'Pinned tabs cannot be placed in a group')
  }

  await Utils.GLOBAL_QUEUE.add(Tabs.groupTabs, tabIds, { title, active: false })
  const groupTab = Tabs.byId[firstTab.parentId]
  if (!groupTab?.isGroup) return fail('GROUP_CREATE_FAILED', 'Sidebery did not create a group')

  const branchIds = new Set(Tabs.getBranch(groupTab).map(tab => tab.id))
  return { groupTabId: groupTab.id, tabs: serializeTabs(branchIds) }
}

async function removeGroupAndKeepTabs(groupTabId: ID): Promise<ID[]> {
  const groupTab = Tabs.byId[groupTabId]
  if (!groupTab?.isGroup) return fail('GROUP_NOT_FOUND', `Cannot find group ${String(groupTabId)}`)

  const children = Tabs.getBranch(groupTab, false)
  if (children.length) {
    await Tabs.move(
      children,
      { windowId: Windows.id, panelId: groupTab.panelId },
      {
        windowId: Windows.id,
        panelId: groupTab.panelId,
        parentId: groupTab.parentId,
        index: groupTab.index + 1,
      }
    )
  }
  await Tabs.removeTabs([groupTabId], true)
  return children.map(tab => tab.id)
}

async function removeGroup(request: T.ExternalApiRequest): Promise<T.ExternalApiMutationResult> {
  const params = getObjectParams(request) as unknown as T.ExternalApiRemoveGroupParams
  if (!isId(params.groupTabId)) return fail('INVALID_PARAMS', 'groupTabId must be a tab ID')

  const childIds = await Utils.GLOBAL_QUEUE.add(removeGroupAndKeepTabs, params.groupTabId)
  return {
    removedGroupTabId: params.groupTabId,
    tabs: serializeTabs(new Set(childIds)),
  }
}

async function renameGroup(request: T.ExternalApiRequest): Promise<T.ExternalApiMutationResult> {
  const params = getObjectParams(request) as unknown as T.ExternalApiRenameGroupParams
  if (!isId(params.groupTabId)) return fail('INVALID_PARAMS', 'groupTabId must be a tab ID')
  const groupTab = Tabs.byId[params.groupTabId]
  if (!groupTab?.isGroup) {
    return fail('GROUP_NOT_FOUND', `Cannot find group ${String(params.groupTabId)}`)
  }

  await Utils.GLOBAL_QUEUE.add(Tabs.setGroupName, groupTab.id, getTitle(params.title))
  return { groupTabId: groupTab.id, tabs: serializeTabs(new Set([groupTab.id])) }
}

async function flattenTabs(request: T.ExternalApiRequest): Promise<T.ExternalApiMutationResult> {
  const params = getObjectParams(request) as unknown as T.ExternalApiFlattenTabsParams
  const tabIds = getTabIds(params.tabIds)
  await Utils.GLOBAL_QUEUE.add(async () => Tabs.flattenTabs([...tabIds]))
  return { tabs: serializeTabs(new Set(tabIds)) }
}

export async function handleRequest(request: T.ExternalApiRequest): Promise<unknown> {
  await Tabs.waitForTabsReady()

  if (request.method === 'get-state') return getState()
  if (request.method === 'move-tabs') return moveTabs(request)
  if (request.method === 'create-group') return createGroup(request)
  if (request.method === 'remove-group') return removeGroup(request)
  if (request.method === 'rename-group') return renameGroup(request)
  if (request.method === 'flatten-tabs') return flattenTabs(request)

  return fail('UNKNOWN_METHOD', `Unknown external API method: ${String(request.method)}`)
}

export async function handleIpcRequest(request: T.ExternalApiRequest): Promise<{
  result?: unknown
  error?: T.ExternalApiError
}> {
  try {
    return { result: await handleRequest(request) }
  } catch (err) {
    if (err instanceof ExternalApiRequestError) {
      return { error: { code: err.code, message: err.message } }
    }
    return { error: { code: 'REQUEST_FAILED', message: String(err) } }
  }
}
