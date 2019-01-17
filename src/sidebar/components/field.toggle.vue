<template lang="pug">
.ToggleField(:class="{ inline }", @click="toggle")
  .label(:style="{ color }") {{t(label)}}
  toggle-input.input(:value="value")
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
    field: Boolean,
    inline: Boolean,
    color: String,
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

.ToggleField > .label
  box(relative)
  text(s: rem(14))
  color: var(--label-fg)
  transition: color var(--d-fast)

.ToggleField.inline
  box(flex)
  margin: 0 12px 0 16px
  justify-content: space-between
  align-items: center
  >.input
    flex-shrink: 0
  >.label
    margin-right: 12px
    overflow: hidden
    text-overflow: ellipsis
  // +[class$="Field"]
  //   margin-top: 3px
</style>
