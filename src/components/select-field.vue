<template lang="pug">
.SelectField(
  :data-inline="inline"
  :data-inactive="inactive"
  @mousedown="switchOption")
  .body
    .label {{t(label)}}
    select-input(
      :label="optLabel"
      :value="value"
      :opts="opts"
      :noneOpt="noneOpt"
      :color="color"
      :icon="icon"
      @input="select")
  .note(v-if="note") {{note}}
</template>

<script>
import SelectInput from './select-input'

export default {
  components: {
    SelectInput,
  },

  props: {
    value: [String, Number],
    label: String,
    inactive: Boolean,
    inline: Boolean,
    optLabel: String,
    opts: Array,
    color: String,
    icon: String,
    noneOpt: String,
    note: String,
  },

  data() {
    return {}
  },

  methods: {
    switchOption(e) {
      if (this.inactive) return
      let i = this.opts.indexOf(this.value)
      if (i === -1) i = this.opts.findIndex(o => o.value === this.value)
      if (i === -1) return
      if (e.button === 0) i++
      if (e.button === 2) i--
      if (i >= this.opts.length) i = 0
      if (i < 0) i = this.opts.length - 1

      let selected = this.opts[i]
      if (selected && selected.value) this.$emit('input', selected.value)
      else this.$emit('input', selected)
    },

    select(option) {
      this.$emit('input', option)
    },
  },
}
</script>
