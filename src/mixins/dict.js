/*global browser:true*/
import En from '../../addon/_locales/en/messages.json'
import EnButtons from '../locales/en.buttons'
import EnDashboards from '../locales/en.dashboards'
import EnBookmarksEditor from '../locales/en.bookmarks-editor'
import EnNav from '../locales/en.nav'
import EnMenu from '../locales/en.menu'
import EnSettings from '../locales/en.settings'
import EnStyles from '../locales/en.styles'
import Ru from '../../addon/_locales/ru/messages.json'
import RuButtons from '../locales/ru.buttons'
import RuDashboards from '../locales/ru.dashboards'
import RuBookmarksEditor from '../locales/ru.bookmarks-editor'
import RuNav from '../locales/ru.nav'
import RuMenu from '../locales/ru.menu'
import RuSettings from '../locales/ru.settings'
import RuStyles from '../locales/ru.styles'

export const Locales = {
  en: {
    ...En,
    ...EnButtons,
    ...EnDashboards,
    ...EnBookmarksEditor,
    ...EnNav,
    ...EnMenu,
    ...EnSettings,
    ...EnStyles,
  },
  ru: {
    ...Ru,
    ...RuButtons,
    ...RuDashboards,
    ...RuBookmarksEditor,
    ...RuNav,
    ...RuMenu,
    ...RuSettings,
    ...RuStyles,
  },
}

let LANG = browser.i18n.getUILanguage().slice(0, 2)
if (!Locales[LANG]) LANG = 'en'

/**
 *  Get dict value
 **/
export function translate(id, group) {
  if (!id) return ''
  if (group) id = `${group}.${id}`
  if (!Locales[LANG][id] || Locales[LANG][id].message === undefined) return id
  return Locales[LANG][id].message
}

/**
 * Get right plural translation
 */
export function plurTrans(id, val) {
  if (!id) return ''
  if (!Locales[LANG][id] || Locales[LANG][id].message === undefined) return id
  const forms = Locales[LANG][id].message.split('|')
  if (forms.length === 1) return Locales[LANG][id].message
  const ranges = Locales[LANG][id].description.split('|').map(range => {
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
    t: translate,
    pt: plurTrans,
  },
}
