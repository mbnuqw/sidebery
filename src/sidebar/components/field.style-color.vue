<template lang="pug">
.ColorField
  .label {{t(label)}}
  .input-group(:is-activated="isActive")
    color-input.color-input(
      v-debounce:input.128="debouncedInput"
      :value="value"
      @input="onInput")
    toggle-input.toggle(:value="isActive", @input="toggle")
</template>


<script>
import ToggleInput from './input.toggle'
import ColorInput from './input.color'

export default {
  components: {
    ToggleInput,
    ColorInput,
  },

  props: {
    value: String,
    label: String,
    optFill: String,
    opts: Array,
  },

  data() {
    return {}
  },

  computed: {
    isActive() {
      return !!this.value
    }
  },

  methods: {
    onInput(val) {
      this.$emit('input', val)
    },

    debouncedInput() {
      this.$emit('change', this.value)
    },

    toggle() {
      this.$emit('toggle')
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.ColorField
  box(relative)
  padding: 2px 0
  margin: 0 12px 0 16px
  &:hover
    > .label
      color: var(--label-fg-hover)
  &.-no-top-margin
    margin-top: 0

.ColorField > .label
  box(relative)
  text(s: rem(15))
  color: var(--label-fg)
  transition: color var(--d-fast)

.ColorField > .input-group
  box(relative, flex)
  align-items: center
  margin: 6px 0 0

  > .color-input
    box(relative)
    size(100%)
    text(c: #afafaf, s: rem(15))
    margin: 0 16px 0 0
    transform: opacity var(--d-fast)

  > .toggle
    flex-shrink: 0

  &:not([is-activated]) > .color-input
    opacity: .5
</style>
