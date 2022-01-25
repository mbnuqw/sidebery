import * as SearchActions from 'src/services/search.actions'

export interface SearchState {
  barIsShowed: boolean
  barIsActive: boolean
  barIsFocused: boolean
  value: string
  rawValue: string
}

export const Search = {
  reactive: {
    barIsShowed: false,
    barIsActive: false,
    barIsFocused: false,
    value: '',
  } as SearchState,
  prevValue: '',

  ...SearchActions,
}
