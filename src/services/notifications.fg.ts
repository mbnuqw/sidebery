import { Notification, Reactivator } from 'src/types'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import * as SetupPage from './setup-page.fg'

import * as Notifications from 'src/services/notifications.fg'

export interface NotificationsState {
  list: Notification[]
}

export let reactive: NotificationsState = {
  list: [],
}
export let hiddenRecently = false

export function reactivate(r: Reactivator<NotificationsState>) {
  reactive = r(reactive)
}

export function err(title: string, details?: string): Notification {
  return notify({ title, details, lvl: 'err' })
}

export function notify(config: Notification, timeout = 5555): Notification {
  const id = Utils.uid()
  config.id = id
  if (!config.lvl) config.lvl = 'info'
  if (!config.timeout) config.timeout = timeout
  if (timersEnabled) restartTimer(config)
  const len = Notifications.reactive.list.push(config)
  return Notifications.reactive.list[len - 1]
}

let timersEnabled = true
export function resetTimer(nn: Notification): void {
  if (nn.timer) clearTimeout(nn.timer)
  nn.timer = undefined
}
export function resetTimers(): void {
  timersEnabled = false
  Notifications.reactive.list.forEach(resetTimer)
}

export function restartTimer(nn: Notification): void {
  if (nn.timer) clearTimeout(nn.timer)
  if (nn.timeout) {
    nn.timer = setTimeout(() => {
      const index = Notifications.reactive.list.findIndex(n => n.id === nn.id)
      if (index !== -1) Notifications.reactive.list.splice(index, 1)
    }, nn.timeout)
  }
}
export function restartTimers(): void {
  timersEnabled = true
  Notifications.reactive.list.forEach(restartTimer)
}

export function progress(config: Notification): Notification {
  const id = Utils.uid()
  config.id = id
  config.lvl = 'progress'
  if (!config.progress) config.progress = { percent: 0 }

  const len = Notifications.reactive.list.push(config)
  return Notifications.reactive.list[len - 1]
}

export function updateProgress(notification: Notification, done: number, all: number): void {
  if (!notification.progress) return
  let prcnt = Math.floor((100 / all) * done)
  if (prcnt > 100) prcnt = 100
  if (prcnt < 0) prcnt = 0
  notification.progress.percent = prcnt
}

export function finishProgress(notification: Notification, delay = 120): void {
  if (!notification.progress) return
  notification.progress.percent = 100

  setTimeout(() => {
    const index = Notifications.reactive.list.indexOf(notification)
    if (index !== -1) Notifications.reactive.list.splice(index, 1)
  }, delay)
}

let hiddenRecentlyTimeout: number | undefined
export function setHiddenRecently(): void {
  hiddenRecently = true
  clearTimeout(hiddenRecentlyTimeout)
  hiddenRecentlyTimeout = setTimeout(() => {
    hiddenRecently = false
  }, 1000)
}

// ---

export function notifyAboutWrongProxyAuthData(containerId: string): void {
  const config: Notification = {
    lvl: 'err',
    title: translate('notif.proxy_auth_err'),
    details: translate('notif.proxy_auth_err_details'),
    ctrl: translate('notif.proxy_auth_err_ctrl'),
    callback: () => SetupPage.open(`settings_containers.${containerId}`),
  }

  Notifications.notify(config)
}
