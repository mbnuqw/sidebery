import { MenuOption } from 'src/types'
import { translate } from 'src/dict'
import { Selection } from './selection'
import { Trash } from './trash'
import { RemovedItem } from 'src/types/trash'
import { Settings } from './settings'
import { Bookmarks } from './bookmarks'
import { BKM_OTHER_ID } from 'src/defaults'

export const trashMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  restoreTrashItem: () => {
    const options: MenuOption[] = []
    const id = Selection.getFirst()
    let target: RemovedItem | undefined = Trash.reactive.tabs.find(item => item.id === id)
    if (!target) target = Trash.reactive.bookmarks.find(item => item.id === id)
    if (!target) target = Trash.reactive.windows.find(item => item.id === id)
    if (!target) target = Trash.reactive.prevCache.find(item => item.id === id)

    if (Trash.isRemovedTab(target)) {
      options.push({
        label: translate('trash.open_tab'),
        icon: 'icon_plus',
        onClick: () => {
          if (Trash.isRemovedTab(target)) Trash.openTab(target)
        },
      })
      options.push({
        label: translate('trash.create_bookmark'),
        icon: 'icon_plus',
        onClick: async () => {
          if (!Trash.isRemovedTab(target)) return
          const result = await Bookmarks.openBookmarksPopup({
            title: translate('popup.bookmarks.create_bookmarks'),
            location: BKM_OTHER_ID,
            locationField: true,
            locationTree: true,
            controls: [{ label: 'btn.create' }],
          })
          if (!result) return

          const parentId = result.location ?? BKM_OTHER_ID
          await browser.bookmarks.create({
            parentId,
            type: 'bookmark',
            title: target.title,
            url: target.url,
          })
        },
      })
    }
    if (Trash.isRemovedBookmark(target)) {
      options.push({
        label: translate('trash.recreate_bookmark'),
        icon: 'icon_plus',
        onClick: () => {
          if (Trash.isRemovedBookmark(target)) Trash.createBookmark(target)
        },
      })
      options.push({
        label: target.subItems ? translate('trash.open_tabs') : translate('trash.open_tab'),
        icon: 'icon_plus',
        onClick: () => {
          if (Trash.isRemovedBookmark(target)) Trash.openTabsFromBookmark(target)
        },
      })
    }
    if (Trash.isRemovedWindow(target)) {
      options.push({
        label: translate('trash.open_window'),
        icon: 'icon_plus',
        onClick: () => {
          if (Trash.isRemovedWindow(target)) Trash.openWindow(target)
        },
      })
    }

    return options
  },

  removeTrashItem: () => {
    const id = Selection.getFirst()
    let target: RemovedItem | undefined = Trash.reactive.tabs.find(item => item.id === id)
    let isCache = false
    if (!target) target = Trash.reactive.bookmarks.find(item => item.id === id)
    if (!target) target = Trash.reactive.windows.find(item => item.id === id)
    if (!target) {
      target = Trash.reactive.prevCache.find(item => item.id === id)
      isCache = true
    }

    const option: MenuOption = {
      label: translate('trash.remove_from_trash'),
      icon: 'icon_x',
      onClick: () => Trash.removeItem(target),
    }

    if (isCache) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },
}
