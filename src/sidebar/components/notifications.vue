<template lang="pug">
.Notifications
  transition-group(name="notification" tag="div")
    .notification(
      v-for="(info, i) in $store.state.notifications"
      :key="info.id"
      @mousedown="onNotifMouseDown($event, info, i)"
      @mouseenter="onNotifMouseEnter(info)")
      .title {{info.title}}
      .msg(v-if="info.msg") info.msg
</template>


<script>
import State from '../store/state.js'
import Actions from '../actions'

export default {
  data() {
    return {}
  },

  methods: {
    onNotifMouseDown(e, info, index) {
      if (e.button === 0 && info.callback) info.callback()
      else if (e.button === 0 && info.action && Actions[info.action]) {
        if (info.args) Actions[info.action](...info.args)
        else Actions[info.action]()
      }

      State.notifications.splice(index, 1)
    },

    onNotifMouseEnter(info) {
      if (info.timer) clearTimeout(info.timer)
    },
  },
}
</script>
