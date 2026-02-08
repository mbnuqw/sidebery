import { NOID } from 'src/defaults'
import * as Windows from 'src/services/windows.bg'
import * as Settings from 'src/services/settings'
import * as Logs from 'src/services/logs'

import * as Styles from 'src/services/styles'
export * from 'src/services/styles'

export interface WindowStyles {
  frameColorScheme: 'dark' | 'light'
  toolbarColorScheme: 'dark' | 'light'
  actElColorScheme: 'dark' | 'light'
  popupColorScheme: 'dark' | 'light'
  ffTheme: browser.theme.Theme | undefined
  parsedTheme: Styles.ParsedTheme | undefined
}
export const byWinId = new Map<ID, Readonly<WindowStyles>>()

const defaultColorScheme = Styles.getSystemColorScheme()

export async function load() {
  const updatingColorSchemes = []
  for (const [id] of Windows.byId) {
    updatingColorSchemes.push(updateWindowStyles(id).catch(() => {}))
  }
  await Promise.all(updatingColorSchemes)
}

export function setupListeners() {
  Styles._setupAutoColorSchemeListener(() => updateWindowStyles(NOID))

  browser.theme.onUpdated.addListener(upd => {
    updateWindowStyles(upd?.windowId === undefined ? NOID : upd.windowId, upd?.theme)
  })
}

const waitingForWinStyles = new Map<ID, ((s: WindowStyles) => void)[]>()
export async function updateWindowStyles(
  winId: ID,
  newTheme?: browser.theme.Theme
): Promise<WindowStyles> {
  if (waitingForWinStyles.has(winId)) {
    return new Promise(ok => waitingForWinStyles.get(winId)?.push(ok))
  } else {
    waitingForWinStyles.set(winId, [])
  }

  const newWinStyles: WindowStyles = {
    frameColorScheme: defaultColorScheme,
    toolbarColorScheme: defaultColorScheme,
    actElColorScheme: defaultColorScheme,
    popupColorScheme: defaultColorScheme,
    ffTheme: {},
    parsedTheme: undefined,
  }

  if (Settings.state.colorScheme === 'ff') {
    if (!newTheme) {
      newTheme = await browser.theme.getCurrent(winId !== NOID ? winId : undefined)
    }

    const result = Styles.parseFirefoxTheme(newTheme)

    if (!result.error) {
      newWinStyles.frameColorScheme = Styles.getColorSchemeName(result.frameVariant)
      newWinStyles.toolbarColorScheme = Styles.getColorSchemeName(result.toolbarVariant)
      newWinStyles.actElColorScheme = Styles.getColorSchemeName(result.actElVariant)
      newWinStyles.popupColorScheme = Styles.getColorSchemeName(result.popupVariant)
      newWinStyles.ffTheme = newTheme
      newWinStyles.parsedTheme = result
    } else {
      Styles.updColorScheme(newWinStyles)
    }
  }

  if (Settings.state.colorScheme === 'sys') Styles.updColorScheme(newWinStyles)
  else if (Settings.state.colorScheme === 'dark') Styles.updColorScheme(newWinStyles, 'dark')
  else if (Settings.state.colorScheme === 'light') Styles.updColorScheme(newWinStyles, 'light')

  // Update all windows
  if (winId === NOID) {
    for (const [id] of Windows.byId) {
      byWinId.set(id, newWinStyles)
    }
  }

  // Or the only one
  else {
    byWinId.set(winId, newWinStyles)
  }

  waitingForWinStyles.get(winId)?.forEach(fn => fn(newWinStyles))
  waitingForWinStyles.delete(winId)

  return newWinStyles
}
