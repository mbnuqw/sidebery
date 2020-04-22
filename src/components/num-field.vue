<template lang="pug">
.NumField(:data-active="!!value" :data-inactive="inactive")
  .label {{t(label)}}
  .input-group
    TextInput.text-input(
      :value="value"
      :line="true"
      :filter="valueFilter"
      @input="onInput"
      @change="onChange")
    SelectInput.unit-input(
      :value="validUnit"
      :opts="unitOpts"
      :label="unitLabel"
      :plurNum="value"
      @input="select")
</template>

<script>
import SelectInput from './select-input'
import TextInput from './text-input'

export default {
  components: {
    SelectInput,
    TextInput,
  },

  props: {
    label: String,
    value: [Number, String],
    or: [Number, String],
    inactive: Boolean,
    unit: String,
    unitOpts: Array,
    unitLabel: String,
  },

  computed: {
    validUnit() {
      if (!this.value) return 'none'
      else return this.unit
    },
  },

  methods: {
    onInput(val) {
      this.$emit('input', [val, this.unit])
    },

    onChange() {
      this.$emit('change', [this.value, this.unit])
    },

    valueFilter(e) {
      let val = parseInt(e.target.value)
      if (isNaN(val)) return 0
      else return val
    },

    select(unit) {
      if (this.inactive) return
      this.$emit('input', [this.value || 1, unit])
    },
  },
}
</script>
