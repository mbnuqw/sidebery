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
  margin: 0 12px 0 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--label-fg-hover)
  &:active
    > .label
      transition: none
      color: var(--label-fg-active)
  &.-no-top-margin
    margin-top: 0

.InfoField > .label
  box(relative)
  text(s: rem(14))
  color: var(--label-fg)
  transition: color var(--d-fast)

.InfoField > .info
  box(relative)
  text(s: rem(14))
  color: var(--active-fg)
</style>
