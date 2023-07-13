import { MenuOption } from 'src/types'
import { translate } from 'src/dict'
import { History } from './history'
import { Selection } from './selection'
import { Search } from './search'

export const historyMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  open: () => {
    return {
      label: translate('menu.history.open'),
      icon: 'icon_reopen',
      onClick: () => {
        const firstId = Selection.getFirst()
        const list = History.reactive.filtered ?? History.reactive.list
        const target = list.find(item => item.id === firstId)
        if (!target) return
        History.openTab(target)
      },
    }
  },

  copyHistoryUrls: () => {
    const selected = Selection.get()
    return {
      label: translate('menu.copy_urls', selected.length),
      icon: 'icon_link',
      badge: 'icon_copy_badge',
      onClick: () => History.copyUrls(selected),
    }
  },

  copyHistoryTitles: () => {
    const selected = Selection.get()
    return {
      label: translate('menu.copy_titles', selected.length),
      icon: 'icon_title',
      badge: 'icon_copy_badge',
      onClick: () => History.copyTitles(selected),
    }
  },

  deleteVisits: () => {
    const selected = Selection.get()

    return {
      label: translate('menu.history.delete_visits', selected.length),
      icon: 'icon_clock',
      badge: 'icon_close',
      keepSearching: true,
      onClick: () => History.deleteVisits(selected),
    }
  },

  deleteSites: () => {
    const selected = Selection.get()

    return {
      label: translate('menu.history.delete_sites', selected.length),
      icon: 'icon_web',
      badge: 'icon_close',
      keepSearching: true,
      onClick: async () => {
        await History.deleteSites(selected)
        if (Search.rawValue) Search.search()
      },
    }
  },
}
