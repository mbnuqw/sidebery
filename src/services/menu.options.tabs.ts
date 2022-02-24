import Utils from 'src/utils'
import { ASKID, CONTAINER_ID, NEWID } from 'src/defaults'
import { MenuOption, Window, Tab } from 'src/types'
import { translate } from 'src/dict'
import { Tabs } from 'src/services/tabs.fg'
import { Windows } from 'src/services/windows'
import { Selection } from 'src/services/selection'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Menu } from 'src/services/menu'
import { Containers } from 'src/services/containers'
import { ItemInfo } from 'src/types/tabs'
import { Logs } from './logs'

export const tabsMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  undoRmTab: () => ({
    label: translate('menu.tab.undo'),
    icon: 'icon_undo',
    onClick: () => Tabs.undoRmTab(),
  }),

  moveToNewWin: () => {
    return {
      label: translate(`menu.tab.move_to_new_${Windows.incognito ? 'priv_window' : 'window'}`),
      icon: Windows.incognito ? 'icon_move_to_new_priv_win' : 'icon_move_to_new_norm_win',
      onClick: () => {
        Tabs.move(Selection.getTabs(), {}, { windowId: NEWID, incognito: Windows.incognito })
      },
    }
  },

  moveToWin: () => {
    const option: MenuOption = {}
    const wins = Windows.otherWindows.filter(w => w.incognito === Windows.incognito)
    const winLen = wins.length
    if (winLen === 0) option.inactive = true
    if (winLen <= 1) {
      option.label = translate('menu.tab.move_to_another_window')
      if (Windows.incognito) option.icon = 'icon_move_to_priv_win'
      else option.icon = 'icon_move_to_norm_win'
      option.onClick = () => Tabs.move(Selection.getTabs(), {}, { windowId: wins[0].id })
    } else {
      option.label = translate('menu.tab.move_to_window_')
      if (Windows.incognito) option.icon = 'icon_move_to_priv_wins'
      else option.icon = 'icon_move_to_norm_wins'
      option.onClick = () => {
        const filter = (w: Window) => w.incognito === Windows.incognito
        const windowChooseConf = { title: option.label, otherWindows: true, filter }
        Tabs.move(Selection.getTabs(), {}, { windowChooseConf })
      }
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  moveToPanel: () => {
    const opts: MenuOption[] = []
    const probeTab = Tabs.byId[Selection.getFirst()]
    if (!probeTab) return

    for (const panel of Sidebar.reactive.panels) {
      if (!Utils.isTabsPanel(panel)) continue
      if (probeTab.panelId === panel.id) continue

      opts.push({
        label: translate('menu.tab.move_to_panel_') + panel.name,
        icon: panel.iconSVG,
        img: panel.iconIMG,
        badge: 'icon_move_badge',
        color: panel.color,
        onClick: () => {
          const items = Tabs.getTabsInfo(Selection.get())
          const src = { windowId: Windows.id, panelId: probeTab.panelId, pinned: probeTab.pinned }
          Tabs.move(items, src, { panelId: panel.id, index: panel.nextTabIndex })
        },
      })
    }

    if (opts.length) return opts
  },

  moveToNewPanel: () => {
    const option: MenuOption = {
      label: translate('menu.tab.move_to_new_panel'),
      icon: 'icon_add_tabs_panel',
      badge: 'icon_move_badge',
      onClick: () => Tabs.moveToNewPanel(Selection.get()),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  reopenInNewWin: () => {
    const label = Windows.incognito ? 'reopen_in_new_norm_window' : 'reopen_in_new_priv_window'
    return {
      label: translate('menu.tab.' + label),
      icon: Windows.incognito ? 'icon_reopen_in_new_norm_window' : 'icon_reopen_in_new_priv_win',
      onClick: () => {
        const items: ItemInfo[] = []
        for (const id of Selection.get()) {
          const tab = Tabs.byId[id]
          if (!tab) continue

          items.push({
            id: tab.id,
            url: tab.url,
            parentId: tab.parentId,
            panelId: tab.panelId,
            container: tab.cookieStoreId !== CONTAINER_ID ? tab.cookieStoreId : undefined,
          })
        }
        Tabs.reopen(items, { windowId: NEWID, incognito: !Windows.incognito })
      },
    }
  },

  reopenInWin: () => {
    const option: MenuOption = {}
    const wins = Windows.otherWindows.filter(w => w.incognito !== Windows.incognito)
    const winLen = wins.length
    let items: ItemInfo[]
    if (winLen === 0) option.inactive = true
    else {
      items = Selection.getTabs().map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        parentId: tab.parentId,
        panelId: tab.panelId,
        pinned: tab.pinned,
      }))
    }

    if (winLen <= 1) {
      if (Windows.incognito) {
        option.label = translate('menu.tab.reopen_in_norm_window')
        option.icon = 'icon_reopen_in_norm_win'
      } else {
        option.label = translate('menu.tab.reopen_in_priv_window')
        option.icon = 'icon_reopen_in_priv_win'
      }
      option.onClick = () => Tabs.reopen(items, { windowId: wins[0].id })
    } else {
      option.label = translate('menu.tab.reopen_in_window_')
      if (Windows.incognito) option.icon = 'icon_reopen_in_norm_wins'
      else option.icon = 'icon_reopen_in_priv_wins'
      option.onClick = () => {
        const filter = (w: Window) => w.incognito !== Windows.incognito
        Tabs.reopen(items, {
          windowId: ASKID,
          windowChooseConf: { title: option.label, otherWindows: true, filter },
        })
      }
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  reopenInCtr: () => {
    if (Windows.incognito) return
    const opts = []
    const firstTab = Tabs.byId[Selection.getFirst()]
    const ignoreRules = Menu.ctxMenuIgnoreContainersRules

    if (!firstTab) return

    if (firstTab.cookieStoreId !== CONTAINER_ID) {
      opts.push({
        label: translate('menu.tab.reopen_in_default_panel'),
        icon: 'icon_ff',
        badge: 'icon_reopen',
        onClick: () => {
          const items = Tabs.getTabsInfo(Selection.get())
          Tabs.reopen(items, { panelId: firstTab.panelId, containerId: CONTAINER_ID })
        },
      })
    }

    for (const c of Object.values(Containers.reactive.byId)) {
      if (firstTab.cookieStoreId === c.id) continue
      if (ignoreRules?.[c.id]) continue
      opts.push({
        label: translate('menu.tab.reopen_in_') + c.name,
        icon: c.icon,
        badge: 'icon_reopen',
        color: c.color,
        onClick: () => {
          const items = Tabs.getTabsInfo(Selection.get())
          Tabs.reopen(items, { panelId: firstTab.panelId, containerId: c.id })
        },
      })
    }

    return opts
  },

  reopenInNewCtr: () => {
    if (Windows.incognito) return

    const option: MenuOption = {
      label: translate('menu.tab.reopen_in_new_container'),
      icon: 'icon_new_container',
      badge: 'icon_reopen',
      onClick: () => Tabs.reopenTabsInNewContainer(Selection.get()),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  pin: () => {
    const selected = Selection.get()
    const firstTab = Tabs.byId[selected[0]]
    if (!firstTab) return
    return {
      label: translate('menu.tab.' + (firstTab.pinned ? 'unpin' : 'pin')),
      icon: 'icon_pin',
      onClick: firstTab.pinned ? () => Tabs.unpinTabs(selected) : () => Tabs.pinTabs(selected),
    }
  },

  reload: () => {
    return {
      label: translate('menu.tab.reload'),
      icon: 'icon_reload',
      onClick: () => Tabs.reloadTabs(Selection.get()),
    }
  },

  duplicate: () => {
    return {
      label: translate('menu.tab.duplicate'),
      icon: 'icon_duplicate',
      onClick: () => Tabs.duplicateTabs(Selection.get()),
    }
  },

  bookmark: () => {
    return {
      label: translate('menu.tab.bookmark'),
      icon: 'icon_star',
      onClick: () => Tabs.bookmarkTabs(Selection.get()),
    }
  },

  mute: () => {
    const selected = Selection.get()
    const firstTab = Tabs.byId[selected[0]]
    const isMuted = firstTab?.mutedInfo?.muted
    return {
      label: translate('menu.tab.' + (isMuted ? 'unmute' : 'mute')),
      icon: isMuted ? 'icon_loud' : 'icon_mute',
      onClick: isMuted ? () => Tabs.unmuteTabs(selected) : () => Tabs.muteTabs(selected),
    }
  },

  discard: () => {
    const option: MenuOption = {
      label: translate('menu.tab.discard'),
      icon: 'icon_discard',
      onClick: () => Tabs.discardTabs(Selection.get()),
    }
    const firstTab = Tabs.byId[Selection.getFirst()]
    if (Selection.getLength() === 1 && firstTab?.discarded) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  group: () => {
    const option: MenuOption = {
      label: translate('menu.tab.group'),
      icon: 'icon_group_tabs',
      onClick: () => Tabs.groupTabs(Selection.get()),
    }
    const firstTab = Tabs.byId[Selection.getFirst()]
    if (!Settings.reactive.tabsTree || firstTab?.pinned) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  flatten: () => {
    const option: MenuOption = {
      label: translate('menu.tab.flatten'),
      icon: 'icon_flatten',
      onClick: () => Tabs.flattenTabs(Selection.get()),
    }
    if (Selection.getLength() <= 1) option.inactive = true
    const firstTab = Tabs.byId[Selection.getFirst()]
    if (!firstTab) return
    if (Selection.get().every(t => firstTab.lvl === Tabs.byId[t]?.lvl)) {
      option.inactive = true
    }
    if (!Settings.reactive.tabsTree || firstTab.pinned) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  clearCookies: () => {
    return {
      label: translate('menu.tab.clear_cookies'),
      icon: 'icon_cookie',
      onClick: () => Tabs.clearTabsCookies(Selection.get()),
    }
  },

  close: () => {
    const option: MenuOption = {
      label: translate('menu.tab.close'),
      icon: 'icon_close',
      onClick: () => Tabs.removeTabs(Selection.get()),
    }
    const minCount = Settings.reactive.ctxMenuRenderInact ? 1 : 2
    const firstTab = Tabs.byId[Selection.getFirst()]
    if (!firstTab) return
    if (Selection.getLength() < minCount && !firstTab.pinned) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  closeDescendants: () => {
    const option: MenuOption = {
      label: translate('menu.tab.close_descendants'),
      icon: 'icon_rm_descendants',
      onClick: () => Tabs.removeTabsDescendants(Selection.get()),
    }
    const hasDescendants = Selection.get().some(tabId => {
      const tab = Tabs.byId[tabId]
      if (!tab) return false
      const nextTab = Tabs.list[tab.index + 1]
      return nextTab && nextTab.parentId === tab.id
    })
    if (!hasDescendants) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  closeTabsAbove: () => {
    const option: MenuOption = {
      label: translate('menu.tab.close_above'),
      icon: 'icon_close_tabs_above',
      onClick: () => Tabs.removeTabsAbove(Selection.get()),
    }

    const tabId = Selection.getFirst()
    const tab = Tabs.byId[tabId]
    if (!tab) return
    const prevTab = Tabs.list[tab.index - 1]
    if (!tab || tab.pinned) option.inactive = true
    if (!prevTab || prevTab.panelId !== tab.panelId || prevTab.pinned) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  closeTabsBelow: () => {
    const option: MenuOption = {
      label: translate('menu.tab.close_below'),
      icon: 'icon_close_tabs_below',
      onClick: () => Tabs.removeTabsBelow(Selection.get()),
    }

    const tabId = Selection.getFirst()
    const tab = Tabs.byId[tabId]
    if (!tab) return
    const nextTab = Tabs.list[tab.index + 1]
    if (!tab || tab.pinned) option.inactive = true
    if (!nextTab || nextTab.panelId !== tab.panelId) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  closeOtherTabs: () => {
    const option: MenuOption = {
      label: translate('menu.tab.close_other'),
      icon: 'icon_close_other_tabs',
      onClick: () => Tabs.removeOtherTabs(Selection.get()),
    }

    const tabId = Selection.getFirst()
    const tab = Tabs.byId[tabId]
    if (!tab || tab.pinned) option.inactive = true
    if (tab) {
      const panel = Sidebar.reactive.panelsById[tab.panelId]
      if (!panel || panel.len === 1) option.inactive = true
    }
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyTabsUrls: () => {
    const selected = Selection.get()
    return {
      label: translate('menu.copy_urls', selected.length),
      icon: 'icon_link',
      badge: 'icon_copy_badge',
      onClick: () => Tabs.copyUrls(selected),
    }
  },

  copyTabsTitles: () => {
    const selected = Selection.get()
    return {
      label: translate('menu.copy_titles', selected.length),
      icon: 'icon_title',
      badge: 'icon_copy_badge',
      onClick: () => Tabs.copyTitles(selected),
    }
  },

  // ---
  // -- Panel options
  // -

  muteAllAudibleTabs: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const tabIds = Tabs.list.filter(t => t.audible && t.panelId === panel.id).map(t => t.id)
    const option: MenuOption = {
      label: translate('menu.tabs_panel.mute_all_audible'),
      icon: 'icon_mute',
      onClick: () => Tabs.muteTabs(tabIds),
    }
    if (!tabIds.length) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  closeTabsDuplicates: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const tabs = panel.tabs ?? []
    const tabIds = tabs.map(t => t.id)
    const option: MenuOption = {
      label: translate('menu.tabs_panel.dedup'),
      icon: 'icon_dedup_tabs',
      onClick: () => Tabs.dedupTabs(tabIds),
    }
    if (!tabIds.length) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  reloadTabs: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const tabs = panel.tabs ?? []
    const tabIds = tabs.map(t => t.id)
    const option: MenuOption = {
      label: translate('menu.tabs_panel.reload'),
      icon: 'icon_reload',
      onClick: () => Tabs.reloadTabs(tabIds),
    }
    if (!tabIds.length) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  discardTabs: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const tabIds: ID[] = []
    panel.pinnedTabs.forEach(t => tabIds.push(t.id))
    panel.tabs.forEach(t => tabIds.push(t.id))
    const option: MenuOption = {
      label: translate('menu.tabs_panel.discard'),
      icon: 'icon_discard',
      onClick: () => Tabs.discardTabs(tabIds),
    }
    if (!tabIds.length) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  closeTabs: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const tabs = panel.tabs ?? []
    const tabIds = tabs.map(t => t.id)
    const option: MenuOption = {
      label: translate('menu.tabs_panel.close'),
      icon: 'icon_close',
      onClick: () => Tabs.removeTabs(tabIds),
    }
    if (!tabIds.length) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  collapseInactiveBranches: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return
    if (!Settings.reactive.tabsTree) return

    const panelTabs = panel.tabs ?? []
    const option: MenuOption = {
      label: translate('menu.tabs_panel.collapse_inact_branches'),
      icon: 'icon_collapse_all',
      onClick: () => {
        const tabs = panelTabs.map(rt => Tabs.byId[rt.id] as Tab)
        Tabs.foldAllInactiveBranches(tabs)
      },
    }
    if (panelTabs.length < 3) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  bookmarkTabsPanel: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const option: MenuOption = {
      label: translate('menu.tabs_panel.bookmark'),
      icon: 'icon_star',
      badge: 'icon_move_badge',
      onClick: () => Sidebar.bookmarkTabsPanel(panel.id),
      onAltClick: () => Sidebar.bookmarkTabsPanel(panel.id, true),
    }

    return option
  },

  restoreFromBookmarks: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const option: MenuOption = {
      label: translate('menu.tabs_panel.restore_from_bookmarks'),
      icon: 'icon_star',
      badge: 'icon_move_out_badge',
      onClick: () => Sidebar.restoreFromBookmarks(panel),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  convertToBookmarksPanel: () => {
    const panel = Sidebar.reactive.panelsById[Selection.getFirst()]
    if (!Utils.isTabsPanel(panel)) return

    const option: MenuOption = {
      label: translate('menu.tabs_panel.convert_to_bookmarks_panel'),
      icon: 'icon_star',
      badge: 'icon_reopen',
      onClick: () => Sidebar.convertToBookmarksPanel(panel),
    }

    return option
  },
}
