<template lang="pug">
.ToggleInput(:opt-true="value", @click="toggle")
  .opt.-true {{t('settings.opt_true')}}
  .opt.-false {{t('settings.opt_false')}}
</template>


<script>
export default {
  props: {
    value: Boolean,
  },

  data() {
    return {}
  },

  methods: {
    toggle() {
      this.$emit('input', !this.value)
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.ToggleInput
  box(relative, flex)
  flex-wrap: wrap
  cursor: pointer
  &[opt-true]
    .opt.-true
      color: var(--settings-opt-true-fg)
    .opt.-false
      color: var(--settings-opt-inactive-fg)
  
.ToggleInput > .opt
  box(relative)
  text(s: rem(14))
  margin: 0 7px 0 0
  color: var(--settings-opt-inactive-fg)
  transition: color var(--d-fast)
  &.-false
    color: var(--settings-opt-false-fg)
</style>
