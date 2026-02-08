import { MenuOption } from 'src/types'
import { translate } from 'src/dict'
import * as History from 'src/services/history.fg'
import * as Selection from './selection.fg'
import * as Search from 'src/services/search.fg'
import * as Sidebar from 'src/services/sidebar.fg'

export const historyMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  open: () => {
    return {
      label: translate('menu.history.open'),
      icon: 'icon_reopen',
      onClick: () => {
        const firstId = Selection.getFirst()
        const list = History.filtered ?? History.visits
        const target = list.find(v => v.id === firstId)
        if (!target) return
        History.open(target, { panelId: Sidebar.getRecentTabsPanelId() }, false, true)
      },
    }
  },

  copyHistoryUrls: () => {
    const selected = Selection.ids()
    return {
      label: translate('menu.copy_urls', selected.length),
      icon: 'icon_link',
      badge: 'icon_copy_badge',
      onClick: () => History.copyUrls(selected),
    }
  },

  copyHistoryTitles: () => {
    const selected = Selection.ids()
    return {
      label: translate('menu.copy_titles', selected.length),
      icon: 'icon_title',
      badge: 'icon_copy_badge',
      onClick: () => History.copyTitles(selected),
    }
  },

  deleteVisits: () => {
    const selected = Selection.ids()

    return {
      label: translate('menu.history.delete_visits', selected.length),
      icon: 'icon_clock',
      badge: 'icon_close',
      keepSearching: true,
      onClick: () => History.deleteVisits(selected),
    }
  },

  deleteSites: () => {
    const selected = Selection.ids()

    return {
      label: translate('menu.history.delete_sites', selected.length),
      icon: 'icon_web',
      badge: 'icon_close',
      keepSearching: true,
      onClick: async () => {
        await History.deleteSites(selected)
        if (Search.active) Search.search()
      },
    }
  },
}
