<template lang="pug">
.CountField(:data-active="value !== off" :data-inactive="inactive" @click="toggle"): .body
  .label {{t(label)}}
  .input-group(@click.stop="")
    text-input.text-input(
      :value="value"
      :line="true"
      :filter="valueFilter"
      @input="onInput"
      @change="onChange")
    toggle-input.toggle-input(:value="value !== off" @input="toggle")
</template>

<script>
import TextInput from './text-input'
import ToggleInput from './toggle-input'

export default {
  components: {
    // SelectInput,
    TextInput,
    ToggleInput,
  },

  props: {
    label: String,
    value: [Number, String],
    or: [Number, String],
    inactive: Boolean,
    off: {
      type: Number,
      default: 0,
    },
    min: Number,
  },

  data() {
    return {}
  },

  methods: {
    onInput(val) {
      this.$emit('input', val)
    },

    onChange() {
      this.$emit('change', this.value)
    },

    valueFilter(e) {
      let val = parseInt(e.target.value)
      if (isNaN(val)) return 0
      else if (val < this.min) return this.min
      else return val
    },

    toggle() {
      if (this.inactive) return
      else if (this.value === this.off) this.$emit('input', this.min || this.off + 1)
      else this.$emit('input', this.off)
    },
  },
}
</script>
