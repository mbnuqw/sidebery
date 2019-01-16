<template lang="pug">
.SelectField(@mousedown="select")
  .label {{t(label)}}
  select-input(
    :label="optLabel"
    :value="value"
    :opts="opts"
    :noneOpt="noneOpt")
</template>


<script>
import SelectInput from './input.select'

export default {
  components: {
    SelectInput
  },

  props: {
    value: String,
    label: String,
    optLabel: String,
    opts: Array,
    noneOpt: String,
  },

  data() {
    return {}
  },

  methods: {
    select(e) {
      let i = this.opts.indexOf(this.value)
      if (e.button === 0) i++
      if (e.button === 2) i--
      if (i >= this.opts.length) i = 0
      if (i < 0) i = this.opts.length - 1
      this.$emit('input', this.opts[i])
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.SelectField
  box(relative)
  padding: 2px 0
  margin: 8px 12px 8px 16px
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

.SelectField > .label
  box(relative)
  text(s: rem(14))
  color: var(--label-fg)
  transition: color var(--d-fast)
</style>
