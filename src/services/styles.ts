import { CustomCssTarget, CustomCssFieldName, Stored, RGBA, RGB } from 'src/types'
import * as Settings from 'src/services/settings'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

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

export const SRC_VARS: (keyof SrcVars)[] = [
  'frame_bg',
  'frame_fg',
  'toolbar_bg',
  'toolbar_fg',
  'toolbar_border',
  'act_el_bg',
  'act_el_fg',
  'act_el_border',
  'popup_bg',
  'popup_fg',
  'popup_border',
  'accent',
  'top_padding',
  'darker_border_width',
]

const PREF_DARK_MEDIA = '(prefers-color-scheme: dark)'

let darkMedia: MediaQueryList | undefined

export function getColorSchemeName(colorScheme?: ColorSchemeVariant): 'dark' | 'light' {
  if (colorScheme === ColorSchemeVariant.Dark) return 'dark'
  else return 'light'
}

export function updColorScheme(state: StylesState, scheme?: 'dark' | 'light'): void {
  if (!scheme) {
    if (!darkMedia) darkMedia = window.matchMedia(PREF_DARK_MEDIA)

    if (darkMedia.matches) {
      state.frameColorScheme = 'dark'
      state.toolbarColorScheme = 'dark'
      state.actElColorScheme = 'dark'
      state.popupColorScheme = 'dark'
    } else {
      state.frameColorScheme = 'light'
      state.toolbarColorScheme = 'light'
      state.actElColorScheme = 'light'
      state.popupColorScheme = 'light'
    }
  } else {
    state.frameColorScheme = scheme
    state.toolbarColorScheme = scheme
    state.actElColorScheme = scheme
    state.popupColorScheme = scheme
  }
}

export function _setupAutoColorSchemeListener(cb: () => void): void {
  if (!darkMedia) darkMedia = window.matchMedia(PREF_DARK_MEDIA)
  if (!darkMedia.onchange) darkMedia.onchange = () => cb()
}

function getColorSchemeVariant(bg?: RGBA, fg?: RGBA): ColorSchemeVariant | undefined {
  let variant: ColorSchemeVariant | undefined
  if (bg && fg && bg[3] > 0.1) {
    const bgn = (bg[0] + bg[1] + bg[2]) / 3
    const fgn = (fg[0] + fg[1] + fg[2]) / 3
    if (bgn > fgn) variant = ColorSchemeVariant.Light
    else variant = ColorSchemeVariant.Dark
  }
  return variant
}

function shiftColor(rgba: RGBA, shift: number): RGBA {
  let r = rgba[0]
  let g = rgba[1]
  let b = rgba[2]
  const a = rgba[3]
  if (shift < 2 && shift > 0) {
    if ((r *= shift) > 255) r = 255
    if ((g *= shift) > 255) g = 255
    if ((b *= shift) > 255) b = 255
  } else {
    if ((r += shift) > 255) r = 255
    if ((g += shift) > 255) g = 255
    if ((b += shift) > 255) b = 255
    if (r < 0) r = 0
    if (g < 0) g = 0
    if (b < 0) b = 0
  }
  return [r, g, b, a]
}

function mergeColors(a?: RGBA, b?: RGBA, alpha?: number): RGBA | undefined {
  if (!a || !b) return
  if (alpha === undefined) alpha = b[3]
  if (alpha === 1) return b
  const cr = Math.round(a[0] * (1 - alpha) + b[0] * alpha)
  const cg = Math.round(a[1] * (1 - alpha) + b[1] * alpha)
  const cb = Math.round(a[2] * (1 - alpha) + b[2] * alpha)
  return [cr, cg, cb, 1]
}

function isTransparent(color?: RGBA): boolean {
  if (!color) return false
  return color[3] !== 1
}

function toColorString(rgba?: RGBA | RGB | string | null, noAlpha?: boolean): string {
  if (!rgba) return '#000'
  if (!Array.isArray(rgba)) return rgba
  if (rgba[3] === undefined || rgba[3] === 1 || noAlpha) {
    return `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`
  }
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
}

