import { Stored } from 'src/types'
import { toCSSVarName } from 'src/utils'

export function initTheme(theme: string): void {
  const themeLinkEl = document.getElementById('theme_link') as HTMLLinkElement

  // Create next theme link
  const nextThemeLinkEl = document.createElement('link')
  nextThemeLinkEl.type = 'text/css'
  nextThemeLinkEl.rel = 'stylesheet'
  document.head.appendChild(nextThemeLinkEl)

  // Wait until new theme loaded
  nextThemeLinkEl.onload = () => {
    // Remove prev theme link
    if (themeLinkEl) themeLinkEl.remove()
    nextThemeLinkEl.id = 'theme_link'
  }
  nextThemeLinkEl.href = `/themes/${theme}/group.css`
}

export function applyFirefoxThemeColors(theme: browser.theme.Theme): void {
  const rootEl = document.getElementById('root')
  if (!rootEl || !theme.colors) return

  for (const prop of Object.keys(theme.colors) as (keyof browser.theme.ThemeColors)[]) {
    const value = theme.colors[prop]

    if (value) {
      rootEl.style.setProperty(toCSSVarName('ff_' + prop), value)
    } else {
      rootEl.style.removeProperty(toCSSVarName('ff_' + prop))
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
