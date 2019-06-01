import State from '../store/state'
import { translate } from '../../mixins/dict'

export const DEFAULT_TABS_MENU = [
  ['undoRmTab', 'mute', 'reload', 'bookmark'],
  'moveToNewWin',
  'moveToNewPrivWin',
  'moveToAnotherWin',
  'moveToWin',
  'moveToCtr',
  'pin',
  'discard',
  'group',
  'flatten',
  'clearCookies',
  'close',
]

export default {
  undoRmTab: () => ({ label: translate('menu.tab.undo'), icon: 'icon_undo', action: 'undoRmTab' }),

  moveToNewWin: () => ({
    label: translate('menu.tab.move_to_new_window'),
    icon: 'icon_new_win',
    action: 'moveTabsToNewWin',
    args: [State.selected],
  }),

  moveToNewPrivWin: () => ({
    label: translate('menu.tab.move_to_new_priv_window'),
    icon: 'icon_private',
    action: 'moveTabsToNewWin',
    args: [State.selected, true],
  }),

  moveToAnotherWin: () => {
    if (State.otherWindows.length !== 1) return
    return {
      label: translate('menu.tab.move_to_another_window'),
      icon: 'icon_window',
      action: 'moveTabsToWin',
      args: [State.selected, State.otherWindows[0]],
    }
  },

  moveToWin: () => {
    if (State.otherWindows.length <= 1) return
    return {
      label: translate('menu.tab.move_to_window_'),
      icon: 'icon_windows',
      action: 'moveTabsToWin',
      args: [State.selected],
    }
  },

  moveToCtr: node => {
    if (State.private) return
    const opts = []

    if (node.cookieStoreId !== 'firefox-default') {
      opts.push({
        label: translate('menu.tab.reopen_in_default_panel'),
        icon: 'icon_tabs',
        action: 'moveTabsToCtx',
        args: [State.selected, 'firefox-default'],
      })
    }

    for (let c of State.containers) {
      if (node.cookieStoreId === c.cookieStoreId) continue
      opts.push({
        label: translate('menu.tab.reopen_in_') + `||${c.colorCode}>>${c.name}`,
        icon: c.icon,
        color: c.colorCode,
        action: 'moveTabsToCtx',
        args: [State.selected, c.cookieStoreId],
      })
    }

    return opts
  },

  pin: node => {
    const wut = node.pinned ? 'unpin' : 'pin'
    return {
      label: translate('menu.tab.' + wut),
      icon: 'icon_pin',
      action: wut + 'Tabs',
      args: [State.selected],
    }
  },

  reload: () => {
    return {
      label: translate('menu.tab.reload'),
      icon: 'icon_reload',
      action: 'reloadTabs',
      args: [State.selected],
    }
  },

  bookmark: () => {
    return {
      label: translate('menu.tab.bookmark'),
      icon: 'icon_star',
      action: 'bookmarkTabs',
      args: [State.selected],
    }
  },

  mute: node => {
    const wut = node.mutedInfo.muted ? 'unmute' : 'mute'
    return {
      label: translate('menu.tab.' + wut),
      icon: node.mutedInfo.muted ? 'icon_loud' : 'icon_mute',
      action: wut + 'Tabs',
      args: [State.selected],
    }
  },

  discard: node => {
    if (State.selected.length === 1) {
      if (node.active || node.discarded) return
    }
    return {
      label: translate('menu.tab.discard'),
      icon: 'icon_discard',
      action: 'discardTabs',
      args: [State.selected],
    }
  },

  group: node => {
    if (!State.tabsTree || node.pinned) return
    return {
      label: translate('menu.tab.group'),
      icon: 'icon_group_tabs',
      action: 'groupTabs',
      args: [State.selected],
    }
  },

  flatten: node => {
    if (State.selected.length <= 1) return
    if (State.selected.every(t => node.lvl === State.tabsMap[t].lvl)) return
    if (!State.tabsTree || node.pinned) return
    return {
      label: translate('menu.tab.flatten'),
      icon: 'icon_flatten',
      action: 'flattenTabs',
      args: [State.selected],
    }
  },

  clearCookies: () => {
    return {
      label: translate('menu.tab.clear_cookies'),
      icon: 'icon_cookie',
      action: 'clearTabsCookies',
      args: [State.selected],
    }
  },

  close: () => {
    if (State.selected.length <= 1) return
    return {
      label: translate('menu.tab.close'),
      icon: 'icon_close',
      action: 'removeTabs',
      args: [State.selected],
    }
  },
}
