import * as Utils from 'src/utils'
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
import { historyMenuOptions } from './menu.options.history'
import { CONTAINER_ID } from 'src/defaults'
import * as Popups from 'src/services/popups'

export const menuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  ...tabsMenuOptions,
  ...bookmarksMenuOptions,
  ...historyMenuOptions,

  // ---
  // -- Common panels
  // -

  openPanelConfig: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel) return

    const inSidebar = Utils.isTabsPanel(panel) || Utils.isBookmarksPanel(panel)
    const option: MenuOption = {
      label: translate('menu.common.conf'),
      tooltip: translate('menu.common.conf_tooltip'),
      icon: 'icon_panel_config',
      onClick: () => SetupPage.open(`settings_nav.${panel.id}`),
      onAltClick: () => {
        if (inSidebar) Popups.openPanelPopup({ id: panel.id })
        else SetupPage.open(`settings_nav.${panel.id}`)
      },
    }
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  unloadPanelType: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel) return

    const option: MenuOption = {
      label: translate('menu.panels.unload'),
      icon: 'icon_discard',
      onClick: () => Sidebar.unloadPanelType(panel.type),
    }

    if (!panel.ready) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  hidePanel: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel) return

    const option: MenuOption = {
      label: translate('menu.panels.hide_panel'),
      icon: 'icon_hide',
      onClick: () => Sidebar.hidePanel(panel.id),
    }

    if (panel.hidden) option.inactive = true
    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  removePanel: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel) return

    const option: MenuOption = {
      label: translate('menu.tabs_panel.remove_panel'),
      icon: 'icon_close',
      onClick: () => Sidebar.removePanel(panel.id),
    }

    if (!Settings.state.ctxMenuRenderInact && option.inactive) return
    return option
  },

  // ---
  // -- New tab button
  // -

  newTabNoContainer: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel) return

    return {
      label: translate('menu.new_tab_bar.no_container'),
      icon: 'icon_plus',
      onClick: () => Tabs.createTabInPanel(panel, { cookieStoreId: CONTAINER_ID }),
      onAltClick: () => {
        if (Settings.state.newTabMiddleClickAction === 'new_child') {
          const actTab = Tabs.byId[Tabs.activeId]
          if (actTab && !actTab.pinned && actTab.panelId === panel.id) {
            Tabs.createChildTab(actTab.id)
          } else {
            Tabs.createTabInPanel(panel)
          }
        } else if (Settings.state.newTabMiddleClickAction === 'reopen') {
          const dst = { containerId: CONTAINER_ID, panelId: panel.id }
          Tabs.reopen(Tabs.getTabsInfo([Tabs.activeId]), dst)
        }
      },
    }
  },

  newTabContainers: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const opts: MenuOption[] = []
    const ignoreRules = Menu.ctxMenuIgnoreContainersRules

    for (const c of Containers.sortContainers(Object.values(Containers.reactive.byId))) {
      if (ignoreRules?.[c.id]) continue
      opts.push({
        label: c.name,
        icon: c.icon,
        color: c.color,
        flag: {
          active: panel.newTabBtns.includes(c.name),
          icon: '#icon_pin',
          onClick: opt => {
            const index = panel.newTabBtns.indexOf(c.name)
            if (index !== -1) {
              panel.newTabBtns.splice(index, 1)
              if (opt.flag?.active) opt.flag.active = false
            } else {
              panel.newTabBtns.push(c.name)
              if (opt.flag) opt.flag.active = true
            }
            panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
            Sidebar.saveSidebar(500)
          },
        },
        onClick: () => Tabs.createTabInPanel(panel, { cookieStoreId: c.id }),
        onAltClick: () => {
          if (Settings.state.newTabMiddleClickAction === 'new_child') {
            const actTab = Tabs.byId[Tabs.activeId]
            if (actTab && !actTab.pinned && actTab.panelId === panel.id) {
              Tabs.createChildTab(actTab.id, undefined, c.id)
            } else {
              Tabs.createTabInPanel(panel, { cookieStoreId: c.id })
            }
          } else if (Settings.state.newTabMiddleClickAction === 'reopen') {
            const dst = { containerId: c.id, panelId: panel.id }
            Tabs.reopen(Tabs.getTabsInfo([Tabs.activeId]), dst)
          }
        },
      })
    }

    return opts
  },

  newTabNewContainer: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]
    if (!panel) return

    return {
      label: translate('menu.new_tab_bar.new_container'),
      icon: 'icon_new_container',
      onClick: () => Tabs.createTabInNewContainer(),
    }
  },

  manageShortcuts: () => {
    const panel = Sidebar.panelsById[Selection.getFirst()]

    return {
      label: translate('menu.new_tab_bar.manage_shortcuts'),
      icon: 'icon_pin',
      onClick: () => Popups.openNewTabShortcutsPopup(panel),
    }
  },

  manageContainers: () => {
    return {
      label: translate('menu.new_tab_bar.manage_containers'),
      icon: 'icon_settings',
      onClick: () => SetupPage.open('settings_containers'),
    }
  },
}
