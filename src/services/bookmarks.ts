import { Bookmark } from 'src/types'
import * as BookmarksActions from 'src/services/bookmarks.actions'
import * as BookmarksHandlers from 'src/services/bookmarks.handlers'

export interface BookmarksState {
  tree: Bookmark[]
  byId: Record<ID, Bookmark>
  byUrl: Record<string, Bookmark[]>
  popup: BookmarksPopupState | null
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
    byUrl: {},
    popup: null,
  } as BookmarksState,

  expandedBookmarkFolders: [] as ID[],

  ...BookmarksHandlers,
  ...BookmarksActions,
}
