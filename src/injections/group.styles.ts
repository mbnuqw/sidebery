import { ParsedTheme, SrcVars } from 'src/services/styles'
import { Stored } from 'src/types'
import { toCSSVarName } from 'src/utils'

export function applyThemeSrcVars(parsed: ParsedTheme, rootEl?: HTMLElement): void {
  if (!rootEl) rootEl = document.getElementById('root') ?? undefined
  if (!rootEl) return

  for (const prop of Object.keys(parsed.vars) as (keyof SrcVars)[]) {
    const value = parsed.vars[prop]

    if (value) {
      rootEl.style.setProperty(toCSSVarName('s_' + prop), value)
    } else {
      rootEl.style.removeProperty(toCSSVarName('s_' + prop))
    }
  }
}

export async function loadCustomGroupCSS(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('groupCSS')
  applyCustomCSS(stored.groupCSS)
}

/**
 * Update custom css
 */
export function applyCustomCSS(css?: string | null): void {
  if (css === null || css === undefined) return

  // Find or create new style element
  let customStyleEl = document.getElementById('custom_css') as HTMLLinkElement
  if (!customStyleEl) {
    customStyleEl = document.createElement('style') as HTMLLinkElement
    customStyleEl.id = 'custom_css'
    customStyleEl.type = 'text/css'
    customStyleEl.rel = 'stylesheet'
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
