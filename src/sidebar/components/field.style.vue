<template lang="pug">
.StyleField
  .label {{t(label)}}
  .input-group(:is-activated="isActive")
    text-input.text-input(
      :value="value"
      :line="true"
      :or="or"
      @input="onInput"
      @change="onChange")
    toggle-input.toggle(:value="isActive", @input="toggle")
</template>


<script>
import ToggleInput from './input.toggle'
import TextInput from './input.text'

export default {
  components: {
    ToggleInput,
    TextInput,
  },

  props: {
    value: String,
    or: String,
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

    onChange() {
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

.StyleField
  box(relative)
  padding: 2px 0
  margin: 8px 12px 8px 16px
  &:hover
    > .label
      color: var(--label-fg-hover)
  &.-no-top-margin
    margin-top: 0

.StyleField > .label
  box(relative)
  text(s: rem(15))
  color: var(--label-fg)
  transition: color var(--d-fast)

.StyleField > .input-group
  box(relative, flex)
  align-items: center
  margin: 6px 0 0

  > .text-input
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
