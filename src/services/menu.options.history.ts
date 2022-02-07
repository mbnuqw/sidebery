import { MenuOption } from 'src/types'
import { translate } from 'src/dict'
import { History } from './history'
import { Selection } from './selection'

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
}
