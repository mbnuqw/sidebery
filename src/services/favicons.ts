import * as FaviconsActions from 'src/services/favicons.actions'

export interface FaviconsState {
  list: string[]
  domains: Record<string, number>
}

export const Favicons = {
  reactive: { list: [], domains: {} } as FaviconsState,
  ready: false,

  ...FaviconsActions,
}
