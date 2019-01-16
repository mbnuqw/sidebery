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
      color: var(--true-fg)
    .opt.-false
      color: var(--inactive-fg)
  
.ToggleInput > .opt
  box(relative)
  text(s: rem(14))
  margin: 0 7px 0 0
  color: var(--inactive-fg)
  transition: color var(--d-fast)
  &.-false
    color: var(--false-fg)
</style>
