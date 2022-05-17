<template lang="pug">
.Notifications
  TransitionGroup(name="notification" tag="div")
    .notification(
      v-for="(info, i) in Notifications.reactive.list"
      :key="info.id"
      :data-lvl="info.lvl"
      :data-timeout="!!info.timer"
      :style="getTimeoutCSSVar(info)"
      @mousedown="onMouseDown($event, info, i)"
      @mouseenter="Notifications.resetTimer(info)"
      @mouseleave="Notifications.restartTimer(info)")
      .header
        .icon(v-if="info.icon")
          svg(v-if="info.icon[0] === '#'")
            use(:xlink:href="info.icon")
          img(v-else :src="info.icon")
        .title {{info.title}}
      .details(v-if="info.details") {{info.details}}
      .progress(v-if="info.progress"
        :data-progress-unknown="info.progress.percent === -1"
        :style="getProgressPercent(info)")
        .progress-bar
          .progress-bar-value

      .ctrls(v-if="info.ctrl || info.controls")
        .ctrl(v-if="info.ctrl" @click="onCtrlMouseDown($event, i, info.callback)")
          .label {{info.ctrl}}
        .separator(v-if="info.ctrl")
        template(v-for="ctrl in info.controls" :key="ctrl.label")
          .ctrl(
            :data-icon="!!ctrl.icon"
            :title="ctrl.label"
            @click="onCtrlMouseDown($event, i, ctrl.callback)")
            svg(v-if="ctrl.icon")
              use(:xlink:href="ctrl.icon")
            .label(v-else-if="ctrl.label") {{ctrl.label}}
          .separator
        .ctrl(
          data-icon="true"
          :title="translate('notif.hide_tooltip')"
          @click="onHideMouseDown($event, i)")
          svg
            use(xlink:href="#icon_expand")
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import { Notification } from 'src/types'
import { Notifications } from 'src/services/notifications'

function getProgressPercent(info: Notification): Record<string, string> {
  return { '--percent': `${info.progress?.percent ?? 0}%` }
}

function onMouseDown(e: MouseEvent, info: Notification, index: number): void {
  if (!info.ctrl && !info.controls) onHideMouseDown(e, index)
}

function onHideMouseDown(e: MouseEvent, index: number): void {
  Notifications.reactive.list.splice(index, 1)
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
