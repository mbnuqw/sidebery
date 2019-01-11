<template lang="pug">
.ToggleField(@click="toggle")
  .label {{t(label)}}
  toggle-input(:value="value")
</template>


<script>
import ToggleInput from './input.toggle'

export default {
  components: {
    ToggleInput,
  },

  props: {
    value: Boolean,
    label: String,
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

.ToggleField
  box(relative)
  margin: 0 12px 12px 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--settings-label-fg-hover)
  &:active
    > .label
      transition: none
      color: var(--settings-label-fg-active)

.ToggleField > .label
  box(relative)
  text(s: rem(14))
  color: var(--settings-label-fg)
  transition: color var(--d-fast)
</style>
