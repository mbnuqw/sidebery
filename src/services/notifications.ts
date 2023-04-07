import * as Utils from 'src/utils'
import { Notification } from 'src/types'
import { translate } from 'src/dict'
import { SetupPage } from './setup-page'

export interface NotificationsState {
  list: Notification[]
}

export const Notifications = {
  reactive: { list: [] } as NotificationsState,
  hiddenRecently: false,

  err,
  notify,
  resetTimer,
  resetTimers,
  restartTimer,
  restartTimers,
  progress,
  finishProgress,
  updateProgress,
  setHiddenRecently,

  notifyAboutWrongProxyAuthData,
}

function err(title: string, details?: string): Notification {
  return notify({ title, details, lvl: 'err' })
}

function notify(config: Notification, timeout = 5555): Notification {
  const id = Utils.uid()
  config.id = id
  if (!config.lvl) config.lvl = 'info'
  config.timeout = timeout
  if (timersEnabled) restartTimer(config)
  const len = Notifications.reactive.list.push(config)
  return Notifications.reactive.list[len - 1]
}

let timersEnabled = true
function resetTimer(nn: Notification): void {
  if (nn.timer) clearTimeout(nn.timer)
  nn.timer = undefined
}
function resetTimers(): void {
  timersEnabled = false
  Notifications.reactive.list.forEach(resetTimer)
}

function restartTimer(nn: Notification): void {
  if (nn.timer) clearTimeout(nn.timer)
  if (nn.timeout) {
    nn.timer = setTimeout(() => {
      const index = Notifications.reactive.list.findIndex(n => n.id === nn.id)
      if (index !== -1) Notifications.reactive.list.splice(index, 1)
    }, nn.timeout)
  }
}
function restartTimers(): void {
  timersEnabled = true
  Notifications.reactive.list.forEach(restartTimer)
}

function progress(config: Notification): Notification {
  const id = Utils.uid()
  config.id = id
  config.lvl = 'progress'
  if (!config.progress) config.progress = { percent: 0 }

  const len = Notifications.reactive.list.push(config)
  return Notifications.reactive.list[len - 1]
}

function updateProgress(notification: Notification, done: number, all: number): void {
  if (!notification.progress) return
  notification.progress.percent = Math.floor((100 / all) * done)
}

function finishProgress(notification: Notification, delay = 120): void {
  if (!notification.progress) return
  notification.progress.percent = 100

  setTimeout(() => {
    const index = Notifications.reactive.list.indexOf(notification)
    if (index !== -1) Notifications.reactive.list.splice(index, 1)
  }, delay)
}

let hiddenRecentlyTimeout: number | undefined
function setHiddenRecently(): void {
  Notifications.hiddenRecently = true
  clearTimeout(hiddenRecentlyTimeout)
  hiddenRecentlyTimeout = setTimeout(() => {
    Notifications.hiddenRecently = false
  }, 1000)
}

// ---

function notifyAboutWrongProxyAuthData(containerId: string): void {
  const config: Notification = {
    lvl: 'err',
    title: translate('notif.proxy_auth_err'),
    details: translate('notif.proxy_auth_err_details'),
    ctrl: translate('notif.proxy_auth_err_ctrl'),
    callback: () => SetupPage.open(`settings_containers.${containerId}`),
  }

  Notifications.notify(config)
}
