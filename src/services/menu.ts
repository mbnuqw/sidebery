import { MenuConf } from 'src/types'
import * as MenuActions from 'src/services/menu.actions'

export const Menu = {
  isOpen: false,
  tabsConf: [] as MenuConf,
  bookmarksConf: [] as MenuConf,
  tabsPanelConf: [] as MenuConf,
  bookmarksPanelConf: [] as MenuConf,
  ctxMenuIgnoreContainersRules: {} as Record<string, boolean>,

  ...MenuActions,
}
