/*global browser:true*/
import En from '../../addon/_locales/en/messages.json'
import Ru from '../../addon/_locales/ru/messages.json'

export const Locales = {
  en: En,
  ru: Ru,
}

let LANG = browser.i18n.getUILanguage().slice(0, 2)
if (!Locales[LANG]) LANG = 'en'

/**
 *  Get dict value
 **/
export function Translate(id, group) {
  if (!id) return ''
  if (group) id = `${group}.${id}`
  if (!Locales[LANG][id] || Locales[LANG][id].message === undefined) return id
  return Locales[LANG][id].message
}

/**
 * Get right plural translation
 */
export function PlurTrans(id, val) {
  if (!id) return ''
  if (!Locales[LANG][id] || Locales[LANG][id].message === undefined) return id
  const forms = Locales[LANG][id].message.split('|')
  const ranges = Locales[LANG][id].description.split('|')
    .map(range => {
      if (!range) return null
      return range.split(',').map(v => {
        const num = parseInt(v)
        if (isNaN(num)) return 0
        return num
      })
    })
  const i = ranges.findIndex(r => {
    if (r) return r.includes(val)
    else return true
  })
  return forms[i]
}

export default {
  methods: {
    t: Translate,
    pt: PlurTrans,
  },
}
