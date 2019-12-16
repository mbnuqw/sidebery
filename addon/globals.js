import Utils from './utils.js'

import EnButtons from './locales/en.buttons.js'
import EnDashboards from './locales/en.dashboards.js'
import EnBookmarksEditor from './locales/en.bookmarks-editor.js'
import EnNav from './locales/en.nav.js'
import EnMenu from './locales/en.menu.js'
import EnSettings from './locales/en.settings.js'
import EnStyles from './locales/en.styles.js'
import EnSnapshots from './locales/en.snapshots.js'
import EnConfirm from './locales/en.confirm.js'
import EnNotifications from './locales/en.notifications.js'
import RuButtons from './locales/ru.buttons.js'
import RuDashboards from './locales/ru.dashboards.js'
import RuBookmarksEditor from './locales/ru.bookmarks-editor.js'
import RuNav from './locales/ru.nav.js'
import RuMenu from './locales/ru.menu.js'
import RuSettings from './locales/ru.settings.js'
import RuStyles from './locales/ru.styles.js'
import RuSnapshots from './locales/ru.snapshots.js'
import RuConfirm from './locales/ru.confirm.js'
import RuNotifications from './locales/ru.notifications.js'

window.Utils = Utils

window.locales = {
  en: {
    ...EnButtons,
    ...EnDashboards,
    ...EnBookmarksEditor,
    ...EnNav,
    ...EnMenu,
    ...EnSettings,
    ...EnStyles,
    ...EnSnapshots,
    ...EnConfirm,
    ...EnNotifications,
  },
  ru: {
    ...RuButtons,
    ...RuDashboards,
    ...RuBookmarksEditor,
    ...RuNav,
    ...RuMenu,
    ...RuSettings,
    ...RuStyles,
    ...RuSnapshots,
    ...RuConfirm,
    ...RuNotifications,
  },
}
