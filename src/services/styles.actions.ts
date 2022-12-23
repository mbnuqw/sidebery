import { CustomCssTarget, CustomCssFieldName, Stored, RGBA, RGB } from 'src/types'
import { ColorSchemeVariant, ParsedTheme, SrcVars, Styles } from 'src/services/styles'
import { Settings } from 'src/services/settings'
import { Store } from 'src/services/storage'
import { Info } from 'src/services/info'
import * as Utils from 'src/utils'
import { Sidebar } from './sidebar'

const SRC_VARS: (keyof SrcVars)[] = [
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

export async function initColorScheme(): Promise<void> {
  await updateColorScheme()

  setupAutoColorSchemeListener(() => updateColorScheme())
  browser.theme.onUpdated.addListener(upd => updateColorScheme(upd?.theme))
}

export function getColorSchemeName(colorScheme?: ColorSchemeVariant): 'dark' | 'light' {
  if (colorScheme === ColorSchemeVariant.Dark) return 'dark'
  else return 'light'
}

export async function updateColorScheme(theme?: browser.theme.Theme): Promise<void> {
  if (Settings.state.colorScheme === 'ff') {
    if (!theme) theme = await browser.theme.getCurrent()

    const result = parseFirefoxTheme(theme)
    Styles.reactive.frameColorScheme = getColorSchemeName(result.frameVariant)
    Styles.reactive.toolbarColorScheme = getColorSchemeName(result.toolbarVariant)
    Styles.reactive.actElColorScheme = getColorSchemeName(result.actElVariant)
    Styles.reactive.popupColorScheme = getColorSchemeName(result.popupVariant)

    if (!Info.isBg) {
      if (!result.error) applyThemeSrcVars(result)
      else resetThemeSrcVars()
    }

    Styles.theme = theme
    Styles.parsedTheme = result
  } else {
    if (!Info.isBg) resetThemeSrcVars()

    Styles.theme = {}
    Styles.parsedTheme = undefined
  }

  if (Settings.state.colorScheme === 'sys') {
    useAutoColorScheme()
  } else if (Settings.state.colorScheme === 'dark') {
    Styles.reactive.frameColorScheme = 'dark'
    Styles.reactive.toolbarColorScheme = 'dark'
    Styles.reactive.actElColorScheme = 'dark'
    Styles.reactive.popupColorScheme = 'dark'
  } else if (Settings.state.colorScheme === 'light') {
    Styles.reactive.frameColorScheme = 'light'
    Styles.reactive.toolbarColorScheme = 'light'
    Styles.reactive.actElColorScheme = 'light'
    Styles.reactive.popupColorScheme = 'light'
  }
}

function useAutoColorScheme(): void {
  if (!darkMedia) darkMedia = window.matchMedia(PREF_DARK_MEDIA)

  if (darkMedia.matches) {
    Styles.reactive.frameColorScheme = 'dark'
    Styles.reactive.toolbarColorScheme = 'dark'
    Styles.reactive.actElColorScheme = 'dark'
    Styles.reactive.popupColorScheme = 'dark'
  } else {
    Styles.reactive.frameColorScheme = 'light'
    Styles.reactive.toolbarColorScheme = 'light'
    Styles.reactive.actElColorScheme = 'light'
    Styles.reactive.popupColorScheme = 'light'
  }
}

function setupAutoColorSchemeListener(cb: () => void): void {
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

function parseFirefoxTheme(theme: browser.theme.Theme): ParsedTheme {
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
  // Proton theme colors
  per_theme_stuff: if (Settings.state.theme === 'proton') {
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
    parsed.frameBg = shiftColor(parsed.toolbarBg, 0.85)
    if (parsed.frameBg) parsed.vars.frame_bg = toColorString(parsed.frameBg)
    parsed.vars.frame_fg = parsed.vars.toolbar_fg

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
  parsed.popupVariant = getColorSchemeVariant(parsed.popupBg, parsed.popupFg)
  fixing_popup_border: if (!popup_border || popup_bg === popup_border) {
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

  // Handle frame_image - set frame background
  if (theme.colors && theme.images?.theme_frame && parsed.toolbarBg?.[3] === 1) {
    const ffg = parsed.frameFg
    const tfg = parsed.toolbarFg
    if (ffg && tfg) {
      const tn = (tfg[0] + tfg[1] + tfg[2]) / 3
      const fn = (ffg[0] + ffg[1] + ffg[2]) / 3
      if (Math.abs(tn - fn) < 16) {
        parsed.frameBg = parsed.toolbarBg
        parsed.vars.frame_bg = parsed.vars.toolbar_bg
      }
    }
  }

  // Check frame contrast
  let frameContrastOk = true
  if (parsed.frameBg && parsed.frameFg) {
    const frameBgAvrg = (parsed.frameBg[0] + parsed.frameBg[1] + parsed.frameBg[2]) / 3
    const frameFgAvrg = (parsed.frameFg[0] + parsed.frameFg[1] + parsed.frameFg[2]) / 3
    frameContrastOk = Math.abs(frameFgAvrg - frameBgAvrg) > 80
  }

  // Check toolbar contrast
  let toolbarContrastOk = true
  if (parsed.toolbarBg && parsed.toolbarFg) {
    const toolbarBgAvrg = (parsed.toolbarBg[0] + parsed.toolbarBg[1] + parsed.toolbarBg[2]) / 3
    const toolbarFgAvrg = (parsed.toolbarFg[0] + parsed.toolbarFg[1] + parsed.toolbarFg[2]) / 3
    toolbarContrastOk = Math.abs(toolbarFgAvrg - toolbarBgAvrg) > 80
  }

  if (!frameContrastOk && toolbarContrastOk) {
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

export function applyThemeSrcVars(parsed: ParsedTheme, rootEl?: HTMLElement): void {
  if (!rootEl) rootEl = document.getElementById('root') ?? undefined
  if (!rootEl) return

  for (const colorName of SRC_VARS) {
    if (parsed.vars[colorName]) continue

    rootEl.style.removeProperty(Utils.toCSSVarName('s_' + colorName))
  }

  for (const prop of Object.keys(parsed.vars) as (keyof SrcVars)[]) {
    const value = parsed.vars[prop]

    if (value) {
      rootEl.style.setProperty(Utils.toCSSVarName('s_' + prop), value)
    } else {
      rootEl.style.removeProperty(Utils.toCSSVarName('s_' + prop))
    }
  }
}

export function resetThemeSrcVars(): void {
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  for (const colorName of SRC_VARS) {
    rootEl.style.removeProperty(Utils.toCSSVarName('s_' + colorName))
  }
}

export async function loadCustomSidebarCSS(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('sidebarCSS')
  applyCustomCSS(stored.sidebarCSS)
  // Recalculate sizes when custom CSS is changed
  Sidebar.recalcElementSizesDebounced()
}

export async function loadCustomGroupCSS(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('groupCSS')
  applyCustomCSS(stored.groupCSS)
}

/**
 * Update custom css
 */
function applyCustomCSS(css?: string | null): void {
  if (css === null || css === undefined) return

  // Find or create new style element
  let customStyleEl = document.getElementById('custom_css') as HTMLStyleElement
  if (!customStyleEl) {
    customStyleEl = document.createElement('style')
    customStyleEl.id = 'custom_css'
    document.head.appendChild(customStyleEl)
  } else {
    // Remove old styles
    while (customStyleEl.lastChild) {
      customStyleEl.removeChild(customStyleEl.lastChild)
    }
  }

  // Apply css
  if (css) customStyleEl.appendChild(document.createTextNode(css))
}

export function removeCustomCSS(): void {
  const customStyleEl = document.getElementById('custom_css') as HTMLStyleElement
  if (customStyleEl) customStyleEl.remove()
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

/**
 * Apply custom css and save it
 */
export function setCustomCSS(target: CustomCssTarget, css: string): void {
  const fieldName = (target + 'CSS') as CustomCssFieldName

  let settingsChanged = false
  if (fieldName === 'sidebarCSS') {
    if (Styles.sidebarCSS === css) return
    if (Settings.state.sidebarCSS !== !!css) settingsChanged = true
    Styles.sidebarCSS = css
    Settings.state.sidebarCSS = !!css
  } else if (fieldName === 'groupCSS') {
    if (Styles.groupCSS === css) return
    if (Settings.state.groupCSS !== !!css) settingsChanged = true
    Styles.groupCSS = css
    Settings.state.groupCSS = !!css
  }

  if (settingsChanged) Settings.saveSettings()
  Store.set({ [fieldName]: css })

  if (Settings.state.syncSaveStyles) saveStylesToSync()
}

export function upgradeCustomStyles(stored: Stored, newStorage: Stored): void {
  const legacyCSSVars = stored.cssVars ? convertVarsToCSS(stored.cssVars) : ''

  let sidebarCSS = ''
  if (stored.sidebarCSS) sidebarCSS = `/* OLD STYLES\n${stored.sidebarCSS}\n*/`
  if (legacyCSSVars) sidebarCSS = legacyCSSVars + '\n\n' + sidebarCSS

  let groupCSS = ''
  if (stored.groupCSS) groupCSS = `/* OLD STYLES\n${stored.groupCSS}\n*/`
  if (legacyCSSVars) groupCSS = legacyCSSVars + '\n\n' + groupCSS

  newStorage.sidebarCSS = sidebarCSS
  newStorage.groupCSS = groupCSS
}

export function convertVarsToCSS(vars: Record<string, string | null>): string {
  const cssVars: string[] = []
  for (const key of Object.keys(vars)) {
    const value = vars[key]
    if (!value) continue

    const varName = '--' + key.replace(Utils.UNDERSCORE_RE, '-')
    cssVars.push(`#root.root {${varName}: ${value};}`)
  }

  if (!cssVars.length) return ''
  return `/* OLD CSS VARS\n${cssVars.join('\n')}\n*/`
}

export async function loadCustomCSS(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>(['sidebarCSS', 'groupCSS'])
  if (stored.sidebarCSS) Styles.sidebarCSS = stored.sidebarCSS
  if (stored.groupCSS) Styles.groupCSS = stored.groupCSS
}

export async function saveStylesToSync(): Promise<void> {
  const value: Stored = {}

  if (Settings.state.sidebarCSS && Styles.sidebarCSS) value.sidebarCSS = Styles.sidebarCSS
  if (Settings.state.groupCSS && Styles.groupCSS) value.groupCSS = Styles.groupCSS

  await Store.sync('styles', value)
}

export function setupListeners(): void {
  if (Info.isSidebar) {
    Store.onKeyChange('sidebarCSS', css => {
      applyCustomCSS(css)
      Sidebar.recalcElementSizesDebounced()
    })
  }
}
