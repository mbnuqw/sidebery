<template lang="pug">
.SelectField(
  :data-inline="inline"
  :data-inactive="inactive"
  @mousedown="switchOption")
  .label {{t(label)}}
  select-input(
    :label="optLabel"
    :value="value"
    :opts="opts"
    :noneOpt="noneOpt"
    @input="select")
</template>


<script>
import SelectInput from './select-input'

export default {
  components: {
    SelectInput
  },

  props: {
    value: [String, Number],
    label: String,
    inactive: Boolean,
    inline: Boolean,
    optLabel: String,
    opts: Array,
    noneOpt: String,
  },

  data() {
    return {}
  },

  methods: {
    switchOption(e) {
      if (this.inactive) return
      let i = this.opts.indexOf(this.value)
      if (e.button === 0) i++
      if (e.button === 2) i--
      if (i >= this.opts.length) i = 0
      if (i < 0) i = this.opts.length - 1
      this.$emit('input', this.opts[i])
    },

    select(option) {
      this.$emit('input', option)
    },
  },
}
</script>
