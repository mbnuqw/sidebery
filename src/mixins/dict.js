import En from '../../addon/_locales/en/messages.json'
import EnButtons from '../locales/en.buttons'
import EnDashboards from '../locales/en.dashboards'
import EnBookmarksEditor from '../locales/en.bookmarks-editor'
import EnNav from '../locales/en.nav'
import EnMenu from '../locales/en.menu'
import EnSettings from '../locales/en.settings'
import EnStyles from '../locales/en.styles'
import EnSnapshots from '../locales/en.snapshots'
import EnNotifications from '../locales/en.notifications'
import Ru from '../../addon/_locales/ru/messages.json'
import RuButtons from '../locales/ru.buttons'
import RuDashboards from '../locales/ru.dashboards'
import RuBookmarksEditor from '../locales/ru.bookmarks-editor'
import RuNav from '../locales/ru.nav'
import RuMenu from '../locales/ru.menu'
import RuSettings from '../locales/ru.settings'
import RuStyles from '../locales/ru.styles'
import RuSnapshots from '../locales/ru.snapshots'

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
    ...EnSnapshots,
    ...EnNotifications,
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
    ...RuSnapshots,
  },
}

let LANG = browser.i18n.getUILanguage().slice(0, 2)
if (!Locales[LANG]) LANG = 'en'

/**
 *  Get dict value
 **/
export function translate(id, plurNum) {
  if (!id) return ''
  if (!Locales[LANG][id] || Locales[LANG][id].message === undefined) return id

  if (Locales[LANG][id].message.constructor === String) return Locales[LANG][id].message
  if (Locales[LANG][id].message.constructor === Array) {
    let i, record = Locales[LANG][id]

    for (i = 0; i < record.plur.length; i++) {
      let range = record.plur[i]
      if (range === plurNum) return record.message[i]

      if (range.constructor === Array && range[0] <= plurNum && range[1] >= plurNum) {
        return record.message[i]
      }
      if (range.constructor === RegExp && range.test(plurNum)) {
        return record.message[i]
      }
    }
    return record.message[i]
  }
  return id
}

export default {
  methods: { t: translate },
}
