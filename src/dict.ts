const LANG_REG = browser.i18n.getUILanguage().replace('-', '_')
export const LANG = LANG_REG.slice(0, 2)

// Set dictionary
const dict: Record<string, TranslationFn | string> = {}
if (window.translations) {
  for (const key of Object.keys(window.translations)) {
    const prop = window.translations[key]
    dict[key] = prop[LANG_REG] ?? prop[LANG] ?? prop.en
  }
}

function isString(r: string | TranslationFn): r is string {
  if (r.constructor === String) return true
  else return false
}

export function translate(id?: string, ...args: (number | string | undefined)[]): string {
  if (!id) return ''

  const record = dict[id]
  if (record === undefined) return id

  if (isString(record)) return record
  else return record(...args)
}
