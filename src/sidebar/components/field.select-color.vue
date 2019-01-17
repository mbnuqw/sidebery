<template lang="pug">
.SelectColorField
  .label {{t(label)}}
  select-color-input(
    :value="value"
    :opts="opts"
    :fill="optFill"
    @input="select")
</template>


<script>
import SelectColorInput from './input.select-color'

export default {
  components: {
    SelectColorInput,
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

  methods: {
    select(option) {
      this.$emit('input', option)
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.SelectColorField
  box(relative)
  padding: 2px 0
  margin: 0 12px 0 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--label-fg-hover)
  &.-no-top-margin
    margin-top: 0

.SelectColorField > .label
  box(relative)
  text(s: rem(14))
  color: var(--label-fg)
  transition: color var(--d-fast)
</style>
