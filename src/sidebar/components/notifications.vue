<template lang="pug">
.Notifications
  transition-group(name="notification" tag="div")
    .notification(
      v-for="(info, i) in $store.state.notifications"
      :key="info.id"
      :data-timeout="!!info.timer"
      :style="getTimeoutCSSVar(info)"
      @mouseenter="onNotifMouseEnter(info)"
      @mouseleave="onNotifMouseLeave(info)")
      .title {{info.title}}
      .msg(v-if="info.msg") {{info.msg}}
      .ctrls(v-if="info.ctrl")
        .ctrl(@mousedown="onOkMouseDown($event, info, i)") {{info.ctrl}}
        .ctrl(@mousedown="onHideMouseDown($event, info, i)") {{t('notif.hide_ctrl')}}
</template>


<script>
import State from '../store/state.js'
import Actions from '../actions'

export default {
  data() {
    return {}
  },

  methods: {
    onHideMouseDown(e, info, index) {
      State.notifications.splice(index, 1)
    },

    onNotifMouseEnter(info) {
      if (info.timer) clearTimeout(info.timer)
      info.timer = null
    },

    onNotifMouseLeave(info) {
      if (info.timer) clearTimeout(info.timer)
      if (info.timeout) {
        info.timer = setTimeout(() => {
          let index = State.notifications.findIndex(n => n.id === info.id)
          if (index !== -1) State.notifications.splice(index, 1)
        }, info.timeout)
      }
    },

    onOkMouseDown(e, info, index) {
      if (e.button === 0 && info.callback) info.callback()
      else if (e.button === 0 && info.action && Actions[info.action]) {
        if (info.args) Actions[info.action](...info.args)
        else Actions[info.action]()
      }
      State.notifications.splice(index, 1)
    },

    getTimeoutCSSVar(info) {
      if (!info.timeout) return null
      return { '--timeout': info.timeout + 200 + 'ms' }
    }
  },
}
</script>
