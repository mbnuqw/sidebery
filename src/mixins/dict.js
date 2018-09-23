/*global browser:true*/
import En from '../../addon/_locales/en/messages.json'
import Ru from '../../addon/_locales/ru/messages.json'

const Locales = {
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

export default {
  methods: {
    t: Translate,
  },
}
