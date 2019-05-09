<template lang="pug">
.SelectField(:class="classList" @mousedown="select")
  .label {{t(label)}}
  select-input(
    :label="optLabel"
    :value="value"
    :opts="opts"
    :noneOpt="noneOpt")
</template>


<script>
import SelectInput from '../inputs/select'

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

  computed: {
    classList() {
      return {
        '-inline': this.inline,
        '-inactive': this.inactive
      }
    }
  },

  methods: {
    select(e) {
      if (this.inactive) return
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
