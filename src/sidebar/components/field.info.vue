<template lang="pug">
.InfoField(@click="onClick")
  .label {{t(label)}}
  .info {{value}}
</template>


<script>
import ToggleInput from './input.toggle'

export default {
  components: {
    ToggleInput,
  },

  props: {
    value: String,
    label: String,
  },

  data() {
    return {}
  },

  methods: {
    onClick(e) {
      this.$emit('click', e)
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.InfoField
  box(relative)
  padding: 2px 0
  margin: 8px 12px 8px 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--settings-label-fg-hover)
  &:active
    > .label
      transition: none
      color: var(--settings-label-fg-active)
  &.-no-top-margin
    margin-top: 0

.InfoField > .label
  box(relative)
  text(s: rem(14))
  color: var(--settings-label-fg)
  transition: color var(--d-fast)

.InfoField > .info
  box(relative)
  text(s: rem(14))
  color: var(--settings-opt-active-fg)
</style>
