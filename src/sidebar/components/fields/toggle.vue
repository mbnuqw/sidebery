<template lang="pug">
.ToggleField(:class="{ inline, inactive }", @click="toggle")
  .label(:style="{ color }") {{t(label)}}
  toggle-input.input(:value="value")
</template>


<script>
import ToggleInput from '../inputs/toggle'

export default {
  components: {
    ToggleInput,
  },

  props: {
    value: Boolean,
    label: String,
    inactive: Boolean,
    field: Boolean,
    inline: Boolean,
    color: String,
  },

  data() {
    return {}
  },

  methods: {
    toggle() {
      if (this.inactive) return
      this.$emit('input', !this.value)
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'

.ToggleField
  box(relative)
  padding: 2px 0
  margin: 0 12px 0 16px
  cursor: pointer
  opacity: .8
  &:hover
    opacity: 1
    // > .label
    //   color: var(--label-fg-hover)
  &:active
    opacity: .7
    // > .label
    //   transition: none
    //   color: var(--label-fg-active)
  &.inactive
    opacity: .2
    cursor: default
  &.-no-top-margin
    margin-top: 0
  &.-rm:before
    content: ''
    box(absolute)
    size(calc(100% + 6px), 100%)
    pos(0, -6px)
    outline: 2px dashed #ff110032
    outline-offset: -2px
    background-color: #ff110016

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