export function getSystemColorScheme(): 'dark' | 'light' {
  const probeEl = document.getElementById('moz_dialog_color_scheme_probe')
  if (!probeEl) return 'dark'

  const styles = window.getComputedStyle(probeEl)
  const bg = Utils.toRGBA(styles.backgroundColor)
  const fg = Utils.toRGBA(styles.color)
  if (!bg || !fg) return 'dark'

  const colorScheme = getColorSchemeVariant(bg, fg)
  if (!colorScheme) return 'dark'

  return colorScheme === ColorSchemeVariant.Dark ? 'dark' : 'light'
}

export function parseFirefoxTheme(theme: browser.theme.Theme): ParsedTheme {
  const parsed: ParsedTheme = { error: false, vars: {} }

  // Try to use -moz-dialog colors
  moz_dialog_fallback: if (!theme.colors) {
    const probeEl = document.getElementById('moz_dialog_color_scheme_probe')
    if (!probeEl) break moz_dialog_fallback

    const styles = window.getComputedStyle(probeEl)
    const bg = Utils.toRGBA(styles.backgroundColor)
    const fg = Utils.toRGBA(styles.color)
    if (!bg || !fg) break moz_dialog_fallback

    theme.colors = {
      frame: toColorString(bg),
      toolbar: toColorString(shiftColor(bg, 15)),
      popup: toColorString(shiftColor(bg, 5)),
      tab_background_text: styles.color,
    }
  }
  parsed.error = !theme.colors

  // ---
  // -- Getting vars
  // -
  // Frame vars
  const frame_bg = theme.colors?.frame ?? theme.colors?.frame_inactive
  const frame_fg =
    theme.colors?.tab_background_text ?? theme.colors?.toolbar_text ?? theme.colors?.bookmark_text

  // Toolbar vars
  const toolbar_bg = theme.colors?.toolbar ?? frame_bg
  const toolbar_fg =
    theme.colors?.icons ??
    theme.colors?.toolbar_text ??
    theme.colors?.bookmark_text ??
    theme.colors?.icons_attention ??
    theme.colors?.tab_background_text

  // Active element vars
  const act_el_bg = theme.colors?.tab_selected ?? toolbar_bg
  const act_el_fg =
    theme.colors?.tab_text ??
    theme.colors?.toolbar_text ??
    theme.colors?.bookmark_text ??
    theme.colors?.tab_background_text

  // Popup vars
  const popup_bg = theme.colors?.popup ?? frame_bg
  const popup_fg = theme.colors?.popup_text ?? frame_fg
  const popup_border = theme.colors?.popup_border

  // Accent
  const accentFg = theme.colors?.tab_line ?? theme.colors?.bookmark_text

  // ---
  // -- Parsing/generating/normalizing vars
  // -
  const isProton = Settings.state.theme === 'proton'
  // Proton theme colors
  per_theme_stuff: if (isProton) {
    // Frame
    parsed.vars.frame_bg = toColorString(frame_bg)
    parsed.frameBg = Utils.toRGBA(parsed.vars.frame_bg)
    if (isTransparent(parsed.frameBg)) {
      parsed.frameBg = mergeColors([0, 0, 0, 0], parsed.frameBg)
      parsed.vars.frame_bg = toColorString(parsed.frameBg)
    }
    parsed.vars.frame_fg = toColorString(frame_fg)
    parsed.frameFg = Utils.toRGBA(parsed.vars.frame_fg)
    parsed.frameVariant = getColorSchemeVariant(parsed.frameBg, parsed.frameFg)

    // Toolbar
    parsed.vars.toolbar_bg = toColorString(toolbar_bg)
    parsed.vars.toolbar_fg = toColorString(toolbar_fg)
    parsed.toolbarBg = Utils.toRGBA(parsed.vars.toolbar_bg)
    if (isTransparent(parsed.toolbarBg)) {
      parsed.toolbarBg = mergeColors(parsed.frameBg, parsed.toolbarBg)
      parsed.vars.toolbar_bg = toColorString(parsed.toolbarBg)
    }
    parsed.toolbarFg = Utils.toRGBA(parsed.vars.toolbar_fg)
    parsed.toolbarVariant = getColorSchemeVariant(parsed.toolbarBg, parsed.toolbarFg)

    normalizeContrast(parsed)
    if (parsed.error) return parsed

    // Active element
    parsed.vars.act_el_bg = toColorString(act_el_bg)
    parsed.vars.act_el_fg = toColorString(act_el_fg)
    parsed.actElBg = Utils.toRGBA(parsed.vars.act_el_bg)
    parsed.actElFg = Utils.toRGBA(parsed.vars.act_el_fg)
    parsed.actElVariant = getColorSchemeVariant(parsed.actElBg, parsed.actElFg)
  }

  // Plain theme colors
  else if (Settings.state.theme === 'plain') {
    // Get base colors (from sidebar / toolbar)
    parsed.vars.toolbar_bg = toColorString(theme.colors?.sidebar ?? toolbar_bg)
    parsed.vars.toolbar_fg = toColorString(theme.colors?.sidebar_text ?? toolbar_fg)
    parsed.toolbarBg = Utils.toRGBA(parsed.vars.toolbar_bg)
    if (isTransparent(parsed.toolbarBg)) {
      const frameBg = Utils.toRGBA(frame_bg)
      if (!isTransparent(frameBg)) {
        parsed.toolbarBg = mergeColors(frameBg, parsed.toolbarBg)
      } else {
        parsed.toolbarBg = mergeColors([0, 0, 0, 0], parsed.toolbarBg)
      }
      parsed.vars.toolbar_bg = toColorString(parsed.toolbarBg)
    }
    parsed.toolbarFg = Utils.toRGBA(parsed.vars.toolbar_fg)
    parsed.toolbarVariant = getColorSchemeVariant(parsed.toolbarBg, parsed.toolbarFg)
    parsed.frameVariant = parsed.toolbarVariant
    parsed.actElVariant = parsed.toolbarVariant
    parsed.popupVariant = parsed.toolbarVariant
    if (!parsed.toolbarBg) break per_theme_stuff

    // Frame
    const toolbarBgAvrg = (parsed.toolbarBg[0] + parsed.toolbarBg[1] + parsed.toolbarBg[2]) / 3
    if (toolbarBgAvrg < 36) {
      parsed.frameBg = shiftColor(parsed.toolbarBg, 0.1 + (toolbarBgAvrg * 0.023) ** 2)
    } else if (toolbarBgAvrg < 200) {
      parsed.frameBg = shiftColor(parsed.toolbarBg, 0.8)
    } else {
      parsed.frameBg = shiftColor(parsed.toolbarBg, 0.9)
    }
    if (parsed.frameBg) parsed.vars.frame_bg = toColorString(parsed.frameBg)
    parsed.frameFg = parsed.toolbarFg
    parsed.vars.frame_fg = parsed.vars.toolbar_fg

    normalizeContrast(parsed)
    if (parsed.error) return parsed

    // Active element
    if (parsed.toolbarVariant === ColorSchemeVariant.Dark) {
      parsed.actElBg = mergeColors(parsed.toolbarBg, parsed.toolbarFg, 0.1)
    } else {
      parsed.actElBg = shiftColor(parsed.toolbarBg, 1.1)
    }
    if (parsed.actElBg) parsed.vars.act_el_bg = toColorString(parsed.actElBg)
    parsed.vars.act_el_fg = parsed.vars.toolbar_fg
  }

  // Popup colors
  parsed.vars.popup_bg = toColorString(popup_bg)
  parsed.vars.popup_fg = toColorString(popup_fg)
  parsed.vars.popup_border = toColorString(popup_border)
  parsed.popupBg = Utils.toRGBA(popup_bg)
  parsed.popupFg = Utils.toRGBA(popup_fg)
  parsed.popupBorder = Utils.toRGBA(popup_border)
  parsed.popupVariant = getColorSchemeVariant(parsed.popupBg, parsed.popupFg)
  fixing_popup_border: if (
    !popup_border ||
    parsed.popupBorder?.[3] === 0 ||
    isSimilarColor(8, parsed.popupBg, parsed.popupBorder)
  ) {
    const border = Utils.toRGBA(popup_bg)
    if (!border) break fixing_popup_border

    if (parsed.popupVariant === ColorSchemeVariant.Dark) {
      parsed.popupBorder = shiftColor(border, 9)
    } else {
      parsed.popupBorder = shiftColor(border, -38)
    }
    parsed.vars.popup_border = toColorString(parsed.popupBorder)
  }

  // Accent color
  accent_parsing: if (accentFg) {
    const accent = Utils.toRGBA(accentFg)
    if (!accent) break accent_parsing
    if (accent[3] === 0) break accent_parsing

    const frame = parsed.frameBg
    const toolbar = parsed.toolbarBg
    const actEl = parsed.actElBg
    if (!frame || !toolbar || !actEl) break accent_parsing

    const accentAvrg = (accent[0] + accent[1] + accent[2]) / 3
    const frameAvrg = (frame[0] + frame[1] + frame[2]) / 3
    const toolbarAvrg = (toolbar[0] + toolbar[1] + toolbar[2]) / 3
    const actElAvrg = (actEl[0] + actEl[1] + actEl[2]) / 3

    const accentIsBrighter = accentAvrg > frameAvrg

    const csVariant = parsed.actElVariant ?? parsed.frameVariant ?? parsed.toolbarVariant
    const isDark = csVariant === ColorSchemeVariant.Dark
    if (accentIsBrighter !== accentAvrg > toolbarAvrg) break accent_parsing
    if (accentIsBrighter !== accentAvrg > actElAvrg) break accent_parsing
    if (isDark && accentAvrg < 50) break accent_parsing
    if (!isDark && Math.abs(accentAvrg - actElAvrg) < 8) break accent_parsing

    // Check if accent color is not the same as frame/toolbar background
    const likeFrameBg = isSimilarColor(8, accent, parsed.frameBg)
    if (likeFrameBg) break accent_parsing

    const likeToolbarBg = isSimilarColor(8, accent, parsed.toolbarBg)
    if (likeToolbarBg) break accent_parsing

    parsed.actElBorder = accent
    parsed.vars.act_el_border = toColorString(accentFg)

    parsed.accent = accent
    parsed.vars.accent = toColorString(accentFg)
  }

  // Check colors of active element for proton theme
  if (isProton && !parsed.vars.accent && parsed.actElBg && parsed.frameBg) {
    const actElBgAvrg = (parsed.actElBg[0] + parsed.actElBg[1] + parsed.actElBg[2]) / 3
    const frameBgAvrg = (parsed.frameBg[0] + parsed.frameBg[1] + parsed.frameBg[2]) / 3
    if (Math.abs(actElBgAvrg - frameBgAvrg) < 8) {
      if (parsed.toolbarVariant === ColorSchemeVariant.Dark) {
        parsed.actElBg = mergeColors(parsed.frameBg, parsed.toolbarFg, 0.1)
      } else {
        parsed.actElBg = shiftColor(parsed.frameBg, 1.1)
      }
      if (parsed.actElBg) parsed.vars.act_el_bg = toColorString(parsed.actElBg)
    }
  }

  // Detect sidebar top border
  detecting_top_border: if (theme.colors?.sidebar && theme.colors.sidebar_border) {
    const border = Utils.toRGBA(theme.colors.sidebar_border)
    const frame = parsed.frameBg
    const toolbar = parsed.toolbarBg
    if (!border || !frame || !toolbar) break detecting_top_border
    if (border[3] === 0) break detecting_top_border
    if (theme.colors.sidebar_border === theme.colors.sidebar) break detecting_top_border

    const borderAvrg = (border[0] + border[1] + border[2]) / 3
    const toolbarAvrg = (toolbar[0] + toolbar[1] + toolbar[2]) / 3
    const borderIsDarkEnough = toolbarAvrg - borderAvrg > 8
    if (borderIsDarkEnough) parsed.vars.darker_border_width = '1px'
  }

  // Calc border between toolbar and frame
  if (theme.colors?.toolbar_top_separator) {
    calcToolbarBorder(theme.colors, parsed)
  }

  // Fallback to system color scheme
  if (parsed.error || !theme.colors) {
    if (!darkMedia) darkMedia = window.matchMedia(PREF_DARK_MEDIA)
    if (darkMedia.matches) parsed.frameVariant = ColorSchemeVariant.Dark
    else parsed.frameVariant = ColorSchemeVariant.Light
    parsed.toolbarVariant = parsed.frameVariant
    parsed.actElVariant = parsed.frameVariant
  }

  return parsed
}

