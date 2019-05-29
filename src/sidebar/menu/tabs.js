import State from '../store/state'
import { Translate } from '../../mixins/dict'

export default {
  undoRmTab: () => ({ label: Translate('menu.tab.undo'), icon: 'icon_undo', action: 'undoRmTab' }),

  moveToNewWin: () => ({
    label: Translate('menu.tab.move_to_new_window'),
    icon: 'icon_new_win',
    action: 'moveTabsToNewWin',
    args: { tabIds: [...State.selected] },
  }),

  moveToNewPrivWin: () => ({
    label: Translate('menu.tab.move_to_new_priv_window'),
    icon: 'icon_private',
    action: 'moveTabsToNewWin',
    args: { tabIds: [...State.selected], incognito: true },
  }),

  moveToAnotherWin: () => {
    if (State.otherWindows.length !== 1) return
    return {
      label: Translate('menu.tab.move_to_another_window'),
      icon: 'icon_window',
      action: 'moveTabsToWin',
      args: { tabIds: [...State.selected], window: State.otherWindows[0] },
    }
  },

  moveToWin: () => {
    if (State.otherWindows.length <= 1) return
    return {
      label: Translate('menu.tab.move_to_window_'),
      icon: 'icon_windows',
      action: 'moveTabsToWin',
      args: { tabIds: [...State.selected] },
    }
  },

  moveToCtr: node => {
    if (State.private) return
    const opts = []

    if (node.cookieStoreId !== 'firefox-default') {
      opts.push({
        label: Translate('menu.tab.reopen_in_default_panel'),
        icon: 'icon_tabs',
        action: 'moveTabsToCtx',
        args: { tabIds: [...State.selected], ctxId: 'firefox-default' },
      })
    }

    for (let c of State.containers) {
      if (node.cookieStoreId === c.cookieStoreId) continue
      opts.push({
        label: Translate('menu.tab.reopen_in_') + `||${c.colorCode}>>${c.name}`,
        icon: c.icon,
        color: c.colorCode,
        action: 'moveTabsToCtx',
        args: { tabIds: [...State.selected], ctxId: c.cookieStoreId },
      })
    }

    return opts
  },

  pin: node => {
    const wut = node.pinned ? 'unpin' : 'pin'
    return {
      label: Translate('menu.tab.' + wut),
      icon: 'icon_pin',
      action: wut + 'Tabs',
      args: [...State.selected],
    }
  },

  reload: () => {
    return {
      label: Translate('menu.tab.reload'),
      icon: 'icon_reload',
      action: 'reloadTabs',
      args: [...State.selected],
    }
  },

  bookmark: () => {
    return {
      label: Translate('menu.tab.bookmark'),
      icon: 'icon_star',
      action: 'bookmarkTabs',
      args: [...State.selected],
    }
  },

  mute: node => {
    const wut = node.mutedInfo.muted ? 'unmute' : 'mute'
    return {
      label: Translate('menu.tab.' + wut),
      icon: node.mutedInfo.muted ? 'icon_loud' : 'icon_mute',
      action: wut + 'Tabs',
      args: [...State.selected],
    }
  },

  discard: node => {
    if (State.selected.length === 1) {
      if (node.active || node.discarded) return
    }
    return {
      label: Translate('menu.tab.discard'),
      icon: 'icon_discard',
      action: 'discardTabs',
      args: [...State.selected],
    }
  },

  group: node => {
    if (!State.tabsTree || node.pinned) return
    return {
      label: Translate('menu.tab.group'),
      icon: 'icon_group_tabs',
      action: 'groupTabs',
      args: [State, State.selected],
    }
  },

  flatten: node => {
    if (State.selected.length <= 1) return
    if (State.selected.every(t => node.lvl === State.tabsMap[t].lvl)) return
    if (!State.tabsTree || node.pinned) return
    return {
      label: Translate('menu.tab.flatten'),
      icon: 'icon_flatten',
      action: 'flattenTabs',
      args: [...State.selected],
    }
  },

  clearCookies: () => {
    return {
      label: Translate('menu.tab.clear_cookies'),
      icon: 'icon_cookie',
      action: 'clearTabsCookies',
      args: [...State.selected],
    }
  },

  close: () => {
    if (State.selected.length <= 1) return
    return {
      label: Translate('menu.tab.close'),
      icon: 'icon_close',
      action: 'removeTabs',
      args: [...State.selected],
    }
  },
}
