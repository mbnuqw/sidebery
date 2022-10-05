import * as StylesActions from 'src/services/styles.actions'

export interface StylesState {
  colorScheme: 'dark' | 'light'
}

export const Styles = {
  reactive: { colorScheme: 'dark' } as StylesState,
  sidebarCSS: '',
  groupCSS: '',
  theme: undefined as browser.theme.Theme | undefined,

  ...StylesActions,
}
