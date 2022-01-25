import { MenuOption } from 'src/types'
import { Downloads } from './downloads'
import { translate } from 'src/dict'
import { Selection } from './selection'
import { Settings } from './settings'
import { Sidebar } from './sidebar'
import Utils from 'src/utils'

export const downloadsMenuOptions: Record<string, () => MenuOption | MenuOption[] | undefined> = {
  openFile: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.open_file'),
      icon: 'icon_local_file',
      onClick: () => browser.downloads.open(item.id),
    }

    if (item.id === -1) option.inactive = true
    if (item.paused || item.state === 'in_progress') option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openRef: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.open_page'),
      icon: 'icon_web',
      onClick: () => Downloads.openRef(item),
    }

    if (!item.referrer) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  openDir: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.open_dir'),
      icon: 'icon_folder',
      onClick: () => browser.downloads.show(item.id),
    }

    if (item.id === -1) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyFullPath: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.copy_full_path'),
      icon: 'icon_path_copy',
      onClick: () => Downloads.copyFullPath(item),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyRef: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.copy_ref'),
      icon: 'icon_web_copy',
      onClick: () => Downloads.copyRef(item),
    }

    if (!item.referrer) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  copyUrl: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.copy_url'),
      icon: 'icon_download_copy',
      onClick: () => Downloads.copyURL(item),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  deleteDownload: () => {
    const itemId = Selection.getFirst()
    const item = Downloads.reactive.byId[itemId]
    const option: MenuOption = {
      label: translate('menu.download.remove'),
      icon: 'icon_close',
      onClick: () => Downloads.remove(item),
    }

    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },

  // ---
  // -- Panel options
  // -

  pauseResumeAll: () => {
    const panel = Sidebar.reactive.panelsById.downloads
    const panelIsReady = Utils.isDownloadsPanel(panel) && panel.ready
    const active: ID[] = []
    const paused: ID[] = []

    if (panelIsReady) {
      for (const item of Downloads.reactive.list) {
        if (item.id === -1) break
        if (item.paused) paused.push(item.id)
        if (item.state === 'in_progress' && !item.paused) active.push(item.id)
      }
    }

    const pause = active.length > 0
    const label = pause ? 'menu.download.pause_all_active' : 'menu.download.resume_all_paused'
    const icon = pause ? 'icon_pause' : 'icon_play'
    const fn = pause ? Downloads.pauseAllActive : Downloads.resumeAllPaused
    const option: MenuOption = { label: translate(label), icon, onClick: () => fn() }

    if (!panelIsReady || (!paused.length && !active.length)) option.inactive = true
    if (!Settings.reactive.ctxMenuRenderInact && option.inactive) return
    return option
  },
}
