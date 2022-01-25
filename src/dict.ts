import { PlurFn } from 'src/types'
import en from 'src/_locales/en'
import ru from 'src/_locales/ru'

export const LANG = browser.i18n.getUILanguage().slice(0, 2)

// Set dict
let dict: Record<string, PlurFn | string> = en
if (LANG === 'ru') dict = ru

function isString(r: string | PlurFn): r is string {
  if (r.constructor === String) return true
  else return false
}

export function translate(id?: string, plurNum?: number | string): string {
  if (!id) return ''

  const record = dict[id]
  if (!record) return id

  if (isString(record)) return record
  else return record(plurNum)
}