const CONTRAST_THRESHOLD = 70
function normalizeContrast(parsed: ParsedTheme) {
  // Check frame contrast
  let frameContrastOk = true
  if (parsed.frameBg && parsed.frameFg) {
    const frameBgAvrg = (parsed.frameBg[0] + parsed.frameBg[1] + parsed.frameBg[2]) / 3
    const frameFgAvrg = (parsed.frameFg[0] + parsed.frameFg[1] + parsed.frameFg[2]) / 3
    frameContrastOk = Math.abs(frameFgAvrg - frameBgAvrg) > CONTRAST_THRESHOLD
  }

  // Check toolbar contrast
  let toolbarContrastOk = true
  if (parsed.toolbarBg && parsed.toolbarFg) {
    const toolbarBgAvrg = (parsed.toolbarBg[0] + parsed.toolbarBg[1] + parsed.toolbarBg[2]) / 3
    const toolbarFgAvrg = (parsed.toolbarFg[0] + parsed.toolbarFg[1] + parsed.toolbarFg[2]) / 3
    toolbarContrastOk = Math.abs(toolbarFgAvrg - toolbarBgAvrg) > CONTRAST_THRESHOLD
  }

  if (!frameContrastOk && toolbarContrastOk && Settings.state.theme === 'proton') {
    parsed.frameBg = parsed.toolbarBg
    parsed.vars.frame_bg = parsed.vars.toolbar_bg
    parsed.frameFg = parsed.toolbarFg
    parsed.vars.frame_fg = parsed.vars.toolbar_fg
    parsed.frameVariant = getColorSchemeVariant(parsed.frameBg, parsed.frameFg)
  }

  if (frameContrastOk && !toolbarContrastOk) {
    parsed.toolbarBg = parsed.frameBg
    parsed.vars.toolbar_bg = parsed.vars.frame_bg
    parsed.toolbarFg = parsed.frameFg
    parsed.vars.toolbar_fg = parsed.vars.frame_fg
    parsed.toolbarVariant = getColorSchemeVariant(parsed.frameBg, parsed.frameFg)
  }

  if (!frameContrastOk && !toolbarContrastOk) {
    parsed.error = true
    return
  }
}

