import Utils from 'src/utils'
import { MenuOption } from 'src/types'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Selection } from 'src/services/selection'
import { SetupPage } from 'src/services/setup-page'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Containers } from 'src/services/containers'
import { tabsMenuOptions } from './menu.options.tabs'
import { bookmarksMenuOptions } from './menu.options.bookmarks'
import { trashMenuOptions } from './menu.options.trash'
import { historyMenuOptions } from './menu.options.history'
import { downloadsMenuOptions } from './menu.options.downloads'

export const menuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  ...tabsMenuOptions,
  ...bookmarksMenuOptions,
  ...trashMenuOptions,
  ...historyMenuOptions,
  ...downloadsMenuOptions,

  // ---
  // -- Common panels
  // -

  openPanelConfig: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!panel) return

    const fastConf = Utils.isTabsPanel(panel) || Utils.isBookmarksPanel(panel)
    const option: MenuOption = {
      label: translate('menu.common.conf'),
      icon: 'icon_panel_config',
      onClick: () => SetupPage.open(`settings_nav.${panel.id}`),
      onAltClick: () => {
        if (fastConf) Sidebar.startFastEditingOfPanel(panel.id, false)
        else SetupPage.open(`settings_nav.${panel.id}`)
      },
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  unloadPanelType: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!panel) return

    const option: MenuOption = {
      label: translate('menu.panels.unload'),
      icon: 'icon_discard',
      onClick: () => Sidebar.unloadPanelType(panel.type),
    }

    if (!panel.ready) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  removePanel: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!panel) return

    const option: MenuOption = {
      label: translate('menu.tabs_panel.remove_panel'),
      icon: 'icon_close',
      onClick: () => Sidebar.removePanel(panel.id),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  // ---
  // -- New tab button
  // -

  newTabNoContainer: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!panel) return

    return {
      label: translate('menu.new_tab_bar.no_container'),
      icon: 'icon_plus',
      onClick: () => Tabs.createTabInPanel(panel),
    }
  },

  newTabContainers: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!panel) return

    const opts = []
    const ignoreRules = Menu.ctxMenuIgnoreContainersRules

    for (const c of Object.values(Containers.reactive.byId)) {
      if (ignoreRules?.[c.id]) continue
      opts.push({
        label: c.name,
        icon: c.icon,
        badge: 'icon_reopen',
        color: c.color,
        onClick: () => Tabs.createTabInPanel(panel, { cookieStoreId: c.id }),
      })
    }

    return opts
  },

  manageContainers: () => {
    return {
      label: translate('menu.new_tab_bar.manage_containers'),
      icon: 'icon_settings',
      onClick: () => SetupPage.open('settings_containers'),
    }
  },
}
