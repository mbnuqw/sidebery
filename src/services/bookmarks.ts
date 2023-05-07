import { Bookmark } from 'src/types'
import * as BookmarksActions from 'src/services/bookmarks.actions'
import * as BookmarksHandlers from 'src/services/bookmarks.handlers'

export interface BookmarksState {
  tree: Bookmark[]
  byId: Record<ID, Bookmark>
  popup: BookmarksPopupState | null
  expanded: Record<ID, Record<ID, boolean>>
}

export interface BookmarksPopupControlConfig {
  label: string
  inactive?: boolean
}

export interface BookmarksPopupConfig {
  title: string
  name?: string
  nameField?: boolean
  url?: string
  urlField?: boolean
  locationField?: boolean
  locationTree?: boolean
  location?: ID
  recentLocations?: boolean
  recentLocationAsDefault?: boolean
  newFolderPosition?: [parentId: ID, index: number]
  target?: Bookmark
  controls?: BookmarksPopupControlConfig[]
  validate?: (popupState: BookmarksPopupState) => void
}

export interface BookmarksPopupState extends BookmarksPopupConfig {
  name: string
  nameValid: boolean
  url: string
  urlValid: boolean
  close: (result?: BookmarksPopupResult) => void
}

export interface BookmarksPopupResult {
  name?: string
  url?: string
  location?: ID
  controlIndex: number
}

export const Bookmarks = {
  reactive: {
    tree: [],
    byId: {},
    popup: null,
    expanded: {},
  } as BookmarksState,

  byUrl: {} as Record<string, Bookmark[]>,
  markedFolders: {} as Record<ID, number>,
  overallCount: 0,

  ...BookmarksHandlers,
  ...BookmarksActions,
}
