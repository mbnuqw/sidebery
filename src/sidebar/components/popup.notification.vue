<template lang="pug">
.notification(
  v-if="notification"
  :key="notification.id"
  :data-lvl="notification.lvl"
  :data-timeout="!!notification.timer"
  :style="getTimeoutCSSVar(notification)"
  @mousedown.left="onMouseDown()")
  .header(@mousedown.middle="onHideMouseDown()")
    .icon(v-if="notification.icon")
      svg(v-if="notification.icon[0] === '#'")
        use(:xlink:href="notification.icon")
      img(v-else :src="notification.icon")
    .title {{notification.title}}
  .details(v-if="notification.details" @mousedown.middle="onHideMouseDown()") {{notification.details}}
  .details-list(v-if="notification.detailsList?.length")
    .details-msg(v-for="msg in notification.detailsList") {{msg}}
  .progress(v-if="notification.progress"
    :data-progress-unknown="notification.progress.percent === -1"
    :style="getProgressPercent(notification)")
    .progress-bar
      .progress-bar-value

  .ctrls(v-if="notification.ctrl || notification.controls")
    .ctrl(v-if="notification.ctrl" @click="onCtrlMouseDown($event, index, notification?.callback)")
      .label {{notification.ctrl}}
    .separator(v-if="notification.ctrl")
    template(v-for="ctrl in notification.controls" :key="ctrl.label")
      .ctrl(
        :data-icon="!!ctrl.icon"
        :title="ctrl.label"
        @click="onCtrlMouseDown($event, index, ctrl.callback)")
        svg(v-if="ctrl.icon")
          use(:xlink:href="ctrl.icon")
        .label(v-else-if="ctrl.label") {{ctrl.label}}
      .separator
    .ctrl(
      v-if="!notification.unconcealed"
      data-icon="true"
      :title="translate('notif.hide_tooltip')"
      @click="onHideMouseDown()")
      svg.-close
        use(xlink:href="#icon_close")
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import { Notification } from 'src/types'
import { Notifications } from 'src/services/notifications'

const props = defineProps<{
  notification: Notification
  index: number
}>()

function getProgressPercent(info: Notification): Record<string, string> {
  return { '--percent': `${info.progress?.percent ?? 0}%` }
}

function onMouseDown(): void {
  if (!props.notification.ctrl && !props.notification.controls) onHideMouseDown()
}

function onHideMouseDown(): void {
  Notifications.reactive.list.splice(props.index, 1)
  if (!Notifications.reactive.list.length) Notifications.restartTimers()
  Notifications.setHiddenRecently()
}

function onCtrlMouseDown(e: MouseEvent, index: number, cb?: () => void): void {
  if (e.button !== 0) return
  if (cb) {
    cb()
    Notifications.reactive.list.splice(index, 1)
    Notifications.setHiddenRecently()
  }
}

function getTimeoutCSSVar(info: Notification): Record<string, string> | undefined {
  if (!info.timeout) return
  return { '--timeout': `${info.timeout + 200}ms` }
}
</script>
