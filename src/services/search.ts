import * as SearchActions from 'src/services/search.actions'

export interface SearchState {
  barIsShowed: boolean
  barIsActive: boolean
  barIsFocused: boolean
  value: string
  rawValue: string
}

export interface SearchShortcut {
  ctrl: boolean
  alt: boolean
  meta: boolean
  key: string
}

interface SearchShortcuts {
  bookmarks?: SearchShortcut
  history?: SearchShortcut
}

export const Search = {
  reactive: {
    barIsShowed: false,
    barIsActive: false,
    barIsFocused: false,
    value: '',
  } as SearchState,
  prevValue: '',
  prevExpandedBookmarks: undefined as Record<ID, Record<ID, boolean>> | undefined,

  shortcuts: {} as SearchShortcuts,

  ...SearchActions,
}