function isSimilarColor(thr: number, a?: RGBA, b?: RGBA): boolean {
  if (a === undefined || b === undefined) return false
  if (thr === 0) return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
  else {
    const dr = Math.abs(a[0] - b[0])
    const dg = Math.abs(a[1] - b[1])
    const db = Math.abs(a[2] - b[2])
    return dr <= thr && dg <= thr && db <= thr
  }
}

function calcToolbarBorder(themeColors: browser.theme.ThemeColors, parsed: ParsedTheme): void {
  const monoColorScheme = parsed.frameVariant === parsed.toolbarVariant
  const borderRaw = themeColors.toolbar_top_separator
  const border = Utils.toRGBA(borderRaw)
  const frame = parsed.frameBg
  const bar = parsed.toolbarBg

  if (!borderRaw || !border) return
  if (borderRaw === themeColors.toolbar) return
  if (borderRaw === themeColors.frame) return
  if (border[3] === 0) return
  if (!monoColorScheme) return
  if (!frame || !bar) return

  const borderAvrg = (border[0] + border[1] + border[2]) / 3
  const frameAvrg = (frame[0] + frame[1] + frame[2]) / 3
  const barAvrg = (bar[0] + bar[1] + bar[2]) / 3
  if (borderAvrg >= frameAvrg) return
  if (borderAvrg >= barAvrg) return

  // Native border is ok
  if (monoColorScheme && borderRaw && border?.[3] === 1) {
    parsed.vars.toolbar_border = toColorString(borderRaw)
    return
  }

  // Calc border
  const frameAv = (frame[0] + frame[1] + frame[2]) / 3
  const barAv = (bar[0] + bar[1] + bar[2]) / 3
  const base = frameAv < barAv ? frame : bar
  parsed.vars.toolbar_border = `rgb(${base[0] - 8}, ${base[1] - 8}, ${base[2] - 8})`
}

/**
 * Get stored custom css
 */
export async function getCustomCSS(target: CustomCssTarget): Promise<string> {
  const fieldName = (target + 'CSS') as CustomCssFieldName
  const ans = await browser.storage.local.get<Stored>(fieldName)
  if (!ans || !ans[fieldName]) return ''

  return ans[fieldName] as string
}

export async function hasCustomCSS(): Promise<boolean> {
  const storage = await browser.storage.local.get<Stored>(['sidebarCSS', 'groupCSS'])
  return !!storage.sidebarCSS || !!storage.groupCSS
}
