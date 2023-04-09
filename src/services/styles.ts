import * as StylesActions from 'src/services/styles.actions'
import { RGBA } from 'src/types'

export interface StylesState {
  frameColorScheme: 'dark' | 'light'
  toolbarColorScheme: 'dark' | 'light'
  actElColorScheme: 'dark' | 'light'
  popupColorScheme: 'dark' | 'light'
}

export interface ParsedTheme {
  error: boolean
  vars: SrcVars

  frameBg?: RGBA
  frameFg?: RGBA

  toolbarBg?: RGBA
  toolbarFg?: RGBA
  toolbarBorder?: RGBA

  actElBg?: RGBA
  actElFg?: RGBA
  actElBorder?: RGBA

  popupBg?: RGBA
  popupFg?: RGBA
  popupBorder?: RGBA

  accent?: RGBA

  frameVariant?: ColorSchemeVariant
  toolbarVariant?: ColorSchemeVariant
  actElVariant?: ColorSchemeVariant
  popupVariant?: ColorSchemeVariant
}

export interface SrcVars {
  frame_bg?: string | null
  frame_fg?: string | null

  toolbar_bg?: string | null
  toolbar_fg?: string | null
  toolbar_border?: string | null

  act_el_bg?: string | null
  act_el_fg?: string | null
  act_el_border?: string | null

  popup_bg?: string | null
  popup_fg?: string | null
  popup_border?: string | null
  popup_separator?: string | null

  accent?: string | null
  top_padding?: string | null
  darker_border_width?: string | null
}

export const enum ColorSchemeVariant {
  Dark = 1,
  Light = 2,
}

const defaultColorScheme = StylesActions.getSystemColorScheme()

export const Styles = {
  reactive: {
    colorScheme: defaultColorScheme,
    frameColorScheme: defaultColorScheme,
    toolbarColorScheme: defaultColorScheme,
    actElColorScheme: defaultColorScheme,
    popupColorScheme: defaultColorScheme,
  } as StylesState,
  sidebarCSS: '',
  groupCSS: '',
  theme: undefined as browser.theme.Theme | undefined,
  parsedTheme: undefined as ParsedTheme | undefined,

  ...StylesActions,
}
