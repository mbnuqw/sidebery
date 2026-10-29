export const EXTERNAL_API_VERSION = 1 as const
export const EXTERNAL_API_MESSAGE_TYPE = 'sidebery-api' as const

export type ExternalApiMethod =
  'get-state' | 'move-tabs' | 'create-group' | 'remove-group' | 'rename-group' | 'flatten-tabs'

export interface ExternalApiRequest {
  type: typeof EXTERNAL_API_MESSAGE_TYPE
  version: typeof EXTERNAL_API_VERSION
  method: ExternalApiMethod
  windowId: ID
  params?: unknown
}

export interface ExternalApiError {
  code: string
  message: string
}

export class ExternalApiRequestError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ExternalApiRequestError'
    this.code = code
  }
}

export type ExternalApiResponse =
  | {
      type: typeof EXTERNAL_API_MESSAGE_TYPE
      version: typeof EXTERNAL_API_VERSION
      ok: true
      result: unknown
    }
  | {
      type: typeof EXTERNAL_API_MESSAGE_TYPE
      version: typeof EXTERNAL_API_VERSION
      ok: false
      error: ExternalApiError
    }

export type ExternalApiPanelType = 'tabs' | 'bookmarks' | 'history' | 'sync'

export interface ExternalApiPanel {
  id: ID
  index: number
  type: ExternalApiPanelType
  name: string
  color: browser.ColorName
}

export interface ExternalApiTab {
  id: ID
  index: number
  panelId: ID
  parentId: ID | null
  ancestorIds: ID[]
  childIds: ID[]
  level: number
  pinned: boolean
  folded: boolean
  isParent: boolean
  isGroup: boolean
}

export interface ExternalApiState {
  windowId: ID
  activePanelId: ID
  panels: ExternalApiPanel[]
  tabs: ExternalApiTab[]
}

export interface ExternalApiMoveTabsParams {
  tabIds: ID[]
  panelId?: ID
  parentId?: ID | null
  beforeTabId?: ID
  afterTabId?: ID
}

export interface ExternalApiCreateGroupParams {
  tabIds: ID[]
  title: string
}

export interface ExternalApiRemoveGroupParams {
  groupTabId: ID
}

export interface ExternalApiRenameGroupParams {
  groupTabId: ID
  title: string
}

export interface ExternalApiFlattenTabsParams {
  tabIds: ID[]
}

export interface ExternalApiMutationResult {
  tabs: ExternalApiTab[]
  groupTabId?: ID
  removedGroupTabId?: ID
}
