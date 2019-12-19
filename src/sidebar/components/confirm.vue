<template lang="pug">
transition(name="confirm"): .Confirm(v-if="$store.state.confirm" @click="onBgClick")
  .msg-box(v-noise:300.g:12:af.a:0:42.s:0:9="" @click.stop="")
    h2 {{t('confirm.warn_title')}}
    .msg {{$store.state.confirm.msg}}
    .ctrls
      .btn(@click="onOkClick") {{t('btn.yes')}}
      .btn.-warn(
        v-if="$store.state.confirm.cancel"
        @click="onCancelClick") {{t('btn.no')}}
</template>

<script>
import State from '../store/state.js'

export default {
  data() {
    return {}
  },

  methods: {
    onBgClick() {
      if (State.confirm.cancel) State.confirm.cancel()
      else if (State.confirm.ok) State.confirm.ok()
    },
    onOkClick() {
      if (State.confirm.ok) State.confirm.ok()
    },
    onCancelClick() {
      if (State.confirm.cancel) State.confirm.cancel()
    },
  },
}
</script>
