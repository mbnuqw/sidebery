import { StoredRemovedBookmark, StoredRemovedTab, StoredRemovedWindow } from 'src/types'
import { RemovedTab, RemovedBookmark, RemovedWindow, RemovedItem } from 'src/types'
import * as TrashActions from 'src/services/trash.actions'

export interface TrashState {
  all: RemovedItem[]
  tabs: RemovedTab[]
  bookmarks: RemovedBookmark[]
  windows: RemovedWindow[]
  prevCache: RemovedWindow[]
  filtered?: RemovedItem[]
}

export const Trash = {
  reactive: {
    all: [],
    tabs: [],
    bookmarks: [],
    windows: [],
    prevCache: [],
  } as TrashState,

  storedTabs: [] as StoredRemovedTab[],
  storedBookmarks: [] as StoredRemovedBookmark[],
  storedWindows: [] as StoredRemovedWindow[],

  ...TrashActions,
}
