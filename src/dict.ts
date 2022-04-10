const LANG_REG = browser.i18n.getUILanguage().replace('-', '_')
export const LANG = LANG_REG.slice(0, 2)

// Set dictionary
const dict: Record<string, PlurFn | string> = {}
for (const key of Object.keys(window.translations)) {
  const prop = window.translations[key]
  dict[key] = prop[LANG_REG] ?? prop[LANG] ?? prop.en
}

function isString(r: string | PlurFn): r is string {
  if (r.constructor === String) return true
  else return false
}

export function translate(id?: string, plurNum?: number | string): string {
  if (!id) return ''

  const record = dict[id]
  if (record === undefined) return id

  if (isString(record)) return record
  else return record(plurNum)
}
